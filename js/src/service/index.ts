// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import AJS from 'AJS';

import {ListenerService} from './listener.service';
import {ConsoleService} from './console.service';
import {RegistryService} from './registry.service';
import {ExecutionService} from './execution.service';
import {JiraService} from './jira.service';
import {ExtrasService} from './extrasService';
import {AuditLogService} from './auditLogService';
import {RestService} from './rest.service';
import {FieldConfigService} from './fieldConfig.service';
import {PreferenceService} from './preference.service';
import {ScheduledTaskService} from './scheduledTask.service';
import {AdminScriptService} from './adminScript.service';
import {JqlScriptService} from './jqlScript.service';
import {WatcherService} from './watcher.service';
import {GlobalObjectService} from './go.service';
import {BindingService} from './binding.service';

import {ErrorMessages} from '../i18n/common.i18n';


export const listenerService = new ListenerService();
export const consoleService = new ConsoleService();
export const registryService = new RegistryService();
export const executionService = new ExecutionService();
export const jiraService = new JiraService();
export const extrasService = new ExtrasService();
export const auditLogService = new AuditLogService();
export const restService = new RestService();
export const fieldConfigService = new FieldConfigService();
export const preferenceService = new PreferenceService();
export const scheduledTaskService = new ScheduledTaskService();
export const adminScriptService = new AdminScriptService();
export const jqlScriptService = new JqlScriptService();
export const watcherService = new WatcherService();
export const globalObjectService = new GlobalObjectService();
export const bindingService = new BindingService();

export {getPluginBaseUrl, getBaseUrl, ajaxGet} from './ajaxHelper';

export * from './types';

window.addEventListener('unhandledrejection', function(err: PromiseRejectionEvent) {
    console.error('uncaught error', err);
    AJS.flag({
        title: ErrorMessages.errorOccurred,
        body: err.reason.message,
        type: 'error',
        close: 'manual'
    });
});
