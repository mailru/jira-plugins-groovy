import React from 'react';

import {Bindings} from '../common/bindings';
import {CheckedEditorField} from '../common/ak';
import {CommonMessages} from '../i18n/common.i18n';


const bindings = [ Bindings.mutableIssue, Bindings.currentUser, Bindings.transientVars ];

type FormEditorProps = {
    initialValue: string | null,
    fieldName: string
};

type FormEditorState = {
    value: string
};

export class FormEditor extends React.Component<FormEditorProps, FormEditorState> {
    state: FormEditorState = {
        value: this.props.initialValue || ''
    };

    _setValue = (value: string | null) => {
        this.setState({ value: value || '' });
    };

    render() {
        const {fieldName} = this.props;
        const {value} = this.state;

        return (
            <div>
                <CheckedEditorField
                    label={CommonMessages.script}
                    isRequired={true}

                    bindings={bindings}

                    value={value}
                    onChange={this._setValue}
                    scriptType="WORKFLOW_GENERIC"
                />
                <textarea
                    className="hidden"

                    readOnly={true}
                    value={value}
                    name={fieldName}
                />
            </div>
        );
    }
}
