package ru.mail.jira.plugins.groovy.api.dto.ast;

import lombok.Getter;
import lombok.Setter;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@Getter @Setter
@XmlRootElement
public class AstPosition {
    @XmlElement
    private int line;
    @XmlElement
    private int column;
}
