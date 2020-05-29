import {ReactNode, SyntheticEvent} from 'react';

import {ChangelogType} from './script/types';


export const entityTypes = [
    'REGISTRY_SCRIPT', 'REGISTRY_DIRECTORY', 'LISTENER', 'REST', 'CUSTOM_FIELD', 'SCHEDULED_TASK', 'ADMIN_SCRIPT', 'JQL_FUNCTION', 'GLOBAL_OBJECT'
] as const;

export type EntityType = 'REGISTRY_SCRIPT' | 'REGISTRY_DIRECTORY' | 'LISTENER' | 'REST' | 'CUSTOM_FIELD' | 'SCHEDULED_TASK' | 'ADMIN_SCRIPT' | 'JQL_FUNCTION' | 'GLOBAL_OBJECT';

export const entityActions = ['CREATED', 'UPDATED', 'DELETED', 'RESTORED', 'ENABLED', 'DISABLED', 'MOVED'] as const;

export type EntityAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'RESTORED' | 'ENABLED' | 'DISABLED' | 'MOVED';


export type IssueEventType = {
    id: number,
    name: string
};

export type ProjectType = any; //todo

export type ScriptEntityWithoutChangelogs = {
    id: number,
    name: string,
    description: string | null | undefined,
    errorCount?: number,
    warningCount?: number,
    scriptBody: string
};

export type ScriptEntity = ScriptEntityWithoutChangelogs & {
    changelogs: Array<ChangelogType>,
};

export type SelectProps = {
    isMulti?: boolean,
    isClearable?: boolean,
    delimiter?: string
};

export type AkFormFieldProps = {
    isValidationHidden: boolean
};

export type FieldProps = {
    label?: string,
    isLabelHidden?: boolean,

    isInvalid?: boolean,
    invalidMessage?: ReactNode,

    isRequired?: boolean,
    isDisabled?: boolean,

    shouldFitContainer?: boolean
};

export type LoadableFieldProps = {
    isLoading?: boolean
};

export type MutableFieldProps<T> = {
    value: T | null,
    onChange: (value: T | null) => void
};

export type OptMutableFieldProps<T> = {
    value?: T | null,
    onChange?: (value: T | null) => void
};

export type FormFieldProps = {
    name: string
};

export type MutableTextFieldProps<T, FieldType> = {
    value: T,
    onChange: (event: SyntheticEvent<FieldType>) => void
};

export type ScriptError = {
    message: string
};

export type SyntaxError = ScriptError & {
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number,
    type: 'warning' | 'error'
};

export type ObjectMap = {[key in string]: string};

export type VoidCallback = () => void;

export type ErrorDataType = {
    error?: ReadonlyArray<string | {message: string}> | null,
    errorMessages?: ReadonlyArray<string>,
    messages?: ReadonlyArray<{message: string}> | null,
    message?: string | null,
    field?: string | null
};

export type ErrorType = {
    response: Omit<JQueryXHR, 'data'> & {
        data?: ErrorDataType
    },
    message: string
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type I18nFunction = (...params: Array<string>) => string;
//export type I18nMessageType = I18nFunction | string;
export type I18nMessages = {[key in string]: string};

export type Page<T> = {
    offset: number,
    limit: number,
    total: number,
    size: number,
    isLast: boolean,
    values: ReadonlyArray<T>
};
