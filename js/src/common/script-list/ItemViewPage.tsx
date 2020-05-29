import React, {ComponentType} from 'react';

import {withRouter, RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';

import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';

import {withRoot} from './breadcrumbs';
import {ConnectedDeleteDialog} from './DeleteDialog';
import {NotFoundPage} from './NotFoundPage';

import {ScriptComponentProps} from './types';

import {RouterLink} from '../ak';
import {createItemSelector} from '../redux';
import {CommonMessages} from '../../i18n/common.i18n';

import {NamedItemType} from '../redux';


type PublicProps<T extends NamedItemType> = {
    id: number,

    ScriptComponent: ComponentType<ScriptComponentProps<T>>,
    deleteCallback: (id: number) => Promise<void>,
    i18n: {
        deleteDialogTitle: string,
        parentName: string
    },
    parentLocation: string
};

type Props<T extends NamedItemType> = PublicProps<T> & RouteComponentProps & {
    script?: T
};

type State = {
    isDeleting: boolean
};

class ItemViewPageInternal<T extends NamedItemType> extends React.PureComponent<Props<T>, State> {
    state: State = {
        isDeleting: false
    };

    _toggleDelete = () => this.setState(state => ({ isDeleting: !state.isDeleting }));

    _doDelete = () => this.props
        .deleteCallback(this.props.id)
        .then(() => this.props.history.push(this.props.parentLocation));

    render() {
        const {script, ScriptComponent, parentLocation, i18n} = this.props;
        const {isDeleting} = this.state;

        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="parent"
                                    text={i18n.parentName}
                                    href={parentLocation}

                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {script ? script.name : 'Unknown script'}
                </PageHeader>
                {script
                    ? <ScriptComponent script={script} collapsible={false} onDelete={this._toggleDelete}/>
                    : <NotFoundPage/>
                }
                {isDeleting && script &&
                    <ConnectedDeleteDialog
                        id={script.id}
                        name={script.name}

                        closeAfterDelete={false}
                        onConfirm={this._doDelete}
                        onClose={this._toggleDelete}

                        i18n={{
                            heading: i18n.deleteDialogTitle,
                            areYouSure: CommonMessages.confirmDelete
                        }}
                    />
                }
            </Page>
        );
    }
}

const itemSelector = createItemSelector();

export const ItemViewPage: ComponentType<PublicProps<NamedItemType>> = withRouter(
    connect(
        createStructuredSelector({
            script: itemSelector
        })
    )(ItemViewPageInternal)
);
