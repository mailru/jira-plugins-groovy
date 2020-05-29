import React from 'react';
import {Provider} from 'react-redux';
import {Switch, Route} from 'react-router-dom';

import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import keyBy from 'lodash/keyBy';

import {ScriptRegistry} from './ScriptRegistry';
import {ScriptForm} from './ScriptForm';
import {ViewScript} from './ViewScript';
import {Loader} from './Loader';
import {reducer, loadState, loadUsage} from './redux';

import {registryService, watcherService} from '../service';

import {NotFoundPage} from '../common/script-list';


export class RegistryRoute extends React.PureComponent<{}> {
    store = createStore(
        reducer,
        applyMiddleware(thunk)
    );

    componentDidMount() {
        Promise
            .all([
                registryService.getAllDirectories(),
                registryService.getRegistryScripts(),
                watcherService.getAllWatches('REGISTRY_SCRIPT'),
                watcherService.getAllWatches('REGISTRY_DIRECTORY')
            ])
            .then(
                ([dirs, scripts, scriptWatches, directoryWatches]) => {
                    this.store.dispatch(loadState(keyBy(dirs, 'id'), keyBy(scripts, 'id'), scriptWatches, directoryWatches));
                }
            );

        registryService
            .getAllScriptUsage()
            .then(usage => this.store.dispatch(loadUsage(usage)));
    }

    render() {
        return (
            <Provider store={this.store}>
                <Loader>
                    <Switch>
                        <Route path="/registry" exact={true}>
                            {() => <ScriptRegistry/>}
                        </Route>
                        <Route path="/registry/script/create/" exact={true}>
                            {() =>
                                <ScriptForm isNew={true} id={null} directoryId={-1}/>
                            }
                        </Route>
                        <Route path="/registry/script/create/:directoryId" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return (
                                        <ScriptForm
                                            isNew={true}
                                            id={null}
                                            directoryId={parseInt(match.params.directoryId, 10)}
                                        />
                                    );
                                }
                            }}
                        </Route>
                        <Route path="/registry/script/edit/:id">
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return (
                                        <ScriptForm
                                            isNew={false}
                                            id={parseInt(match.params.id, 10)}
                                            directoryId={null}
                                        />
                                    );
                                }
                            }}
                        </Route>
                        <Route path="/registry/script/view/:id">
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <ViewScript id={parseInt(match.params.id, 10)}/>;
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
