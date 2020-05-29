import {combineReducers} from 'redux';

import {
    LOAD_STATE,
    ADD_DIRECTORY,
    UPDATE_DIRECTORY,
    DELETE_DIRECTORY,
    DELETE_SCRIPT,
    MOVE_SCRIPT,
    UPDATE_SCRIPT,
    ADD_SCRIPT,
    OPEN_DIRECTORY,
    CLOSE_DIRECTORY,
    ADD_WATCH,
    REMOVE_WATCH,
    UPDATE_FILTER,
    LOAD_USAGE,
    loadState,
    moveScript,
    deleteScript,
    addWatch,
    removeWatch,
    addDirectory,
    DirectoryStateActionCreators, updateDirectory, deleteDirectory
} from './actions';
import {addScript, updateScript} from './thunk';

import {
    FilterType,
    KeyedEntities,
    RegistryDirectoryType,
    RegistryScriptType,
    ScriptUsageItems,
    ScriptUsageType
} from '../types';


type ReadyActions = ReturnType<typeof loadState>;

function readyReducer(state: boolean, action: ReadyActions): boolean {
    if (state === undefined) {
        return false;
    }

    if (action.type === LOAD_STATE) {
        return true;
    }

    return state;
}

type WatchesActions = ReturnType<typeof loadState>
    | ReturnType<typeof addWatch> | ReturnType<typeof removeWatch>
    | ReturnType<typeof addScript>
    | ReturnType<typeof addDirectory>;

function watchesReducer(kind: 'script'|'directory') {
    return (state: ReadonlyArray<number>, action: WatchesActions): ReadonlyArray<number> => {
        if (state === undefined) {
            return [];
        }

        if (action.type === LOAD_STATE) {
            if (kind === 'script') {
                return action.scriptWatches;
            } else if (kind === 'directory') {
                return action.directoryWatches;
            }
        }

        if (action.type === ADD_WATCH && action.kind === kind) {
            return [...state, action.id];
        }

        if (action.type === REMOVE_WATCH && action.kind === kind) {
            return state.filter(id => id !== action.id);
        }

        if (action.type === ADD_SCRIPT && kind === 'script') {
            return [...state, action.script.id];
        }

        if (action.type === ADD_DIRECTORY && kind === 'directory') {
            return [...state, action.directory.id];
        }

        return state;
    };
}

type LoadUsageAction = {
    type: typeof LOAD_USAGE,
    items: ScriptUsageItems
};

function scriptUsageReducer(state: ScriptUsageType, action: LoadUsageAction): ScriptUsageType {
    if (state === undefined) {
        return {
            ready: false,
            items: {}
        };
    }

    if (action.type === LOAD_USAGE) {
        return {
            ready: true,
            items: action.items
        };
    }

    return state;
}

type OpenDirsActions = ReturnType<typeof updateScript>
    | ReturnType<typeof addScript>
    | ReturnType<typeof DirectoryStateActionCreators.open>
    | ReturnType<typeof DirectoryStateActionCreators.close>;

function openDirsReducer(state: ReadonlyArray<number>, action: OpenDirsActions): ReadonlyArray<number> {
    if (state === undefined) {
        return [];
    }

    switch (action.type) {
        case UPDATE_SCRIPT:
        case ADD_SCRIPT:
            return [...state, ...action.parents];
        case OPEN_DIRECTORY:
            return [...state, action.id];
        case CLOSE_DIRECTORY:
            return state.filter(id => id !== action.id);
        default:
            return state;
    }
}

type DirectoriesAction = ReturnType<typeof loadState>
    | ReturnType<typeof addDirectory>
    | ReturnType<typeof updateDirectory>
    | ReturnType<typeof deleteDirectory>;

function directoriesReducer(state: KeyedEntities<RegistryDirectoryType>, action: DirectoriesAction): KeyedEntities<RegistryDirectoryType> {
    if (state === undefined) {
        return {};
    }

    switch (action.type) {
        case LOAD_STATE: {
            return action.directories;
        }
        case ADD_DIRECTORY:
        case UPDATE_DIRECTORY: {
            return {
                ...state,
                [action.directory.id]: action.directory
            };
        }
        case DELETE_DIRECTORY: {
            //todo: test
            const {[action.id]: deleted, ...newState} = state;
            return newState;
        }
        default:
            return state;
    }
}

type ScriptActions = ReturnType<typeof loadState>
    | ReturnType<typeof moveScript>
    | ReturnType<typeof updateScript>
    | ReturnType<typeof addScript>
    | ReturnType<typeof deleteScript>;

function scriptsReducer(state: KeyedEntities<RegistryScriptType>, action: ScriptActions): KeyedEntities<RegistryScriptType> {
    if (state === undefined) {
        return {};
    }

    switch (action.type) {
        case LOAD_STATE: {
            return action.scripts;
        }
        case MOVE_SCRIPT:
            return {
                ...state,
                [action.scriptId]: {
                    ...(state[action.scriptId] as RegistryScriptType),
                    directoryId: action.dst
                }
            };
        case UPDATE_SCRIPT:
        case ADD_SCRIPT:
            return {
                ...state,
                [action.script.id]: action.script
            };
        case DELETE_SCRIPT: {
            //todo: test
            const {[action.id]: deleted, ...newState} = state;
            return newState;
        }
        default:
            return state;
    }
}

export type FilterAction = {
    type: typeof UPDATE_FILTER,
    filter: Partial<FilterType>
};

function filterReducer(state: FilterType, action: FilterAction): FilterType {
    if (state === undefined) {
        return {
            name: '',
            onlyUnused: false,
            scriptType: null
        };
    }

    if (action.type === UPDATE_FILTER) {
        return {
            ...state,
            ...action.filter
        };
    }

    return state;
}


export const reducer = combineReducers({
    directories: directoriesReducer,
    scripts: scriptsReducer,
    ready: readyReducer,
    scriptWatches: watchesReducer('script'),
    directoryWatches: watchesReducer('directory'),
    scriptUsage: scriptUsageReducer,
    openDirectories: openDirsReducer,
    filter: filterReducer
});

export type RootState = ReturnType<typeof reducer>;
