import {ScriptEntity} from '../common/types';


export type ConditionType = {
    type: 'CLASS_NAME' | 'ISSUE',
    typeIds: ReadonlyArray<string>,
    projectIds: ReadonlyArray<string>,
    className: string | null,
    pluginKey: string | null
};

export type ConditionInputType = {
    type: 'CLASS_NAME' | 'ISSUE' | null,
    typeIds: ReadonlyArray<string>,
    projectIds: ReadonlyArray<string>,
    className: string | null,
    pluginKey: string | null
};

export type ListenerType = ScriptEntity & {
    uuid: string,
    condition: ConditionType,
    alwaysTrack: boolean,
    initialized: boolean
};

export type ListenerInputType = ScriptEntity & {
    uuid: string,
    condition: ConditionInputType
};
