import React, {Fragment, SyntheticEvent} from 'react';

import {connect} from 'react-redux';
import {createSelector} from 'reselect';

import {DragDropContext, DropResult} from 'react-beautiful-dnd';

import Page from '@atlaskit/page';
import Blanket from '@atlaskit/blanket';
import PageHeader from '@atlaskit/page-header';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import {Checkbox} from '@atlaskit/checkbox';
import Breadcrumbs from '@atlaskit/breadcrumbs';
import DropdownMenu, {
    DropdownItemGroupRadio,
    DropdownItemRadio,
} from '@atlaskit/dropdown-menu';

import {ScriptDirectory} from './ScriptDirectory';
import {ScriptDirectoryDialog, DialogParams} from './ScriptDirectoryDialog';
import {
    filteredSelector, filterSelector, groupedDirsSelector,
    deleteDirectory, deleteScript, moveScript, UpdateActionCreators as FilterActionCreators, RootState
} from './redux';
import {UsageStatusFlag} from './UsageStatusFlag';

import {scriptTypes, FilterType, RegistryDirectoryType, WorkflowScriptType} from './types';

import {InfoMessage} from '../common/ak';

import {registryService} from '../service';

import {CommonMessages, PageTitleMessages, FieldMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';

import './ScriptRegistry.less';
import {DeleteDialog, DeleteDialogProps} from '../common/script-list/DeleteDialog';
import {withRoot} from '../common/script-list';

import {LazilyRenderedContext} from '../common/lazyRender';


type Props = {
    directories: ReadonlyArray<RegistryDirectoryType>,
    isScriptUsageReady: boolean,
    isForceOpen: boolean,
    filter: FilterType,
    deleteDirectory: typeof deleteDirectory,
    deleteScript: typeof deleteScript,
    moveScript: typeof moveScript,
    updateFilter: typeof FilterActionCreators.updateFilter
};

type State = {
    waiting: boolean,
    isDragging: boolean,
    directoryDialogProps: DialogParams | null,
    deleteScriptProps: DeleteDialogProps | null,
    deleteDirectoryProps: DeleteDialogProps | null
};

//todo: collapse/uncollapse all
export class ScriptRegistryInternal extends React.PureComponent<Props, State> {
    state: State = {
        isDragging: false,
        waiting: false,
        directoryDialogProps: null,
        deleteScriptProps: null,
        deleteDirectoryProps: null,
    };

    _activateCreateDialog = (parentId: number | null, type: 'script'|'directory') => {
        if (type === 'directory') {
            this.setState({ directoryDialogProps: {isNew: true, parentId} });
        }
    };

    _activateEditDialog = (id: number, type: 'script'|'directory') => {
        if (type === 'directory') {
            this.setState({ directoryDialogProps: {isNew: false, id} });
        }
    };

    _closeDirectoryDialog = () => this.setState({ directoryDialogProps: null });

    _closeDeleteScriptDialog = () => this.setState({ deleteScriptProps: null });

    _closeDeleteDirectoryDialog = () => this.setState({ deleteDirectoryProps: null });

    _activateDeleteDialog = (id: number, type: 'script'|'directory', name: string) => {
        if (type === 'directory') {
            this.setState({
                deleteDirectoryProps: { id, name, onConfirm: () => registryService.deleteDirectory(id) }
            });
        } else {
            this.setState({
                deleteScriptProps: { id, name, onConfirm: () => registryService.deleteScript(id) }
            });
        }
    };

    _createDirectory = () => this._activateCreateDialog(null, 'directory');

    _onDragStart = () => {
        this.setState({isDragging: true});
    };

    _onDragEnd = (result: DropResult) => {
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

        this.props.moveScript(sourceId, destId, scriptId);

        this.setState({ waiting: true });

        registryService
            .moveScript(scriptId, destId)
            .then(
                () => {
                    this.setState({ waiting: false });
                    //todo: maybe show flag that script was successfully moved
                },
                () => {
                    this.props.moveScript(destId, sourceId, scriptId); //move script to old parent
                    this.setState({ waiting: false });
                }
            );
    };

    _onFilterChange = (e: SyntheticEvent<HTMLInputElement>) => this.props.updateFilter({ name: e.currentTarget.value });

    _toggleUnused = () => this.props.updateFilter({ onlyUnused: !this.props.filter.onlyUnused });

    _setType = (scriptType: WorkflowScriptType | null) => () => this.props.updateFilter({ scriptType });

    componentDidUpdate(prevProps: Props) {
        if (prevProps.directories !== this.props.directories) {
            //trigger scroll event when directory list is changed so all visible lazily rendered elements render
            window.dispatchEvent(new Event('scroll'));
        }
    }

    render() {
        const {waiting, directoryDialogProps, deleteScriptProps, deleteDirectoryProps} = this.state;
        const {directories, isScriptUsageReady, isForceOpen, filter, deleteScript, deleteDirectory} = this.props;

        return (
            <LazilyRenderedContext>
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
                                <div className="flex-row space-between">
                                    <div>
                                        <TextField
                                            isCompact={true}
                                            placeholder="Filter"
                                            value={filter.name}
                                            onChange={this._onFilterChange}
                                        />
                                    </div>
                                    <DropdownMenu
                                        trigger={
                                            <Fragment>
                                                {FieldMessages.type}{' '}
                                                {filter.scriptType ? <strong>{'('}{filter.scriptType}{')'}</strong> : `(${CommonMessages.all})`}
                                            </Fragment>
                                        }
                                        triggerType="button"
                                    >
                                        <DropdownItemGroupRadio id="categories">
                                            <DropdownItemRadio
                                                id="all"
                                                onClick={this._setType(null)}
                                                isSelected={filter.scriptType === null}
                                            >
                                                All
                                            </DropdownItemRadio>
                                            {scriptTypes.map(type =>
                                                <DropdownItemRadio
                                                    id={type} key={type}
                                                    onClick={this._setType(type)}
                                                    isSelected={filter.scriptType === type}
                                                >
                                                    {type}
                                                </DropdownItemRadio>
                                            )}
                                        </DropdownItemGroupRadio>
                                    </DropdownMenu>
                                    <div className="flex-vertical-middle">
                                        <Checkbox
                                            label={RegistryMessages.onlyUnused}
                                            isDisabled={!isScriptUsageReady}

                                            isChecked={filter.onlyUnused}
                                            onChange={this._toggleUnused}

                                            value="true"
                                            name="onlyUnused"
                                        />
                                    </div>
                                </div>
                            }
                            breadcrumbs={<Breadcrumbs>{withRoot([])}</Breadcrumbs>}
                        >
                            {PageTitleMessages.registry}
                        </PageHeader>

                        <div className={`page-content ScriptList ${this.state.isDragging ? 'dragging' : ''}`}>
                            {directories.map(directory =>
                                <ScriptDirectory
                                    directory={directory}
                                    key={directory.id}

                                    forceOpen={isForceOpen}

                                    onCreate={this._activateCreateDialog}
                                    onEdit={this._activateEditDialog}
                                    onDelete={this._activateDeleteDialog}
                                />
                            )}

                            {!directories.length ? <InfoMessage title={RegistryMessages.noScripts}/> : null}
                            {directoryDialogProps && <ScriptDirectoryDialog {...directoryDialogProps} onClose={this._closeDirectoryDialog}/>}
                            {deleteDirectoryProps &&
                                <DeleteDialog
                                    deleteItem={deleteDirectory}
                                    onClose={this._closeDeleteDirectoryDialog}
                                    i18n={{
                                        heading: RegistryMessages.deleteDirectory,
                                        areYouSure: CommonMessages.confirmDelete
                                    }}

                                    {...deleteDirectoryProps}
                                />
                            }
                            {deleteScriptProps &&
                                <DeleteDialog
                                    deleteItem={deleteScript}
                                    onClose={this._closeDeleteScriptDialog}
                                    i18n={{
                                        heading: RegistryMessages.deleteScript,
                                        areYouSure: CommonMessages.confirmDelete
                                    }}

                                    {...deleteScriptProps}
                                />
                            }

                            {waiting && <Blanket isTinted={true}/>}
                        </div>

                        <UsageStatusFlag/>
                    </Page>
                </DragDropContext>
            </LazilyRenderedContext>
        );
    }
}

const rootSelector = createSelector(
    [groupedDirsSelector],
    dirs => [...(dirs['undefined'] || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))
);

const isForceOpenSelector = createSelector(
    [filteredSelector],
    state => state.isForceOpen
);

export const ScriptRegistry = connect(
    (state: RootState) => ({
        directories: rootSelector(state),
        isForceOpen: isForceOpenSelector(state),
        filter: filterSelector(state),
        isScriptUsageReady: state.scriptUsage.ready
    }),
    {
        deleteDirectory, deleteScript, moveScript,
        updateFilter: FilterActionCreators.updateFilter
    }
)(ScriptRegistryInternal);
