package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsDevService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.google.common.collect.ImmutableMap;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dao.GlobalObjectDao;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.global.GlobalObjectDto;
import ru.mail.jira.plugins.groovy.api.dto.global.GlobalObjectForm;
import ru.mail.jira.plugins.groovy.api.entity.GlobalObject;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;
import ru.mail.jira.plugins.groovy.api.repository.GlobalObjectRepository;
import ru.mail.jira.plugins.groovy.api.script.CompiledScript;
import ru.mail.jira.plugins.groovy.api.script.ResolvedConstructorArgument;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.service.SingletonFactory;
import ru.mail.jira.plugins.groovy.api.service.ScriptInvalidationService;
import ru.mail.jira.plugins.groovy.util.ChangelogHelper;
import ru.mail.jira.plugins.groovy.util.Const;
import ru.mail.jira.plugins.groovy.util.ValidationException;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
@ExportAsDevService(GlobalObjectRepository.class)
public class GlobalObjectRepositoryImpl implements GlobalObjectRepository {
    private final I18nHelper i18nHelper;
    private final GlobalObjectDao globalObjectDao;
    private final ScriptService scriptService;
    private final SingletonFactory singletonFactory;
    private final ScriptInvalidationService invalidationService;
    private final ChangelogHelper changelogHelper;
    private final ExecutionRepository executionRepository;

    @Autowired
    public GlobalObjectRepositoryImpl(
        @ComponentImport I18nHelper i18nHelper,
        GlobalObjectDao globalObjectDao,
        ScriptService scriptService,
        SingletonFactory singletonFactory,
        ScriptInvalidationService invalidationService,
        ChangelogHelper changelogHelper,
        ExecutionRepository executionRepository
    ) {
        this.i18nHelper = i18nHelper;
        this.globalObjectDao = globalObjectDao;
        this.scriptService = scriptService;
        this.singletonFactory = singletonFactory;
        this.invalidationService = invalidationService;
        this.changelogHelper = changelogHelper;
        this.executionRepository = executionRepository;
    }

    @Override
    public List<GlobalObjectDto> getAll() {
        return globalObjectDao
            .getAll()
            .stream()
            .map(script -> buildDto(script, false))
            .collect(Collectors.toList());
    }

    @Override
    public GlobalObjectDto get(int id) {
        GlobalObject object = globalObjectDao.get(id);

        if (object == null || object.isDeleted()) {
            return null;
        }

        return buildDto(object, true);
    }

    @Override
    public List<ChangelogDto> getChangelogs(int id) {
        GlobalObjectDto script = get(id);
        return changelogHelper.collect(script.getScriptBody(), globalObjectDao.getChangelogs(id));
    }

    @Override
    public GlobalObjectDto create(ApplicationUser user, GlobalObjectForm form) {
        validate(true, null, form);

        GlobalObject result = globalObjectDao.createScript(user, form);

        invalidationService.invalidateGlobalObjects();

        return buildDto(result, true);
    }

    @Override
    public GlobalObjectDto update(ApplicationUser user, int id, GlobalObjectForm form) {
        validate(false, id, form);

        GlobalObject result = globalObjectDao.updateScript(user, id, form);

        invalidationService.invalidateGlobalObjects();

        return buildDto(result, true);
    }

    @Override
    public void delete(ApplicationUser user, int id) {
        globalObjectDao.deleteScript(user, id);
        invalidationService.invalidateGlobalObjects();
    }

    @Override
    public void restore(ApplicationUser user, int id) {
        globalObjectDao.restoreScript(user, id);
        invalidationService.invalidateGlobalObjects();
    }

    private void validate(boolean isNew, Integer id, GlobalObjectForm form) {
        ValidationUtils.validateForm2(i18nHelper, isNew, form);

        if (StringUtils.isEmpty(form.getScriptBody())) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
        }

        CompiledScript scriptClass = scriptService.parseSingleton(form.getScriptBody(), true, ImmutableMap.of());

        try {
            ResolvedConstructorArgument[] arguments = singletonFactory.getExtendedConstructorArguments(scriptClass);

            form.setDependencies(
                StringUtils.trimToNull(
                    Arrays
                        .stream(arguments)
                        .filter(it -> it.getArgumentType() == ResolvedConstructorArgument.ArgumentType.GLOBAL_OBJECT)
                        .map(ResolvedConstructorArgument::getObject)
                        .map(Object::getClass)
                        .map(Class::getCanonicalName)
                        .collect(Collectors.joining(";"))
                )
            );
        } catch (IllegalArgumentException e) {
            throw new ValidationException(e.getMessage(), "scriptBody");
        }

        GlobalObject existingDuplicate = globalObjectDao.getByName(form.getName());
        if (existingDuplicate != null && (isNew || !Objects.equals(id, existingDuplicate.getID()))) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.nameTaken"), "name");
        }

        if (!Const.GLOBAL_OBJECT_NAME_PATTERN.matcher(form.getName()).matches()) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.incorrectGlobalObjectName"), "name");
        }
    }

    private GlobalObjectDto buildDto(GlobalObject script, boolean withChangelogs) {
        GlobalObjectDto result = new GlobalObjectDto();

        result.setId(script.getID());
        result.setUuid(script.getUuid());
        result.setName(script.getName());
        result.setDescription(script.getDescription());
        result.setScriptBody(script.getScriptBody());
        result.setDeleted(script.isDeleted());

        result.setErrorCount(executionRepository.getErrorCount(script.getUuid()));
        result.setWarningCount(executionRepository.getWarningCount(script.getUuid()));

        if (withChangelogs) {
            result.setChangelogs(changelogHelper.collect(script.getScriptBody(), script.getChangelogs()));
        }

        return result;
    }
}
