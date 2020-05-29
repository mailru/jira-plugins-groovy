package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import net.java.ao.DBParam;
import net.java.ao.Query;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.admin.AdminScriptDto;
import ru.mail.jira.plugins.groovy.api.dto.admin.AdminScriptForm;
import ru.mail.jira.plugins.groovy.api.entity.*;
import ru.mail.jira.plugins.groovy.api.repository.AdminScriptRepository;
import ru.mail.jira.plugins.groovy.api.repository.ExecutionRepository;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.impl.AuditService;
import ru.mail.jira.plugins.groovy.api.script.ParseContext;
import ru.mail.jira.plugins.groovy.util.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class AdminScriptRepositoryImpl implements AdminScriptRepository {
    private final ActiveObjects ao;
    private final I18nHelper i18nHelper;
    private final ScriptService scriptService;
    private final JsonMapper jsonMapper;
    private final AuditService auditService;
    private final ChangelogHelper changelogHelper;
    private final ExecutionRepository executionRepository;

    @Autowired
    public AdminScriptRepositoryImpl(
        @ComponentImport ActiveObjects activeObjects,
        @ComponentImport I18nHelper i18nHelper,
        ScriptService scriptService,
        JsonMapper jsonMapper,
        AuditService auditService,
        ChangelogHelper changelogHelper,
        ExecutionRepository executionRepository
    ) {
        this.ao = activeObjects;
        this.i18nHelper = i18nHelper;
        this.scriptService = scriptService;
        this.jsonMapper = jsonMapper;
        this.auditService = auditService;
        this.changelogHelper = changelogHelper;
        this.executionRepository = executionRepository;
    }

    @Override
    public List<AdminScriptDto> getAllScripts() {
        return Arrays
            .stream(ao.find(AdminScript.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(script -> buildScriptDto(script, false, true))
            .collect(Collectors.toList());
    }

    @Override
    public List<ChangelogDto> getChangelogs(int id) {
        AdminScriptDto script = getScript(id, false, false);
        return changelogHelper.collect(script.getScriptBody(), ao.find(AdminScriptChangelog.class, Query.select().where("SCRIPT_ID = ?", id)));
    }

    @Override
    public AdminScriptDto createScript(ApplicationUser user, AdminScriptForm form) {
        ParseContext parseContext = validateScriptForm(true, form);

        AdminScript script = ao.create(
            AdminScript.class,
            new DBParam("NAME", form.getName()),
            new DBParam("DESCRIPTION", form.getDescription()),
            new DBParam("UUID", UUID.randomUUID().toString()),
            new DBParam("SCRIPT_BODY", form.getScriptBody()),
            new DBParam("HTML", form.isHtml()),
            new DBParam("PARAMETERS", parseContext.getParameters().size() > 0 ? jsonMapper.write(parseContext.getParameters()) : null),
            new DBParam("DELETED", false)
        );

        String diff = changelogHelper.generateDiff(script.getID(), "", script.getName(), "", form.getScriptBody());

        String comment = form.getComment();
        if (comment == null) {
            comment = Const.CREATED_COMMENT;
        }

        changelogHelper.addChangelog(AdminScriptChangelog.class, script.getID(), null, user.getKey(), diff, comment);

        addAuditLogAndNotify(user, EntityAction.CREATED, script, diff, comment);

        return buildScriptDto(script, true, true);
    }

    @Override
    public AdminScriptDto getScript(int id, boolean includeChangelogs, boolean includeErrorCount) {
        return buildScriptDto(ao.get(AdminScript.class, id), includeChangelogs, includeErrorCount);
    }

    @Override
    public AdminScriptDto updateScript(ApplicationUser user, int id, AdminScriptForm form) {
        AdminScript script = ao.get(AdminScript.class, id);

        ParseContext parseContext = validateScriptForm(false, form);

        String diff = changelogHelper.generateDiff(id, script.getName(), form.getName(), script.getScriptBody(), form.getScriptBody());
        String comment = form.getComment();

        changelogHelper.addChangelog(AdminScriptChangelog.class, script.getID(), script.getUuid(), user.getKey(), diff, comment);

        script.setUuid(UUID.randomUUID().toString());
        script.setName(form.getName());
        script.setDescription(form.getDescription());
        script.setScriptBody(form.getScriptBody());
        script.setHtml(form.isHtml());
        script.setParameters(parseContext.getParameters().size() > 0 ? jsonMapper.write(parseContext.getParameters()) : null);

        script.save();

        addAuditLogAndNotify(user, EntityAction.UPDATED, script, diff, comment);

        return buildScriptDto(script, true, true);
    }

    @Override
    public void deleteScript(ApplicationUser user, int id) {
        AdminScript script = ao.get(AdminScript.class, id);

        script.setDeleted(true);
        script.save();

        addAuditLogAndNotify(user, EntityAction.DELETED, script, null, script.getID() + " - " + script.getName());
    }

    @Override
    public void restoreScript(ApplicationUser user, int id) {
        AdminScript script = ao.get(AdminScript.class, id);

        script.setDeleted(false);
        script.save();

        addAuditLogAndNotify(user, EntityAction.RESTORED, script, null, script.getID() + " - " + script.getName());
    }

    private void addAuditLogAndNotify(ApplicationUser user, EntityAction action, AdminScript script, String diff, String description) {
        auditService.addAuditLogAndNotify(user, action, EntityType.ADMIN_SCRIPT, script, diff, description);
    }

    private ParseContext validateScriptForm(boolean isNew, AdminScriptForm form) {
        ValidationUtils.validateForm2(i18nHelper, isNew, form);

        if (StringUtils.isEmpty(form.getScriptBody())) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
        }

        return scriptService.parseScript(form.getScriptBody());
    }

    private AdminScriptDto buildScriptDto(AdminScript script, boolean includeChangelogs, boolean includeErrorCount) {
        AdminScriptDto result = new AdminScriptDto();

        result.setBuiltIn(false);
        result.setId(script.getID());
        result.setUuid(script.getUuid());
        result.setName(script.getName());
        result.setDescription(script.getDescription());
        result.setScriptBody(script.getScriptBody());
        result.setHtml(script.isHtml());
        result.setDeleted(script.isDeleted());
        result.setParams(script.getParameters() != null ? jsonMapper.read(script.getParameters(), Const.PARAM_LIST_TYPE_REF) : null);

        if (includeChangelogs) {
            result.setChangelogs(changelogHelper.collect(script.getScriptBody(), script.getChangelogs()));
        }

        if (includeErrorCount) {
            result.setErrorCount(executionRepository.getErrorCount(script.getUuid()));
            result.setWarningCount(executionRepository.getWarningCount(script.getUuid()));
        }

        return result;
    }
}
