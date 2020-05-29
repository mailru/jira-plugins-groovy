import React from 'react';

import {connect} from 'react-redux';
import {withRouter, RouteComponentProps} from 'react-router-dom';

import {JqlScriptType} from './types';

import {addItem, updateItem} from '../common/redux';
import {jqlScriptService} from '../service';

import {RegistryMessages} from '../i18n/registry.i18n';
import {ScriptForm, SubmitResult} from '../common/script-list/ScriptForm';
import {DialogComponentProps} from '../common/script-list/types';


const defaultValues = {
    name: '',
    description: '',
    scriptBody: '',
    comment: ''
};

type Props = DialogComponentProps & RouteComponentProps & {
    addItem: typeof addItem,
    updateItem: typeof updateItem
};

const defaultLoader = () => ({
    values: {...defaultValues},
    name: null
});

const editLoader = (id: number) => jqlScriptService
    .getScript(id)
    .then(
        ({name, description, scriptBody}) => ({
            values: {
                ...defaultValues,
                description: description || '',
                name, scriptBody
            },
            name
        })
    );

const onSubmit = (id: number | null, data: {[key in string]: any}): Promise<SubmitResult> => {
    const promise = id ? jqlScriptService.updateScript(id, data) : jqlScriptService.createScript(data);

    return promise
        .then(
            (item: JqlScriptType): SubmitResult => {
                return {
                    success: true,
                    item
                };
            }
        )
        .catch(
            (error): SubmitResult => {
                const {response} = error;

                if (response.status === 400) {
                    return {
                        success: false,
                        error: response.data
                    };
                } else {
                    throw error;
                }
            }
        );
};

class JqlFormInternal extends React.PureComponent<Props> {
    render() {
        return (
            <ScriptForm
                defaultLoader={defaultLoader}
                editLoader={editLoader}
                onSubmit={onSubmit}
                i18n={{
                    editTitle: RegistryMessages.editScript,
                    createTitle: RegistryMessages.addScript,
                    parentName: 'JQL scripts'
                }}
                returnTypes={[]}
                returnTo="/jql/"
                scriptType="JQL"

                {...this.props}
            />
        );
    }
}

export const JqlForm = withRouter(
    connect(
        null,
        { addItem, updateItem }
    )(JqlFormInternal)
);
