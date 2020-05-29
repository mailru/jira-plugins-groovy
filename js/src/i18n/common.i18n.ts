// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nMessages, I18nFunction} from '../common/types';


export const FieldMessages: I18nMessages = {
    name: i18n.fields.name,
    description: i18n.fields.description,
    scriptCode: i18n.fields.scriptCode,
    comment: i18n.fields.comment,
    condition: i18n.fields.condition,
    date: i18n.fields.date,
    time: i18n.fields.time,
    bindings: i18n.fields.bindings,
    successful: i18n.fields.successful,
    httpMethods: i18n.fields.httpMethods,
    projects: i18n.fields.projects,
    eventTypes: i18n.fields.eventTypes,
    type: i18n.fields.type,
    customField: i18n.fields.customField,
    cacheable: i18n.fields.cacheable,
    schedule: i18n.fields.schedule,
    issueJql: i18n.fields.issueJql,
    workflow: i18n.fields.workflow,
    workflowAction: i18n.fields.workflowAction,
    parentName: i18n.fields.parentName,
    action: i18n.fields.action,
    order: i18n.fields.order,
    searcher: i18n.fields.searcher,
    groups: i18n.fields.groups,
    issue: i18n.fields.issue,
    options: i18n.fields.options,
    template: i18n.fields.template,
    pluginKey: i18n.fields.pluginKey
};

export const CommonMessages: ({ [key in string]: string} & { issuesFound: I18nFunction, confirmDelete: I18nFunction }) = {
    loading: i18n.common.loading,
    completed: i18n.common.completed,
    update: i18n.common.update,
    create: i18n.common.create,
    cancel: i18n.common.cancel,
    close: i18n.common.close,
    currentVersion: i18n.common.currentVersion,
    edit: i18n.common.edit,
    delete: i18n.common.delete,
    showCode: i18n.common.showCode,
    hideCode: i18n.common.hideCode,
    prev: i18n.common.prev,
    next: i18n.common.next,
    of: i18n.common.of,
    yes: i18n.common.yes,
    no: i18n.common.no,
    notSpecified: i18n.common.notSpecified,
    error: i18n.common.error,
    script: i18n.common.script,
    switchTheme: i18n.common.switchTheme,
    editorMode: i18n.common.editorMode,
    clearCache: i18n.common.clearCache,
    condition: i18n.common.condition,
    validator: i18n.common.validator,
    function: i18n.common.function,
    returnTypes: i18n.common.returnTypes,
    showAll: i18n.common.showAll,
    preview: i18n.common.preview,
    validating: i18n.common.validating,
    issuesFound: i18n.common.issuesFound,
    run: i18n.common.run,
    back: i18n.common.back,
    confirmDelete: i18n.common.confirmDelete,
    all: i18n.common.all,
    permalink: i18n.common.permalink,
    renderAsHtml: i18n.common.renderAsHtml,
    log: i18n.common.log,
    result: i18n.common.result
};

export const DialogMessages: I18nMessages = {
    notReady: i18n.dialog.notReady
};

export const ErrorMessages: I18nMessages = {
    noValue: i18n.error.noValue,
    notConfigured: i18n.error.notConfigured,
    errorOccurred: i18n.error.errorOccurred,
    incorrectConfigId: i18n.error.incorrectConfigId
};

export const JiraMessages: I18nMessages = {
    configure: i18n.jira.configure,
    edit: i18n.jira.edit
};

export const TitleMessages: I18nMessages = {
    console: i18n.titles.console,
    adminScripts: i18n.titles.adminScripts,
    registry: i18n.titles.registry,
    listeners: i18n.titles.listeners,
    audit: i18n.titles.audit,
    rest: i18n.titles.rest,
    fields: i18n.titles.fields,
    scheduled: i18n.titles.scheduled,
    globalObjects: i18n.titles.globalObjects,
    jql: i18n.titles.jql,
    extras: i18n.titles.extras,
};

export const PageTitleMessages: I18nMessages = {
    console: i18n.pageTitles.console,
    adminScripts: i18n.pageTitles.adminScripts,
    registry: i18n.pageTitles.registry,
    listeners: i18n.pageTitles.listeners,
    audit: i18n.pageTitles.audit,
    rest: i18n.pageTitles.rest,
    fields: i18n.pageTitles.fields,
    scheduled: i18n.pageTitles.scheduled,
    globalObjects: i18n.pageTitles.globalObjects,
    extras: i18n.pageTitles.extras,
    jql: i18n.pageTitles.jql
};
