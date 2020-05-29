import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';
import Lozenge from '@atlaskit/lozenge';

import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'; //todo: better icon
import CodeIcon from '@atlaskit/icon/glyph/code';
import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import {RunDialog} from './RunDialog';

import {AdminScriptType} from './types';

import {WatchActionCreators} from '../common/redux';

import {adminScriptService} from '../service';

import {WatchableScript} from '../common/script/WatchableScript';

import {ScriptComponentProps} from '../common/script-list/types';
import {AdminScriptMessages} from '../i18n/admin.i18n';
import {CommonMessages} from '../i18n/common.i18n';
import {RouterLink} from '../common/ak/RouterLink';


const ConnectedWatchableScript = connect(
    memoizeOne(state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type Props = ScriptComponentProps<AdminScriptType>;

type State = {
    isRunning: boolean
};

export class AdminScript extends React.PureComponent<Props, State> {
    static defaultProps = {
        collapsible: true
    };

    state: State = {
        isRunning: false
    };

    _toggleDialog = () => this.setState(state => ({ isRunning: !state.isRunning }));

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => adminScriptService.deleteScript(this.props.script.id)
    );

    _getScript = memoizeOne(
        (script) => (
            script.builtIn
            ? null
            : {
                id: script.uuid,
                name: script.name,
                description: script.description,
                inline: true,
                scriptBody: script.scriptBody,
                changelogs: script.changelogs,
                errorCount: script.errorCount,
                warningCount: script.warningCount
            }
        )
    );

    _getChangelogs = () => adminScriptService.getChangelogs(this.props.script.id);

    render() {
        const {script, collapsible, focused} = this.props;
        const {isRunning} = this.state;
        const {builtIn} = script;

        const buttons = [
            <Button
                key="runNow"
                appearance="subtle"
                iconBefore={<VidPlayIcon label="run"/>}
                onClick={this._toggleDialog}
            >
                {CommonMessages.run}
            </Button>
        ];

        if (!builtIn) {
            buttons.push(
                <Button
                    key="edit"
                    appearance="subtle"
                    iconBefore={<EditFilledIcon label=""/>}

                    component={RouterLink}
                    href={`/admin-scripts/${script.id}/edit`}
                />
            );
        }

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType="ADMIN_SCRIPT"
                isUnwatchable={builtIn}

                title={
                    builtIn
                    ? (
                        <div className="flex-row space-between">
                            <div className="flex-vertical-middle flex-none">
                                <CodeIcon label=""/>
                            </div>
                            <div className="flex-vertical-middle flex-none">
                                <Lozenge appearance="inprogress">
                                    {AdminScriptMessages.builtIn}
                                </Lozenge>
                            </div>
                            <div className="flex-vertical-middle">
                                <h3 title={script.name}>
                                    {script.name}
                                </h3>
                            </div>
                            <div className="flex-grow"/>
                        </div>
                    )
                    : undefined
                }

                script={this._getScript(script)}
                changelogsLoader={this._getChangelogs}
                withChangelog={true}
                collapsible={collapsible}
                focused={focused}

                onDelete={!builtIn ? this._delete : undefined}
                additionalPrimaryButtons={buttons}
                dropdownItems={
                    !builtIn
                    ? [
                        {
                            label: CommonMessages.permalink,
                            href: `/admin-scripts/${script.id}/view`,
                            linkComponent: RouterLink
                        }
                    ]
                    : undefined
                }
            >
                {isRunning && <RunDialog script={script} onClose={this._toggleDialog}/>}
            </ConnectedWatchableScript>
        );
    }
}
