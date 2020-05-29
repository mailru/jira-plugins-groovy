import React, {ReactElement} from 'react';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Breadcrumbs from '@atlaskit/breadcrumbs';

import {ScriptConsole} from './ScriptConsole';

import {PageTitleMessages} from '../i18n/common.i18n';
import {withRoot} from '../common/script-list/breadcrumbs';
import {ScrollToTop} from '../common/ScrollToTop';


export function ConsoleRoute(): ReactElement {
    return (
        <Page>
            <PageHeader
                breadcrumbs={<Breadcrumbs>{withRoot([])}</Breadcrumbs>}
            >
                {PageTitleMessages.console}
            </PageHeader>
            <ScrollToTop/>
            <ScriptConsole/>
        </Page>
    );
}
