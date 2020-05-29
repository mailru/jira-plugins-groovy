package ru.mail.jira.plugins.groovy.rest;

import com.atlassian.plugin.spring.scanner.annotation.component.Scanned;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import org.codehaus.groovy.control.MultipleCompilationErrorsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.mail.jira.plugins.groovy.api.dto.StaticCheckForm;
import ru.mail.jira.plugins.groovy.api.dto.error.PositionedCompilationMessage;
import ru.mail.jira.plugins.groovy.api.jql.ScriptedJqlFunction;
import ru.mail.jira.plugins.groovy.api.service.AstService;
import ru.mail.jira.plugins.groovy.impl.PermissionHelper;
import ru.mail.jira.plugins.groovy.api.script.ParseContext;
import ru.mail.jira.plugins.groovy.impl.groovy.statik.TypeUtil;
import ru.mail.jira.plugins.groovy.util.cl.DelegatingClassLoader;
import ru.mail.jira.plugins.groovy.util.ExceptionHelper;
import ru.mail.jira.plugins.groovy.util.RestExecutor;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;
import java.util.Map;

@Scanned
@Path("/staticCheck")
public class StaticCheckResource {
    private final Logger logger = LoggerFactory.getLogger(StaticCheckResource.class);

    private final PermissionHelper permissionHelper;
    private final AstService astService;
    private final DelegatingClassLoader classLoader;

    public StaticCheckResource(
        PermissionHelper permissionHelper,
        AstService astService,
        DelegatingClassLoader classLoader
    ) {
        this.permissionHelper = permissionHelper;
        this.astService = astService;
        this.classLoader = classLoader;
    }

    @POST
    public Response checkStatic(StaticCheckForm form) {
        return new RestExecutor<>(() -> {
            permissionHelper.checkIfAdmin();

            Map<String, String> additionalParams = form.getAdditionalParams();

            ParseContext parseContext = null;

            switch (form.getScriptType()) {
                case ADMIN_SCRIPT:
                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getAdminTypes());
                case CONSOLE:
                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getConsoleTypes());
                case WORKFLOW_GENERIC:
                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getWorkflowTypes());
                case REST:
                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getRestTypes());
                case CUSTOM_FIELD:
                    boolean velocityParamsEnabled = false;

                    if (additionalParams != null && additionalParams.containsKey("velocityParamsEnabled")) {
                        velocityParamsEnabled = "true".equals(additionalParams.get("velocityParamsEnabled"));
                    }

                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getFieldTypes(velocityParamsEnabled));
                case SCHEDULED_TASK:
                    boolean isMutableIssue = false;
                    boolean withIssue = false;

                    if (additionalParams != null)
                        if (additionalParams.containsKey("withIssue")) {
                            withIssue = "true".equals(additionalParams.get("withIssue"));
                        }
                        if (additionalParams.containsKey("isMutableIssue")) {
                            isMutableIssue = "true".equals(additionalParams.get("isMutableIssue"));
                        }

                    return astService.runStaticCompilationCheck(form.getScriptBody(), TypeUtil.getScheduledTypes(withIssue, isMutableIssue));
                case JQL:
                    return astService.runSingletonStaticCompilationCheck(form.getScriptBody(), ScriptedJqlFunction.class);
                case GLOBAL_OBJECT:
                    return astService.runSingletonStaticCompilationCheck(form.getScriptBody(), null);
                case LISTENER:
                    Map<String, Class> types = ImmutableMap.of();

                    if (additionalParams.containsKey("className")) {
                        String className = additionalParams.get("className");

                        Class type;
                        try {
                            type = classLoader.loadClass(className);
                        } catch (ClassNotFoundException e) {
                            PositionedCompilationMessage error = new PositionedCompilationMessage();
                            error.setStartLine(0);
                            error.setEndLine(0);
                            error.setStartColumn(0);
                            error.setEndColumn(0);
                            error.setMessage("Can't load class \"" + className + "\"");
                            error.setType("error");

                            return ImmutableList.of(error);
                        }

                        if (type != null) {
                            types = ImmutableMap.of(
                                "event", type
                            );
                        }
                    }

                    return astService.runStaticCompilationCheck(form.getScriptBody(), types);
                default:
                    throw new IllegalArgumentException("Unsupported script type");
            }
        })
            .withExceptionMapper(MultipleCompilationErrorsException.class, Response.Status.BAD_REQUEST, e -> ExceptionHelper.mapCompilationException("scriptBody", e))
            .getResponse();
    }
}
