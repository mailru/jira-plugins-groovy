package ru.mail.jira.plugins.groovy.impl.service;

import lombok.Getter;
import org.codehaus.groovy.ast.*;
import org.codehaus.groovy.ast.expr.*;
import org.codehaus.groovy.control.SourceUnit;
import ru.mail.jira.plugins.groovy.api.dto.ast.AstPosition;

public class AstSearchVisitor extends ClassCodeVisitorSupport {
    private final SourceUnit sourceUnit;
    private final AstPosition position;

    @Getter
    private ASTNode result;

    public AstSearchVisitor(SourceUnit sourceUnit, AstPosition position) {
        this.sourceUnit = sourceUnit;
        this.position = position;
    }

    @Override
    protected SourceUnit getSourceUnit() {
        return sourceUnit;
    }

    @Override
    public void visitClass(ClassNode node) {
        visitNode(node);
        super.visitClass(node);
    }

    @Override
    public void visitClassExpression(ClassExpression node) {
        visitNode(node);
        super.visitClassExpression(node);
    }

    @Override
    public void visitField(FieldNode node) {
        visitNode(node);
        super.visitField(node);
    }

    @Override
    public void visitFieldExpression(FieldExpression node) {
        visitNode(node);
        super.visitFieldExpression(node);
    }

    @Override
    public void visitAnnotations(AnnotatedNode node) {
        visitNode(node);
        for (AnnotationNode annotation : node.getAnnotations()) {
            visitNode(annotation);
        }
        super.visitAnnotations(node);
    }

    @Override
    public void visitPropertyExpression(PropertyExpression node) {
        visitNode(node);
        super.visitPropertyExpression(node);
    }

    @Override
    public void visitProperty(PropertyNode node) {
        visitNode(node);
        super.visitProperty(node);
    }

    @Override
    public void visitMethodCallExpression(MethodCallExpression node) {
        visitNode(node);
        super.visitMethodCallExpression(node);
    }

    @Override
    public void visitConstructorCallExpression(ConstructorCallExpression node) {
        visitNode(node);
        super.visitConstructorCallExpression(node);
    }

    @Override
    public void visitVariableExpression(VariableExpression node) {
        visitNode(node);
        super.visitVariableExpression(node);
    }

    @Override
    protected void visitConstructorOrMethod(MethodNode node, boolean isConstructor) {
        super.visitConstructorOrMethod(node, isConstructor);
        visitNode(node.getReturnType());
    }

    private void visitNode(ASTNode node) {
        if (node.getLineNumber() == -1) {
            return;
        }

        int line = position.getLine();
        int column = position.getColumn();
        if (
            line >= node.getLineNumber() && line <= node.getLastLineNumber() &&
            column >= node.getColumnNumber() && column <= node.getLastColumnNumber()
        ) {
            result = node;
        }

        if (node instanceof Parameter) {
            visitNode(((Parameter) node).getType());
        } else if (node instanceof ClassNode) {
            ClassNode classNode = (ClassNode) node;

            if (classNode.getGenericsTypes() != null) {
                for (GenericsType genericsType : classNode.getGenericsTypes()) {
                    visitNode(genericsType);
                }
            }
        }
    }
}
