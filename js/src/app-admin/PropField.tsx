import React, {SyntheticEvent} from 'react';

import TextField from '@atlaskit/textfield';
import TextArea from '@atlaskit/textarea';
import {Checkbox} from '@atlaskit/checkbox';
import {gridSize} from '@atlaskit/theme';

import {AsyncPicker, EditorField, FormField} from '../common/ak';
import {SingleValueType} from '../common/ak/types';

import {getPluginBaseUrl} from '../service';


type CommonProps = {
    label: string,
    isRequired: boolean,
    onChange: (value: any) => void,
};

export type PropFieldValue = {
    type: 'USER' | 'GROUP' | 'CUSTOM_FIELD' | 'RESOLUTION',
    value: SingleValueType | null,
} | {
    type: 'STRING' | 'TEXT' | 'LONG' | 'DOUBLE' | 'SCRIPT',
    value: string | null
} | {
    type: 'BOOLEAN',
    value: boolean
} | {
    type: 'MULTI_USER',
    value: ReadonlyArray<SingleValueType> | null
}

type Props = CommonProps &  {
    value: PropFieldValue
}


export class PropField extends React.PureComponent<Props> {
    _toggleCallback = (e: SyntheticEvent<HTMLInputElement>) => this.props.onChange(e.currentTarget.checked);

    _textCallback = (e: SyntheticEvent<HTMLInputElement|HTMLTextAreaElement>) => this.props.onChange(e.currentTarget.value);

    render() {
        const {value, label, isRequired, onChange} = this.props;

        switch (value.type) {
            case 'USER': {
                return (
                    <AsyncPicker
                        name={label}
                        label={label}
                        isRequired={isRequired}

                        src={`${getPluginBaseUrl()}/jira-api/userPicker`}
                        displayValue={true}

                        onChange={onChange}
                        value={value.value}
                    />
                );
            }
            case 'MULTI_USER': {
                return (
                    <AsyncPicker
                        name={label}
                        label={label}
                        isRequired={isRequired}
                        isMulti={true}

                        src={`${getPluginBaseUrl()}/jira-api/userPicker`}
                        displayValue={true}

                        onChange={onChange}
                        value={value.value || []}
                    />
                );
            }
            case 'GROUP':
                return (
                    <AsyncPicker
                        name={label}
                        label={label}
                        isRequired={isRequired}

                        src={`${getPluginBaseUrl()}/jira-api/groupPicker`}
                        onChange={onChange}
                        value={value.value}
                    />
                );
            case 'CUSTOM_FIELD':
                return (
                    <AsyncPicker
                        name={label}
                        label={label}
                        isRequired={isRequired}

                        src={`${getPluginBaseUrl()}/jira-api/customFieldPicker`}
                        displayValue={true}

                        onChange={onChange}
                        value={value.value}
                    />
                );
            case 'RESOLUTION':
                return (
                    <AsyncPicker
                        name={label}
                        label={label}
                        isRequired={isRequired}

                        src={`${getPluginBaseUrl()}/jira-api/resolutionPicker`}
                        onChange={onChange}
                        value={value.value}
                    />
                );
            case 'STRING':
                return (
                    <FormField
                        name={label}
                        label={label}
                        isRequired={isRequired}
                    >
                        {props =>
                            <TextField
                                {...props}
                                type="text"

                                value={value.value || ''}
                                onChange={this._textCallback}
                            />
                        }
                    </FormField>
                );
            case 'TEXT':
                return (
                    <FormField
                        name={label}
                        label={label}
                        isRequired={isRequired}
                    >
                        {props =>
                            <TextArea
                                {...props}
                                resize="vertical"

                                value={value.value || ''}
                                onChange={this._textCallback}
                            />
                        }
                    </FormField>
                );
            case 'LONG':
                return (
                    <FormField
                        name={label}
                        label={label}
                        isRequired={isRequired}
                    >
                        {props =>
                            <TextField
                                {...props}
                                type="number"

                                value={value.value || ''}
                                onChange={this._textCallback}
                            />
                        }
                    </FormField>
                );
            case 'DOUBLE':
                return (
                    <FormField
                        name={label}
                        label={label}
                        isRequired={isRequired}
                    >
                        {props =>
                            <TextField
                                {...props}

                                type="text"
                                pattern="[0-9.]+"

                                value={value.value || ''}
                                onChange={this._textCallback}
                            />
                        }
                    </FormField>
                );
            case 'BOOLEAN':
                return (
                    <div style={{marginTop: `${gridSize()}px`}}>
                        <Checkbox
                            label={label}
                            name={label}

                            isChecked={value.value || false}
                            onChange={this._toggleCallback}

                            value="true"
                        />
                    </div>
                );
            case 'SCRIPT':
                return (
                    <EditorField
                        label={label}
                        isRequired={isRequired}

                        onChange={onChange}
                        value={value.value}
                    />
                );
            default:
                return <div>{'Unsupported type'}</div>;
        }
    }
}
