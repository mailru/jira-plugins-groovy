import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';

import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import {JqlScriptType} from './types';

import {WatchActionCreators} from '../common/redux';

import {jqlScriptService} from '../service';

import {WatchableScript} from '../common/script/WatchableScript';

import {ScriptComponentProps} from '../common/script-list/types';
import {CommonMessages} from '../i18n/common.i18n';
import {RouterLink} from '../common/ak';


const ConnectedWatchableScript = connect(
    memoizeOne( state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type Props = ScriptComponentProps<JqlScriptType>;

export class JqlScript extends React.PureComponent<Props> {
    static defaultProps = {
        collapsible: true
    };

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => jqlScriptService.deleteScript(this.props.script.id)
    );

    _getChangelogs = () => jqlScriptService.getChangelogs(this.props.script.id);

    render() {
        const {script, collapsible, focused} = this.props;

        const buttons = [
            <Button
                key="edit"
                appearance="subtle"
                iconBefore={<EditFilledIcon label=""/>}

                component={RouterLink}
                href={`/jql/${script.id}/edit`}
            />
        ];

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType="JQL_FUNCTION"

                script={{
                    id: script.uuid,
                    name: script.name,
                    description: script.description,
                    inline: true,
                    scriptBody: script.scriptBody,
                    changelogs: script.changelogs,
                    errorCount: script.errorCount
                }}
                changelogsLoader={this._getChangelogs}

                withChangelog={true}
                collapsible={collapsible}
                focused={focused}

                onDelete={this._delete}
                additionalPrimaryButtons={buttons}
                dropdownItems={[
                    {
                        label: CommonMessages.permalink,
                        href: `/jql/${script.id}/view`,
                        linkComponent: RouterLink
                    }
                ]}
            />
        );
    }
}
