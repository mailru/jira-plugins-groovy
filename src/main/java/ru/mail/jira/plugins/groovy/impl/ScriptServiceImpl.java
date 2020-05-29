package ru.mail.jira.plugins.groovy.impl;

import com.atlassian.plugin.Plugin;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalCause;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import com.google.common.collect.ImmutableMap;
import groovy.lang.*;
import org.codehaus.groovy.ast.ClassNode;
import org.codehaus.groovy.ast.CompileUnit;
import org.codehaus.groovy.control.*;
import org.codehaus.groovy.control.customizers.ImportCustomizer;
import org.codehaus.groovy.control.messages.WarningMessage;
import org.codehaus.groovy.runtime.InvokerHelper;
import org.codehaus.groovy.tools.GroovyClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.script.*;
import ru.mail.jira.plugins.groovy.api.dto.CacheStatsDto;
import ru.mail.jira.plugins.groovy.api.script.binding.BindingProvider;
import ru.mail.jira.plugins.groovy.api.service.InjectionResolver;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.api.util.PluginLifecycleAware;
import ru.mail.jira.plugins.groovy.impl.groovy.*;
import ru.mail.jira.plugins.groovy.impl.groovy.statik.CompileStaticExtension;
import ru.mail.jira.plugins.groovy.impl.groovy.statik.DeprecatedAstVisitor;
import ru.mail.jira.plugins.groovy.api.script.binding.BindingDescriptor;
import ru.mail.jira.plugins.groovy.impl.var.HttpClientBindingDescriptor;
import ru.mail.jira.plugins.groovy.impl.var.LoggerBindingDescriptor;
import ru.mail.jira.plugins.groovy.impl.var.ScriptTypeBindingProvider;
import ru.mail.jira.plugins.groovy.impl.var.TemplateEngineBindingDescriptor;
import ru.mail.jira.plugins.groovy.util.cl.ContextAwareClassLoader;
import ru.mail.jira.plugins.groovy.util.cl.DelegatingClassLoader;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@ExportAsService({ScriptService.class})
@Component
public class ScriptServiceImpl implements ScriptService, PluginLifecycleAware {
    private final Logger logger = LoggerFactory.getLogger(ScriptServiceImpl.class);
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock(); //todo: remove?
    private final Map<String, ScriptClosure> globalFunctions = new HashMap<>();
    private final Map<String, BindingDescriptor> globalVariables = new HashMap<>();
    private final ParseContextHolder parseContextHolder = new ParseContextHolder();
    private final ExecutionContextHolder executionContextHolder = new ExecutionContextHolder();
    //assuming that all mutations happen only during initialization in single thread
    private final List<BindingProvider> bindingProviders = new ArrayList<>();
    private final Cache<String, CompiledScript> scriptCache = Caffeine
        .newBuilder()
        .maximumSize(1000)
        .expireAfterAccess(1, TimeUnit.HOURS)
        .recordStats()
        .removalListener((String k, CompiledScript v, RemovalCause reason) -> {
            if (v != null) {
                InvokerHelper.removeClass(v.getScriptClass());
            }
        })
        .build();

    private final InjectionResolver injectionResolver;
    private final DelegatingClassLoader classLoader;
    private final ContextAwareClassLoader contextAwareClassLoader;
    private final GroovyClassLoader gcl;
    private final CompilerConfiguration compilerConfiguration;

    @Autowired
    public ScriptServiceImpl(
        InjectionResolver injectionResolver,
        DelegatingClassLoader classLoader,
        ContextAwareClassLoader contextAwareClassLoader
    ) {
        this.injectionResolver = injectionResolver;
        this.classLoader = classLoader;
        this.contextAwareClassLoader = contextAwareClassLoader;
        this.compilerConfiguration = new CompilerConfiguration()
            .addCompilationCustomizers(
                new PackageCustomizer(),
                new CompileStaticExtension(parseContextHolder, this),
                new ImportCustomizer().addStarImports("ru.mail.jira.plugins.groovy.api.script"),
                new WithPluginExtension(parseContextHolder),
                new LoadClassesExtension(parseContextHolder, injectionResolver, contextAwareClassLoader),
                new InjectionExtension(parseContextHolder),
                new ParamExtension(parseContextHolder)
            );
        this.compilerConfiguration.setWarningLevel(WarningMessage.LIKELY_ERRORS);
        this.compilerConfiguration.setTolerance(10);
        this.compilerConfiguration.setOptimizationOptions(ImmutableMap.of(
            CompilerConfiguration.INVOKEDYNAMIC, Boolean.TRUE
        ));
        this.gcl = new GroovyClassLoader(
            classLoader,
            this.compilerConfiguration
        );
        this.gcl.setResourceLoader((url) -> null);
    }

    @Override
    public Object executeScript(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings) throws Exception {
        ScriptExecutionOutcome outcome = executeScriptWithOutcome(scriptId, scriptString, type, bindings);

        if (outcome.isSuccessful()) {
            return outcome.getResult();
        }

        throw outcome.getError();
    }

    @Override
    public ScriptExecutionOutcome executeScriptWithOutcome(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings) {
        return doExecuteScript(scriptId, scriptString, type, bindings, false, null);
    }

    @Override
    public Object executeScriptStatic(String scriptId, String scriptString, ScriptType type, Map<String, Object> bindings, Map<String, Class> types) throws Exception {
        ScriptExecutionOutcome outcome = doExecuteScript(scriptId, scriptString, type, bindings, true, types);

        if (outcome.isSuccessful()) {
            return outcome.getResult();
        }

        throw outcome.getError();
    }

    @Override
    public ParseContext parseScript(String script) {
        CompiledScript result = parseClass(script, null, true, false, null);
        InvokerHelper.removeClass(result.getScriptClass());
        return result.getParseContext();
    }

    @Override
    public ParseContext parseScriptStatic(String script, Map<String, Class> types) {
        CompiledScript result = parseClass(script, null, true, true, types);
        InvokerHelper.removeClass(result.getScriptClass());
        return result.getParseContext();
    }

    @Override
    public Class parseClass(String classBody, boolean extended) {
        return parseClass(classBody, null, extended, false, null).getScriptClass();
    }

    @Override
    public AstParseResult parseAst(String classBody) {
        return parseAst(classBody, null, false, null);
    }

    @Override
    public AstParseResult parseAstStatic(String classBody, Map<String, Class> types) {
        return parseAst(classBody, null, true, types);
    }

    @Override
    public CompiledScript<?> parseSingleton(String classBody, boolean extended, Map<String, Class> types) {
        parseContextHolder.get().setSingleton(true);
        return parseClass(classBody, null, extended, true, types);
    }

    @Override
    public CacheStatsDto getCacheStats() {
        CacheStats stats = scriptCache.stats();

        return new CacheStatsDto(
            stats.hitCount(),
            stats.missCount(),
            stats.loadSuccessCount(),
            stats.loadFailureCount(),
            stats.totalLoadTime(),
            stats.evictionCount(),
            stats.evictionWeight(),
            scriptCache.estimatedSize()
        );
    }

    @Override
    public Map<String, BindingDescriptor> getGlobalBindings() {
        Map<String, BindingDescriptor> result = new HashMap<>(globalVariables);

        for (BindingProvider bindingProvider : bindingProviders) {
            bindingProvider
                .getBindings()
                .forEach(result::put);
        }

        return result;
    }

    @Override
    public void registerBindingProvider(BindingProvider bindingProvider) {
        bindingProviders.add(bindingProvider);
    }

    @Override
    public void invalidate(String id) {
        scriptCache.invalidate(id);
    }

    @Override
    public void invalidateAll() {
        scriptCache.invalidateAll();
        gcl.clearCache();
        classLoader.flushCache();
    }

    private ScriptExecutionOutcome doExecuteScript(
        String scriptId, String scriptString, ScriptType type, Map<String, Object> externalBindings,
        boolean compileStatic, Map<String, Class> types
    ) {
        logger.debug("started execution");

        long t = System.currentTimeMillis();
        CompiledScript compiledScript = null;
        Script script = null;
        boolean fromCache = false;

        try {
            contextAwareClassLoader.startContext();

            if (scriptId != null) {
                compiledScript = scriptCache.get(scriptId, ignore -> parseClass(scriptString, scriptId, false, compileStatic, types));
                fromCache = true;
            }

            if (compiledScript == null) {
                compiledScript = parseClass(scriptString, scriptId, false, compileStatic, types);
            }

            //make sure that plugin classes can be loaded for cached scripts
            Set<Plugin> plugins = new HashSet<>();
            for (String pluginKey : compiledScript.getParseContext().getPlugins()) {
                Plugin plugin = injectionResolver.getPlugin(pluginKey);

                if (plugin == null) {
                    throw new RuntimeException("Plugin " + pluginKey + " couldn't be loaded");
                }

                plugins.add(plugin);
            }

            logger.debug("created class");

            HashMap<String, Object> bindings = new HashMap<>();

            for (BindingProvider bindingProvider : bindingProviders) {
                bindingProvider.getBindings().forEach((name, value) -> bindings.put(name, value.getValue(type, scriptId)));
            }

            for (Map.Entry<String, ScriptClosure> entry : globalFunctions.entrySet()) {
                bindings.put(entry.getKey(), entry.getValue());
            }

            for (Map.Entry<String, BindingDescriptor> entry : globalVariables.entrySet()) {
                bindings.put(entry.getKey(), entry.getValue().getValue(type, scriptId));
            }

            contextAwareClassLoader.addPlugins(plugins);
            bindings.putAll(externalBindings);

            for (ScriptInjection injection : compiledScript.getParseContext().getInjections()) {
                if (injection.getPlugin() != null) {
                    Object component = injectionResolver.resolvePluginInjection(injection.getPlugin(), injection.getClassName());

                    if (component != null) {
                        bindings.put(injection.getVariableName(), component);
                        continue;
                    }
                } else {
                    Object component = injectionResolver.resolveStandardInjection(injection.getClassName());

                    if (component != null) {
                        bindings.put(injection.getVariableName(), component);
                        continue;
                    }
                }

                throw new RuntimeException("Unable to resolve injection: " + injection);
            }

            logger.debug("initialized bindings");

            script = InvokerHelper.createScript(compiledScript.getScriptClass(), new Binding(bindings));

            logger.debug("created script");

            Object result = script.run();
            logger.debug("completed script");

            return new ScriptExecutionOutcome(result, executionContextHolder.get(), System.currentTimeMillis() - t, null);
        } catch (Exception e) {
            return new ScriptExecutionOutcome(null, executionContextHolder.get(), System.currentTimeMillis() - t, e);
        } finally {
            this.contextAwareClassLoader.exitContext();
            this.executionContextHolder.reset();
            if (!fromCache && script != null) {
                InvokerHelper.removeClass(script.getClass());
            }
        }
    }

    public void onPluginDisable(Plugin plugin) {
        Lock lock = rwLock.writeLock();
        lock.lock();
        try {
            scriptCache.invalidateAll();
        } finally {
            lock.unlock();
        }
    }

    private CompiledScript parseClass(String script, String id, boolean extended, boolean compileStatic, Map<String, Class> types) {
        logger.debug("parsing script");
        try {
            contextAwareClassLoader.startContext();
            parseContextHolder.get().setExtended(extended);
            parseContextHolder.get().setCompileStatic(compileStatic);
            parseContextHolder.get().setTypes(types);

            Class scriptClass = null;

            String scriptId = id;
            if (scriptId == null) {
                scriptId = String.valueOf(System.currentTimeMillis());
            }
            String fileName = "script_" + scriptId.replace('-', '_') + "." + Math.abs(script.hashCode()) + ".groovy";

            CompilationUnit compilationUnit = new CompilationUnit(compilerConfiguration, null, gcl);
            SourceUnit sourceUnit = compilationUnit.addSource(fileName, script);
            compilationUnit.compile(Phases.CLASS_GENERATION);

            if (extended) {
                DeprecatedAstVisitor astVisitor = new DeprecatedAstVisitor();

                for (Object aClass : compilationUnit.getAST().getClasses()) {
                    astVisitor.visitClass((ClassNode) aClass);
                }

                parseContextHolder.get().setWarnings(astVisitor.getWarnings());
            }

            GroovyClassLoader.InnerLoader innerLoader = new GroovyClassLoader.InnerLoader(gcl);

            String mainClass = sourceUnit
                .getAST()
                .getClasses()
                .stream()
                .map(ClassNode::getName)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Unable to find main class"));

            for (Object aClass : compilationUnit.getClasses()) {
                if (aClass instanceof GroovyClass) {
                    GroovyClass groovyClass = (GroovyClass) aClass;

                    BytecodeProcessor bytecodePostprocessor = compilerConfiguration.getBytecodePostprocessor();

                    byte[] byteCode = groovyClass.getBytes();
                    if (bytecodePostprocessor != null) {
                        byteCode = bytecodePostprocessor.processBytecode(groovyClass.getName(), byteCode);
                    }

                    Class clazz = innerLoader.defineClass(groovyClass.getName(), byteCode);

                    if (groovyClass.getName().equals(mainClass)) {
                        scriptClass = clazz;
                    }
                }
            }

            logger.debug("parsed script");
            return new CompiledScript(
                scriptClass,
                parseContextHolder.get()
            );
        } finally {
            logger.debug("resetting parse context");
            this.parseContextHolder.reset();
            this.contextAwareClassLoader.exitContext();
        }
    }

    private AstParseResult parseAst(String script, String id, boolean compileStatic, Map<String, Class> types) {
        logger.debug("parsing ast");
        try {
            contextAwareClassLoader.startContext();
            parseContextHolder.get().setExtended(true);
            parseContextHolder.get().setCompileStatic(compileStatic);
            parseContextHolder.get().setTypes(types);

            String scriptId = id;
            if (scriptId == null) {
                scriptId = String.valueOf(System.currentTimeMillis());
            }
            String fileName = "script_" + scriptId.replace('-', '_') + "." + Math.abs(script.hashCode()) + ".groovy";

            CompilationUnit compilationUnit = new CompilationUnit(compilerConfiguration, null, gcl);
            compilationUnit.addSource(fileName, script);
            compilationUnit.compile(Phases.INSTRUCTION_SELECTION);

            DeprecatedAstVisitor astVisitor = new DeprecatedAstVisitor();

            for (Object aClass : compilationUnit.getAST().getClasses()) {
                astVisitor.visitClass((ClassNode) aClass);
            }

            parseContextHolder.get().setWarnings(astVisitor.getWarnings());

            logger.debug("parsed ast");
            return new AstParseResult(compilationUnit, parseContextHolder.get());
        } finally {
            logger.debug("resetting parse context");
            this.parseContextHolder.reset();
            this.contextAwareClassLoader.exitContext();
        }
    }

    @Override
    public void onStart() {
        globalVariables.put("httpClient", new HttpClientBindingDescriptor());
        globalVariables.put("logger", new LoggerBindingDescriptor(executionContextHolder));
        globalVariables.put("log", new LoggerBindingDescriptor(executionContextHolder));
        globalVariables.put("templateEngine", new TemplateEngineBindingDescriptor(gcl));
        globalVariables.put("scriptType", new ScriptTypeBindingProvider());
    }

    @Override
    public void onStop() {
        //clear everything, just in case

        logger.info("cleaning up");

        invalidateAll();

        globalFunctions.values().forEach(closure -> InvokerHelper.removeClass(closure.getScriptClass()));
        globalFunctions.clear();

        try {
            gcl.close();
        } catch (IOException e) {
            logger.error("unable to close gcl", e);
        }

        for (Map.Entry<String, BindingDescriptor> entry : globalVariables.entrySet()) {
            try {
                entry.getValue().dispose();
            } catch (Exception e) {
                logger.error("unable to dispose variable {}", entry.getKey(), e);
            }
        }

        globalVariables.clear();
        bindingProviders.clear();
        classLoader.flushCache();
    }

    @Override
    public int getInitOrder() {
        return 10;
    }
}
