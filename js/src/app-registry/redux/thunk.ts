import {Dispatch} from 'redux';

import {ADD_SCRIPT, UPDATE_SCRIPT} from './actions';

import {KeyedEntities, RegistryDirectoryType, RegistryScriptType} from '../types';


type StateType = {
    directories: KeyedEntities<RegistryDirectoryType>
};

function makeScriptActionThunk(type: typeof UPDATE_SCRIPT | typeof ADD_SCRIPT) {
    return (script: RegistryScriptType) => {
        return (dispatch: Dispatch<any>, getState: () => StateType) => {
            const {directories} = getState();

            const parents: Array<number> = [];

            let parent: RegistryDirectoryType | null | undefined = directories[script.directoryId];
            while (parent) {
                parents.push(parent.id);
                if (parent.parentId) {
                    parent = directories[parent.parentId];
                } else {
                    parent = null;
                }
            }

            dispatch({
                type, script, parents
            });
        };
    };
}

type ScriptMutationAction<T> = {
    type: T,
    script: RegistryScriptType,
    parents: ReadonlyArray<number>
}

type Temp<T> = (script: RegistryScriptType) => ScriptMutationAction<T>;

export const addScript = makeScriptActionThunk(ADD_SCRIPT) as unknown as Temp<typeof ADD_SCRIPT>;
export const updateScript = makeScriptActionThunk(UPDATE_SCRIPT) as unknown as Temp<typeof UPDATE_SCRIPT>;
