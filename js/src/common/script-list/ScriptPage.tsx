import React, {ComponentType, ReactElement, SyntheticEvent} from 'react';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs from '@atlaskit/breadcrumbs';
import TextField from '@atlaskit/textfield';

import {ScriptList} from './ScriptList';

import {withRoot} from './breadcrumbs';
import {ConnectedDeleteDialog} from './DeleteDialog';

import {ScriptComponentProps, I18nType} from './types';
import {DeleteDialogProps} from './DeleteDialog';

import {updateFilter} from '../redux';
import {ItemType} from '../redux';


type Props<T> = {
    i18n: I18nType,
    isReady: boolean,
    filter: string,
    items: Array<T>,
    updateFilter: typeof updateFilter,

    ScriptComponent: ComponentType<ScriptComponentProps<T>>,

    actions?: ReactElement,
};

type State = {
    deleteProps: DeleteDialogProps | null
};

export class ScriptPage<T extends ItemType> extends React.PureComponent<Props<T>, State> {
    state: State = {
        deleteProps: null
    };

    _updateFilter = (e: SyntheticEvent<HTMLInputElement>) => this.props.updateFilter(e.currentTarget.value);

    _triggerDelete = (id: number, name: string, onConfirm: () => Promise<void>) => this.setState({ deleteProps: {id, name, onConfirm} });

    _closeDelete = () => this.setState({ deleteProps: null });

    render() {
        const {isReady, filter, items, i18n, ScriptComponent, actions} = this.props;
        const {deleteProps} = this.state;

        return (
            <Page>
                <PageHeader
                    actions={actions}
                    breadcrumbs={<Breadcrumbs>{withRoot([])}</Breadcrumbs>}
                    bottomBar={
                        <TextField
                            isCompact={true}
                            placeholder="Filter"
                            value={filter}
                            onChange={this._updateFilter}
                        />
                    }
                >
                    {i18n.title}
                </PageHeader>

                <div className="page-content">
                    <ScriptList
                        isReady={isReady}
                        items={items}

                        i18n={i18n}
                        ScriptComponent={ScriptComponent}
                        onDelete={this._triggerDelete}
                    />
                </div>

                {deleteProps && <ConnectedDeleteDialog {...deleteProps} i18n={i18n.delete} onClose={this._closeDelete}/>}
            </Page>
        );
    }
}
