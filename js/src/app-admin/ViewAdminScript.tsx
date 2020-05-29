import React from 'react';

import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';
import {RouteComponentProps, withRouter} from 'react-router-dom';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {AdminScript} from './AdminScript';
import {AdminScriptType} from './types';

import {RouterLink} from '../common/ak';
import {RegistryMessages} from '../i18n/registry.i18n';
import {CommonMessages} from '../i18n/common.i18n';
import {adminScriptService} from '../service';
import {DeleteDialog, NotFoundPage, withRoot} from '../common/script-list';
import {createItemSelector, deleteItem} from '../common/redux';


type Props = RouteComponentProps & {
    id: number,
    script?: AdminScriptType,
    deleteItem: typeof deleteItem
};

type State = {
    isDeleting: boolean
};

class ViewAdminScriptInternal extends React.PureComponent<Props, State> {
    state: State = {
        isDeleting: false
    };

    _toggleDelete = () => this.setState(state => ({ isDeleting: !state.isDeleting }));

    _doDelete = () => adminScriptService
        .deleteScript(this.props.id)
        .then(() => this.props.history.push('/admin-scripts/'));

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
                                    text="Admin scripts"
                                    href="/admin-scripts/"

                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {script ? script.name : 'Unknown script'}
                </PageHeader>
                {script
                    ? <AdminScript script={script} collapsible={false} onDelete={this._toggleDelete}/>
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

export const ViewAdminScript = withRouter(
    connect(
        () => {
            createStructuredSelector({
                script: createItemSelector()
            });
        },
        { deleteItem }
    )(ViewAdminScriptInternal)
);
