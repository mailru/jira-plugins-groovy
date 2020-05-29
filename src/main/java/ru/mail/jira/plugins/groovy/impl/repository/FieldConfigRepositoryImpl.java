package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.cache.Cache;
import com.atlassian.cache.CacheManager;
import com.atlassian.cache.CacheSettingsBuilder;
import com.atlassian.jira.issue.CustomFieldManager;
import com.atlassian.jira.issue.customfields.CustomFieldSearcher;
import com.atlassian.jira.issue.fields.CustomField;
import com.atlassian.jira.issue.fields.config.FieldConfig;
import com.atlassian.jira.issue.fields.config.manager.FieldConfigManager;
import com.atlassian.jira.issue.fields.config.manager.FieldConfigSchemeManager;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsDevService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.google.common.collect.ImmutableList;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dao.FieldConfigDao;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.cf.FieldScriptDto;
import ru.mail.jira.plugins.groovy.api.entity.*;
import ru.mail.jira.plugins.groovy.util.CustomFieldHelper;
import ru.mail.jira.plugins.groovy.util.RestFieldException;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;
import ru.mail.jira.plugins.groovy.api.repository.FieldConfigRepository;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.dto.cf.FieldConfigDto;
import ru.mail.jira.plugins.groovy.api.dto.cf.FieldConfigForm;
import ru.mail.jira.plugins.groovy.api.service.ScriptInvalidationService;
import ru.mail.jira.plugins.groovy.impl.cf.ScriptedCFType;
import ru.mail.jira.plugins.groovy.impl.cf.TemplateScriptedCFType;
import ru.mail.jira.plugins.groovy.util.ChangelogHelper;
import ru.mail.jira.plugins.groovy.util.Const;

import javax.annotation.Nonnull;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@ExportAsDevService
public class FieldConfigRepositoryImpl implements FieldConfigRepository {
    private final Logger logger = LoggerFactory.getLogger(FieldConfigRepositoryImpl.class);

    private final I18nHelper i18nHelper;
    private final FieldConfigManager fieldConfigManager;
    private final FieldConfigSchemeManager fieldConfigSchemeManager;
    private final CustomFieldManager customFieldManager;
    private final ScriptService scriptService;
    private final ChangelogHelper changelogHelper;
    private final Cache<Long, FieldScriptDto> scriptCache;
    private final ScriptInvalidationService invalidationService;
    private final ExecutionRepository executionRepository;
    private final CustomFieldHelper customFieldHelper;
    private final FieldConfigDao fieldConfigDao;

    @Autowired
    public FieldConfigRepositoryImpl(
        @ComponentImport I18nHelper i18nHelper,
        @ComponentImport FieldConfigManager fieldConfigManager,
        @ComponentImport FieldConfigSchemeManager fieldConfigSchemeManager,
        @ComponentImport CustomFieldManager customFieldManager,
        @ComponentImport CacheManager cacheManager,
        ScriptService scriptService,
        ChangelogHelper changelogHelper,
        ScriptInvalidationService invalidationService,
        ExecutionRepository executionRepository,
        CustomFieldHelper customFieldHelper,
        FieldConfigDao fieldConfigDao
    ) {
        this.i18nHelper = i18nHelper;
        this.fieldConfigManager = fieldConfigManager;
        this.fieldConfigSchemeManager = fieldConfigSchemeManager;
        this.customFieldManager = customFieldManager;
        this.scriptService = scriptService;
        this.changelogHelper = changelogHelper;
        this.invalidationService = invalidationService;
        this.executionRepository = executionRepository;
        this.customFieldHelper = customFieldHelper;

        this.scriptCache = cacheManager
            .getCache(
                FieldConfigRepositoryImpl.class.getCanonicalName() + ".cache",
                this::doGetScript,
                new CacheSettingsBuilder()
                    .remote()
                    .replicateViaInvalidation()
                    .build()
            );
        this.fieldConfigDao = fieldConfigDao;
    }

    @Override
    public List<FieldConfigDto> getAllConfigs() {
        return customFieldManager
            .getCustomFieldObjects()
            .stream()
            .filter(field -> field.getCustomFieldType() instanceof ScriptedCFType)
            .flatMap(this::getConfigs)
            .distinct()
            .collect(Collectors.toList());
    }

    @Override
    public List<ChangelogDto> getChangelogs(long id) {
        FieldScriptDto script = getScript(id);
        return changelogHelper.collect(script.getScriptBody(), fieldConfigDao.getChangelogs(id));
    }

    private Stream<FieldConfigDto> getConfigs(CustomField customField) {
        return customField
            .getConfigurationSchemes()
            .stream()
            .flatMap(fieldConfigScheme -> fieldConfigScheme.getConfigs().values().stream())
            .map(config -> buildDto(config, fieldConfigDao.findByConfigId(config.getId()), false, true));
    }

    @Override
    public FieldConfigDto getConfig(long id, boolean includeChangelogs) {
        FieldConfig jiraFieldConfig = fieldConfigManager.getFieldConfig(id);
        return buildDto(jiraFieldConfig, fieldConfigDao.findByConfigId(id), includeChangelogs, true);
    }

    @Override
    public FieldConfigDto updateConfig(ApplicationUser user, long configId, FieldConfigForm form) {
        FieldScript fieldScript = fieldConfigDao.findByConfigId(configId);
        FieldConfig jiraFieldConfig = fieldConfigManager.getFieldConfig(configId);

        if (jiraFieldConfig == null) {
            throw new IllegalArgumentException("Coudn't find field config with id " + configId);
        }

        boolean isTemplated = isTemplated(jiraFieldConfig);

        if (fieldScript == null) {
            validate(true, isTemplated, form);
            fieldScript = fieldConfigDao.createConfig(user, jiraFieldConfig, form);
        } else {
            validate(false, isTemplated, form);
            fieldScript = fieldConfigDao.updateConfig(user, fieldScript.getID(), jiraFieldConfig, form);
        }

        CustomField cf = jiraFieldConfig.getCustomField();

        scriptCache.remove(configId);
        if (cf != null) {
            invalidationService.invalidateField(cf.getIdAsLong());
        } else {
            logger.error("CustomField is null for field config {}", jiraFieldConfig.getId());
        }
        return buildDto(jiraFieldConfig, fieldScript, true, true);
    }

    @Override
    public FieldScriptDto getScript(long fieldConfigId) {
        return scriptCache.get(fieldConfigId);
    }

    @Override
    public void invalidateAll() {
        scriptCache.removeAll();
    }

    @Nonnull
    private FieldScriptDto doGetScript(long fieldConfigId) {
        FieldScript fieldScript = fieldConfigDao.findByConfigId(fieldConfigId);

        if (fieldScript == null) {
            return new FieldScriptDto();
        }

        return new FieldScriptDto(
            fieldScript.getUuid(),
            fieldScript.getScriptBody(),
            fieldScript.getDescription(),
            fieldScript.getTemplate(),
            fieldScript.getCacheable(),
            fieldScript.isVelocityParamsEnabled()
        );
    }

    private void validate(boolean isNew, boolean template, FieldConfigForm form) {
        scriptService.parseScript(form.getScriptBody());

        if (StringUtils.isEmpty(form.getScriptBody())) {
            throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
        }

        String description = StringUtils.trimToNull(form.getDescription());
        form.setDescription(description);
        if (description != null) {
            if (form.getDescription().length() > 10000) {
                throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.valueTooLong"), "description");
            }
        }

        String comment = StringUtils.trimToNull(form.getComment());
        form.setComment(comment);

        if (!isNew) {
            if (StringUtils.isEmpty(comment)) {
                throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "comment");
            }
        }

        if (comment != null) {
            if (comment.length() > Const.COMMENT_MAX_LENGTH) {
                throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.valueTooLong"), "comment");
            }
        }

        if (template) {
            if (StringUtils.isEmpty(form.getTemplate())) {
                throw new RestFieldException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "template");
            }
        } else {
            form.setTemplate("");
        }
    }

    private FieldConfigDto buildDto(FieldConfig jiraConfig, FieldScript fieldScript, boolean includeChangelogs, boolean includeErrorCount) {
        FieldConfigDto result = new FieldConfigDto();

        CustomField customField = jiraConfig.getCustomField();

        boolean isTemplated = isTemplated(jiraConfig);

        result.setId(jiraConfig.getId());

        String customFieldName = customField.getName();
        String contextName = fieldConfigSchemeManager.getConfigSchemeForFieldConfig(jiraConfig).getName();

        result.setName(customFieldName + " - " + contextName);
        result.setCustomFieldName(customFieldName);
        result.setCustomFieldId(customField.getIdAsLong());
        result.setContextName(contextName);

        result.setNeedsTemplate(isTemplated);
        result.setType(customField.getCustomFieldType().getName());

        CustomFieldSearcher searcher = customField.getCustomFieldSearcher();
        if (searcher != null) {
            result.setSearcher(searcher.getDescriptor().getName());
        }
        result.setExpectedType(customFieldHelper.getExpectedType(customField).getCanonicalName());

        if (fieldScript == null) {
            result.setCacheable(true);
            result.setScriptBody("");
            if (isTemplated) {
                result.setTemplate("");
            }
            result.setChangelogs(ImmutableList.of());
        } else {
            result.setCacheable(fieldScript.getCacheable());
            result.setVelocityParamsEnabled(fieldScript.isVelocityParamsEnabled());
            result.setScriptBody(fieldScript.getScriptBody());
            result.setUuid(fieldScript.getUuid());
            result.setFieldScriptId(fieldScript.getID());
            result.setDescription(fieldScript.getDescription());

            if (isTemplated) {
                result.setTemplate(fieldScript.getTemplate());
            }

            if (includeChangelogs) {
                result.setChangelogs(changelogHelper.collect(fieldScript.getScriptBody(), fieldScript.getChangelogs()));
            }

            if (includeErrorCount) {
                result.setErrorCount(executionRepository.getErrorCount(fieldScript.getUuid()));
                result.setWarningCount(executionRepository.getWarningCount(fieldScript.getUuid()));
            }
        }

        return result;
    }

    private boolean isTemplated(FieldConfig jiraFieldConfig) {
        return TemplateScriptedCFType.class.equals(jiraFieldConfig.getCustomField().getCustomFieldType().getClass());
    }
}
