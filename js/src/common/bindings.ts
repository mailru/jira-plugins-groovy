import {BindingType, ReturnType} from './editor/types';


export const globalBindings: Array<BindingType> = [
    {
        name: 'httpClient',
        className: 'CloseableHttpClient',
        fullClassName: 'org.apache.http.impl.client.CloseableHttpClient',
        javaDoc: 'https://hc.apache.org/httpcomponents-client-4.5.x/httpclient/apidocs/org/apache/http/impl/client/CloseableHttpClient.html'
    },
    {
        name: 'templateEngine',
        className: 'TemplateEngine',
        fullClassName: 'groovy.text.TemplateEngine',
        javaDoc: 'http://docs.groovy-lang.org/2.4.13/html/api/groovy/text/TemplateEngine.html'
    },
    {
        name: 'log',
        className: 'Logger',
        fullClassName: 'org.slf4j.Logger',
        javaDoc: 'https://www.slf4j.org/api/org/slf4j/Logger.html'
    },
    {
        name: 'logger',
        className: 'Logger',
        fullClassName: 'org.slf4j.Logger',
        javaDoc: 'https://www.slf4j.org/api/org/slf4j/Logger.html'
    }
];

const jiraVersion = '7.6.1';

export const Bindings: {[key in string]: BindingType} = {
    currentUser: {
        name: 'currentUser',
        className: 'ApplicationUser',
        fullClassName: 'com.atlassian.jira.user.ApplicationUser',
        javaDoc: `https://docs.atlassian.com/software/jira/docs/api/${jiraVersion}/com/atlassian/jira/user/ApplicationUser.html`
    },
    issue: {
        name: 'issue',
        className: 'Issue',
        fullClassName: 'com.atlassian.jira.issue.Issue',
        javaDoc: `https://docs.atlassian.com/software/jira/docs/api/${jiraVersion}/com/atlassian/jira/issue/Issue.html`
    },
    mutableIssue: {
        name: 'issue',
        className: 'MutableIssue',
        fullClassName: 'com.atlassian.jira.issue.MutableIssue',
        javaDoc: `https://docs.atlassian.com/software/jira/docs/api/${jiraVersion}/com/atlassian/jira/issue/Mutableissue.html`
    },
    event: {
        name: 'event',
        className: 'Object',
        fullClassName: 'java.lang.Object',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html'
    },
    issueEvent: {
        name: 'event',
        className: 'IssueEvent',
        fullClassName: 'com.atlassian.jira.event.issue.IssueEvent',
        javaDoc: `https://docs.atlassian.com/software/jira/docs/api/${jiraVersion}/com/atlassian/jira/event/issue/IssueEvent.html`
    },
    transientVars: {
        name: 'transientVars',
        className: 'Map<String, Object>',
        fullClassName: 'java.util.Map',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/util/Map.html'
    },
    method: {
        name: 'method',
        className: 'String',
        fullClassName: 'java.lang.String',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/lang/String.html'
    },
    uriInfo: {
        name: 'uriInfo',
        className: 'UriInfo',
        fullClassName: 'javax.ws.rs.core.UriInfo',
        javaDoc: 'https://docs.oracle.com/javaee/7/api/javax/ws/rs/core/UriInfo.html'
    },
    headers: {
        name: 'headers',
        className: 'HttpHeaders',
        fullClassName: 'javax.ws.rs.core.HttpHeaders',
        javaDoc: 'https://docs.oracle.com/javaee/7/api/javax/ws/rs/core/HttpHeaders.html'
    },
    body: {
        name: 'body',
        className: 'String',
        fullClassName: 'java.lang.String',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/lang/String.html'
    },
    velocityParams: {
        name: 'velocityParams',
        className: 'Map<String, Object>',
        fullClassName: 'java.util.Map',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/util/Map.html'
    }
};

export const ReturnTypes: {[key in string]: ReturnType} = {
    void: {
        className: 'void',
        fullClassName: 'void'
    },
    boolean: {
        className: 'boolean',
        fullClassName: 'boolean'
    },
    string: {
        className: 'String',
        fullClassName: 'java.lang.String',
        javaDoc: 'https://docs.oracle.com/javase/8/docs/api/java/lang/String.html'
    }
};
