import React from 'react';

import {withRouter, RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {addScript, updateScript, deleteScript, scriptWithParentSelectorFactory} from './redux';
import {RegistryScriptType} from './types';
import {RegistryScript} from './RegistryScript';

import {RouterLink} from '../common/ak';
import {RegistryMessages} from '../i18n/registry.i18n';
import {CommonMessages} from '../i18n/common.i18n';
import {registryService} from '../service';
import {withRoot, DeleteDialog, NotFoundPage} from '../common/script-list';


type Props = RouteComponentProps & {
    id: number,
    script?: RegistryScriptType,
    deleteScript: typeof deleteScript
};

type State = {
    isDeleting: boolean
};

class ViewScriptInternal extends React.PureComponent<Props, State> {
    state: State = {
        isDeleting: false
    };

    _toggleDelete = () => this.setState(state => ({ isDeleting: !state.isDeleting }));

    _doDelete = () => registryService
        .deleteScript(this.props.id)
        .then(() => this.props.history.push('/registry/'));

    render() {
        const {script} = this.props;
        const {isDeleting} = this.state;

        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="registry"
                                    text="Workflow script registry"
                                    href="/registry/"
                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {script ? script.name : 'Unknown script'}
                </PageHeader>
                {script
                    ? <RegistryScript script={script} collapsible={false} onDelete={this._toggleDelete} showParent={true}/>
                    : <NotFoundPage/>
                }
                {isDeleting && script &&
                    <DeleteDialog
                        id={script.id}
                        name={script.name}

                        deleteItem={this.props.deleteScript}
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

export const ViewScript = withRouter(
    connect(
        () => {
            const scriptSelector = scriptWithParentSelectorFactory();
            return createStructuredSelector({
                script: scriptSelector
            });
        },
        { addScript, updateScript, deleteScript }
    )(ViewScriptInternal)
);
