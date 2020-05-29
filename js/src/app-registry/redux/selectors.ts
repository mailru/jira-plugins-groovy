import {createSelector} from 'reselect';

import groupBy from 'lodash/groupBy';

import {RootState} from './reducer';

import {KeyedEntities, RegistryDirectoryType, RegistryScriptType} from '../types';
import {notNull} from '../../common/tsUtil';


export const filterSelector = (state: RootState) => state.filter;

function addChildren(
    dir: RegistryDirectoryType,
    dirsResult: KeyedEntities<RegistryDirectoryType>,
    scriptsResult: KeyedEntities<RegistryScriptType>,
    directories: ReadonlyArray<RegistryDirectoryType>,
    scripts: ReadonlyArray<RegistryScriptType>
) {
    scripts
        .filter(it => it.directoryId === dir.id)
        .forEach(it => scriptsResult[it.id] = it);

    directories
        .filter(it => it.parentId === dir.id)
        .forEach((it: RegistryDirectoryType) => {
            dirsResult[it.id] = it;
            addChildren(it, dirsResult, scriptsResult, directories, scripts);
        });
}

export const filteredSelector = createSelector(
    [
        (state: RootState) => state.scripts,
        (state: RootState) => state.directories,
        (state: RootState) => state.scriptUsage,
        filterSelector
    ],
    (scripts, directories, scriptUsage, filter) => {
        const nameFilter = filter.name.toLocaleLowerCase();

        if (nameFilter.length < 2 && !filter.onlyUnused && !filter.scriptType) {
            return {scripts, directories, isForceOpen: false};
        }
        const scriptsResult: {[key in number]: RegistryScriptType} = {};
        const dirsResult: {[key in number]: RegistryDirectoryType} = {};

        const allScripts = Object.values(scripts).filter(notNull);
        allScripts
            .filter((script: RegistryScriptType): boolean => {
                if (!filter.scriptType) {
                    return true;
                }

                return script.types.some(type => type === filter.scriptType);
            })
            .filter((script: RegistryScriptType): boolean => {
                let matchesUnused = true;
                let matchesFilter = true;
                if (filter.onlyUnused && scriptUsage.ready) {
                    matchesUnused = (scriptUsage.items[script.id] || 0) === 0;
                }
                if (nameFilter.length >= 2) {
                    matchesFilter = script.name.toLocaleLowerCase().includes(nameFilter);

                    if (!matchesFilter && script.description) {
                        matchesFilter = script.description.toLocaleLowerCase().includes(nameFilter);
                    }
                }
                return matchesUnused && matchesFilter;
            })
            .forEach((script: RegistryScriptType) => {
                scriptsResult[script.id] = script;
                //add all parents
                let directory: RegistryDirectoryType | null | undefined = directories[script.directoryId];
                while (directory != null) {
                    if (dirsResult[directory.id]) {
                        return;
                    }
                    dirsResult[directory.id] = directory;
                    if (directory.parentId) {
                        directory = directories[directory.parentId];
                    } else {
                        directory = null;
                    }
                }
            });

        if (nameFilter) {
            const allDirectories = Object.values(directories).filter(notNull);

            allDirectories
                .filter((script: RegistryDirectoryType): boolean => {
                    let matchesFilter = true;
                    if (nameFilter.length >= 2) {
                        matchesFilter = script.name.toLocaleLowerCase().includes(nameFilter);
                    }
                    return matchesFilter;
                })
                .forEach((currentDirectory: RegistryDirectoryType) => {
                    //add all children
                    addChildren(currentDirectory, dirsResult, scriptsResult, allDirectories, allScripts);

                    //add all parents
                    let directory: RegistryDirectoryType | null | undefined = currentDirectory;
                    while (directory != null) {
                        if (dirsResult[directory.id]) {
                            return;
                        }
                        dirsResult[directory.id] = directory;
                        if (directory.parentId) {
                            directory = directories[directory.parentId];
                        } else {
                            directory = null;
                        }
                    }
                });
        }

        return {
            scripts: scriptsResult,
            directories: dirsResult,
            isForceOpen: (Object.keys(scriptsResult).length + Object.keys(dirsResult).length) <= 50
        };
    }
);

const groupedSelector = <T>(parentKey: string) => (entities: T) => groupBy(Object.values(entities), parentKey);

const scriptsSelector = createSelector(
    [filteredSelector],
    (filtered) => filtered.scripts
);

const directoriesSelector = createSelector(
    [filteredSelector],
    (filtered) => filtered.directories
);

export const groupedScriptsSelector = createSelector(
    scriptsSelector,
    groupedSelector('directoryId')
);

export const groupedDirsSelector = createSelector(
    directoriesSelector,
    groupedSelector('parentId')
);

export const scriptSelectorFactory = (
    () => createSelector(
        [
            (state: RootState) => state.scripts,
            (_state: RootState, props: {id: number}) => props.id
        ],
        (scripts: KeyedEntities<RegistryScriptType>, id: number) => scripts[id]
    )
);


function getParentName(directories: KeyedEntities<RegistryDirectoryType>, parentId: number): string {
    const parent = directories[parentId];

    if (!parent) {
        return 'Unknown';
    }
    const parentName = parent.name;
    return parent.parentId ? `${getParentName(directories, parent.parentId)} / ${parentName}` : parentName;
}

export const scriptWithParentSelectorFactory = (
    () => createSelector(
        [
            scriptSelectorFactory(),
            state => state.directories
        ],
        (script: RegistryScriptType, directories: KeyedEntities<RegistryDirectoryType>) => ({
            ...script,
            parentName: getParentName(directories, script.directoryId)
        })
    )
);
