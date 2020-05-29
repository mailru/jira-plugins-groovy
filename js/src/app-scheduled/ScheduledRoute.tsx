import React from 'react';

import {combineReducers, createStore} from 'redux';
import {Provider} from 'react-redux';
import {Switch, Route} from 'react-router-dom';

import Button from '@atlaskit/button';

import {ScheduledTask} from './ScheduledTask';
import {ScheduledTaskForm} from './ScheduledTaskForm';

import {scheduledTaskService, watcherService} from '../service';

import {filterReducer, ItemActionCreators, itemsReducer, readinessReducer, watchesReducer} from '../common/redux';
import {ConnectedScriptPage, NotFoundPage, ItemViewPage, focusOnRender} from '../common/script-list';
import {Loader, RouterLink} from '../common/ak';

import {CommonMessages, PageTitleMessages} from '../i18n/common.i18n';
import {ScheduledTaskMessages} from '../i18n/scheduled.i18n';

import './ScheduledTaskRegistry.less';


const ScheduledTaskComponent = focusOnRender(ScheduledTask);

export class ScheduledRoute extends React.PureComponent<{}> {
    store = createStore(
        combineReducers({
            items: itemsReducer,
            isReady: readinessReducer,
            watches: watchesReducer,
            filter: filterReducer
        })
    );

    componentDidMount() {
        Promise
            .all([scheduledTaskService.getAllTasks(), watcherService.getAllWatches('SCHEDULED_TASK')])
            .then(([scripts, watches]) => this.store.dispatch(ItemActionCreators.loadItems(scripts, watches)));
    }

    render() {
        return (
            <Provider store={this.store}>
                <Loader>
                    <Switch>
                        <Route path="/scheduled/" exact={true}>
                            {() =>
                                <ConnectedScriptPage
                                    ScriptComponent={ScheduledTaskComponent}
                                    i18n={{
                                        title: PageTitleMessages.scheduled,
                                        addItem: ScheduledTaskMessages.addTask,
                                        noItems: ScheduledTaskMessages.noTasks,
                                        delete: {
                                            heading: ScheduledTaskMessages.deleteTask,
                                            areYouSure: CommonMessages.confirmDelete
                                        }
                                    }}
                                    actions={
                                        <Button
                                            appearance="primary"

                                            component={RouterLink}
                                            href="/scheduled/create"
                                        >
                                            {ScheduledTaskMessages.addTask}
                                        </Button>
                                    }
                                />
                            }
                        </Route>
                        <Route path="/scheduled/create" exact={true}>
                            {() =>
                                <ScheduledTaskForm id={null} isNew={true}/>
                            }
                        </Route>
                        <Route path="/scheduled/:id/edit" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return <ScheduledTaskForm id={parseInt(match.params.id, 10)} isNew={false}/>;
                                }
                            }}
                        </Route>
                        <Route path="/scheduled/:id/view" exact={true}>
                            {({match}) => {
                                if (match == null) {
                                    return <NotFoundPage/>;
                                } else {
                                    return (
                                        <ItemViewPage
                                            id={parseInt(match.params.id, 10)}

                                            ScriptComponent={ScheduledTask}
                                            deleteCallback={scheduledTaskService.doDelete}
                                            i18n={{
                                                deleteDialogTitle: ScheduledTaskMessages.deleteTask,
                                                parentName: 'Scheduled tasks'
                                            }}
                                            parentLocation="/scheduled/"
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
