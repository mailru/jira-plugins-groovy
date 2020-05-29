// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nFunction} from '../common/types';


export const ConsoleMessages: {[key in string]: string} & {executedIn: I18nFunction} =  {
    execute: i18n.console.execute,
    //todo: move to common
    executedIn: i18n.console.executedIn
};
