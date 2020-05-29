package ru.mail.jira.plugins.groovy.api.service;

import com.atlassian.plugin.Plugin;
import org.codehaus.groovy.control.CompilationUnit;
import ru.mail.jira.plugins.groovy.api.dto.CacheStatsDto;
import ru.mail.jira.plugins.groovy.api.script.*;
import ru.mail.jira.plugins.groovy.api.script.binding.BindingDescriptor;
import ru.mail.jira.plugins.groovy.api.script.binding.BindingProvider;
import ru.mail.jira.plugins.groovy.api.util.WithPluginLoader;

import java.util.Map;

public interface ScriptService {
    @Deprecated
    @WithPluginLoader
    Object executeScript(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings) throws Exception;

    @WithPluginLoader
    ScriptExecutionOutcome executeScriptWithOutcome(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings);

    @WithPluginLoader
    Object executeScriptStatic(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings, Map<String, Class> types) throws Exception;

    @WithPluginLoader
    ParseContext parseScript(String script);

    @WithPluginLoader
    ParseContext parseScriptStatic(String script, Map<String, Class> types);

    @WithPluginLoader
    Class parseClass(String classBody, boolean extended);

    @WithPluginLoader
    AstParseResult parseAst(String classBody);

    @WithPluginLoader
    AstParseResult parseAstStatic(String classBody, Map<String, Class> types);

    @WithPluginLoader
    CompiledScript<?> parseSingleton(String classBody, boolean extended, Map<String, Class> types);

    CacheStatsDto getCacheStats();

    Map<String, BindingDescriptor> getGlobalBindings();

    void registerBindingProvider(BindingProvider bindingProvider);

    void invalidate(String id);

    void invalidateAll();

    void onPluginDisable(Plugin event);
}
