package ru.mail.jira.plugins.groovy.impl.service;

import com.atlassian.cache.Cache;
import com.atlassian.cache.CacheException;
import com.atlassian.cache.CacheManager;
import com.atlassian.cache.CacheSettingsBuilder;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.google.common.collect.ImmutableMap;
import org.codehaus.groovy.ast.*;
import org.codehaus.groovy.ast.expr.*;
import org.codehaus.groovy.control.CompilationUnit;
import org.codehaus.groovy.control.MultipleCompilationErrorsException;
import org.codehaus.groovy.tools.groovydoc.LinkArgument;
import org.codehaus.groovy.transform.stc.StaticTypesMarker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.ast.AstContent;
import ru.mail.jira.plugins.groovy.api.dto.ast.AstPosition;
import ru.mail.jira.plugins.groovy.api.dto.ast.AstRange;
import ru.mail.jira.plugins.groovy.api.dto.ast.HoverDto;
import ru.mail.jira.plugins.groovy.api.script.AstParseResult;
import ru.mail.jira.plugins.groovy.api.service.AstService;
import ru.mail.jira.plugins.groovy.api.service.GroovyDocService;
import ru.mail.jira.plugins.groovy.api.service.ScriptService;
import ru.mail.jira.plugins.groovy.util.ExceptionHelper;
import ru.mail.jira.plugins.groovy.util.ValidationException;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
public class AstServiceImpl implements AstService {
    private final Cache<String, AstParseResult> astCache;
    private final GroovyDocService groovyDocService;
    private final ScriptService scriptService;

    @Autowired
    public AstServiceImpl(
        @ComponentImport CacheManager cacheManager,
        ScriptService scriptService,
        GroovyDocService groovyDocService
    ) {
        this.groovyDocService = groovyDocService;
        this.scriptService = scriptService;
        this.astCache = cacheManager.getCache(
            AstService.class.getName() + ".ast",
            (String source) -> scriptService.parseAstStatic(source, ImmutableMap.of()),
            new CacheSettingsBuilder()
                .expireAfterAccess(5, TimeUnit.MINUTES)
                .maxEntries(100)
                .build()
        );
    }

    @Override
    public List<Object> runStaticCompilationCheck(String source, Map<String, Class> types) {
        AstParseResult parseResult = scriptService.parseAstStatic(source, types);
        //todo: maybe use @TypeChecked logic, instead of @CompileStatic

        return parseResult
            .getParseContext()
            .getWarnings()
            .stream()
            .map(msg -> ExceptionHelper.mapCompilationMessage("warning", msg))
            .collect(Collectors.toList());
    }

    @Override
    public List<Object> runSingletonStaticCompilationCheck(
        String source, Class expectedType
    ) {
        try {
            AstParseResult parseResult = astCache.get(source);
            CompilationUnit compilationUnit = parseResult.getCompilationUnit();

            if (expectedType != null) {
                if (Arrays.stream(compilationUnit.getAST().getClasses().get(0).getInterfaces()).noneMatch(it -> it.getTypeClass() == expectedType)) {
                    throw new ValidationException("Must implement " + expectedType.getCanonicalName());
                }
            }

            return parseResult
                .getParseContext()
                .getWarnings()
                .stream()
                .map(msg -> ExceptionHelper.mapCompilationMessage("warning", msg))
                .collect(Collectors.toList());
        } catch (CacheException e) {
            if (e.getCause() instanceof MultipleCompilationErrorsException) {
                throw ((MultipleCompilationErrorsException) e.getCause());
            } else {
                throw e;
            }
        }
    }

    @Override
    public HoverDto getHoverInfo(String source, AstPosition position) {
        CompilationUnit compilationUnit = astCache.get(source).getCompilationUnit();

        AstSearchVisitor searcher = new AstSearchVisitor(compilationUnit.iterator().next(), position);

        for (ClassNode aClass : compilationUnit.getAST().getClasses()) {
            searcher.visitClass(aClass);
        }

        ASTNode node = searcher.getResult();

        if (node != null) {
            List<AstContent> content = new ArrayList<>();

            if (node instanceof GenericsType) {
                node = ((GenericsType) node).getType();
            }

            if (node instanceof VariableExpression) {
                VariableExpression variableExp = (VariableExpression) node;
                content.add(new AstContent("**Variable** " + getClassReference(variableExp.getType()) + " " + variableExp.getName()));
            } else if (node instanceof FieldExpression) {
                FieldExpression fieldExpr = (FieldExpression) node;
                //todo: add field modifiers (maybe via metadata)
                content.add(new AstContent("**Field** " + getClassReference(fieldExpr.getType()) + " " + fieldExpr.getFieldName()));
            } else if (node instanceof AnnotationNode) {
                AnnotationNode annotationNode = (AnnotationNode) node;
                content.add(new AstContent("**Annotation** \"" + getClassReference(annotationNode.getClassNode()) + "\""));
            } else if (node instanceof PropertyExpression) {
                //todo: property modifiers (maybe via metadata)
                PropertyExpression propertyExpr = (PropertyExpression) node;
                ClassNode type = propertyExpr.getType();
                ClassNode inferredType = propertyExpr.getNodeMetaData(StaticTypesMarker.INFERRED_TYPE);
                if (inferredType != null) {
                    type = inferredType;
                }

                String modifiers = "";

                MethodNode directCallTarget = propertyExpr.getNodeMetaData(StaticTypesMarker.DIRECT_METHOD_CALL_TARGET);
                if (directCallTarget != null) {
                    content.add(new AstContent(getClassReference(directCallTarget.getDeclaringClass())));
                    modifiers = getModifiers(directCallTarget.getModifiers()) + " ";
                }

                content.add(new AstContent("**Property** " + modifiers + getClassReference(type) + " " + propertyExpr.getPropertyAsString()));
            } else if (node instanceof ConstructorCallExpression) {
                ConstructorCallExpression constructorCallExpr = (ConstructorCallExpression) node;
                MethodNode methodTarget = constructorCallExpr.getNodeMetaData(StaticTypesMarker.DIRECT_METHOD_CALL_TARGET);

                content.add(new AstContent(
                    "**Constructor call** " +
                        getModifiers(methodTarget.getModifiers()) + " " +
                        getClassReference(methodTarget.getDeclaringClass()) +
                        "(" + getParameters(methodTarget.getParameters()) + ")"
                ));
            } else if (node instanceof MethodCallExpression) {
                MethodCallExpression methodCallExpr = (MethodCallExpression) node;
                MethodNode methodTarget = methodCallExpr.getMethodTarget();

                content.add(new AstContent("**Method call** " + getClassReference(methodTarget.getDeclaringClass()) + "#" + methodTarget.getName() + ""));
                content.add(new AstContent(
                    getModifiers(methodTarget.getModifiers()) + " " +
                        getClassReference(methodTarget.getReturnType()) + " " + methodTarget.getName() +
                        "(" + getParameters(methodTarget.getParameters()) + ")"
                ));
            } else if (node instanceof ClassExpression) {
                ClassExpression classExpr = (ClassExpression) node;
                ClassNode type = classExpr.getType();
                content.add(new AstContent(getModifiers(type.getModifiers()) + " class " + getClassReference(type)));
            } else if (node instanceof ClassNode) {
                ClassNode classNode = (ClassNode) node;
                content.add(new AstContent(getModifiers(classNode.getModifiers()) + " class " + getClassReference(classNode)));
            } else {
                //todo: change to noop
                content.add(new AstContent(node.getClass().getName()));
            }

            return new HoverDto(
                new AstRange(
                    node.getLineNumber(), node.getColumnNumber(),
                    node.getLastLineNumber(), node.getLastColumnNumber()
                ),
                content
            );
        }

        return null;
    }

    private String getModifiers(int modifiers) {
        List<String> tokens = new ArrayList<>();

        if (Modifier.isStatic(modifiers)) {
            tokens.add("static");
        }

        if (Modifier.isPublic(modifiers)) {
            tokens.add("public");
        } else if (Modifier.isProtected(modifiers)) {
            tokens.add("private");
        }

        if (Modifier.isFinal(modifiers)) {
            tokens.add("final");
        }

        return String.join(" ", tokens);
    }

    private String getParameters(Parameter[] parameters) {
        return Arrays
            .stream(parameters)
            .map(parameter -> getClassReference(parameter.getType()) + " " + parameter.getName())
            .collect(Collectors.joining(", "));
    }

    private String getClassReference(ClassNode classNode) {
        String name = classNode.getName();

        String genericTypes = "";

        if (classNode.getGenericsTypes() != null && classNode.getGenericsTypes().length > 0) {
            genericTypes = "<" + Arrays
                .stream(classNode.getGenericsTypes())
                .map(GenericsType::getType)
                .map(this::getClassReference)
                .collect(Collectors.joining(", ")) + ">";
        }

        for (LinkArgument docLink : groovyDocService.getDocLinks()) {
            for (String packageName : docLink.getPackages().split(",")){
                if (name.startsWith(packageName)) {
                    return "[" + classNode.getNameWithoutPackage() + "](" + docLink.getHref() + name.replaceAll("\\.", "/") + ".html)" + genericTypes;
                }
            }
        }

        return name + genericTypes;
    }
}
