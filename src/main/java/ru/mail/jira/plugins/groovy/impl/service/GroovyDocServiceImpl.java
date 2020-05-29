package ru.mail.jira.plugins.groovy.impl.service;

import com.atlassian.jira.util.BuildUtilsInfo;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsDevService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.google.common.collect.ImmutableList;
import groovyjarjarantlr.collections.AST;
import org.apache.commons.lang3.StringUtils;
import org.codehaus.groovy.antlr.AntlrASTProcessor;
import org.codehaus.groovy.antlr.SourceBuffer;
import org.codehaus.groovy.antlr.UnicodeEscapingReader;
import org.codehaus.groovy.antlr.parser.GroovyLexer;
import org.codehaus.groovy.antlr.parser.GroovyRecognizer;
import org.codehaus.groovy.antlr.treewalker.SourceCodeTraversal;
import org.codehaus.groovy.groovydoc.GroovyClassDoc;
import org.codehaus.groovy.groovydoc.GroovyProgramElementDoc;
import org.codehaus.groovy.groovydoc.GroovyType;
import org.codehaus.groovy.tools.groovydoc.LinkArgument;
import org.codehaus.groovy.tools.groovydoc.SimpleGroovyClassDoc;
import org.codehaus.groovy.tools.groovydoc.SimpleGroovyClassDocAssembler;
import org.codehaus.groovy.tools.groovydoc.SimpleGroovyRootDoc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.mail.jira.plugins.groovy.api.dto.docs.ClassDoc;
import ru.mail.jira.plugins.groovy.api.dto.docs.MethodDoc;
import ru.mail.jira.plugins.groovy.api.dto.docs.ParameterDoc;
import ru.mail.jira.plugins.groovy.api.dto.docs.TypeDoc;
import ru.mail.jira.plugins.groovy.api.service.GroovyDocService;

import java.io.StringReader;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;

@Component
@ExportAsDevService(GroovyDocService.class)
public class GroovyDocServiceImpl implements GroovyDocService {
    private final List<LinkArgument> docLinks;

    @Autowired
    public GroovyDocServiceImpl(
        @ComponentImport BuildUtilsInfo buildUtilsInfo
    ) {
        docLinks = ImmutableList.of(
            linkArgument("java.,org.xml.,javax.,org.xml.", "https://docs.oracle.com/javase/8/docs/api/"),
            linkArgument("groovy.,org.codehaus.groovy.", "http://docs.groovy-lang.org/latest/html/api/"),
            linkArgument("com.atlassian.jira.", "https://docs.atlassian.com/software/jira/docs/api/" + buildUtilsInfo.getVersion() + "/"),
            linkArgument("com.atlassian.crowd.", "https://docs.atlassian.com/atlassian-crowd/current/"),
            linkArgument("com.atlassian.mail.", "https://docs.atlassian.com/atlassian-mail/1.3.23/")
        );
    }

    @Override
    public ClassDoc parseDocs(String canonicalName, String className, String source) throws Exception {
        SourceBuffer sourceBuffer = new SourceBuffer();
        GroovyRecognizer parser = getGroovyParser(source, sourceBuffer);

        parser.compilationUnit();

        AST ast = parser.getAST();

        SimpleGroovyClassDocAssembler visitor = new SimpleGroovyClassDocAssembler("", className + ".groovy", sourceBuffer, docLinks, new Properties(), true);
        AntlrASTProcessor traverser = new SourceCodeTraversal(visitor);
        traverser.process(ast);
        Map<String, GroovyClassDoc> docs = visitor.getGroovyClassDocs();

        SimpleGroovyRootDoc rootDoc = new SimpleGroovyRootDoc("root");
        rootDoc.putAllClasses(docs);
        rootDoc.resolve();

        GroovyClassDoc doc = docs.values().iterator().next();

        List<MethodDoc> methods = Arrays
            .stream(doc.methods())
            .filter(GroovyProgramElementDoc::isPublic)
            .filter(it -> !it.isStatic())
            .map(it -> new MethodDoc(
                it.name(),
                processComment(it.commentText()),
                toTypeDoc(doc, it.returnType(), null),
                Arrays
                    .stream(it.parameters())
                    .map(param -> new ParameterDoc(toTypeDoc(doc, param.type(), param.typeName()), param.name()))
                    .collect(Collectors.toList())
            ))
            .collect(Collectors.toList());

        return new ClassDoc(false, canonicalName, processComment(doc.commentText()), methods);
    }

    @Override
    public List<LinkArgument> getDocLinks() {
        return docLinks;
    }

    private static TypeDoc toTypeDoc(GroovyClassDoc classDoc, GroovyType groovyType, String fallbackString) {
        if (groovyType == null) {
            return new TypeDoc(fallbackString, fallbackString);
        }

        String url = null;

        if (classDoc instanceof SimpleGroovyClassDoc) {
            url = ((SimpleGroovyClassDoc) classDoc).getDocUrl(groovyType.qualifiedTypeName(), false);
        }

        return new TypeDoc(groovyType.qualifiedTypeName(), url);
    }

    private static String processComment(String comment) {
        comment = StringUtils.trimToNull(comment);

        if (comment != null) {
            comment = comment.replaceAll("\\s+", " ");
        }

        return comment;
    }

    private static GroovyRecognizer getGroovyParser(String input, SourceBuffer sourceBuffer) {
        UnicodeEscapingReader unicodeReader = new UnicodeEscapingReader(new StringReader(input), sourceBuffer);
        GroovyLexer lexer = new GroovyLexer(unicodeReader);
        unicodeReader.setLexer(lexer);
        GroovyRecognizer parser = GroovyRecognizer.make(lexer);
        parser.setSourceBuffer(sourceBuffer);
        return parser;
    }

    private static LinkArgument linkArgument(String packages, String href) {
        LinkArgument linkArgument = new LinkArgument();
        linkArgument.setPackages(packages);
        linkArgument.setHref(href);
        return linkArgument;
    }
}
