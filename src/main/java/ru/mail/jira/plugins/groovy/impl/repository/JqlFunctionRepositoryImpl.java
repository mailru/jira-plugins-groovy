package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsDevService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import net.java.ao.DBParam;
import net.java.ao.Query;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.jql.JqlFunctionForm;
import ru.mail.jira.plugins.groovy.api.dto.jql.JqlFunctionScriptDto;
import ru.mail.jira.plugins.groovy.api.entity.*;
import ru.mail.jira.plugins.groovy.api.jql.CustomFunction;
import ru.mail.jira.plugins.groovy.api.jql.ScriptedJqlFunction;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;
import ru.mail.jira.plugins.groovy.api.repository.JqlFunctionRepository;
import ru.mail.jira.plugins.groovy.api.script.CompiledScript;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.service.SingletonFactory;
import ru.mail.jira.plugins.groovy.impl.AuditService;
import ru.mail.jira.plugins.groovy.util.ChangelogHelper;
import ru.mail.jira.plugins.groovy.util.Const;
import ru.mail.jira.plugins.groovy.util.ValidationException;

import java.util.*;
import java.util.stream.Collectors;

@Component
@ExportAsDevService
public class JqlFunctionRepositoryImpl implements JqlFunctionRepository {
    private final Set<String> builtInNames;
    private final ActiveObjects ao;
    private final I18nHelper i18nHelper;
    private final ScriptService scriptService;
    private final ExecutionRepository executionRepository;
    private final ChangelogHelper changelogHelper;
    private final AuditService auditService;
    private final SingletonFactory singletonFactory;

    @Autowired
    public JqlFunctionRepositoryImpl(
        @ComponentImport ActiveObjects ao,
        @ComponentImport I18nHelper i18nHelper,
        ScriptService scriptService,
        ExecutionRepository executionRepository,
        ChangelogHelper changelogHelper,
        AuditService auditService,
        SingletonFactory singletonFactory,
        Optional<List<CustomFunction>> builtInFunctions
    ) {
        this.ao = ao;
        this.i18nHelper = i18nHelper;
        this.scriptService = scriptService;
        this.executionRepository = executionRepository;
        this.changelogHelper = changelogHelper;
        this.auditService = auditService;
        this.singletonFactory = singletonFactory;

        builtInNames = builtInFunctions
            .map(it -> it
                .stream()
                .map(CustomFunction::getFunctionName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet())
            ).orElse(ImmutableSet.of());
    }

    @Override
    public List<JqlFunctionScriptDto> getAllScripts(boolean includeChangelogs, boolean includeErrorCount) {
        return Arrays
            .stream(ao.find(JqlFunctionScript.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(it -> buildScriptDto(it, includeChangelogs, includeErrorCount))
            .collect(Collectors.toList());
    }

    @Override
    public List<ChangelogDto> getChangelogs(int id) {
        JqlFunctionScriptDto script = getScript(id);
        return changelogHelper.collect(script.getScriptBody(), ao.find(JqlFunctionScriptChangelog.class, Query.select().where("SCRIPT_ID = ?", id)));
    }

    @Override
    public JqlFunctionScriptDto getScript(int id) {
        return buildScriptDto(ao.get(JqlFunctionScript.class, id), false, false);
    }

    @Override
    public JqlFunctionScriptDto createScript(ApplicationUser user, JqlFunctionForm form) {
        validateScriptForm(true, null, form);

        JqlFunctionScript script = ao.create(
            JqlFunctionScript.class,
            new DBParam("NAME", form.getName()),
            new DBParam("LOWER_NAME", form.getName().toLowerCase()),
            new DBParam("DESCRIPTION", form.getDescription()),
            new DBParam("UUID", UUID.randomUUID().toString()),
            new DBParam("SCRIPT_BODY", form.getScriptBody()),
            new DBParam("DELETED", false)
        );

        String diff = changelogHelper.generateDiff(script.getID(), "", script.getName(), "", form.getScriptBody());

        String comment = form.getComment();
        if (comment == null) {
            comment = Const.CREATED_COMMENT;
        }

        changelogHelper.addChangelog(JqlFunctionScriptChangelog.class, script.getID(), null, user.getKey(), diff, comment);

        addAuditLogAndNotify(user, EntityAction.CREATED, script, diff, comment);

        return buildScriptDto(script, true, false);
    }

    @Override
    public JqlFunctionScriptDto updateScript(ApplicationUser user, int id, JqlFunctionForm form) {
        //todo: consider disabling rename
        JqlFunctionScript script = ao.get(JqlFunctionScript.class, id);

        validateScriptForm(false, id, form);

        String diff = changelogHelper.generateDiff(id, script.getName(), form.getName(), script.getScriptBody(), form.getScriptBody());
        String comment = form.getComment();

        changelogHelper.addChangelog(JqlFunctionScriptChangelog.class, script.getID(), script.getUuid(), user.getKey(), diff, comment);

        script.setUuid(UUID.randomUUID().toString());
        script.setName(form.getName());
        script.setLowerName(form.getName().toLowerCase());
        script.setDescription(form.getDescription());
        script.setScriptBody(form.getScriptBody());

        script.save();

        addAuditLogAndNotify(user, EntityAction.UPDATED, script, diff, comment);

        return buildScriptDto(script, true, true);
    }

    @Override
    public void deleteScript(ApplicationUser user, int id) {
        JqlFunctionScript script = ao.get(JqlFunctionScript.class, id);

        script.setDeleted(true);
        script.save();

        addAuditLogAndNotify(user, EntityAction.DELETED, script, null, script.getID() + " - " + script.getName());
    }

    @Override
    public void restoreScript(ApplicationUser user, int id) {
        JqlFunctionScript script = ao.get(JqlFunctionScript.class, id);

        script.setDeleted(false);
        script.save();

        addAuditLogAndNotify(user, EntityAction.RESTORED, script, null, script.getID() + " - " + script.getName());
    }

    private void addAuditLogAndNotify(ApplicationUser user, EntityAction action, JqlFunctionScript script, String diff, String description) {
        auditService.addAuditLogAndNotify(user, action, EntityType.JQL_FUNCTION, script, diff, description);
    }

    private void validateScriptForm(boolean isNew, Integer id, JqlFunctionForm form) {
        ValidationUtils.validateForm2(i18nHelper, isNew, form);

        String lowerName = form.getName().toLowerCase();
        if (builtInNames.contains(lowerName)) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.nameTaken"), "name");
        }
        JqlFunctionScript[] existingScripts = ao.find(JqlFunctionScript.class, Query.select().where("LOWER_NAME = ?", lowerName));
        if (existingScripts.length > 0) {
            if (isNew || existingScripts[0].getID() != id) {
                throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.nameTaken"), "name");
            }
        }
        //todo: also validate for system and other plugin function names

        if (StringUtils.isEmpty(form.getScriptBody())) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
        }

        CompiledScript compiledScript = scriptService.parseSingleton(form.getScriptBody(), false, ImmutableMap.of());

        if (!ScriptedJqlFunction.class.isAssignableFrom(compiledScript.getScriptClass())) {
            throw new ValidationException("Must implement ru.mail.jira.plugins.groovy.api.jql.ScriptedJqlFunction", "scriptBody");
        }

        try {
            singletonFactory.getConstructorArguments(compiledScript);
        } catch (IllegalArgumentException e) {
            throw new ValidationException(e.getMessage(), "scriptBody");
        }
    }

    private JqlFunctionScriptDto buildScriptDto(JqlFunctionScript script, boolean includeChangelogs, boolean includeErrorCount) {
        JqlFunctionScriptDto result = new JqlFunctionScriptDto();

        result.setId(script.getID());
        result.setUuid(script.getUuid());
        result.setName(script.getName());
        result.setDescription(script.getDescription());
        result.setScriptBody(script.getScriptBody());
        result.setDeleted(script.isDeleted());

        if (includeChangelogs) {
            result.setChangelogs(changelogHelper.collect(script.getScriptBody(), script.getChangelogs()));
        }

        if (includeErrorCount) {
            result.setErrorCount(executionRepository.getErrorCount(script.getUuid()));
        }

        return result;
    }
}
