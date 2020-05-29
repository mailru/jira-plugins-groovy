import React, {ReactNode} from 'react';

import {connect} from 'react-redux';
import {withRouter, Prompt, RouteComponentProps} from 'react-router-dom';

import Button, {ButtonGroup} from '@atlaskit/button';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';
import TextField from '@atlaskit/textfield';
import TextArea from '@atlaskit/textarea';
import {colors} from '@atlaskit/theme';

import WarningIcon from '@atlaskit/icon/glyph/warning';

import {RestScriptType} from './types';

import {RestMessages} from '../i18n/rest.i18n';
import {CommonMessages, DialogMessages, FieldMessages} from '../i18n/common.i18n';

import {MultiSelect, AsyncPicker, CheckedEditorField, FormField, ErrorMessage, RouterLink} from '../common/ak';
import {ScrollToTop} from '../common/ScrollToTop';
import {withRoot} from '../common/script-list';

import {restService, getPluginBaseUrl} from '../service';
import {Bindings} from '../common/bindings';
import {RegistryMessages} from '../i18n/registry.i18n';
import {addItem, updateItem} from '../common/redux';
import {DialogComponentProps} from '../common/script-list/types';
import {ErrorDataType, ErrorType, HttpMethod} from '../common/types';
import {OldSelectItem, SingleValueType} from '../common/ak/types';
import {InputEvent} from '../common/EventTypes';


const returnTypes = [
    {
        label: 'custom', //todo: i18n
        className: 'Response',
        fullClassName: 'javax.ws.rs.core.Response',
        javaDoc: 'https://docs.oracle.com/javaee/7/api/javax/ws/rs/core/Response.html',
        optional: true
    },
    {
        label: 'No content (204)', //todo: i18n
        className: 'null',
        fullClassName: 'null'
    }
];

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'].map(
    (method: HttpMethod): OldSelectItem<string> => {
        return {
            label: method,
            value: method
        };
    }
);

const bindings = [ Bindings.method, Bindings.headers, Bindings.uriInfo, Bindings.body, Bindings.currentUser ];

type Form = {
    name: string,
    description: string,
    comment: string,
    scriptBody: string,
    methods: ReadonlyArray<HttpMethod>,
    groups: ReadonlyArray<SingleValueType>
};

type FormFieldKey = keyof Form;

const defaultForm = {
    name: '',
    description: '',
    comment: '',
    scriptBody: '',
    methods: [],
    groups: []
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
    error: ErrorDataType | null | undefined,
    script: RestScriptType | null
};

export class RestFormInternal extends React.Component<Props, State> {
    state: State = {
        ready: false,
        waiting: false,
        isModified: false,
        values: {...defaultForm},
        error: null,
        script: null
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
                isModified: false,
                values: {...defaultForm},
                error: null
            });

            restService
                .getScript(id)
                .then((script: RestScriptType) => {
                    this.setState({
                        values: {
                            ...defaultForm,
                            name: script.name,
                            methods: script.methods,
                            scriptBody: script.scriptBody,
                            groups: script.groups.map((group: string): SingleValueType => {
                                return {
                                    label: group,
                                    value: group
                                };
                            }),
                            description: script.description || '',
                            comment: ''
                        },
                        ready: true,
                        isModified: false,
                        script
                    });
                });
        } else {
            this.setState({
                ready: true,
                isModified: false,
                values: {
                    ...defaultForm,
                    name: '',
                    methods: [],
                    groups: [],
                    scriptBody: ''
                },
                error: null,
                script: null
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
        const {isNew, id, history} = this.props;

        this.setState({ waiting: true });

        const {groups, ...data} = this.state.values;
        (data as any).groups = groups ? groups.map(group => group.value) : [];

        if (!isNew && id) {
            restService
                .updateScript(id, data)
                .then(
                    (script: RestScriptType) => {
                        history.push('/rest/', {focus: script.id});
                        this.props.updateItem(script);
                    },
                    this._handleError
                );
        } else {
            restService
                .createScript(data)
                .then(
                    (script: RestScriptType) => {
                        history.push('/rest/', {focus: script.id});
                        this.props.addItem(script);
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

    render() {
        const {isNew} = this.props;
        const {ready, waiting, isModified, values, script, error} = this.state;

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

                        helperText={RestMessages.nameDescription}
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

                    <MultiSelect
                        name="methods"
                        label={FieldMessages.httpMethods}
                        isRequired={true}
                        isDisabled={waiting}

                        isInvalid={errorField === 'methods'}
                        invalidMessage={errorField === 'methods' ? <div className="error">{errorMessage}</div> : ''}

                        items={httpMethods}
                        value={values.methods}
                        onChange={this._setObjectValue('methods')}
                    />
                    <AsyncPicker
                        name="groups"
                        label={FieldMessages.groups}
                        isMulti={true}
                        isDisabled={waiting}

                        src={`${getPluginBaseUrl()}/jira-api/groupPicker`}

                        value={values.groups}
                        onChange={this._setObjectValue('groups')}

                        isInvalid={errorField === 'groups'}
                        invalidMessage={errorField === 'groups' ? errorMessage : ''}
                    />
                    {(values.groups.length === 0)
                        ? (
                            <div className="ak-description">
                                <WarningIcon size="small" label="" primaryColor={colors.Y300}/>
                                {' '}
                                {RestMessages.noGroups}
                            </div>
                        )
                        : null
                    }
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
                                scriptType="REST"

                                bindings={bindings}
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
                                href="/rest/"
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
                                    text="REST scripts"
                                    href="/rest"
                                    component={RouterLink}
                                />,
                                !isNew && script
                                    ? (
                                        <BreadcrumbsItem
                                            key="script"
                                            text={script.name}
                                            href={`/rest/${script.id}/view`}
                                            component={RouterLink}
                                        />
                                    )
                                    : null
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {isNew
                        ? RegistryMessages.addScript
                        : `${RegistryMessages.editScript}: ${script ? script.name : ''}`
                    }
                </PageHeader>
                <ScrollToTop/>
                <Prompt when={isModified && !waiting} message="Are you sure you want to leave?"/>
                {body}
            </Page>
        );
    }
}

export const RestForm = withRouter(
    connect(
        null,
        { addItem, updateItem }
    )(RestFormInternal)
);

