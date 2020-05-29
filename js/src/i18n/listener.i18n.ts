// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nMessages} from '../common/types';


export const ListenerMessages: I18nMessages = {
    addListener: i18n.listener.addListener,
    editListener: i18n.listener.editListener,
    addCondition: i18n.listener.addCondition,
    createListener: i18n.listener.createListener,
    updateListener: i18n.listener.updateListener,
    deleteListener: i18n.listener.deleteListener,
    noListeners: i18n.listener.noListeners
};

export const ListenerTypeMessages: I18nMessages = {
    CLASS_NAME: i18n.listener.type.className,
    ISSUE: i18n.listener.type.issueEvent
};
