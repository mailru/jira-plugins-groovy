import React, {ReactElement} from 'react';

import {connect} from 'react-redux';
import {withRouter, RouteComponentProps} from 'react-router-dom';

import {Checkbox} from '@atlaskit/checkbox';

import {AdminScriptType} from './types';

import {addItem, updateItem} from '../common/redux';
import {adminScriptService} from '../service';

import {RegistryMessages} from '../i18n/registry.i18n';
import {ReturnTypes} from '../common/bindings';
import {ScriptForm, SubmitResult, AdditionalFieldProps, ProvidedState} from '../common/script-list/ScriptForm';
import {DialogComponentProps, ScriptForm as ScriptFormType} from '../common/script-list/types';
import {CommonMessages} from '../i18n/common.i18n';


type FormType = ScriptFormType & {
    html: boolean
};

type Props = DialogComponentProps & RouteComponentProps & {
    addItem: typeof addItem,
    updateItem: typeof updateItem
};

const defaultValues = {
    name: '',
    description: '',
    scriptBody: '',
    comment: '',
    html: false
};

const defaultLoader = () => ({
    values: {...defaultValues},
    name: null
});

const editLoader = (id: number) => adminScriptService
    .getScript(id)
    .then(({name, description, scriptBody, html}: AdminScriptType): ProvidedState<FormType> => {
        return {
            values: {
                ...defaultValues,
                description: description || '',
                name, scriptBody, html
            },
            name
        };
    });

const onSubmit = (id: number | null, data: {[key in string]: any}): Promise<SubmitResult> => {
    const promise = id ? adminScriptService.updateScript(id, data) : adminScriptService.createScript(data);

    return promise
        .then(
            (item: AdminScriptType): SubmitResult => {
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

const returnTypes = [{
    ...ReturnTypes.string,
    optional: true
}];

function HtmlField({values, mutateValue}: AdditionalFieldProps<FormType>): ReactElement {
    return (
        <Checkbox
            label={CommonMessages.renderAsHtml}
            isChecked={values.html || false}
            // eslint-disable-next-line react/jsx-no-bind
            onChange={e => mutateValue('html', e.currentTarget.checked)}
        />
    );
}

class AdminFormInternal extends React.PureComponent<Props> {
    render() {
        return (
            <ScriptForm
                defaultLoader={defaultLoader}
                editLoader={editLoader}

                onSubmit={onSubmit}
                i18n={{
                    editTitle: RegistryMessages.editScript,
                    createTitle: RegistryMessages.addScript,
                    parentName: 'Admin scripts'
                }}
                scriptType="ADMIN_SCRIPT"
                returnTypes={returnTypes}
                returnTo="/admin-scripts/"

                additionalFields={[
                    {
                        key: 'html',
                        component: HtmlField
                    }
                ]}

                {...this.props}
            />
        );
    }
}

export const AdminForm = withRouter(
    connect(
        null,
        { addItem, updateItem }
    )(AdminFormInternal)
);
