import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';
import Lozenge from '@atlaskit/lozenge';

import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import {ConditionType, ListenerType} from './types';

import {WatchActionCreators} from '../common/redux';

import {ListenerTypeMessages} from '../i18n/listener.i18n';
import {CommonMessages, FieldMessages} from '../i18n/common.i18n';

import {RouterLink} from '../common/ak';

import {ScriptParameters} from '../common/script';
import {WatchableScript} from '../common/script/WatchableScript';

import {ObjectMap} from '../common/types';
import {ScriptParam} from '../common/script/ScriptParameters';
import {ScriptComponentProps} from '../common/script-list/types';

import './ListenerRegistry.less';
import {listenerService} from '../service';


const ConnectedWatchableScript = connect(
    memoizeOne( state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type ConnectProps = {
    projects: ObjectMap,
    eventTypes: ObjectMap
};

type Props = ScriptComponentProps<ListenerType> & ConnectProps;

class ListenerInternal extends React.PureComponent<Props> {
    static defaultProps = {
        collapsible: true
    };

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => listenerService.deleteListener(this.props.script.id)
    );

    _getParams = memoizeOne(
        (projects: ObjectMap, eventTypes: ObjectMap, condition: ConditionType, initialized: boolean): Array<ScriptParam | null> => {
            const params: Array<ScriptParam> = [
                {
                    label: 'Status',
                    value: initialized
                        ? <Lozenge appearance="success">Initialized</Lozenge>
                        : <Lozenge appearance="removed">Not initialized</Lozenge>
                },
                {
                    label: FieldMessages.type,
                    value: ListenerTypeMessages[condition.type]
                }
            ];

            if (condition.type === 'CLASS_NAME') {
                if (condition.pluginKey) {
                    params.push({
                        label: FieldMessages.pluginKey,
                        value: condition.pluginKey
                    });
                }
                params.push({
                    label: FieldMessages.name,
                    value: condition.className
                });
            } else if (condition.type === 'ISSUE') {
                params.push({
                    label: FieldMessages.eventTypes,
                    value: condition.typeIds.length
                        ? condition.typeIds.map(id => eventTypes[id.toString()] || id).join(', ')
                        : <div className="muted-text">{CommonMessages.notSpecified}</div>
                });
                params.push({
                    label: FieldMessages.projects,
                    value: (
                        <div className="flex-column">
                            {condition.projectIds.length
                                ? condition.projectIds.map(id => <div key={id}>{projects[id.toString()] || id}</div>)
                                : <div className="muted-text">{CommonMessages.notSpecified}</div>
                            }
                        </div>
                    )
                });
            }

            return params;
        }
    );

    _getChangelogs = () => listenerService.getChangelogs(this.props.script.id);

    render() {
        const {script, collapsible, focused, projects, eventTypes} = this.props;

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType={'LISTENER'}

                script={{
                    id: script.uuid,
                    name: script.name,
                    description: script.description,
                    inline: true,
                    scriptBody: script.scriptBody,
                    changelogs: script.changelogs,
                    errorCount: script.errorCount,
                    warningCount: script.warningCount
                }}
                changelogsLoader={this._getChangelogs}

                withChangelog={true}
                collapsible={collapsible}
                focused={focused}

                onDelete={this._delete}

                dropdownItems={[
                    {
                        label: CommonMessages.permalink,
                        href: `/listeners/${script.id}/view`,
                        linkComponent: RouterLink
                    }
                ]}

                additionalButtons={[
                    <Button
                        key="edit"
                        appearance="subtle"
                        iconBefore={<EditFilledIcon label=""/>}

                        component={RouterLink}
                        href={`/listeners/${script.id}/edit`}
                    />
                ]}
            >
                <ScriptParameters params={this._getParams(projects, eventTypes, script.condition, script.initialized)}/>
            </ConnectedWatchableScript>
        );
    }
}

export const Listener = connect(
    memoizeOne( state => ({ projects: state.projects, eventTypes: state.eventTypes }) )
)(ListenerInternal);
