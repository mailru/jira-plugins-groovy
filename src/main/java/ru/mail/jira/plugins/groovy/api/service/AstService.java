package ru.mail.jira.plugins.groovy.api.service;

import ru.mail.jira.plugins.groovy.api.dto.ast.AstPosition;
import ru.mail.jira.plugins.groovy.api.dto.ast.HoverDto;

import java.util.List;
import java.util.Map;

public interface AstService {
    List<Object> runStaticCompilationCheck(String source, Map<String, Class> types);

    List<Object> runSingletonStaticCompilationCheck(String source, Class expectedType);

    HoverDto getHoverInfo(String source, AstPosition position);
}
