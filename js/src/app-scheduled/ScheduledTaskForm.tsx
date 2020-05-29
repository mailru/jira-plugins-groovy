import React, {ReactNode, SyntheticEvent} from 'react';

import {connect} from 'react-redux';
import {Prompt, withRouter, RouteComponentProps} from 'react-router-dom';

import Button, {ButtonGroup} from '@atlaskit/button';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';
import TextField from '@atlaskit/textfield';
import TextArea from '@atlaskit/textarea';
import {RadioGroup} from '@atlaskit/radio';
import {Checkbox} from '@atlaskit/checkbox';
import {colors} from '@atlaskit/theme';
import {Label} from '@atlaskit/field-base';

import WarningIcon from '@atlaskit/icon/glyph/warning';

import {
    types, typeList,
    ScheduledTaskType,
    KeyedScheduledTaskTypeType,
    TransitionOptionsType,
    ScheduledTaskTypeEnum
} from './types';

import {CommonMessages, DialogMessages, FieldMessages} from '../i18n/common.i18n';
import {ScheduledTaskMessages, TransitionOptionMessages} from '../i18n/scheduled.i18n';

import {AsyncPicker, CheckedEditorField, JqlInput, FormField, FieldError, ErrorMessage, RouterLink} from '../common/ak';
import {ScrollToTop} from '../common/ScrollToTop';
import {withRoot} from '../common/script-list';

import {scheduledTaskService, getPluginBaseUrl} from '../service';
import {Bindings, ReturnTypes} from '../common/bindings';
import {addItem, updateItem} from '../common/redux';

import {DialogComponentProps} from '../common/script-list/types';
import {InputEvent} from '../common/EventTypes';
import {BindingType} from '../common/editor';
import {SingleValueType} from '../common/ak/types';
import {ErrorDataType, ErrorType} from '../common/types';
import {notNull} from '../common/tsUtil';


const issueBindings = [Bindings.issue];
const emptyBindings: Array<BindingType> = [];
const returnTypes = [ReturnTypes.void];

function getValue(option: any): string | null {
    return option ? option.value : null;
}

type Form = {
    name: string,
    type: ScheduledTaskTypeEnum | null,
    scheduleExpression: string,
    transitionOptions: TransitionOptionsType,
    issueWorkflowName: SingleValueType | null,
    issueWorkflowActionId: SingleValueType | null,
    userKey: SingleValueType | null,
    description: string | null,
    issueJql: string | null,
    scriptBody: string | null,
    comment: string | null,
};

type FormFieldKey = keyof Form;

const defaultValues: Form = {
    name: '',
    type: null,
    scheduleExpression: '',
    transitionOptions: {},
    issueWorkflowName: null,
    issueWorkflowActionId: null,
    userKey: null,
    scriptBody: null,
    issueJql: null,
    comment: null,
    description: null
};

type Props = DialogComponentProps & RouteComponentProps & {
    updateItem: typeof updateItem,
    addItem: typeof addItem
};

type State = {
    ready: boolean,
    waiting: boolean,
    isModified: boolean,
    values: Form,
    task: ScheduledTaskType | null,
    error: ErrorDataType | null | undefined
};

export class ScheduledTaskFormInternal extends React.PureComponent<Props, State> {
    state: State = {
        ready: false,
        waiting: false,
        isModified: false,
        values: {...defaultValues},
        task: null,
        error: null
    };

    componentDidUpdate(prevProps: Props) {
        const {isNew, id} = this.props;

        if (prevProps.isNew !== isNew || prevProps.id !== id) {
            this._init(this.props);
        }
    }

    componentDidMount() {
        this._init(this.props);
    }

    _init = ({isNew, id}: Props) => {
        if (!isNew && id) {
            this.setState({
                ready: false,
                waiting: false,
                isModified: false,
                values: {...defaultValues},
                error: null
            });

            scheduledTaskService
                .get(id)
                .then((task: ScheduledTaskType) => {
                    this.setState({
                        values: {
                            ...defaultValues,
                            name: task.name,
                            description: task.description || null,
                            scriptBody: task.scriptBody,
                            scheduleExpression: task.scheduleExpression,
                            userKey: task.user,
                            type: task.type,
                            issueJql: task.issueJql,
                            issueWorkflowName: task.issueWorkflow,
                            issueWorkflowActionId: task.issueWorkflowAction,
                            transitionOptions: task.transitionOptions || {},
                            comment: ''
                        },
                        ready: true,
                        isModified: false,
                        task
                    });
                });
        } else {
            this.setState({
                ready: true,
                isModified: false,
                values: {
                    ...defaultValues,
                    name: '',
                    description: '',
                    transitionOptions: {},
                    scriptBody: ''
                },
                error: null,
                task: null
            });
        }
    };

    _handleError = (error: ErrorType) => {
        const {response} = error;

        if (response.status === 400) {
            this.setState({ error: response.data, waiting: false });
        } else {
            this.setState({ waiting: false });
            throw error;
        }
    };

    _onSubmit = () => {
        const {isNew, id, updateItem, addItem, history} = this.props;

        this.setState({ waiting: true });

        const jsData = this.state.values;
        const data = {
            ...jsData,
            userKey: getValue(jsData.userKey),
            issueWorkflowName: getValue(jsData.issueWorkflowName),
            issueWorkflowActionId: getValue(jsData.issueWorkflowActionId)
        };

        if (!isNew && id) {
            scheduledTaskService
                .update(id, data)
                .then(
                    (script: ScheduledTaskType) => {
                        history.push('/scheduled', {focus: script.id});
                        updateItem(script);
                    },
                    this._handleError
                );
        } else {
            scheduledTaskService
                .create(data)
                .then(
                    (script: ScheduledTaskType) => {
                        history.push('/scheduled', {focus: script.id});
                        addItem(script);
                    },
                    this._handleError
                );
        }
    };

    mutateValue = (field: FormFieldKey, value: any) => {
        this.setState( state => ({
            values: {
                ...state.values,
                [field]: value,
                isModified: true
            }
        }));
    };

    _setTextValue = (field: FormFieldKey) => (event: InputEvent) => this.mutateValue(field, event.currentTarget.value);

    _setObjectValue = (field: FormFieldKey) => (value: any) => this.mutateValue(field, value);

    _toggleTransitionOption2 = (e: SyntheticEvent<HTMLInputElement>) => {
        const option = e.currentTarget.value as keyof TransitionOptionsType;

        if (option) {
            this.setState((state) => {
                const options = state.values.transitionOptions || {};

                return {
                    values: {
                        ...state.values,
                        transitionOptions: {
                            ...options,
                            [option]: !options[option]
                        }
                    }
                };
            });
        }
    };

    _renderField = (fieldName: (FormFieldKey | 'workflowAction'), e: ErrorDataType | null | undefined): ReactNode => {
        const {values, waiting} = this.state;
        let error: ErrorDataType | null | undefined = e;

        let errorMessage: ReactNode = null;
        let errorField: string | null | undefined = null;

        if (error) {
            errorMessage = error.message || error.messages;
            errorField = error.field;
        }

        switch (fieldName) {
            case 'scriptBody': {
                if (error && error.field === fieldName) {
                    if (Array.isArray(error.error)) {
                        const errors = error.error.filter(notNull);
                        error = {
                            field: fieldName,
                            messages: errors.map(error => error.message)
                        };
                    }
                }

                const currentType = values.type;

                let bindings: Array<BindingType> | null = null;

                let withIssue = false;
                const isMutableIssue = currentType === 'ISSUE_JQL_SCRIPT';

                switch (currentType) {
                    case 'ISSUE_JQL_SCRIPT':
                    case 'DOCUMENT_ISSUE_JQL_SCRIPT':
                        bindings = issueBindings;
                        withIssue = true;
                        break;
                    default:
                        bindings = emptyBindings;
                }

                return (
                    <CheckedEditorField
                        key={fieldName}

                        label={FieldMessages.scriptCode}
                        resizable={true}
                        isRequired={true}
                        isDisabled={waiting}

                        isInvalid={errorField === 'scriptBody'}
                        invalidMessage={errorField === 'scriptBody' ? errorMessage : null}

                        scriptType="SCHEDULED_TASK"
                        typeParams={{
                            withIssue: withIssue ? 'true' : 'false',
                            isMutableIssue: isMutableIssue ? 'true' : 'false'
                        }}
                        bindings={bindings}
                        returnTypes={returnTypes}

                        value={values[fieldName] || ''}
                        onChange={this._setObjectValue(fieldName)}
                    />
                );
            }
            case 'issueJql': {
                return (
                    <div key={fieldName}>
                        <JqlInput
                            name={fieldName}
                            label={FieldMessages.issueJql}
                            isRequired={true}
                            isDisabled={waiting}

                            isInvalid={errorField === fieldName}
                            invalidMessage={errorField === fieldName ? errorMessage : ''}

                            shouldFitContainer={true}

                            value={values[fieldName] || ''}
                            onChange={this._setTextValue(fieldName)}
                        />
                        <div className="ak-description">
                            <WarningIcon size="small" label="" primaryColor={colors.Y300}/>
                            {' '}
                            {ScheduledTaskMessages.jqlLimitDescription('1000') /*todo: insert value from config when its configurable*/}
                        </div>
                        {['ISSUE_JQL_SCRIPT', 'DOCUMENT_ISSUE_JQL_SCRIPT'].includes(values.type as string) &&
                            <div className="ak-description">
                                <WarningIcon size="small" label="" primaryColor={colors.Y300}/>
                                {' '}
                                {ScheduledTaskMessages.jqlScriptDescription}
                            </div>
                        }
                    </div>
                );
            }
            case 'workflowAction': {
                const workflow = values.issueWorkflowName;
                return (
                    <div key={fieldName}>
                        <AsyncPicker
                            name={fieldName}
                            label={FieldMessages.workflow}
                            isRequired={true}
                            isDisabled={waiting}

                            src={`${getPluginBaseUrl()}/jira-api/workflowPicker`}
                            value={workflow}
                            onChange={this._setObjectValue('issueWorkflowName')}

                            isInvalid={errorField === fieldName}
                            invalidMessage={errorField === fieldName ? errorMessage : ''}
                        />
                        {workflow &&
                            <AsyncPicker
                                name={fieldName}
                                label={FieldMessages.workflowAction}
                                isRequired={true}
                                isDisabled={waiting}

                                src={`${getPluginBaseUrl()}/jira-api/workflowActionPicker/${workflow.value}`}
                                value={values.issueWorkflowActionId}
                                onChange={this._setObjectValue('issueWorkflowActionId')}

                                isInvalid={errorField === fieldName}
                                invalidMessage={errorField === fieldName ? errorMessage : ''}
                            />
                        }
                    </div>
                );
            }
            case 'transitionOptions': {
                const value = ((values[fieldName] || {}) as TransitionOptionsType);
                return (
                    <div key={fieldName}>
                        <Label label={ScheduledTaskMessages.transitionOptions}/>
                        <div>
                            <Checkbox
                                isChecked={value.skipConditions || false}
                                isDisabled={waiting}
                                onChange={this._toggleTransitionOption2}
                                label={TransitionOptionMessages.skipConditions}
                                value="skipConditions"
                                name="transition-options"
                            />
                            <Checkbox
                                isChecked={value.skipValidators || false}
                                isDisabled={waiting}
                                onChange={this._toggleTransitionOption2}
                                label={TransitionOptionMessages.skipValidators}
                                value="skipValidators"
                                name="transition-options"
                            />
                            <Checkbox
                                isChecked={value.skipPermissions || false}
                                isDisabled={waiting}
                                onChange={this._toggleTransitionOption2}
                                label={TransitionOptionMessages.skipPermissions}
                                value="skipPermissions"
                                name="transition-options"
                            />
                        </div>
                    </div>
                );
            }
            default:
                return <div key={fieldName}>{'NOT IMPLEMENTED'}</div>;
        }
    };

    render() {
        const {isNew} = this.props;
        const {ready, waiting, isModified, values, task, error} = this.state;

        let body: ReactNode = null;

        if (!ready) {
            body = <div>{DialogMessages.notReady}</div>;
        } else {
            const currentType = values.type;

            let errorMessage: ReactNode = null;
            let errorField: string | null | undefined = null;

            if (error) {
                errorMessage = error.message || error.messages;
                errorField = error.field;
            }

            body = (
                <div className="flex-column">
                    {error && !errorField && <ErrorMessage title={errorMessage || undefined}/>}

                    <FormField
                        name="name"
                        label={FieldMessages.name}
                        isRequired={true}

                        isDisabled={waiting}

                        isInvalid={errorField === 'name'}
                        invalidMessage={errorField === 'name' ? errorMessage : null}
                    >
                        {props =>
                            <TextField
                                {...props}

                                value={values.name || ''}
                                onChange={this._setTextValue('name')}
                            />
                        }
                    </FormField>

                    <FormField
                        name="description"
                        label={FieldMessages.description}

                        isDisabled={waiting}

                        isInvalid={errorField === 'description'}
                        invalidMessage={errorField === 'description' ? errorMessage : null}
                    >
                        {props =>
                            <TextArea
                                {...props}

                                minimumRows={5}

                                value={values.description || ''}
                                onChange={this._setTextValue('description')}
                            />
                        }
                    </FormField>

                    <FormField
                        name="schedule"
                        label={FieldMessages.schedule}
                        isRequired={true}

                        isDisabled={waiting}

                        isInvalid={errorField === 'scheduleExpression'}
                        invalidMessage={errorField === 'scheduleExpression' ? errorMessage : null}

                        helperText={ScheduledTaskMessages.scheduleDescription}
                    >
                        {props =>
                            <TextField
                                {...props}

                                value={values.scheduleExpression || ''}
                                onChange={this._setTextValue('scheduleExpression')}
                            />
                        }
                    </FormField>

                    <AsyncPicker
                        name="userKey"
                        label={ScheduledTaskMessages.runAs}
                        isRequired={true}
                        isDisabled={waiting}

                        src={`${getPluginBaseUrl()}/jira-api/userPicker`}
                        onChange={this._setObjectValue('userKey')}
                        value={values.userKey}

                        isInvalid={errorField === 'userKey'}
                        invalidMessage={errorField === 'userKey' ? errorMessage : ''}
                    />

                    <FormField
                        label={FieldMessages.type}
                        name="type"
                        isRequired={true}
                        isDisabled={waiting}

                        isInvalid={errorField === 'type'}
                        invalidMessage={errorField === 'type' ? errorMessage : ''}
                    >
                        {fieldProps =>
                            <RadioGroup
                                isRequired={fieldProps.isRequired}
                                isDisabled={fieldProps.isDisabled}
                                options={typeList.map((type: KeyedScheduledTaskTypeType) => {
                                    return {
                                        label: type.name,
                                        value: type.key
                                    };
                                })}
                                value={values.type}
                                onChange={this._setTextValue('type')}
                            />
                        }
                    </FormField>

                    {currentType && types[currentType].fields.map(field => this._renderField(field, error))}

                    <FormField
                        name="comment"
                        label={FieldMessages.comment}
                        isRequired={!isNew}

                        isDisabled={waiting}

                        isInvalid={errorField === 'comment'}
                        invalidMessage={errorField === 'comment' ? errorMessage : null}
                    >
                        {props =>
                            <TextArea
                                {...props}

                                value={values.comment || ''}
                                onChange={this._setTextValue('comment')}
                            />
                        }
                    </FormField>

                    <div style={{marginTop: '10px'}}>
                        <ButtonGroup>
                            <Button
                                appearance="primary"
                                isLoading={waiting}

                                onClick={this._onSubmit}
                            >
                                {isNew ? CommonMessages.create : CommonMessages.update}
                            </Button>
                            <Button
                                appearance="link"

                                isDisabled={waiting}

                                component={RouterLink}
                                href="/scheduled/"
                            >
                                {CommonMessages.cancel}
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>
            );
        }

        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="parent"
                                    text="Scheduled tasks"
                                    href="/scheduled"
                                    component={RouterLink}
                                />,
                                !isNew && task
                                    ? (
                                        <BreadcrumbsItem
                                            key="task"
                                            text={task.name}
                                            href={`/scheduled/${task.id}/view`}
                                            component={RouterLink}
                                        />
                                    )
                                    : null
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {isNew ? ScheduledTaskMessages.addTask : `${ScheduledTaskMessages.editTask}: ${task ? task.name : ''}`}
                </PageHeader>
                <ScrollToTop/>
                <Prompt when={isModified && !waiting} message="Are you sure you want to leave?"/>
                {body}
            </Page>
        );
    }
}

export const ScheduledTaskForm = withRouter(connect(() => ({}), { updateItem, addItem })(ScheduledTaskFormInternal));
