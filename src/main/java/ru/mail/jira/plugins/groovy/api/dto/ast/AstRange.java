package ru.mail.jira.plugins.groovy.api.dto.ast;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@XmlRootElement
public class AstRange {
    @XmlElement
    private int startLine;
    @XmlElement
    private int startColumn;

    @XmlElement
    private int endLine;
    @XmlElement
    private int endColumn;
}
