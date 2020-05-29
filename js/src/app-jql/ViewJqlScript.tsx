import React from 'react';

import {withRouter, RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {JqlScript} from './JqlScript';
import {JqlScriptType} from './types';

import { createItemSelector, deleteItem } from '../common/redux';

import {RouterLink} from '../common/ak';
import {RegistryMessages} from '../i18n/registry.i18n';
import {CommonMessages} from '../i18n/common.i18n';
import {jqlScriptService} from '../service';
import {withRoot, DeleteDialog, NotFoundPage} from '../common/script-list';


type Props = RouteComponentProps & {
    id: number,
    script?: JqlScriptType,
    deleteItem: typeof deleteItem
};

type State = {
    isDeleting: boolean
};

class ViewJqlScriptInternal extends React.PureComponent<Props, State> {
    state: State = {
        isDeleting: false
    };

    _toggleDelete = () => this.setState(state => ({ isDeleting: !state.isDeleting }));

    _doDelete = () => jqlScriptService
        .deleteScript(this.props.id)
        .then(() => this.props.history.push('/jql/'));

    render() {
        const {script, deleteItem} = this.props;
        const {isDeleting} = this.state;

        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="registry"
                                    text="JQL scripts"
                                    href="/jql/"

                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {script ? script.name : 'Unknown script'}
                </PageHeader>
                {script
                    ? <JqlScript script={script} collapsible={false} onDelete={this._toggleDelete}/>
                    : <NotFoundPage/>
                }
                {isDeleting && script &&
                    <DeleteDialog
                        id={script.id}
                        name={script.name}

                        deleteItem={deleteItem}
                        onConfirm={this._doDelete}
                        onClose={this._toggleDelete}

                        i18n={{
                            heading: RegistryMessages.deleteScript,
                            areYouSure: CommonMessages.confirmDelete
                        }}
                    />
                }
            </Page>
        );
    }
}

export const ViewJqlScript = withRouter(
    connect(
        () => {
            createStructuredSelector({
                script: createItemSelector()
            });
        },
        { deleteItem }
    )(ViewJqlScriptInternal)
);
