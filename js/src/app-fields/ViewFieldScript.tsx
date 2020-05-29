import React from 'react';

import {withRouter, RouteComponentProps} from 'react-router-dom';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';

import Breadcrumbs, {BreadcrumbsItem} from '@atlaskit/breadcrumbs';
import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';

import {FieldScript} from './FieldScript';
import {FieldConfigItem} from './types';

import {withRoot, NotFoundPage} from '../common/script-list';

import {createItemSelector} from '../common/redux';
import {RouterLink} from '../common/ak';


type Props = RouteComponentProps & {
    id: number,
    script?: FieldConfigItem
};

class ViewFieldScriptInternal extends React.PureComponent<Props> {
    render() {
        const {script: fieldConfig} = this.props;

        return (
            <Page>
                <PageHeader
                    breadcrumbs={
                        <Breadcrumbs>
                            {withRoot([
                                <BreadcrumbsItem
                                    key="registry"
                                    text="Scripted fields"
                                    href="/fields/"
                                    component={RouterLink}
                                />
                            ])}
                        </Breadcrumbs>
                    }
                >
                    {fieldConfig ? `${fieldConfig.customFieldName} - ${fieldConfig.contextName}` : 'Unknown script'}
                </PageHeader>
                {fieldConfig
                    ? <FieldScript script={fieldConfig} collapsible={false}/>
                    : <NotFoundPage/>
                }
            </Page>
        );
    }
}

export const ViewFieldScript = withRouter(
    connect(
        () => {
            createStructuredSelector({
                script: createItemSelector()
            });
        }
    )(ViewFieldScriptInternal)
);
