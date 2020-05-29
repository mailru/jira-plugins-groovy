import React, {SyntheticEvent} from 'react';

import {Prompt, withRouter, RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';

import Button, {ButtonGroup} from '@atlaskit/button';
import {Checkbox} from '@atlaskit/checkbox';
import TextArea from '@atlaskit/textarea';
import TextField from '@atlaskit/textfield';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {fieldConfigSelectorFactory} from './selectors';

import {FieldConfig, FieldConfigPreviewResult} from './types';

import {fieldConfigService} from '../service';
import {CommonMessages, ErrorMessages, FieldMessages} from '../i18n/common.i18n';
import {Bindings} from '../common/bindings';
import {
    EditorField,
    CheckedEditorField,
    FormField,
    ErrorMessage,
    InfoMessage,
    RouterLink
} from '../common/ak';
import {ConsoleMessages} from '../i18n/console.i18n';
import {InputEvent} from '../common/EventTypes';
import {extractShortClassName} from '../common/classNames';
import {ScriptFieldMessages} from '../i18n/cf.i18n';
import {updateItem} from '../common/redux';
import {withRoot} from '../common/script-list';
import {ScrollToTop} from '../common/ScrollToTop';
import {ErrorDataType} from '../common/types';


const bindings = [ Bindings.issue ];
const bindingsWithVelocity = [ Bindings.issue, Bindings.velocityParams ];

type Form = {
    description: string | null,
    comment: string,
    scriptBody: string,
    cacheable: boolean,
    template?: string,
    velocityParamsEnabled: boolean
};

type FormFieldType = keyof Form;

const defaultForm: Form = {
    description: '',
    comment: '',
    scriptBody: '',
    template: '',
    cacheable: true,
    velocityParamsEnabled: false
};

type Props = RouteComponentProps & {
    id: number,
    fieldConfig: FieldConfig,
    updateItem: typeof updateItem
};

type State = {
    values: Form,
    waiting: boolean,
    waitingPreview: boolean,
    isModified: boolean,
    previewKey: string | null,
    previewResult: FieldConfigPreviewResult | null,
    error: ErrorDataType | null,
    previewError: ErrorDataType | null
};

export class CustomFieldFormInternal extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const {fieldConfig} = props;

        this.state = {
            values: {
                ...defaultForm,
                scriptBody: fieldConfig.scriptBody,
                description: fieldConfig.description,
                cacheable: fieldConfig.cacheable,
                template: fieldConfig.template || '',
                velocityParamsEnabled: fieldConfig.velocityParamsEnabled,
                comment: ''
            },
            waiting: false,
            waitingPreview: false,
            isModified: false,
            previewKey: '',
            previewResult: null,
            error: null,
            previewError: null
        };
    }

    _onSubmit = () => {
        const {history} = this.props;

        this.setState({ waiting: true });

        fieldConfigService
            .updateFieldConfig(this.props.id, this.state.values)
            .then(
                (data: FieldConfig) => {
                    this.props.updateItem(data);
                    history.push('/fields/', {focus: data.id});
                },
                (error) => {
                    const {response} = error;

                    if (response.status === 400) {
                        this.setState({ error: response.data, waiting: false, previewError: null });
                    } else {
                        this.setState({ waiting: false, error: null, previewError: null });
                        throw error;
                    }
                }
            );
    };

    _preview = () => {
        this.setState({ waitingPreview: true });

        fieldConfigService
            .preview(
                this.props.id,
                {
                    issueKey: this.state.previewKey,
                    configForm: this.state.values
                }
            )
            .then(
                previewResult => this.setState({ previewResult, waitingPreview: false, previewError: null }),
                (error) => {
                    const {response} = error;

                    if (response.status === 400) {
                        this.setState({ previewError: response.data, previewResult: null, waitingPreview: false });
                    } else {
                        this.setState({ waitingPreview: false, previewError: null, previewResult: null });
                        throw error;
                    }
                }
            );
    };

    _mutateValue = (field: FormFieldType, value: any) => {
        this.setState( state => ({
            values: {
                ...state.values,
                [field]: value,
                isModified: true
            }
        }));
    };

    _setObjectValue = (field: FormFieldType) => (value: any) => this._mutateValue(field, value);

    _setTextValue = (field: FormFieldType) => (event: InputEvent) => this._mutateValue(field, event.currentTarget.value);

    _setToggleValue = (field: FormFieldType) => (e: SyntheticEvent<HTMLInputElement>) => {
        this._mutateValue(field, e.currentTarget.checked);
    };

    _setTemplate = this._setObjectValue('template');
    _setScript = this._setObjectValue('scriptBody');

    _setPreviewKey = (e: InputEvent) => this.setState({ previewKey: e.currentTarget.value });

    render() {
        const {fieldConfig} = this.props;
        const {values, error, previewError, waiting, isModified, waitingPreview, previewKey, previewResult} = this.state;

        let errorMessage = null;
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

        const returnTypes = [
            {
                className: extractShortClassName(fieldConfig.expectedType),
                fullClassName: fieldConfig.expectedType,
                optional: true
            }
        ];

        const velocityParamsEnabled = values.velocityParamsEnabled;

        //todo: header actions
        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="fields"
                                    text="Scripted fields"
                                    href="/fields"
                                    component={RouterLink}
                                />,
                                <BreadcrumbsItem
                                    key="script"
                                    text={fieldConfig.name}
                                    href={`/fields/${fieldConfig.id}/view`}
                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {ScriptFieldMessages.scriptFor(`${fieldConfig.customFieldName} - ${fieldConfig.contextName}`)}
                </PageHeader>
                <ScrollToTop/>
                <Prompt when={isModified && !waiting} message="Are you sure you want to leave?"/>

                <div className="flex-column">
                    <FormField
                        name="description"
                        label={FieldMessages.description}

                        isDisabled={waiting}
                        isInvalid={errorField === 'description'}
                        invalidMessage={errorMessage || ''}
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

                        isDisabled={waiting}
                        isInvalid={errorField === 'options'}
                        invalidMessage={errorMessage || ''}
                    >
                        {({isDisabled}) =>
                            <div>
                                <Checkbox
                                    label={FieldMessages.cacheable}

                                    isDisabled={isDisabled}

                                    onChange={this._setToggleValue('cacheable')}
                                    isChecked={values.cacheable}

                                    name="cacheable"
                                    value="true"
                                />
                                {fieldConfig.needsTemplate &&
                                <Checkbox
                                    label="Velocity params"

                                    isDisabled={isDisabled}

                                    onChange={this._setToggleValue('velocityParamsEnabled')}
                                    isChecked={velocityParamsEnabled}

                                    name="velocityParamsEnabled"
                                    value="true"
                                />
                                }
                            </div>
                        }
                    </FormField>
                    <FormField
                        name="scriptCode"
                        label={FieldMessages.scriptCode}
                        isRequired={true}
                        isDisabled={waiting}

                        isInvalid={errorField === 'scriptBody'}
                        invalidMessage={errorMessage || ''}
                    >
                        {props =>
                            <CheckedEditorField
                                {...props}

                                resizable={true}
                                scriptType="CUSTOM_FIELD"
                                typeParams={{velocityParamsEnabled: velocityParamsEnabled ? 'true' : 'false'}}
                                bindings={velocityParamsEnabled ? bindingsWithVelocity : bindings}
                                returnTypes={returnTypes}

                                value={values.scriptBody}
                                onChange={this._setScript}
                            />
                        }
                    </FormField>

                    {fieldConfig.needsTemplate &&
                        <FormField
                            name="template"
                            label={FieldMessages.template}
                            isRequired={true}
                            isDisabled={waiting}

                            isInvalid={errorField === 'template'}
                            invalidMessage={errorMessage || ''}
                        >
                            {props =>
                                <EditorField
                                    {...props}

                                    resizable={true}
                                    mode="velocity"
                                    //todo: bindings={[ Bindings.issue ]}

                                    value={values.template || ''}
                                    onChange={this._setTemplate}
                                />
                            }
                        </FormField>
                    }
                    <FormField
                        name="comment"
                        label={FieldMessages.comment}
                        isRequired={!!fieldConfig.uuid}
                        isDisabled={waiting}

                        isInvalid={errorField === 'comment'}
                        invalidMessage={errorMessage || ''}
                    >
                        {props =>
                            <TextArea
                                {...props}
                                value={values.comment || ''}
                                onChange={this._setTextValue('comment')}
                            />
                        }
                    </FormField>
                    <FormField
                        name="previewIssueKey"
                        label="Preview issue key"
                    >
                        {props =>
                            <TextField
                                {...props}
                                value={previewKey || ''}
                                onChange={this._setPreviewKey}
                            />
                        }
                    </FormField>
                    <div style={{marginTop: '10px'}}>
                        <ButtonGroup>
                            <Button
                                appearance="primary"

                                isDisabled={waiting || waitingPreview}
                                isLoading={waiting}

                                onClick={this._onSubmit}
                            >
                                {CommonMessages.update}
                            </Button>
                            <Button
                                isDisabled={waiting || waitingPreview}
                                isLoading={waitingPreview}

                                onClick={this._preview}
                            >
                                {CommonMessages.preview}
                            </Button>
                            <Button
                                appearance="link"

                                isDisabled={waiting}

                                component={RouterLink}
                                href="/fields/"
                            >
                                {CommonMessages.cancel}
                            </Button>
                        </ButtonGroup>
                    </div>

                    <div className="flex-column" style={{marginTop: '20px'}}>
                        {previewResult &&
                            <InfoMessage title={ConsoleMessages.executedIn(previewResult.time.toString())}>
                                <div dangerouslySetInnerHTML={{__html: previewResult.htmlResult}}/>
                            </InfoMessage>
                        }
                        {previewError && previewError.messages &&
                            <ErrorMessage title={ErrorMessages.errorOccurred}>
                                {previewError.messages.map((e, i) => <div key={i}>{e}</div>)}
                            </ErrorMessage>
                        }
                    </div>
                </div>
            </Page>
        );
    }
}

export const CustomFieldForm = (
    withRouter(
        connect(
            createStructuredSelector({
                fieldConfig: fieldConfigSelectorFactory()
            }),
            {
                updateItem: updateItem
            }
        )(CustomFieldFormInternal)
    )
);
