package ru.mail.jira.plugins.groovy.rest;

import com.atlassian.plugin.spring.scanner.annotation.component.Scanned;
import com.atlassian.sal.api.websudo.WebSudoRequired;
import ru.mail.jira.plugins.groovy.api.dto.ast.AstRequest;
import ru.mail.jira.plugins.groovy.api.service.AstService;
import ru.mail.jira.plugins.groovy.impl.PermissionHelper;
import ru.mail.jira.plugins.groovy.util.RestExecutor;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Scanned
@Path("/ast")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@WebSudoRequired
public class AstResource {
    private final PermissionHelper permissionHelper;
    private final AstService astService;

    public AstResource(
        PermissionHelper permissionHelper,
        AstService astService
    ) {
        this.permissionHelper = permissionHelper;
        this.astService = astService;
    }

    @POST
    @Path("/hover")
    public Response getHoverInfo(AstRequest request) {
        return new RestExecutor<>(() -> {
            permissionHelper.checkIfAdmin();

            return astService.getHoverInfo(request.getCode(), request.getPosition());
        }).getResponse();
    }
}
