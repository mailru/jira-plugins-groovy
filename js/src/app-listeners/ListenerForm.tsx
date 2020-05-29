import React, {ReactNode, SyntheticEvent} from 'react';

import {connect} from 'react-redux';
import {withRouter, Prompt, RouteComponentProps} from 'react-router-dom';

import Button, {ButtonGroup} from '@atlaskit/button';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';
import TextField from '@atlaskit/textfield';
import TextArea from '@atlaskit/textarea';
import {Checkbox} from '@atlaskit/checkbox';

import {ConditionPicker} from './ConditionPicker';

import {ListenerType, ConditionInputType} from './types';

import {ListenerMessages} from '../i18n/listener.i18n';
import {CommonMessages, DialogMessages, FieldMessages} from '../i18n/common.i18n';

import {RouterLink, FormField, CheckedEditorField, ErrorMessage} from '../common/ak';

import {listenerService} from '../service';
import {Bindings, ReturnTypes} from '../common/bindings';
import {addItem, updateItem} from '../common/redux';
import {DialogComponentProps} from '../common/script-list/types';
import {BindingType} from '../common/editor';
import {extractShortClassName} from '../common/classNames';
import {withRoot} from '../common/script-list';
import {ScrollToTop} from '../common/ScrollToTop';
import {ErrorDataType, ErrorType} from '../common/types';


//AbstractProjectEvent
//ProjectCategoryChangeEvent
//AbstractVersionEvent
//AbstractProjectComponentEvent
//DirectoryEvent
//AbstractCustomFieldEvent
//AbstractWorklogEvent
//IndexEvent
//AbstractRemoteIssueLinkEvent
//IssueWatcherAddedEvent
//IssueWatcherDeletedEvent

const issueEventBindings = [Bindings.issueEvent];
const returnTypes = [ReturnTypes.void];

type Form = {
    name: string,
    description: string,
    comment: string,
    scriptBody: string,
    condition: ConditionInputType,
    alwaysTrack: boolean
};

type FormFieldKey = keyof Form;

const defaultValues: Form = {
    name: '',
    description: '',
    comment: '',
    scriptBody: '',
    condition: {
        type: null,
        typeIds: [],
        projectIds: [],
        className: null,
        pluginKey: null
    },
    alwaysTrack: false
};

type Props = DialogComponentProps & RouteComponentProps & {
    addItem: typeof addItem,
    updateItem: typeof updateItem
};

type State = {
    ready: boolean,
    waiting: boolean,
    isModified: boolean,
    values: Form,
    listener: ListenerType | null,
    error: ErrorDataType | null | undefined
};

class ListenerFormInternal extends React.PureComponent<Props, State> {
    state: State = {
        ready: false,
        waiting: false,
        isModified: false,
        values: {...defaultValues},
        listener: null,
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
                waiting: false,
                ready: false,
                values: {...defaultValues}
            });

            listenerService
                .getListener(id)
                .then((listener: ListenerType) => {
                    this.setState({
                        values: {
                            ...defaultValues,
                            name: listener.name,
                            description: listener.description || '',
                            scriptBody: listener.scriptBody,
                            //$FlowFixMe todo
                            condition: listener.condition,
                            alwaysTrack: listener.alwaysTrack
                        },
                        listener: listener,
                        ready: true,
                        isModified: false
                    });
                });
        } else {
            this.setState({
                ready: true,
                isModified: false,
                values: {...defaultValues},
                listener: null
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
        const {isNew, id, addItem, updateItem, history} = this.props;
        const data = this.state.values;

        this.setState({waiting: true});

        if (!isNew && id) {
            listenerService
                .updateListener(id, data)
                .then(
                    (listener: ListenerType) => {
                        history.push('/listeners/', {focus: listener.id});
                        updateItem(listener);
                    },
                    this._handleError
                );
        } else {
            listenerService
                .createListener(data)
                .then(
                    (listener: ListenerType) => {
                        history.push('/listeners/', {focus: listener.id});
                        addItem(listener);
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

    _setTextValue = (field: FormFieldKey) => (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => this.mutateValue(field, event.currentTarget.value);

    _setObjectValue = (field: FormFieldKey) => (value: any) => this.mutateValue(field, value);

    _setCheckboxValue = (field: FormFieldKey) => (event: SyntheticEvent<HTMLInputElement>) => this.mutateValue(field, event.currentTarget.checked);

    render() {
        const {isNew} = this.props;
        const {ready, waiting, isModified, values, listener, error} = this.state;

        let body: ReactNode = null;

        if (!ready) {
            body = <div>{DialogMessages.notReady}</div>;
        } else {
            let errorMessage: any = null;
            let errorField: string | null | undefined = null;

            if (error) {
                if (error.field === 'scriptBody' && Array.isArray(error.error)) {
                    const errors = error.error.filter(e => e);
                    errorMessage = errors
                        .map(error => error.message)
                        .map(error => <p key={error}>{error}</p>);
                } else {
                    errorMessage = error.message;
                }
                errorField = error.field;
            }

            let bindings: Array<BindingType> | null = null;

            const condition = values.condition || {};
            if (condition && condition.type) {
                if (condition.type === 'ISSUE') {
                    bindings = issueEventBindings;
                } else {
                    const className = condition.className;
                    if (className) {
                        const extractedName = extractShortClassName(className);
                        if (extractedName) {
                            bindings = [{
                                ...Bindings.event,
                                className: extractedName,
                                fullClassName: className
                            }];
                        }
                    }
                }
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
                        name="options"
                        label={FieldMessages.options}
                    >
                        {({isDisabled}) =>
                            <Checkbox
                                isDisabled={isDisabled}
                                label="Track successful executions"
                                isChecked={values.alwaysTrack}
                                onChange={this._setCheckboxValue('alwaysTrack')}
                            />
                        }
                    </FormField>

                    <ConditionPicker
                        value={condition}
                        onChange={this._setObjectValue('condition')}

                        error={error}
                        isDisabled={waiting}
                    />

                    <FormField
                        name="scriptCode"
                        label={FieldMessages.scriptCode}
                        isRequired={true}

                        isDisabled={waiting}
                        isInvalid={errorField === 'scriptBody'}
                        invalidMessage={errorField === 'scriptBody' ? errorMessage : null}
                    >
                        {props =>
                            <CheckedEditorField
                                {...props}

                                resizable={true}

                                scriptType="LISTENER"
                                typeParams={{
                                    className: (condition.type === 'ISSUE' ? 'com.atlassian.jira.event.issue.IssueEvent' : condition.className || undefined)
                                }}

                                bindings={bindings || undefined}
                                returnTypes={returnTypes}

                                value={values.scriptBody || ''}
                                onChange={this._setObjectValue('scriptBody')}
                            />
                        }
                    </FormField>
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
                                href="/listeners/"
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
                                    key="fields"
                                    text="Listeners"
                                    href="/listeners"
                                    component={RouterLink}
                                />,
                                !isNew && listener
                                    ? (
                                        <BreadcrumbsItem
                                            key="script"
                                            text={listener.name}
                                            href={`/listeners/${listener.id}/view`}
                                            component={RouterLink}
                                        />
                                    )
                                    : null
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {isNew
                        ? ListenerMessages.addListener
                        : `${ListenerMessages.editListener}: ${listener ? listener.name : ''}`
                    }
                </PageHeader>
                <ScrollToTop/>
                <Prompt when={isModified && !waiting} message="Are you sure you want to leave?"/>

                {body}
            </Page>
        );
    }
}

export const ListenerForm = withRouter(
    connect(
        null,
        { addItem, updateItem }
    )(ListenerFormInternal)
);
