package ru.mail.jira.plugins.groovy.impl.repository;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.bc.issue.search.SearchService;
import com.atlassian.jira.datetime.DateTimeFormatter;
import com.atlassian.jira.datetime.DateTimeStyle;
import com.atlassian.jira.user.ApplicationUser;
import com.atlassian.jira.user.util.UserManager;
import com.atlassian.jira.util.I18nHelper;
import com.atlassian.jira.workflow.JiraWorkflow;
import com.atlassian.jira.workflow.WorkflowManager;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.scheduler.SchedulerHistoryService;
import com.atlassian.scheduler.SchedulerService;
import com.atlassian.scheduler.caesium.cron.parser.CronExpressionParser;
import com.atlassian.scheduler.config.JobId;
import com.atlassian.scheduler.cron.CronSyntaxException;
import com.atlassian.scheduler.status.JobDetails;
import com.atlassian.scheduler.status.RunDetails;
import com.google.common.collect.Lists;
import com.google.common.primitives.Ints;
import com.opensymphony.workflow.loader.ActionDescriptor;
import net.java.ao.DBParam;
import net.java.ao.Query;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.ChangelogDto;
import ru.mail.jira.plugins.groovy.api.dto.scheduled.RunInfo;
import ru.mail.jira.plugins.groovy.api.dto.scheduled.ScheduledTaskForm;
import ru.mail.jira.plugins.groovy.api.dto.scheduled.ScheduledTaskDto;
import ru.mail.jira.plugins.groovy.api.dto.scheduled.TransitionOptionsDto;
import ru.mail.jira.plugins.groovy.api.entity.*;
import ru.mail.jira.plugins.groovy.api.repository.ScheduledTaskRepository;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.dto.PickerOption;
import ru.mail.jira.plugins.groovy.impl.scheduled.JobUtil;
import ru.mail.jira.plugins.groovy.util.ChangelogHelper;
import ru.mail.jira.plugins.groovy.impl.AuditService;
import ru.mail.jira.plugins.groovy.util.Const;
import ru.mail.jira.plugins.groovy.util.UserMapper;
import ru.mail.jira.plugins.groovy.util.ValidationException;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ScheduledTaskRepositoryImpl implements ScheduledTaskRepository {
    private final Logger logger = LoggerFactory.getLogger(ScheduledTaskRepositoryImpl.class);

    private final ActiveObjects ao;
    private final I18nHelper i18nHelper;
    private final DateTimeFormatter dateTimeFormatter;
    private final WorkflowManager workflowManager;
    private final UserManager userManager;
    private final SchedulerHistoryService schedulerHistoryService;
    private final SchedulerService schedulerService;
    private final SearchService searchService;
    private final ChangelogHelper changelogHelper;
    private final AuditService auditService;
    private final UserMapper userMapper;
    private final ScriptService scriptService;

    @Autowired
    public ScheduledTaskRepositoryImpl(
        @ComponentImport ActiveObjects ao,
        @ComponentImport I18nHelper i18nHelper,
        @ComponentImport DateTimeFormatter dateTimeFormatter,
        @ComponentImport WorkflowManager workflowManager,
        @ComponentImport UserManager userManager,
        @ComponentImport SchedulerHistoryService schedulerHistoryService,
        @ComponentImport SchedulerService schedulerService,
        @ComponentImport SearchService searchService,
        ChangelogHelper changelogHelper,
        AuditService auditService, UserMapper userMapper,
        ScriptService scriptService
    ) {
        this.ao = ao;
        this.i18nHelper = i18nHelper;
        this.dateTimeFormatter = dateTimeFormatter;
        this.workflowManager = workflowManager;
        this.userManager = userManager;
        this.schedulerHistoryService = schedulerHistoryService;
        this.schedulerService = schedulerService;
        this.searchService = searchService;
        this.changelogHelper = changelogHelper;
        this.auditService = auditService;
        this.userMapper = userMapper;
        this.scriptService = scriptService;
    }

    @Override
    public List<ScheduledTaskDto> getAllTasks(boolean includeChangelogs, boolean includeRunInfo) {
        return Arrays
            .stream(ao.find(ScheduledTask.class, Query.select().where("DELETED = ?", Boolean.FALSE)))
            .map(task -> buildDto(task, includeChangelogs, includeRunInfo))
            .collect(Collectors.toList());
    }

    @Override
    public List<ChangelogDto> getChangelogs(int id) {
        ScheduledTaskDto script = getTaskInfo(id, false, false);
        return changelogHelper.collect(script.getScriptBody(), ao.find(ScheduledTaskChangelog.class, Query.select().where("TASK_ID = ?", id)));
    }

    @Override
    public ScheduledTaskDto getTaskInfo(int id, boolean includeChangelogs, boolean includeRunInfo) {
        return buildDto(ao.get(ScheduledTask.class, id), includeChangelogs, includeRunInfo);
    }

    @Override
    public ScheduledTaskDto createTask(ApplicationUser user, ScheduledTaskForm form) {
        validateForm(true, form);

        ScheduledTask task = ao.create(
            ScheduledTask.class,
            new DBParam("UUID", UUID.randomUUID().toString()),
            new DBParam("NAME", form.getName()),
            new DBParam("DESCRIPTION", form.getDescription()),
            new DBParam("SCHEDULE_EXPRESSION", form.getScheduleExpression()),
            new DBParam("USER_KEY", form.getUserKey()),
            new DBParam("TYPE", form.getType()),
            new DBParam("SCRIPT_BODY", form.getScriptBody()),
            new DBParam("JQL", form.getIssueJql()),
            new DBParam("WORKFLOW", form.getIssueWorkflowName()),
            new DBParam("WORKFLOW_ACTION", form.getIssueWorkflowActionId()),
            new DBParam("TRANSITION_OPTIONS", form.getTransitionOptions() != null ? form.getTransitionOptions().toInt() : null),
            new DBParam("DELETED", false),
            new DBParam("ENABLED", true)
        );

        String diff = changelogHelper.generateDiff(task.getID(), "", task.getName(), "", task.getScriptBody());

        String comment = form.getComment();
        if (comment == null) {
            comment = Const.CREATED_COMMENT;
        }

        changelogHelper.addChangelog(ScheduledTaskChangelog.class, "TASK_ID", task.getID(), null, user.getKey(), diff, comment);

        addAuditLogAndNotify(user, EntityAction.CREATED, task, diff, comment);

        return buildDto(task, true, true);
    }

    @Override
    public ScheduledTaskDto updateTask(ApplicationUser user, int id, ScheduledTaskForm form) {
        validateForm(false, form);

        ScheduledTask task = ao.get(ScheduledTask.class, id);

        String diff = changelogHelper.generateDiff(id, task.getName(), form.getName(), task.getScriptBody(), form.getScriptBody());
        String comment = form.getComment();

        changelogHelper.addChangelog(ScheduledTaskChangelog.class, "TASK_ID", task.getID(), task.getUuid(), user.getKey(), diff, comment);

        task.setUuid(UUID.randomUUID().toString());
        task.setName(form.getName());
        task.setDescription(form.getDescription());
        task.setScheduleExpression(form.getScheduleExpression());
        task.setUserKey(form.getUserKey());
        task.setType(form.getType());
        task.setScriptBody(form.getScriptBody());
        task.setJql(form.getIssueJql());
        task.setWorkflow(form.getIssueWorkflowName());
        task.setWorkflowAction(form.getIssueWorkflowActionId());
        task.setTransitionOptions(form.getTransitionOptions() != null ? form.getTransitionOptions().toInt() : null);
        task.save();

        addAuditLogAndNotify(user, EntityAction.UPDATED, task, diff, comment);

        return buildDto(task, true, true);
    }

    @Override
    public void setEnabled(ApplicationUser user, int id, boolean enabled) {
        ScheduledTask task = ao.get(ScheduledTask.class, id);

        task.setEnabled(enabled);
        task.save();

        addAuditLogAndNotify(user, enabled ? EntityAction.ENABLED : EntityAction.DISABLED, task, null, task.getID() + " - " + task.getName());
    }

    @Override
    public void deleteTask(ApplicationUser user, int id) {
        ScheduledTask task = ao.get(ScheduledTask.class, id);

        task.setDeleted(true);
        task.save();

        addAuditLogAndNotify(user, EntityAction.DELETED, task, null, task.getID() + " - " + task.getName());
    }

    @Override
    public ScheduledTaskDto restoreTask(ApplicationUser user, int id) {
        ScheduledTask task = ao.get(ScheduledTask.class, id);

        task.setDeleted(false);
        task.save();

        addAuditLogAndNotify(user, EntityAction.RESTORED, task, null, task.getID() + " - " + task.getName());

        return buildDto(task, true, true);
    }

    private void addAuditLogAndNotify(ApplicationUser user, EntityAction action, ScheduledTask task, String diff, String description) {
        auditService.addAuditLogAndNotify(user, action, EntityType.SCHEDULED_TASK, task, diff, description);
    }

    private void validateForm(boolean isNew, ScheduledTaskForm form) {
        ValidationUtils.validateForm(i18nHelper, isNew, form);

        String scheduleExpression = StringUtils.trimToNull(form.getScheduleExpression());
        form.setScheduleExpression(scheduleExpression);

        if (scheduleExpression == null) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scheduleExpression");
        }
        Integer schedulePeriod = Ints.tryParse(scheduleExpression);
        boolean isPeriod = schedulePeriod != null;
        if (isPeriod) {
            if (schedulePeriod == 0) {
                throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.invalidValue"), "scheduleExpression");
            }
        } else {
            try {
                CronExpressionParser.parse(scheduleExpression);
            } catch (CronSyntaxException e) {
                throw new ValidationException(e.getMessage(), "scheduleExpression");
            }
        }

        String userKey = StringUtils.trimToNull(form.getUserKey());
        form.setUserKey(userKey);

        if (userKey == null) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "userKey");
        }

        ApplicationUser user = userManager.getUserByKey(userKey);

        if (user == null) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.unknownUser"), "userKey");
        }

        boolean requiresScript = false;
        boolean requiresJql = false;

        ScheduledTaskType type = form.getType();

        if (type == null) {
            throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "type");
        }

        switch(type) {
            case BASIC_SCRIPT:
                requiresScript = true;
                break;
            case ISSUE_JQL_SCRIPT:
            case DOCUMENT_ISSUE_JQL_SCRIPT:
                requiresScript = true;
                requiresJql = true;
                break;
            case ISSUE_JQL_TRANSITION:
                requiresJql = true;

                if (StringUtils.isEmpty(form.getIssueWorkflowName())) {
                    throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "issueWorkflowName");
                }

                if (form.getIssueWorkflowActionId() == null) {
                    throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "issueWorkflowActionId");
                }

                if (form.getTransitionOptions() == null) {
                    form.setTransitionOptions(new TransitionOptionsDto());
                }
                break;
        }

        if (requiresScript) {
            if (StringUtils.isEmpty(form.getScriptBody())) {
                throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "scriptBody");
            }

            scriptService.parseScript(form.getScriptBody());
        } else {
            form.setScriptBody(null);
        }

        if (requiresJql) {
            if (StringUtils.isEmpty(form.getIssueJql())) {
                throw new ValidationException(i18nHelper.getText("ru.mail.jira.plugins.groovy.error.fieldRequired"), "issueJql");
            }

            SearchService.ParseResult parseResult = searchService.parseQuery(user, form.getIssueJql());
            if (!parseResult.isValid()) {
                throw new ValidationException(Lists.newArrayList(parseResult.getErrors().getErrorMessages()), "issueJql");
            }
        } else {
            form.setIssueJql(null);
        }
    }

    private ScheduledTaskDto buildDto(ScheduledTask task, boolean includeChangelogs, boolean includeRunInfo) {
        ScheduledTaskDto result = new ScheduledTaskDto();

        result.setId(task.getID());
        result.setUuid(task.getUuid());
        result.setName(task.getName());
        result.setDescription(task.getDescription());
        result.setScheduleExpression(task.getScheduleExpression());
        result.setType(task.getType());
        result.setScriptBody(task.getScriptBody());
        result.setUserKey(task.getUserKey());
        result.setIssueJql(task.getJql());
        result.setIssueWorkflowActionId(task.getWorkflowAction());
        result.setEnabled(task.isEnabled());

        result.setUser(userMapper.buildUserOption(task.getUserKey()));

        if (task.getType() == ScheduledTaskType.ISSUE_JQL_TRANSITION) {
            JiraWorkflow workflow = workflowManager.getWorkflow(task.getWorkflow());
            if (workflow != null) {
                ActionDescriptor action = workflow
                    .getAllActions()
                    .stream()
                    .filter(a -> a.getId() == task.getWorkflowAction())
                    .findAny()
                    .orElse(null);

                if (action != null) {
                    result.setIssueWorkflow(new PickerOption(
                        workflow.getDisplayName(),
                        workflow.getName(),
                        null
                    ));
                    result.setIssueWorkflowAction(new PickerOption(
                        action.getName() + " (" + action.getId() + ")",
                        String.valueOf(action.getId()),
                        null
                    ));
                }

                result.setTransitionOptions(TransitionOptionsDto.fromInt(task.getTransitionOptions()));
            }
        }

        if (includeChangelogs) {
            result.setChangelogs(changelogHelper.collect(task.getScriptBody(), task.getChangelogs()));
        }

        if (includeRunInfo) {
            JobId jobId = JobUtil.getJobId(task.getID());
            RunDetails runDetails = schedulerHistoryService.getLastRunForJob(jobId);

            if (runDetails != null) {
                RunInfo runInfo = new RunInfo();
                runInfo.setStartDate(dateTimeFormatter.withStyle(DateTimeStyle.COMPLETE).format(runDetails.getStartTime()));
                runInfo.setDuration(runDetails.getDurationInMillis());
                runInfo.setOutcome(runDetails.getRunOutcome());
                runInfo.setMessage(runDetails.getMessage());

                result.setLastRunInfo(runInfo);
            }

            if (task.isEnabled()) {
                JobDetails jobDetails = schedulerService.getJobDetails(jobId);
                if (jobDetails != null) {
                    Date nextRunTime = jobDetails.getNextRunTime();
                    if (nextRunTime != null) {
                        result.setNextRunDate(dateTimeFormatter.withStyle(DateTimeStyle.COMPLETE).format(nextRunTime));
                    }
                } else {
                    logger.error("cannot get job details for {}", task.getID());
                }
            }
        }

        return result;
    }
}
