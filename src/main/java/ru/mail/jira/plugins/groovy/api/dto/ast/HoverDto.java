package ru.mail.jira.plugins.groovy.api.dto.ast;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@XmlRootElement
public class HoverDto {
    @XmlElement
    private AstRange range;
    @XmlElement
    private List<AstContent> contents;
}
