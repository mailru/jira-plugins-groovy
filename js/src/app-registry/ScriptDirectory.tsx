import React, {ReactElement, ReactNode} from 'react';

import {connect} from 'react-redux';
import {createSelector, createStructuredSelector} from 'reselect';

import {Droppable} from 'react-beautiful-dnd';

import Button from '@atlaskit/button';
import Badge from '@atlaskit/badge';
import {colors} from '@atlaskit/theme';

import FolderIcon from '@atlaskit/icon/glyph/folder';
import FolderFilledIcon from '@atlaskit/icon/glyph/folder-filled';
import { Skeleton } from '@atlaskit/icon';

import {DirectoryStateActionCreators, groupedDirsSelector, groupedScriptsSelector} from './redux';

import {DraggableRegistryScript} from './DraggableRegistryScript';
import {ScriptDirectoryActions} from './ScriptDirectoryActions';

import {DeleteCallback, CreateCallback, EditCallback, RegistryDirectoryType, RegistryScriptType} from './types';

import {LazilyRendered} from '../common/lazyRender';

import './ScriptDirectory.less';


function ActionsPlaceholder(): ReactElement {
    return (
        <div className="ScriptDirectoryActionsPlaceholder">
            <div className="ButtonPlaceholder" style={{width: '144px'}}>
                <div className="ButtonIcon">
                    <Skeleton/>
                </div>
                <div className="ButtonContentPlaceholder"/>
            </div>
            <div className="ButtonPlaceholder" style={{width: '122px'}}>
                <div className="ButtonIcon">
                    <Skeleton/>
                </div>
                <div className="ButtonContentPlaceholder"/>
            </div>
            <div className="IconButtonPlaceholder">
                <Skeleton/>
            </div>
            <div className="IconButtonPlaceholder">
                <Skeleton/>
            </div>
            <div className="IconButtonPlaceholder">
                <Skeleton/>
            </div>
        </div>
    );
}

type ScriptDirectoryProps = {
    directory: RegistryDirectoryType,
    children: ReadonlyArray<RegistryDirectoryType>,
    scripts: ReadonlyArray<RegistryScriptType>,
    errorCount: number,
    warningCount: number,
    onCreate: CreateCallback,
    onEdit: EditCallback,
    onDelete: DeleteCallback,
    open: typeof DirectoryStateActionCreators.open,
    close: typeof DirectoryStateActionCreators.close,
    forceOpen: boolean,
    isOpen: boolean,
};

export class ScriptDirectoryInternal extends React.PureComponent<ScriptDirectoryProps> {
    _toggle = () => {
        const {directory, isOpen, open, close} = this.props;

        if (isOpen) {
            close(directory.id);
        } else {
            open(directory.id);
        }
    };

    render() {
        const {forceOpen, isOpen, directory, children, scripts, errorCount, warningCount, onCreate, onEdit, onDelete} = this.props;

        let directories: ReactNode = null;
        let scriptsEl: ReadonlyArray<ReactNode> | null = null;

        const hasChildren = (children.length + scripts.length) > 0;
        const open = (isOpen || forceOpen) && hasChildren;

        if (open) {
            directories = (
                <div>
                    {children && children.map(child =>
                        <ScriptDirectory
                            directory={child}
                            key={child.id}
                            forceOpen={forceOpen}
                            onCreate={onCreate}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    )}
                </div>
            );
            scriptsEl = (
                scripts && scripts.map((script, index) =>
                    <DraggableRegistryScript
                        key={script.id}
                        index={index}
                        script={script}
                        onDelete={onDelete}
                    />
                )
            );
        }

        return (
            <div className="flex full-width flex-column scriptDirectory">
                <div className="scriptDirectoryTitle">
                    <div className="flex-row">
                        <Button
                            appearance="subtle"
                            spacing="none"
                            iconBefore={!open ? <FolderFilledIcon label=""/> : <FolderIcon label=""/>}

                            isDisabled={!hasChildren}

                            onClick={this._toggle}
                        >
                            <h3 className="flex-vertical-middle" style={{ margin: 0 }}>
                                {' '}{directory.name}
                            </h3>
                        </Button>
                    </div>
                    {warningCount > 0 &&
                        <div className="flex-vertical-middle flex-none errorCount">
                            <div>
                                <Badge
                                    max={99}
                                    appearance={{ backgroundColor: colors.Y400, textColor: colors.N0 }}
                                >
                                    {warningCount}
                                </Badge>
                            </div>
                        </div>
                    }
                    {errorCount > 0 &&
                        <div className="flex-vertical-middle flex-none errorCount">
                            <div>
                                <Badge
                                    max={99}
                                    appearance="important"
                                >
                                    {errorCount}
                                </Badge>
                            </div>
                        </div>
                    }
                    <div className="flex-grow"/>
                    <div className="flex-none">
                        <LazilyRendered>
                            {render => render
                                ? (
                                    <ScriptDirectoryActions
                                        id={directory.id}
                                        name={directory.name}

                                        onCreate={onCreate}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                )
                                : <ActionsPlaceholder/>
                            }
                        </LazilyRendered>
                    </div>
                </div>
                <div className={`scriptDirectoryChildren ${open ? 'open' : ''}`}>
                    <Droppable droppableId={`${directory.id}`}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                className={`ScriptList scriptDropArea ${snapshot.isDraggingOver ? 'draggingOver' : ''}`}
                                style={{minHeight: (scriptsEl && scriptsEl.length) ? (65*scriptsEl.length + 10*(scriptsEl.length-1)) : undefined}}
                                {...provided.droppableProps}
                            >
                                {scriptsEl}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                    {directories}
                </div>
            </div>
        );
    }
}

const countExecutions = (
    field: 'errorCount' | 'warningCount',
    dirId: number,
    scripts: {[key in number]: ReadonlyArray<RegistryScriptType>},
    dirs: {[key in number]: ReadonlyArray<RegistryDirectoryType>}
): number => {
    let errors = 0;
    if (scripts[dirId]) {
        errors += scripts[dirId].map(script => script[field] || 0).reduce((a, b) => a + b, 0);
    }
    if (dirs[dirId]) {
        errors += dirs[dirId].map(child => countExecutions(field, child.id, scripts, dirs)).reduce((a, b) => a + b, 0);
    }
    return errors;
};

export const ScriptDirectory = connect(
    () => {
        const idSelector = (_state: any, props: {directory: {id: number}}) => props.directory.id;
        const entitySelector = function<T extends {name: string}>(entities: {[key in number]: ReadonlyArray<T>}, id: number) {
            return [...(entities[id] || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
        };

        return createStructuredSelector({
            isOpen: createSelector(
                [state => state.openDirectories, idSelector],
                (openDirectories, id) => openDirectories.includes(id)
            ),
            errorCount: createSelector(
                [groupedDirsSelector, groupedScriptsSelector, idSelector],
                (dirs, scripts, id) => countExecutions('errorCount', id, scripts, dirs)
            ),
            warningCount: createSelector(
                [groupedDirsSelector, groupedScriptsSelector, idSelector],
                (dirs, scripts, id) => countExecutions('warningCount', id, scripts, dirs)
            ),
            children: createSelector(
                [groupedDirsSelector, idSelector], entitySelector
            ),
            scripts: createSelector(
                [groupedScriptsSelector, idSelector], entitySelector
            )
        });
    },
    {
        open: DirectoryStateActionCreators.open,
        close: DirectoryStateActionCreators.close
    }
)(ScriptDirectoryInternal);
