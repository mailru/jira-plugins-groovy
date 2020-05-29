import React, {ReactElement, ReactNode} from 'react';

import reactStringReplace from 'react-string-replace';

import Avatar from '@atlaskit/avatar';
import Tooltip from '@atlaskit/tooltip';
import Badge from '@atlaskit/badge';
import {colors} from '@atlaskit/theme';

import {ChangelogType, IssueReference} from './types';

import {VoidCallback} from '../types';

import {CommonMessages} from '../../i18n/common.i18n';

import {getBaseUrl} from '../../service';


type ChangelogProps = {
    changelogs: ReadonlyArray<ChangelogType>,
    switchToCurrent: VoidCallback,
    switchToChangelog: (changelog: ChangelogType) => () => void
};

export function Changelog({changelogs, switchToCurrent, switchToChangelog}: ChangelogProps): ReactElement {
    return (
        <div className="scriptChangelogs" style={{width: '150px'}}>
            <div key="current" className="scriptChangelog" onClick={switchToCurrent}>
                <div className="changelogContent">
                    <strong>{CommonMessages.currentVersion}</strong>
                </div>
            </div>
            {changelogs && changelogs.map(changelog =>
                <div key={changelog.id} className="scriptChangelog" onClick={switchToChangelog(changelog)}>
                    <div className="changelogContent">
                        <Tooltip content={changelog.author.displayName}>
                            <div className="flex-row">
                                <Avatar src={changelog.author.avatarUrl} size="xsmall" appearance="square" borderColor="transparent"/>
                                <span className="author">
                                    {changelog.author.displayName}
                                </span>
                            </div>
                        </Tooltip>
                        <div className="date">
                            {changelog.date}
                        </div>
                        <div>
                            <ChangelogComment
                                text={changelog.comment}
                                issueReferences={changelog.issueReferences}
                            />
                        </div>
                        {(changelog.warnings > 0 || changelog.errors > 0)
                            ? (
                                <div className="flex-row">
                                    {(changelog.warnings > 0)
                                        ? (
                                            <Badge appearance={{ backgroundColor: colors.Y400, textColor: colors.N0 }}>
                                                {changelog.warnings}
                                            </Badge>
                                        )
                                        : undefined
                                    }
                                    {(changelog.errors > 0)
                                        ? (
                                            <Badge appearance="important">
                                                {changelog.errors}
                                            </Badge>
                                        )
                                        : undefined
                                    }
                                </div>
                            )
                            : undefined
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

type ChangelogCommentProps = {
    text: string,
    issueReferences: Array<IssueReference>
};

function ChangelogComment({text, issueReferences}: ChangelogCommentProps): ReactElement {
    if (!(issueReferences && issueReferences.length)) {
        return <p>{text}</p>;
    }

    return (
        <p>
            {reactStringReplace(
                text, /([A-Z0-9a-z]{1,10}-\d+)/g,
                (issueKey: string, i: number): ReactNode => {
                    const issueReference = issueReferences.find(ref => ref.key === issueKey);

                    if (issueReference) {
                        return (
                            <Tooltip
                                key={`${issueKey}-${i}`}
                                tag="span"
                                content={issueReference.summary}
                            >
                                <a href={`${getBaseUrl()}/browse/${issueKey}`}>{issueKey}</a>
                            </Tooltip>
                        );
                    } else {
                        return issueKey;
                    }
                }
            )}
        </p>
    );
}
