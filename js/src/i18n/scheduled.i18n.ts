// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nFunction} from '../common/types';


export const ScheduledTaskMessages: {[key in string]: string} & {runNowConfirm: I18nFunction, jqlLimitDescription: I18nFunction} = {
    noTasks: i18n.scheduled.noTasks,
    addTask: i18n.scheduled.addTask,
    editTask: i18n.scheduled.editTask,
    deleteTask: i18n.scheduled.deleteTask,
    runAs: i18n.scheduled.runAs,
    runNow: i18n.scheduled.runNow,
    runNowConfirm: i18n.scheduled.runNowConfirm,
    lastRun: i18n.scheduled.lastRun,
    nextRun: i18n.scheduled.nextRun,
    jqlLimitDescription: i18n.scheduled.jqlLimitDescription,
    jqlScriptDescription: i18n.scheduled.jqlScriptDescription,
    scheduleDescription: i18n.scheduled.scheduleDescription,
    transitionOptions: i18n.scheduled.transitionOptions,
} as const;

export const TransitionOptionMessages: {[key in string]: string} = {
    skipConditions: i18n.scheduled.transitionOption.skipConditions as string,
    skipValidators: i18n.scheduled.transitionOption.skipValidators as string,
    skipPermissions: i18n.scheduled.transitionOption.skipPermissions as string,
} as const;
