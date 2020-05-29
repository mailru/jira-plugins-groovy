import React from 'react';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';

import {PageCard} from './PageCard';

import {ScrollToTop} from '../common/ScrollToTop';

import './MainApp.less';


// eslint-disable-next-line react/prefer-stateless-function
export class MainApp extends React.PureComponent<{}> {
    render() {
        return (
            <Page>
                <PageHeader>{'MyGroovy'}</PageHeader>
                <ScrollToTop/>
                <div className="MainApp">
                    <PageCard
                        href="/console"
                        title="Console"
                    />
                    <PageCard
                        href="/admin-scripts"
                        title="Admin scripts"
                    />
                    <PageCard
                        href="/registry"
                        title="Registry"
                    />
                    <PageCard
                        href="/listeners"
                        title="Listeners"
                    />
                    <PageCard
                        href="/rest"
                        title="REST scripts"
                    />
                    <PageCard
                        href="/fields"
                        title="Scripted fields"
                    />
                    <PageCard
                        href="/scheduled"
                        title="Scheduled tasks"
                    />
                    <PageCard
                        href="/jql"
                        title="JQL functions"
                    />
                    <PageCard
                        href="/go"
                        title="Global objects"
                    />
                    <PageCard
                        href="/audit"
                        title="Audit log"
                    />
                </div>
            </Page>
        );
    }
}
