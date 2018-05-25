//@flow
import React, {type Node} from 'react';

import {connect} from 'react-redux';

import ModalDialog from '@atlaskit/modal-dialog';
import {FieldTextStateless} from '@atlaskit/field-text';

import {RegistryActionCreators} from './registry.reducer';
import type {BasicRegistryDirectoryType} from './types';

import {ErrorMessage} from '../common/ak/messages';

import {registryService} from '../service/services';

import {CommonMessages, FieldMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';
import type {VoidCallback} from '../common/types';


export type DialogParams = { isNew: false, id: number, parentId?: null } | { isNew: true, id?: null, parentId: ?number };

type Props = DialogParams & {
    addDirectory: typeof RegistryActionCreators.addDirectory,
    updateDirectory: typeof RegistryActionCreators.updateDirectory,
    onClose: VoidCallback
};

type State = {
    name: string,
    directory: ?BasicRegistryDirectoryType,
    error: *
};

export class ScriptDirectoryDialogInternal extends React.PureComponent<Props, State> {
    state = {
        name: '',
        directory: null,
        error: null
    };

    componentDidMount() {
        const {isNew, id} = this.props;

        if (!isNew) {
            registryService
                //$FlowFixMe id will be non-null here
                .getDirectory(id)
                .then(data => this.setState({
                    name: data.name,
                    error: null,
                    directory: data
                }));
        } else {
            this.setState({
                name: '',
                error: null
            });
        }
    }

    _handleError = (error: *) => {
        const {response} = error;

        if (response.status === 400) {
            this.setState({error: response.data});
        } else {
            throw error;
        }
    };

    _onSubmit = () => {
        const {id, parentId, isNew, updateDirectory, addDirectory, onClose} = this.props;
        const {name} = this.state;

        const data = {
            name: name,
            parentId: parentId || undefined
        };

        if (!isNew && id) {
            registryService
                .updateDirectory(id, data)
                .then(
                    (result: BasicRegistryDirectoryType) => {
                        updateDirectory(result);
                        onClose();
                    },
                    this._handleError);
        } else {
            registryService
                .createDirectory(data)
                .then(
                    (result: BasicRegistryDirectoryType) => {
                        addDirectory({
                            ...result,
                            children: [],
                            scripts: []
                        });
                        onClose();
                    },
                    this._handleError
                );
        }
    };

    _setName = (event: SyntheticEvent<HTMLInputElement>) => this.setState({ name: event.currentTarget.value });

    render(): Node {
        const {onClose, isNew} = this.props;
        const {error, directory} = this.state;

        let errorMessage: * = null;
        let errorField: ?string = null;

        if (error) {
            ({field: errorField, message: errorMessage} = error);
        }

        return (
            <ModalDialog
                width="medium"

                isHeadingMultiline={false}
                heading={isNew ? RegistryMessages.addDirectory : `${RegistryMessages.editDirectory}: ${directory ? directory.name : ''}`}

                onClose={onClose}
                actions={[
                    {
                        text: isNew ? CommonMessages.create : CommonMessages.update,
                        onClick: this._onSubmit
                    },
                    {
                        text: CommonMessages.cancel,
                        onClick: onClose
                    }
                ]}
            >
                {error && !errorField && <ErrorMessage title={errorMessage}/>}
                <div className="flex-column">
                    <FieldTextStateless
                        shouldFitContainer={true}
                        required={true}
                        maxLength={32}

                        isInvalid={errorField === 'name'}
                        invalidMessage={errorMessage}

                        label={FieldMessages.name}
                        value={this.state.name}
                        onChange={this._setName}
                    />
                </div>
            </ModalDialog>
        );
    }
}

export const ScriptDirectoryDialog = connect(
    null,
    //$FlowFixMe
    {
        addDirectory: RegistryActionCreators.addDirectory,
        updateDirectory: RegistryActionCreators.updateDirectory
    },
    null,
    {withRef: true}
)(ScriptDirectoryDialogInternal);
