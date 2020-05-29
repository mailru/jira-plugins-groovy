import React, {Fragment, ReactNode, ComponentType, SyntheticEvent} from 'react';

import {Prompt, RouteComponentProps} from 'react-router-dom';

import Button, {ButtonGroup} from '@atlaskit/button';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import TextField from '@atlaskit/textfield';
import TextArea from '@atlaskit/textarea';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {DialogComponentProps, ScriptForm as ScriptFormType} from './types';
import {withRoot} from './breadcrumbs';

import {RouterLink, FormField, CheckedEditorField, LoadingSpinner, ErrorMessage, StaticCheckScriptType} from '../ak';

import {ScrollToTop} from '../ScrollToTop';
import {addItem, updateItem, ItemType} from '../redux';
import {Bindings} from '../bindings';
import {CommonMessages, FieldMessages} from '../../i18n/common.i18n';

import {BindingType, ReturnType} from '../editor';

import './ScriptForm.less';
import {ErrorDataType} from '../types';


export type SubmitResult = {
    success: true,
    item: ItemType
} | {
    success: false,
    error: ErrorDataType
};

type ValuesType<T extends ScriptFormType> = T;
type DataType = {[key in string]: any};
type ScriptFormField<T extends ScriptFormType> = keyof T;

export type ProvidedState<T extends ScriptFormType> = {
    values: ValuesType<T>,
    name: string | null
};

export type AdditionalFieldProps<T extends ScriptFormType> = {
    values: ValuesType<T>,
    mutateValue: (field: keyof T, value: any) => void
};

type AdditionalField<T extends ScriptFormType> = {
    key: string,
    component: ComponentType<AdditionalFieldProps<T>>
};

type Props<T extends ScriptFormType> = DialogComponentProps & RouteComponentProps & {
    defaultLoader: () => ProvidedState<T>,
    editLoader: (id: number) => Promise<ProvidedState<T>>,
    onSubmit: (id: number | null, data: DataType) => Promise<SubmitResult>,
    addItem: typeof addItem,
    updateItem: typeof updateItem,
    i18n: {
        editTitle: string,
        createTitle: string,
        parentName: string,
    },
    valuesTransformer: (values: ValuesType<T>) => DataType,
    additionalFields: ReadonlyArray<AdditionalField<T>>,
    returnTo: string,
    bindings: ReadonlyArray<BindingType> | null,
    returnTypes?: ReadonlyArray<ReturnType>,
    scriptType: StaticCheckScriptType
};

type State<T extends ScriptFormType> = {
    values: ValuesType<T>,
    isLoadingState: boolean,
    isSubmitting: boolean,
    isModified: boolean,
    error: ErrorDataType | null,
    name: string | null,
};

export class ScriptForm<T extends ScriptFormType> extends React.PureComponent<Props<T>, State<T>> {
    static defaultProps = {
        valuesTransformer: (values: ValuesType<any>) => values,
        additionalFields: [],
        isChecked: false,
        bindings: [ Bindings.currentUser ]
    };

    constructor(props: Props<T>) {
        super(props);

        const defaultState = props.defaultLoader();

        this.state = {
            ...defaultState,
            isLoadingState: true,
            isSubmitting: false,
            isModified: false,
            error: null,
            name: null
        };
    }

    mutateValue = (field: ScriptFormField<T>, value: any) => {
        this.setState( state => ({
            values: {
                ...state.values,
                [field]: value
            },
            isModified: true
        }));
    };

    _setTextValue = (field: ScriptFormField<T>) => (event: SyntheticEvent<HTMLInputElement|HTMLTextAreaElement>) =>
        this.mutateValue(field, event.currentTarget.value);

    _setObjectValue = (field: ScriptFormField<T>) => (value: any) =>
        this.mutateValue(field, value);

    _init = () => {
        const {id, isNew, defaultLoader, editLoader} = this.props;

        this.setState({ isLoadingState: true });

        const promise = (!isNew && id) ? editLoader(id) : Promise.resolve(defaultLoader());

        promise
            .then(({values, name}) =>
                this.setState({
                    values, name,
                    isLoadingState: false,
                    isSubmitting: false,
                    isModified: false,
                    error: null
                })
            );
    };

    _onSubmit = () => {
        const {id, isNew, history, onSubmit, valuesTransformer, addItem, updateItem, returnTo} = this.props;
        const {values} = this.state;

        this.setState({ isSubmitting: true });

        onSubmit(id, valuesTransformer(values))
            .then(
                (result: SubmitResult) => {
                    if (result.success) {
                        if (isNew) {
                            addItem(result.item);
                        } else {
                            updateItem(result.item);
                        }
                        history.push(returnTo, {focus: result.item.id});
                    } else {
                        this.setState({
                            isSubmitting: false,
                            error: result.error
                        });
                    }
                }
            );
    };

    componentDidMount() {
        this._init();
    }

    componentDidUpdate(prevProps: Props<T>) {
        if (prevProps.isNew !== this.props.isNew && prevProps.id !== this.props.id) {
            this._init();
        }
    }

    render() {
        const {i18n, isNew, id, additionalFields, bindings, returnTypes, scriptType, returnTo} = this.props;
        const {values, isModified, isLoadingState, isSubmitting, error, name} = this.state;

        let content: ReactNode = null;

        if (isLoadingState) {
            content = <LoadingSpinner/>;
        } else {
            let errorMessage: ReactNode = null;
            let errorField: string | null | undefined = null;

            if (error) {
                if (error.field === 'scriptBody' && Array.isArray(error.error)) {
                    const errors = error.error.filter(e => e);
                    errorMessage = errors
                        .map(error => error.message)
                        .map(error => <p key={error}>{error}</p>);
                } else if (error.messages) {
                    errorMessage = error.messages.join('; ');
                }
                errorField = error.field;
            }

            content = (
                <div className="flex-column">
                    {error && !errorField && errorMessage && <ErrorMessage title={errorMessage}/>}

                    <FormField
                        name="name"
                        label={FieldMessages.name}
                        isRequired={true}

                        isDisabled={isSubmitting}

                        isInvalid={errorField === 'name'}
                        invalidMessage={errorMessage || ''}
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

                        isDisabled={isSubmitting}

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
                        name="scriptCode"
                        label={FieldMessages.scriptCode}
                        isRequired={true}

                        isDisabled={isSubmitting}

                        isInvalid={errorField === 'scriptBody'}
                        invalidMessage={errorMessage || ''}
                    >
                        {props =>
                            <CheckedEditorField
                                {...props}

                                resizable={true}

                                scriptType={scriptType}

                                bindings={bindings}
                                returnTypes={returnTypes}

                                value={values.scriptBody || ''}
                                onChange={this._setObjectValue('scriptBody')}
                            />
                        }
                    </FormField>

                    {additionalFields.map(field =>
                        <Fragment key={field.key}>
                            <field.component
                                values={values}
                                mutateValue={this.mutateValue}
                            />
                        </Fragment>
                    )}

                    <FormField
                        name="comment"
                        label={FieldMessages.comment}
                        isRequired={!isNew}

                        isDisabled={isSubmitting}

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
                                    key="registry"
                                    text={i18n.parentName}
                                    href={returnTo}
                                    component={RouterLink}
                                />,
                                name && id
                                    ? (
                                        <BreadcrumbsItem
                                            key="script"
                                            text={name}
                                            href={`${returnTo}${id}/view`}
                                            component={RouterLink}
                                        />
                                    )
                                    : null
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {isNew ? i18n.createTitle : `${i18n.editTitle}: ${name || ''}`}
                </PageHeader>
                <ScrollToTop/>
                <Prompt when={isModified && !isSubmitting} message="Are you sure you want to leave?"/>
                <div className="flex-column">
                    {content}
                    <div className="formButtons">
                        <ButtonGroup>
                            <Button
                                appearance="primary"

                                isDisabled={isSubmitting || isLoadingState}
                                isLoading={isSubmitting}

                                onClick={this._onSubmit}
                            >
                                {isNew ? CommonMessages.create : CommonMessages.update}
                            </Button>
                            <Button
                                appearance="link"
                                isDisabled={isSubmitting || isLoadingState}

                                component={RouterLink}
                                href={returnTo}
                            >
                                {CommonMessages.cancel}
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>
            </Page>
        );
    }
}
