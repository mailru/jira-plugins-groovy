// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nMessages} from '../common/types';


export const AuditMessages: I18nMessages = {
    user: i18n.audit.user,
    category: i18n.audit.category,
    action: i18n.audit.action,
    description: i18n.audit.description,
    script: i18n.audit.script,
    restore: i18n.audit.restore,
    noItems: i18n.audit.noItems
};

export const CategoryNameMessages: I18nMessages = {
    ADMIN_SCRIPT: i18n.audit.adminScript,
    REGISTRY_SCRIPT: i18n.audit.registryScript,
    REGISTRY_DIRECTORY: i18n.audit.registryDirectory,
    LISTENER: i18n.audit.listener,
    REST: i18n.audit.rest,
    CUSTOM_FIELD: i18n.audit.cf,
    SCHEDULED_TASK: i18n.audit.scheduledTask,
    JQL_FUNCTION: i18n.audit.jqlFunction,
    GLOBAL_OBJECT: i18n.audit.globalObject
};
