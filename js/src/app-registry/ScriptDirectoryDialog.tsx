import React, {SyntheticEvent} from 'react';

import {connect} from 'react-redux';

import ModalDialog from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';

import {addDirectory, updateDirectory} from './redux';
import {RegistryDirectoryType} from './types';

import {registryService, getPluginBaseUrl} from '../service';

import {CommonMessages, FieldMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';
import {ErrorDataType, ErrorType, VoidCallback} from '../common/types';
import {AsyncPicker, FormField, ErrorMessage} from '../common/ak';
import {SingleValueType} from '../common/ak/types';


export type DialogParams = {
    isNew: boolean,
    id?: number,
    parentId?: number | null
};

type Props = DialogParams & {
    addDirectory: typeof addDirectory,
    updateDirectory: typeof updateDirectory,
    onClose: VoidCallback
};

type State = {
    name: string,
    parent: SingleValueType | null,
    directory: RegistryDirectoryType | null,
    error: ErrorDataType | null | undefined
};

export class ScriptDirectoryDialogInternal extends React.PureComponent<Props, State> {
    state: State = {
        name: '',
        parent: null,
        directory: null,
        error: null
    };

    componentDidMount() {
        const {isNew, id, parentId} = this.props;

        if (!isNew && id != null) {
            registryService
                //$FlowFixMe id will be non-null here
                .getDirectory(id)
                .then(data => this.setState({
                    name: data.name,
                    parent: data.parentId
                        ? {
                            value: data.parentId,
                            label: data.parentName ? data.parentName : data.parentId.toString()
                        }
                        : null,
                    error: null,
                    directory: data
                }));
        } else {
            if (parentId) {
                registryService
                    .getDirectory(parentId)
                    .then(parent => this.setState({
                        name: '',
                        parent: {
                            value: parent.id,
                            label: parent.fullName ? parent.fullName : parent.id.toString()
                        },
                        error: null
                    }));
            } else {
                this.setState({
                    name: '',
                    error: null
                });
            }
        }
    }

    _handleError = (error: ErrorType) => {
        const {response} = error;

        if (response.status === 400) {
            this.setState({error: response.data});
        } else {
            throw error;
        }
    };

    _onSubmit = () => {
        const {id, isNew, updateDirectory, addDirectory, onClose} = this.props;
        const {name, parent} = this.state;

        const data = {
            name: name,
            parentId: (parent && parent.value) || undefined
        };

        if (!isNew && id) {
            registryService
                .updateDirectory(id, data)
                .then(
                    (result: RegistryDirectoryType) => {
                        updateDirectory(result);
                        onClose();
                    },
                    this._handleError);
        } else {
            registryService
                .createDirectory(data)
                .then(
                    (result: RegistryDirectoryType) => {
                        addDirectory(result);
                        onClose();
                    },
                    this._handleError
                );
        }
    };

    _setName = (event: SyntheticEvent<HTMLInputElement>) => this.setState({ name: event.currentTarget.value });

    _setParent = (value: SingleValueType | null) => this.setState({ parent: value });

    render() {
        const {onClose, isNew} = this.props;
        const {error, directory, parent} = this.state;

        let errorMessage = null;
        let errorField: string | null | undefined = null;

        if (error) {
            ({field: errorField, message: errorMessage} = error);
        }

        return (
            <ModalDialog
                width="medium"

                scrollBehavior="outside"
                autoFocus={false}

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
                {error && !errorField && <ErrorMessage title={errorMessage || undefined}/>}
                <div className="flex-column">
                    <FormField
                        name="parentName"
                        label={FieldMessages.parentName}

                        isInvalid={errorField === 'parentId'}
                        invalidMessage={errorMessage || ''}
                    >
                        {props =>
                            <AsyncPicker
                                {...props}

                                src={`${getPluginBaseUrl()}/registry/directory/picker`}
                                isClearable={true}

                                value={parent}
                                onChange={this._setParent}
                            />
                        }
                    </FormField>
                    <FormField
                        name="name"
                        label={FieldMessages.name}
                        isRequired={true}
                        isInvalid={errorField === 'name'}
                        invalidMessage={errorMessage}
                    >
                        {props =>
                            <TextField
                                {...props}

                                maxLength={32}

                                value={this.state.name}
                                onChange={this._setName}
                            />
                        }
                    </FormField>
                </div>
            </ModalDialog>
        );
    }
}

export const ScriptDirectoryDialog = connect(
    () => ({}),
    { addDirectory, updateDirectory }
)(ScriptDirectoryDialogInternal);
