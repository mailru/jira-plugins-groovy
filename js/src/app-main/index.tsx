import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import {BrowserRouter, Route, Switch} from 'react-router-dom';

// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import AJS from 'AJS';

import {MainApp} from './MainApp';
import {NavigationController} from './NavigationController';

import {getBaseUrl} from '../service';
import {fixStyle} from '../common/fixStyle';

import {ConsoleRoute} from '../app-console';
import {AdminRoute} from '../app-admin';
import {RegistryRoute} from '../app-registry';
import {ListenersRoute} from '../app-listeners';
import {RestRoute} from '../app-rest';
import {FieldsRoute} from '../app-fields';
import {ScheduledRoute} from '../app-scheduled';
import {JqlRoute} from '../app-jql';
import {GlobalObjectRoute} from '../app-go';
import {AuditLogRoute} from '../app-audit';

import {NotFoundPage} from '../common/script-list';

import {EditorThemeContext} from '../common/editor';

import '../flex.less';


AJS.toInit(() => {
    fixStyle();

    const element = document.getElementById('react-content');

    if (element === null) {
        alert('no element');
        return;
    }

    ReactDOM.render(
        <BrowserRouter basename={`${getBaseUrl()}/plugins/servlet/my-groovy`}>
            <EditorThemeContext>
                <Fragment>
                    <Switch>
                        <Route path="/" exact={true} component={MainApp}/>
                        <Route path="/console" component={ConsoleRoute}/>
                        <Route path="/admin-scripts" component={AdminRoute}/>
                        <Route path="/registry" component={RegistryRoute}/>
                        <Route path="/listeners" component={ListenersRoute}/>
                        <Route path="/rest" component={RestRoute}/>
                        <Route path="/fields" component={FieldsRoute}/>
                        <Route path="/scheduled" component={ScheduledRoute}/>
                        <Route path="/jql" component={JqlRoute}/>
                        <Route path="/go" component={GlobalObjectRoute}/>
                        <Route path="/audit" component={AuditLogRoute}/>
                        <Route component={NotFoundPage}/>
                    </Switch>
                    <NavigationController/>
                </Fragment>
            </EditorThemeContext>
        </BrowserRouter>,
        element
    );
});
