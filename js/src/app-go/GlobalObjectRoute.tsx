import React from 'react';

import {combineReducers, createStore} from 'redux';
import {Provider} from 'react-redux';
import {Switch, Route} from 'react-router-dom';

import Button from '@atlaskit/button';

import {GlobalObjectScript} from './GlobalObjectScript';
import {GlobalObjectForm} from './GlobalObjectForm';

import {CommonMessages, PageTitleMessages} from '../i18n/common.i18n';
import {RegistryMessages} from '../i18n/registry.i18n';

import {NotFoundPage, ConnectedScriptPage, ItemViewPage, focusOnRender} from '../common/script-list';

import {filterReducer, ItemActionCreators, itemsReducer, readinessReducer, watchesReducer} from '../common/redux';
import {watcherService, globalObjectService} from '../service';
import {Loader, RouterLink} from '../common/ak';


const ScriptComponent = focusOnRender(GlobalObjectScript);

export class GlobalObjectRoute extends React.PureComponent<{}> {
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
            .all([globalObjectService.getAllScripts(), watcherService.getAllWatches('GLOBAL_OBJECT')])
            .then(([scripts, watches]) => this.store.dispatch(ItemActionCreators.loadItems(scripts, watches)));
    }

    render() {
        return (
            <Provider store={this.store}>
                <Loader>
                    <Switch>
                        <Route path="/go/" exact={true}>
                            {() =>
                                <ConnectedScriptPage
                                    ScriptComponent={ScriptComponent}
                                    i18n={{
                                        title: PageTitleMessages.globalObjects,
                                        addItem: RegistryMessages.addScript,
                                        noItems: RegistryMessages.noScripts,
                                        delete: {
                                            heading: RegistryMessages.deleteScript,
                                            areYouSure: CommonMessages.confirmDelete
                                        }
                                    }}
                                    actions={
                                        <Button
                                            appearance="primary"

                                            component={RouterLink}
                                            href="/go/create"
                                        >
                                            {RegistryMessages.addScript}
                                        </Button>
                                    }
                                />
                            }
                        </Route>
                        <Route path="/go/create" exact={true}>
                            {() => <GlobalObjectForm isNew={true} id={null}/>}
                        </Route>
                        <Route path="/go/:id/edit" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <GlobalObjectForm isNew={false} id={parseInt(match.params.id, 10)}/>;
                                }
                            }}
                        </Route>
                        <Route path="/go/:id/view" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return (
                                        <ItemViewPage
                                            id={parseInt(match.params.id, 10)}

                                            ScriptComponent={GlobalObjectScript}
                                            deleteCallback={globalObjectService.deleteScript}
                                            i18n={{
                                                deleteDialogTitle: RegistryMessages.deleteScript,
                                                parentName: 'Global objects'
                                            }}
                                            parentLocation="/go/"
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
