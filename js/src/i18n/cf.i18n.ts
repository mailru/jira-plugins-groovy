// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import i18n from 'external-i18n';

import {I18nFunction} from '../common/types';


export const ScriptFieldMessages: {[key in string]: string} & {scriptFor: I18nFunction} = {
    scriptFor: i18n.field.scriptFor,
    noFields: i18n.field.noFields
};
