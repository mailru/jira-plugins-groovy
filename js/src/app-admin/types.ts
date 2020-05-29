import {ScriptEntity} from '../common/types';
import {ParamType} from '../app-workflow/types';
import {filterReducer, ItemListType, readinessReducer, watchesReducer} from '../common/redux';


export type AdminScriptType = ScriptEntity & {
    uuid: string,
    html: boolean,
    builtIn: boolean,
    builtInKey: string | null,
    resultWidth: 'small' | 'medium' | 'large' | 'x-large' | null,
    params: Array<ParamType> | null,
    defaultValues: {[key in string]: any} | null
};

export type AdminScriptOutcomeType = {
    success: boolean,
    message: string | null
};

export type RootState = {
    items: ItemListType<AdminScriptType>,
    watches: ReturnType<typeof watchesReducer>,
    isReady: ReturnType<typeof readinessReducer>,
    filter: ReturnType<typeof filterReducer>
}
