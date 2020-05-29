import {ReactElement} from 'react';

import {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {DeleteI18n} from './DeleteDialog';


export type DeleteCallbackType = (id: number, name: string, onConfirm: () => Promise<void>) => void;

export type BasicScriptComponentProps<T> = {
    script: T,
    focused?: boolean,
    collapsible?: boolean
};

export type ScriptComponentProps<T> = BasicScriptComponentProps<T> & {
    onDelete?: DeleteCallbackType
};

export type DialogComponentProps = {
    isNew: boolean,
    id: number | null,
    isChecked?: boolean
};

export type I18nType = {
    title: string,
    addItem: string,
    noItems: string,
    delete: DeleteI18n
};

export type ScriptForm = {
    name: string,
    description: string,
    scriptBody: string,
    comment: string
};

export type BreadcrumbsType = Array<ReactElement<typeof BreadcrumbsItem> | null>;
