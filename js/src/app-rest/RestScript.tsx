import React from 'react';

import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';

import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';

import {RestScriptType} from './types';

import {ScriptParameters} from '../common/script';

import {restService, getPluginBaseUrl} from '../service';

import {CommonMessages, FieldMessages} from '../i18n/common.i18n';

import {WatchActionCreators} from '../common/redux';

import {WatchableScript} from '../common/script/WatchableScript';
import {RouterLink} from '../common/ak';

import {ScriptComponentProps} from '../common/script-list/types';


const ConnectedWatchableScript = connect(
    memoizeOne( state => ({ watches: state.watches }) ),
    WatchActionCreators
)(WatchableScript);

type Props = ScriptComponentProps<RestScriptType>;

export class RestScript extends React.PureComponent<Props> {
    static defaultProps = {
        collapsible: true
    };

    _delete = () => this.props.onDelete && this.props.onDelete(
        this.props.script.id,
        this.props.script.name,
        () => restService.deleteScript(this.props.script.id)
    );

    _getChangelogs = () => restService.getChangelogs(this.props.script.id);

    render() {
        const {script, collapsible, focused} = this.props;

        const url = `${getPluginBaseUrl()}/custom/${script.name}`;

        return (
            <ConnectedWatchableScript
                entityId={script.id}
                entityType="REST"

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
                        href: `/rest/${script.id}/view`,
                        linkComponent: RouterLink
                    }
                ]}

                additionalButtons={[
                    <Button
                        key="edit"
                        appearance="subtle"
                        iconBefore={<EditFilledIcon label=""/>}

                        component={RouterLink}
                        href={`/rest/${script.id}/edit`}
                    />
                ]}
            >
                <ScriptParameters
                    params={[
                        {
                            label: 'URL',
                            value: <a href={url}>{url}</a>
                        },
                        {
                            label: FieldMessages.httpMethods,
                            value: script.methods.join(', ')
                        },
                        {
                            label: FieldMessages.groups,
                            value: script.groups.length
                                ? script.groups.join(', ')
                                : <div className="muted-text">{CommonMessages.notSpecified}</div>
                        }
                    ]}
                />
            </ConnectedWatchableScript>
        );
    }
}
