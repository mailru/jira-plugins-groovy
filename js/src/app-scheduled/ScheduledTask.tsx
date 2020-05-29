import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Avatar from '@atlaskit/avatar';
import Button from '@atlaskit/button';
import Lozenge, {ThemeAppearance as LozengeAppearance} from '@atlaskit/lozenge';
import Tooltip from '@atlaskit/tooltip';
import {ToggleStateless} from '@atlaskit/toggle';
import {colors} from '@atlaskit/theme';

import ErrorIcon from '@atlaskit/icon/glyph/error';
import InfoIcon from '@atlaskit/icon/glyph/info';
import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import {RunNowDialog} from './RunNowDialog';
import {types, RunOutcomeType, ScheduledTaskType, TransitionOptionsType} from './types';

import {ScriptParameters} from '../common/script';

import {scheduledTaskService} from '../service';

import {ScheduledTaskMessages, TransitionOptionMessages} from '../i18n/scheduled.i18n';
import {CommonMessages, FieldMessages} from '../i18n/common.i18n';
import {updateItem, WatchActionCreators} from '../common/redux';

import {ScriptParam} from '../common/script/ScriptParameters';
import {WatchableScript} from '../common/script/WatchableScript';
import {ScriptComponentProps} from '../common/script-list/types';
import {RouterLink} from '../common/ak';


function getOutcomeLozengeAppearance(outcome: RunOutcomeType): LozengeAppearance {
    switch(outcome) {
        case 'SUCCESS':
            return 'success';
        case 'ABORTED':
            return 'moved';
        case 'UNAVAILABLE':
        case 'FAILED':
            return 'removed';
        case 'NOT_RAN':
            return 'default';
        default:
            return 'default';
    }
}

const ConnectedWatchableScript = connect(
    memoizeOne( state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type Props = ScriptComponentProps<ScheduledTaskType> & {
    updateItem: typeof updateItem
};

type State = {
    showRunDialog: boolean
};

export class ScheduledTaskInternal extends React.Component<Props, State> {
    static defaultProps = {
        collapsible: true
    };

    state: State = {
        showRunDialog: false
    };

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => scheduledTaskService.doDelete(this.props.script.id)
    );

    _toggleEnabled = () => {
        const {script, updateItem} = this.props;

        const enabled = !script.enabled;

        scheduledTaskService
            .setEnabled(script.id, enabled)
            .then(() => updateItem({...script, enabled}));
    };

    _toggleRunNow = () => this.setState( state => ({ showRunDialog: !state.showRunDialog }) );

    _getChangelogs = () => scheduledTaskService.getChangelogs(this.props.script.id);

    _getParams = memoizeOne(
        (task: ScheduledTaskType) => {
            const params: Array<ScriptParam | null> = [
                {
                    label: FieldMessages.schedule,
                    value: task.scheduleExpression
                }
            ];

            if (task.user) {
                params.push({
                    label: ScheduledTaskMessages.runAs,
                    value: (
                        <div className="flex-row">
                            <Avatar size="xsmall" appearance="square" src={task.user.imgSrc}/>
                            <div className="flex-vertical-middle">
                                {' '}{task.user.label}
                            </div>
                        </div>
                    )
                });
            }

            if (task.issueJql) {
                params.push({
                    label: FieldMessages.issueJql,
                    value: task.issueJql
                });
            }

            if (task.issueWorkflow && task.issueWorkflowAction) {
                params.push({
                    label: FieldMessages.workflowAction,
                    value: `${task.issueWorkflow.label}' - '${task.issueWorkflowAction.label}`
                });
            }

            const {transitionOptions} = task;
            if ((task.type === 'ISSUE_JQL_TRANSITION') && transitionOptions) {
                params.push({
                    label: ScheduledTaskMessages.transitionOptions,
                    value: Object
                        .keys(transitionOptions)
                        .filter(key => transitionOptions[key as keyof TransitionOptionsType])
                        .map(key => TransitionOptionMessages[key as keyof TransitionOptionsType])
                        .join(', ') || 'None'
                });
            }

            return params;
        }
    );

    render() {
        const {script, collapsible, focused} = this.props;
        const {showRunDialog} = this.state;
        const {lastRunInfo} = script;

        const outcome = lastRunInfo ? lastRunInfo.outcome : 'NOT_RAN';

        const isError = outcome === 'FAILED';
        const lastRun = lastRunInfo
            ? (
                <div className="flex-column">
                    <strong>{ScheduledTaskMessages.lastRun}{':'}</strong>
                    <div>
                        {lastRunInfo.startDate}{' - '}{lastRunInfo.duration/1000}{'s'}
                    </div>
                    {lastRunInfo.message && <div className="flex-row">
                        <div style={{color: isError ? colors.R400 : colors.P300}}>
                            {isError ? <ErrorIcon label="error" size="small"/> : <InfoIcon label="info" size="small"/>}
                        </div>
                        <div className="TaskRunMessage">
                            {lastRunInfo.message}
                        </div>
                    </div>}
                </div>
            )
            : '';

        const popup = (
            <div className="flex-column">
                <div>
                    <strong>{ScheduledTaskMessages.nextRun}{':'}</strong>
                    <div>{script.nextRunDate || 'unavailable'}</div>
                </div>
                {lastRun}
            </div>
        );
        const titleEl = (
            <div className="flex-row space-between">
                <div className="flex-vertical-middle">
                    <ToggleStateless
                        isChecked={script.enabled}
                        onChange={this._toggleEnabled}
                    />
                </div>
                <div className="flex-vertical-middle">
                    <span style={{marginTop: '2px', marginLeft: '2px'}}>
                        {types[script.type].name}{': '}
                        <strong>{script.name}</strong>
                    </span>
                </div>
                <div className="flex-vertical-middle">
                    <Tooltip
                        content={popup}
                        position="bottom"
                    >
                        <div
                            className="flex-vertical-middle"
                        >
                            <Lozenge appearance={getOutcomeLozengeAppearance(outcome)} isBold={true}>
                                {outcome}
                            </Lozenge>
                        </div>
                    </Tooltip>
                </div>
            </div>
        );

        const isJqlTransition = script.type === 'ISSUE_JQL_TRANSITION';

        const scriptObject = (
            !isJqlTransition
            ? {
                id: script.uuid,
                name: script.name,
                scriptBody: script.scriptBody,
                inline: true,
                changelogs: script.changelogs,
                description: script.description
            }
            : {
                id: script.uuid,
                name: script.name,
                inline: true,
                changelogs: script.changelogs,
                description: script.description
            }
        );

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType="SCHEDULED_TASK"

                withChangelog={true}
                collapsible={collapsible}
                focused={focused}
                noCode={isJqlTransition}

                script={scriptObject}
                changelogsLoader={this._getChangelogs}
                title={titleEl}
                onDelete={this._delete}

                dropdownItems={[
                    {
                        label: CommonMessages.permalink,
                        href: `/scheduled/${script.id}/view`,
                        linkComponent: RouterLink
                    },
                    {
                        label: ScheduledTaskMessages.runNow,
                        onClick: this._toggleRunNow
                    }
                ]}

                additionalButtons={[
                    <Button
                        key="edit"
                        appearance="subtle"
                        iconBefore={<EditFilledIcon label=""/>}

                        component={RouterLink}
                        href={`/scheduled/${script.id}/edit`}
                    />
                ]}
            >
                {script.type === 'ISSUE_JQL_TRANSITION' && script.description &&
                    <div className="scriptDescription">
                        {script.description}
                    </div>
                }
                <ScriptParameters
                    params={this._getParams(script)}
                />
                {showRunDialog && <RunNowDialog task={script} onClose={this._toggleRunNow}/>}
            </ConnectedWatchableScript>
        );
    }
}

export const ScheduledTask = connect(
    null,
    { updateItem }
)(ScheduledTaskInternal);
