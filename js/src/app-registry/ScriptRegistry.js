//@flow
import React, {type Node} from 'react';
import PropTypes from 'prop-types';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import {DragDropContext} from 'react-beautiful-dnd';

import Page from '@atlaskit/page';
import Blanket from '@atlaskit/blanket';
import PageHeader from '@atlaskit/page-header';
import Button from '@atlaskit/button';
import {FieldTextStateless} from '@atlaskit/field-text';

import {ScriptDialog} from './ScriptDialog';
import {ScriptDirectory} from './ScriptDirectory';
import {ScriptDirectoryDialog} from './ScriptDirectoryDialog';
import {RegistryActionCreators} from './registry.reducer';

import type {RegistryDirectoryType, RegistryScriptType} from './types';

import {LoadingSpinner} from '../common/ak/LoadingSpinner';
import {InfoMessage} from '../common/ak/messages';

import {registryService} from '../service/services';

import {TitleMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';

import './ScriptRegistry.less';


type Props = {
    ready: boolean,
    directories: $ReadOnlyArray<RegistryDirectoryType>,
    deleteDirectory: typeof RegistryActionCreators.deleteDirectory,
    deleteScript: typeof RegistryActionCreators.deleteScript,
    moveScript: typeof RegistryActionCreators.moveScript
};

type State = {
    waiting: boolean,
    isDragging: boolean,
    filter: string
};

//todo: collapse/uncollapse all
export class ScriptRegistryInternal extends React.PureComponent<Props, State> {
    static propTypes = {
        ready: PropTypes.bool.isRequired,
        directories: PropTypes.arrayOf(PropTypes.object.isRequired)
    };

    state = {
        isDragging: false,
        waiting: false,
        filter: ''
    };

    _setRef = (key: string) => (el: any) => {
        this[key] = el;
    };

    _activateCreateDialog = (parentId: ?number, type: 'script'|'directory') => {
        if (type === 'directory') {
            this.directoryDialogRef.getWrappedInstance().activateCreate(parentId);
        } else {
            this.scriptDialogRef.getWrappedInstance().activateCreate(parentId);
        }
    };

    _activateEditDialog = (id: number, type: 'script'|'directory') => {
        console.log(id, type);
        if (type === 'directory') {
            this.directoryDialogRef.getWrappedInstance().activateEdit(id);
        } else {
            this.scriptDialogRef.getWrappedInstance().activateEdit(id);
        }
    };

    _activateDeleteDialog = (id: number, type: 'script'|'directory', name: string) => {
        // eslint-disable-next-line no-restricted-globals
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            if (type === 'directory') {
                registryService.deleteDirectory(id).then(() => this.props.deleteDirectory(id));
            } else {
                registryService.deleteScript(id).then(() => this.props.deleteScript(id));
            }
        }
    };

    _createDirectory = () => this._activateCreateDialog(null, 'directory');

    _onDragStart = () => {
        this.setState({isDragging: true});
    };

    _onDragEnd = (result: *) => {
        const {source, destination, draggableId} = result;

        this.setState({isDragging: false});

        if (!source || !destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            return;
        }

        const sourceId = parseInt(source.droppableId, 10);
        const destId = parseInt(destination.droppableId, 10);
        const scriptId = parseInt(draggableId, 10);

        const script = this._findScript(scriptId);

        if (!script) {
            console.error('unable to find script', result);
            return;
        }

        this.props.moveScript(sourceId, destId, script);

        this.setState({ waiting: true });

        registryService
            .moveScript(script.id, destId)
            .then(
                () => {
                    this.setState({ waiting: false });
                    //todo: maybe show flag that script was successfully moved
                },
                () => {
                    this.props.moveScript(destId, sourceId, script); //move script to old parent
                    this.setState({ waiting: false });
                }
            );
    };

    _findScript(id: number): ?RegistryScriptType {
        for (const dir of this.props.directories) {
            const found = this._findScriptInDirectory(dir, id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    _findScriptInDirectory(dir: RegistryDirectoryType, id: number): ?RegistryScriptType {
        if (dir.children) {
            for (const child of dir.children) {
                const foundInDir = this._findScriptInDirectory(child, id);
                if (foundInDir) {
                    return foundInDir;
                }
            }
        }
        if (dir.scripts) {
            return dir.scripts.find(script => script.id === id);
        }
        return null;
    }

    _onFilterChange = (e: SyntheticEvent<HTMLInputElement>) => this.setState({ filter: e.currentTarget.value });

    _matchesFilter = (item: RegistryDirectoryType|RegistryScriptType, filter: string): boolean => {
        return item.name.toLocaleLowerCase().includes(filter);
    };

    _getFilteredDirsInternal = (dirs: $ReadOnlyArray<RegistryDirectoryType>, filter: string): $ReadOnlyArray<RegistryDirectoryType> => {
        return dirs
            .map((dir: RegistryDirectoryType): RegistryDirectoryType => {
                if (this._matchesFilter(dir, filter)) {
                    return dir;
                }
                return {
                    ...dir,
                    scripts: dir.scripts.filter(script => this._matchesFilter(script, filter)),
                    children: this._getFilteredDirsInternal(dir.children, filter)
                };
            })
            .filter(dir => (dir.scripts.length + dir.children.length) > 0);
    };

    _getFilteredDirs = memoizeOne(this._getFilteredDirsInternal);

    render(): Node {
        const {waiting, filter} = this.state;
        const {ready} = this.props;

        let directories: * = this.props.directories;

        if (filter && filter.length >= 2) {
            directories = this._getFilteredDirs(directories, filter.toLocaleLowerCase());
        }

        return (
            <DragDropContext onDragStart={this._onDragStart} onDragEnd={this._onDragEnd}>
                <Page>
                    <PageHeader
                        actions={
                            <Button
                                appearance="primary"
                                onClick={this._createDirectory}
                            >
                                {RegistryMessages.addDirectory}
                            </Button>
                        }
                        bottomBar={
                            <FieldTextStateless
                                isLabelHidden
                                compact
                                label="hidden"
                                placeholder="Filter"
                                value={filter}
                                onChange={this._onFilterChange}
                            />
                        }
                    >
                        {TitleMessages.registry}
                    </PageHeader>

                    <div className={`page-content ScriptList ${this.state.isDragging ? 'dragging' : ''}`}>
                        {directories.map(directory =>
                            <ScriptDirectory
                                directory={directory}
                                key={directory.id}
                                onCreate={this._activateCreateDialog}
                                onEdit={this._activateEditDialog}
                                onDelete={this._activateDeleteDialog}
                            />
                        )}

                        {!ready && <LoadingSpinner/>}
                        {ready && !directories.length ? <InfoMessage title={RegistryMessages.noScripts}/> : null}
                        <ScriptDirectoryDialog ref={this._setRef('directoryDialogRef')}/>
                        <ScriptDialog ref={this._setRef('scriptDialogRef')}/>

                        {waiting && <Blanket isTinted={true}/>}
                    </div>
                </Page>
            </DragDropContext>
        );
    }
}

export const ScriptRegistry = connect(
    memoizeOne(
        (state: *): * => {
            return {
                ready: state.ready,
                directories: state.directories
            };
        }
    ),
    RegistryActionCreators
)(ScriptRegistryInternal);
