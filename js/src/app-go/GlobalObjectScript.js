//@flow
import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';

import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import type {GlobalObjectScriptType} from './types';

import {WatchActionCreators} from '../common/redux';

import {globalObjectService} from '../service';

import {WatchableScript} from '../common/script/WatchableScript';

import type {ScriptComponentProps} from '../common/script-list/types';
import {CommonMessages} from '../i18n/common.i18n';
import {RouterLink} from '../common/ak/RouterLink';


const ConnectedWatchableScript = connect(
    memoizeOne( state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type Props = ScriptComponentProps<GlobalObjectScriptType>;

export class GlobalObjectScript extends React.PureComponent<Props> {
    static defaultProps = {
        collapsible: true
    };

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => globalObjectService.deleteScript(this.props.script.id)
    );

    _getScript = memoizeOne(
        (script) => ({
            id: script.uuid,
            name: script.name,
            description: script.description,
            inline: true,
            scriptBody: script.scriptBody,
            changelogs: script.changelogs,
            errorCount: script.errorCount,
            warningCount: script.warningCount
        })
    );

    _getChangelogs = () => globalObjectService.getChangelogs(this.props.script.id);

    _getScript = () => globalObjectService.getScript(this.props.script.id);

    render() {
        const {script, collapsible, focused} = this.props;

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType="GLOBAL_OBJECT"

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
                loadScript={this._getScript}

                withChangelog={true}
                collapsible={collapsible}
                focused={focused}

                onDelete={this._delete}

                additionalPrimaryButtons={[
                    <Button
                        key="edit"
                        appearance="subtle"
                        iconBefore={<EditFilledIcon label=""/>}

                        component={RouterLink}
                        href={`/go/${script.id}/edit`}
                    />
                ]}

                dropdownItems={[
                    {
                        label: CommonMessages.permalink,
                        href: `/go/${script.id}/view`,
                        linkComponent: RouterLink
                    }
                ]}
            />
        );
    }
}
