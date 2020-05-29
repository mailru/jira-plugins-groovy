import React from 'react';

import {combineReducers, createStore} from 'redux';
import {Provider} from 'react-redux';
import {Switch, Route} from 'react-router-dom';

import Button from '@atlaskit/button';

import {RestScript} from './RestScript';
import {RestForm} from './RestForm';

import {CommonMessages, PageTitleMessages} from '../i18n/common.i18n';
import {RestMessages} from '../i18n/rest.i18n';

import {NotFoundPage, ConnectedScriptPage, ItemViewPage, focusOnRender} from '../common/script-list';

import {filterReducer, ItemActionCreators, itemsReducer, readinessReducer, watchesReducer} from '../common/redux';
import {watcherService, restService} from '../service';
import {Loader, RouterLink} from '../common/ak';
import {RegistryMessages} from '../i18n/registry.i18n';


const RestScriptComponent = focusOnRender(RestScript);

export class RestRoute extends React.PureComponent<{}> {
    store = createStore(
        combineReducers({
            items: itemsReducer,
            watches: watchesReducer,
            isReady: readinessReducer,
            filter: filterReducer
        })
    );

    componentDidMount() {
        Promise
            .all([restService.getAllScripts(), watcherService.getAllWatches('LISTENER')])
            .then(([scripts, watches]) => this.store.dispatch(ItemActionCreators.loadItems(scripts, watches)));
    }

    render() {
        return (
            <Provider store={this.store}>
                <Loader>
                    <Switch>
                        <Route path="/rest/" exact={true}>
                            {() =>
                                <ConnectedScriptPage
                                    ScriptComponent={RestScriptComponent}
                                    i18n={{
                                        title: PageTitleMessages.rest,
                                        addItem: RestMessages.addScript,
                                        noItems: RestMessages.noScripts,
                                        delete: {
                                            heading: RestMessages.deleteScript,
                                            areYouSure: CommonMessages.confirmDelete
                                        }
                                    }}
                                    actions={
                                        <Button
                                            appearance="primary"

                                            component={RouterLink}
                                            href="/rest/create"
                                        >
                                            {RegistryMessages.addScript}
                                        </Button>
                                    }
                                />
                            }
                        </Route>
                        <Route path="/rest/create" exact={true}>
                            {() => <RestForm isNew={true} id={null}/>}
                        </Route>
                        <Route path="/rest/:id/edit" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <RestForm isNew={false} id={parseInt(match.params.id, 10)}/>;
                                }
                            }}
                        </Route>
                        <Route path="/rest/:id/view" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return (
                                        <ItemViewPage
                                            id={parseInt(match.params.id, 10)}

                                            ScriptComponent={RestScript}
                                            deleteCallback={restService.deleteScript}
                                            i18n={{
                                                deleteDialogTitle: RestMessages.deleteScript,
                                                parentName: 'REST scripts'
                                            }}
                                            parentLocation="/rest/"
                                        />
                                    );
                                }
                            }}
                        </Route>
                        <Route component={NotFoundPage}/>
                    </Switch>
                </Loader>
            </Provider>
        );
    }
}
