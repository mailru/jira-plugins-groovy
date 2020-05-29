import React from 'react';
import {Provider} from 'react-redux';
import {Switch, Route} from 'react-router-dom';

import {combineReducers, createStore} from 'redux';

import {FieldScript} from './FieldScript';
import {CustomFieldForm} from './CustomFieldForm';
import {ViewFieldScript} from './ViewFieldScript';

import {ConnectedScriptPage, NotFoundPage, focusOnRender} from '../common/script-list';

import {fieldConfigService, watcherService} from '../service';

import {filterReducer, ItemActionCreators, itemsReducer, readinessReducer, watchesReducer} from '../common/redux';
import {Loader} from '../common/ak';

import {PageTitleMessages} from '../i18n/common.i18n';
import {ScriptFieldMessages} from '../i18n/cf.i18n';


const FieldScriptComponent = focusOnRender(FieldScript);

export class FieldsRoute extends React.PureComponent<{}> {
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
            .all([fieldConfigService.getAllConfigs(), watcherService.getAllWatches('CUSTOM_FIELD')])
            .then(([scripts, watches]) => this.store.dispatch(ItemActionCreators.loadItems(scripts, watches)));
    }

    render() {
        return (
            <Provider store={this.store}>
                <Loader>
                    <Switch>
                        <Route path="/fields/" exact={true}>
                            {() =>
                                <ConnectedScriptPage
                                    ScriptComponent={FieldScriptComponent}
                                    i18n={{
                                        title: PageTitleMessages.fields,
                                        addItem: '',
                                        noItems: ScriptFieldMessages.noFields,
                                        delete: {
                                            heading: '',
                                            areYouSure: () => ''
                                        }
                                    }}
                                />
                            }
                        </Route>
                        <Route path="/fields/:id/edit" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <CustomFieldForm id={parseInt(match.params.id, 10)}/>;
                                }
                            }}
                        </Route>
                        <Route path="/fields/:id/view" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <ViewFieldScript id={parseInt(match.params.id, 10)}/>;
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
