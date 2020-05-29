import {RegistryScriptType, KeyedEntities, RegistryDirectoryType, ScriptUsageItems, FilterType} from '../types';


export const LOAD_STATE = 'LOAD_STATE';

export const ADD_WATCH = 'ADD_WATCHER';
export const REMOVE_WATCH = 'REMOVE_WATCH';

export const ADD_DIRECTORY = 'ADD_DIRECTORY';
export const UPDATE_DIRECTORY = 'UPDATE_DIRECTORY';
export const DELETE_DIRECTORY = 'DELETE_DIRECTORY';

export const ADD_SCRIPT = 'ADD_SCRIPT';
export const UPDATE_SCRIPT = 'UPDATE_SCRIPT';
export const DELETE_SCRIPT = 'DELETE_SCRIPT';
export const MOVE_SCRIPT = 'MOVE_SCRIPT';

export const LOAD_USAGE = 'LOAD_USAGE';

export const UPDATE_FILTER = 'UPDATE_FILTER';

export const OPEN_DIRECTORY = 'OPEN_DIRECTORY';
export const CLOSE_DIRECTORY = 'CLOSE_DIRECTORY';


export const loadState = (
    directories: KeyedEntities<RegistryDirectoryType>,
    scripts: KeyedEntities<RegistryScriptType>,
    scriptWatches: ReadonlyArray<number>,
    directoryWatches: ReadonlyArray<number>
) => ({
    type: LOAD_STATE,
    directories, scripts,
    scriptWatches, directoryWatches
}) as const;
export const loadUsage = (items: ScriptUsageItems) => ({
    type: LOAD_USAGE,
    items
}) as const;

export const deleteScript = (id: number) => ({
    type: DELETE_SCRIPT,
    id: id
}) as const;
export const moveScript = (src: number, dst: number, scriptId: number) => ({
    type: MOVE_SCRIPT,
    src, dst, scriptId
}) as const;

export const addDirectory =  (directory: RegistryDirectoryType) => ({
    type: ADD_DIRECTORY,
    directory: directory
}) as const;
export const updateDirectory = (directory: RegistryDirectoryType) => ({
    type: UPDATE_DIRECTORY,
    directory: directory
}) as const;
export const deleteDirectory = (id: number) => ({
    type: DELETE_DIRECTORY,
    id: id
}) as const;

export const addWatch = (kind: 'script' | 'directory', id: number) => ({
    type: ADD_WATCH,
    kind, id
}) as const;
export const removeWatch =  (kind: 'script' | 'directory', id: number) => ({
    type: REMOVE_WATCH,
    kind, id
}) as const;

export type DirectoryStateAction = {
    type: typeof OPEN_DIRECTORY | typeof CLOSE_DIRECTORY,
    id: number
};

export const DirectoryStateActionCreators = {
    open: (id: number): DirectoryStateAction => {
        return {
            type: OPEN_DIRECTORY,
            id
        } as const;
    },
    close: (id: number): DirectoryStateAction => {
        return {
            type: CLOSE_DIRECTORY,
            id
        } as const;
    }
};

export const UpdateActionCreators = {
    updateFilter: (filter: Partial<FilterType>) => ({
        type: UPDATE_FILTER, filter
    })
};
