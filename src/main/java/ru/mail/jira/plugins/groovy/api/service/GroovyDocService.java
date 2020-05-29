package ru.mail.jira.plugins.groovy.api.service;

import org.codehaus.groovy.tools.groovydoc.LinkArgument;
import ru.mail.jira.plugins.groovy.api.dto.docs.ClassDoc;
import ru.mail.jira.plugins.groovy.api.util.WithPluginLoader;

import java.util.List;

public interface GroovyDocService {
    @WithPluginLoader
    ClassDoc parseDocs(String canonicalName, String className, String source) throws Exception;

    List<LinkArgument> getDocLinks();
}
