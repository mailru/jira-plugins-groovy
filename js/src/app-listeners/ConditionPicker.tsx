import React, {ReactNode, SyntheticEvent} from 'react';

import {RadioGroup} from '@atlaskit/radio';
import TextField from '@atlaskit/textfield';

import {ConditionInputType} from './types';

import {jiraService} from '../service';

import {FieldMessages} from '../i18n/common.i18n';
import {ListenerTypeMessages} from '../i18n/listener.i18n';

import {AsyncLoadingMultiSelect, FormField, FieldError} from '../common/ak';

import {LoaderOptionType} from '../common/ak/AsyncLoadingMultiSelect';

import {ErrorDataType, IssueEventType, ProjectType} from '../common/types';

import './ConditionPicker.less';


const projectsLoader = () => jiraService
    .getAllProjects()
    .then(projects => projects.map((project: ProjectType): LoaderOptionType<number> => {
        return {
            value: parseInt(project.id, 10),
            name: `${project.key} - ${project.name}`
        };
    }));

const eventTypeLoader = () => jiraService
    .getEventTypes()
    .then(types => types.map((type: IssueEventType): LoaderOptionType<number> => {
        return {
            value: type.id,
            name: type.name
        };
    }));

type Props = {
    value: ConditionInputType,
    onChange: (value: ConditionInputType) => void,
    error: ErrorDataType | null | undefined,
    isDisabled?: boolean
};

export class ConditionPicker extends React.Component<Props> {
    _onChange = (property: string) =>
        (val: any) => {
            const {value, onChange} = this.props;

            onChange({
                ...value,
                [property]: val
            });
        };

    _onTypeChange = (e: SyntheticEvent<HTMLInputElement>) => {
        const {value, onChange} = this.props;

        const type = e.currentTarget.value;

        if (type === 'CLASS_NAME' || type === 'ISSUE') {
            onChange({...value, type});
        }
    };

    _onInputChange = (property: string) =>
        (e: SyntheticEvent<HTMLInputElement>) => {
            const {value, onChange} = this.props;

            onChange({
                ...value,
                [property]: e.currentTarget.value
            });
        };

    render() {
        const {value, error, isDisabled} = this.props;

        //todo
        let errorField: any = null;
        let errorMessage: any = null;

        if (error) {
            errorField = error.field;
            errorMessage = error.message;
        }

        let paramEl: ReactNode = null;

        if (value.type) {
            switch (value.type) {
                case 'CLASS_NAME':
                    paramEl = [
                        <FormField
                            name="condition.pluginKey"
                            key="pluginKey"

                            label={FieldMessages.pluginKey}

                            isDisabled={isDisabled}
                            isInvalid={errorField === 'condition.pluginKey'}
                            invalidMessage={errorField === 'condition.pluginKey' ? errorMessage : null}
                        >
                            {props =>
                                <TextField
                                    {...props}

                                    key="pluginKey"

                                    value={value.pluginKey || ''}
                                    onChange={this._onInputChange('pluginKey')}
                                />
                            }
                        </FormField>,
                        <FormField
                            name="condition.className"
                            key="className"

                            label={ListenerTypeMessages.CLASS_NAME}
                            isRequired={true}

                            isDisabled={isDisabled}
                            isInvalid={errorField === 'condition.className'}
                            invalidMessage={errorField === 'condition.className' ? errorMessage : null}
                        >
                            {props =>
                                <TextField
                                    {...props}

                                    key="className"
                                    isInvalid={errorField === 'condition.className'}

                                    value={value.className || ''}
                                    onChange={this._onInputChange('className')}
                                />
                            }
                        </FormField>
                    ];
                    break;
                case 'ISSUE':
                    paramEl = [
                        <AsyncLoadingMultiSelect
                            name="project"
                            key="project"
                            label={FieldMessages.projects}
                            isDisabled={isDisabled}

                            value={value.projectIds || []}
                            onChange={this._onChange('projectIds')}
                            loader={projectsLoader}
                        />,
                        <AsyncLoadingMultiSelect
                            name="type"
                            key="type"
                            label={FieldMessages.eventTypes}
                            isDisabled={isDisabled}

                            value={value.typeIds || []}
                            onChange={this._onChange('typeIds')}
                            loader={eventTypeLoader}
                        />
                    ];
                    break;
                default:
                    paramEl = 'not implemented';
            }
        }

        return (
            <div className="flex-column" style={{zIndex: 100}}>
                {/*todo: label FieldMessages.type isRequired={true}*/}
                <RadioGroup
                    options={[
                        {
                            label: ListenerTypeMessages.ISSUE,
                            value: 'ISSUE'
                        },
                        {
                            label: ListenerTypeMessages.CLASS_NAME,
                            value: 'CLASS_NAME'
                        }
                    ]}
                    isDisabled={isDisabled}
                    value={value.type}
                    onChange={this._onTypeChange}
                />
                {errorField === 'condition.type' && <FieldError error={errorMessage}/>}
                {paramEl}
            </div>
        );
    }
}
