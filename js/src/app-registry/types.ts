import {ScriptEntityWithoutChangelogs} from '../common/types';


export type EntityType = 'script' | 'directory';

export type CreateCallback = (parentId: number | null, type: EntityType) => void;
export type EditCallback = (id: number, type: EntityType) => void;
export type DeleteCallback = (id: number, type: EntityType, name: string) => void;

export const scriptTypes = ['CONDITION', 'VALIDATOR', 'FUNCTION'] as const;

export type WorkflowScriptType = 'CONDITION' | 'VALIDATOR' | 'FUNCTION';

export type RegistryScriptType = ScriptEntityWithoutChangelogs & {
    id: number,
    name: string,
    uuid: string,
    types: ReadonlyArray<WorkflowScriptType>,
    directoryId: number,
    parentName?: string,
};

export type RegistryDirectoryType = {
    id: number,
    name: string,
    parentId: number | null,
    parentName: string | null,
    fullName?: string
};

export type WorkflowActionItemType = {
    type: WorkflowScriptType,
    order: number
};

export type WorkflowActionType = {
    id: number,
    stepId: number | null,
    name: string,
    items: Array<WorkflowActionItemType>
};

export type WorkflowType = {
    name: string,
    active: boolean,
    hasDraft: boolean,
    actions: Array<WorkflowActionType>
};

export type WorkflowMode = 'live' | 'draft';

export type ScriptUsageItems = {[key in number]: number};

export type ScriptUsageType = {
    ready: boolean,
    items: ScriptUsageItems
};

export type KeyedEntities<T> = {[key in number]: T | null | typeof undefined};

export type GroupedEntities<T> = KeyedEntities<ReadonlyArray<T>>;

export type FilterType = {
    name: string,
    onlyUnused: boolean,
    scriptType: WorkflowScriptType | null
};
