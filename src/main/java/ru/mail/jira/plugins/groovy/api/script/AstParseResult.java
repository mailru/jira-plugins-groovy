package ru.mail.jira.plugins.groovy.api.script;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.codehaus.groovy.control.CompilationUnit;

@Getter @AllArgsConstructor
public class AstParseResult {
    private final CompilationUnit compilationUnit;
    private final ParseContext parseContext;
}
