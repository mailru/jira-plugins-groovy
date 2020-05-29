import React from 'react';

import {connect} from 'react-redux';
import {createSelector, createStructuredSelector} from 'reselect';

import Button, {ButtonGroup} from '@atlaskit/button';
import DropdownMenu, {DropdownItemGroup, DropdownItem} from '@atlaskit/dropdown-menu';

import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';
import AddIcon from '@atlaskit/icon/glyph/add';
import MoreVerticalIcon from '@atlaskit/icon/glyph/more-vertical';
import WatchIcon from '@atlaskit/icon/glyph/watch';
import WatchFilledIcon from '@atlaskit/icon/glyph/watch-filled';

import {addWatch, removeWatch, RootState} from './redux';

import {DeleteCallback, CreateCallback, EditCallback} from './types';

import {watcherService} from '../service';

import {CommonMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';
import {RouterLink} from '../common/ak';


type ActionsProps = {
    id: number,
    name: string,
    onCreate: CreateCallback,
    onEdit: EditCallback,
    onDelete: DeleteCallback,
    addWatch: typeof addWatch,
    removeWatch: typeof removeWatch,
    isWatched: boolean
};

type ActionsState = {
    waitingWatch: boolean
};

export class ScriptDirectoryActionsInternal extends React.PureComponent<ActionsProps, ActionsState> {
    _onEdit = () => this.props.onEdit(this.props.id, 'directory');
    _onDelete = () => this.props.onDelete(this.props.id, 'directory', this.props.name);
    _onCreateDir = () => this.props.onCreate(this.props.id, 'directory');

    _toggleWatch = () => {
        const {id, isWatched, addWatch, removeWatch} = this.props;

        this.setState({ waitingWatch: true });

        const promise = isWatched
            ? watcherService.stopWatching('REGISTRY_DIRECTORY', id)
            : watcherService.startWatching('REGISTRY_DIRECTORY', id);

        promise.then(
            () => {
                (isWatched ? removeWatch : addWatch)('directory', id);
                this.setState({ waitingWatch: false });
            },
            (error) => {
                this.setState({ waitingWatch: false });
                throw error;
            }
        );
    };

    state: ActionsState = {
        waitingWatch: false
    };

    render() {
        const {id, isWatched} = this.props;
        const {waitingWatch} = this.state;

        return (
            <ButtonGroup>
                <Button
                    appearance="subtle"
                    iconBefore={<AddIcon label=""/>}

                    onClick={this._onCreateDir}
                >
                    {RegistryMessages.addDirectory}
                </Button>
                <Button
                    appearance="subtle"
                    iconBefore={<AddIcon label=""/>}

                    component={RouterLink}
                    href={`/registry/script/create/${id}`}
                >
                    {RegistryMessages.addScript}
                </Button>
                <Button
                    appearance="subtle"
                    iconBefore={<EditFilledIcon label=""/>}

                    onClick={this._onEdit}
                />
                <Button
                    key="watch"
                    appearance="subtle"
                    isDisabled={waitingWatch}
                    iconBefore={isWatched ? <WatchFilledIcon label=""/> : <WatchIcon label=""/>}

                    onClick={this._toggleWatch}
                />
                <DropdownMenu
                    key="etc"

                    position="bottom right"

                    triggerType="button"
                    triggerButtonProps={{
                        appearance: 'subtle',
                        iconBefore: <MoreVerticalIcon label=""/>
                    }}
                >
                    <DropdownItemGroup>
                        <DropdownItem onClick={this._onDelete}>
                            {CommonMessages.delete}
                        </DropdownItem>
                    </DropdownItemGroup>
                </DropdownMenu>
            </ButtonGroup>
        );
    }
}

export const ScriptDirectoryActions = connect(
    () => {
        const isWatchedSelector = createSelector(
            [
                (state: RootState) => state.directoryWatches,
                (_state: RootState, props: ActionsProps) => props.id
            ],
            (directoryWatches, id) => directoryWatches.includes(id)
        );

        return createStructuredSelector({
            isWatched: isWatchedSelector
        });
    },
    { addWatch, removeWatch }
)(ScriptDirectoryActionsInternal);
