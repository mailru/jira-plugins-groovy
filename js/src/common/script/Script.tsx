import React, {ReactNode, ReactElement} from 'react';

import Button, {ButtonGroup} from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import Badge from '@atlaskit/badge';
import DropdownMenu, {DropdownItemGroup, DropdownItem} from '@atlaskit/dropdown-menu';
import {colors} from '@atlaskit/theme';
import EmptyState from '@atlaskit/empty-state';

import CodeIcon from '@atlaskit/icon/glyph/code';
import EditIcon from '@atlaskit/icon/glyph/edit-filled';
import BitbucketSourceIcon from '@atlaskit/icon/glyph/bitbucket/source';
import RecentIcon from '@atlaskit/icon/glyph/recent';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import MoreVerticalIcon from '@atlaskit/icon/glyph/more-vertical';

import {ScriptType, ExecutionType, ChangelogType} from './types';

import {Changelog} from './Changelog';
import {ExecutionBar} from './ExecutionBar';
import {ScriptParameters, ScriptParam} from './ScriptParameters';

import {VoidCallback} from '../types';

import Editor, {EditorThemeContextConsumer} from '../editor';
import {LoadingSpinner} from '../ak';

import {CommonMessages} from '../../i18n/common.i18n';

import {executionService} from '../../service';

import './Script.less';


type DropdownItemType = {
    label: string,
    onClick?: VoidCallback,
    href?: string,
    linkComponent?: Function
};

export type ScriptProps = {
    withChangelog: boolean,
    collapsible: boolean,
    headerless: boolean,
    focused: boolean,
    noCode: boolean,

    script: ScriptType | null,
    changelogsLoader?: () => Promise<ReadonlyArray<ChangelogType>>,

    template?: {
        body: string
    },

    onEdit?: VoidCallback,
    onDelete?: VoidCallback,

    title?: ReactNode,
    scriptName?: ReactNode,
    children?: ReactNode,
    additionalButtons?: Array<ReactElement<any>>,
    additionalPrimaryButtons?: Array<ReactElement<any>>,
    dropdownItems?: Array<DropdownItemType>,
    additionalParameters?: Array<ScriptParam | null>
};

type ScriptState = {
    showCode: boolean,
    activeSource: {
        type: string,
        id: number | string,
        source?: string,
        before?: string,
        after?: string,
        templateSource?: string
    },
    changelogs: ReadonlyArray<ChangelogType>,
    executions: ReadonlyArray<ExecutionType>,
    onlyLastExecutions: boolean,
    executionsReady: boolean,
    changelogsReady: boolean
};

export class Script extends React.Component<ScriptProps, ScriptState> {
    static defaultProps = {
        collapsible: true,
        withChangelog: false,
        headerless: false,
        focused: false,
        noCode: false
    };

    state: ScriptState = {
        showCode: false,
        activeSource: {
            type: 'groovy',
            id: 'current'
        },
        executions: [],
        changelogs: [],
        onlyLastExecutions: true,
        executionsReady: false,
        changelogsReady: false
    };

    componentDidMount() {
        if (!this.props.collapsible) {
            this._fetchExecutions();
            this._fetchChangelogs();
        }
    }

    _showCode = () => {
        const {showCode} = this.state;

        this.setState({ showCode: !showCode, onlyLastExecutions: true }, () => {
            if (this.state.showCode) {
                this._fetchExecutions();
                this._fetchChangelogs();
            }
        });
    };

    _showAllExecutions = () => this.setState({ onlyLastExecutions: false }, this._fetchExecutions);

    _fetchExecutions = () => {
        this.setState({ executionsReady: false });
        const {script} = this.props;
        const {onlyLastExecutions} = this.state;

        if (script) {
            executionService
                .getExecutions(script.inline, script.id, onlyLastExecutions)
                .then(result => this.setState({executions: result, executionsReady: true}));
        }
    };

    _fetchChangelogs = () => {
        this.setState({ executionsReady: false });
        const {script, changelogsLoader} = this.props;

        if (script && script.changelogs) {
            this.setState({
                changelogs: script.changelogs,
                changelogsReady: true
            });
        } else if (changelogsLoader) {
            this.setState({ changelogsReady: false });
            changelogsLoader()
                .then(changelogs => this.setState({
                    changelogs, changelogsReady: true
                }));
        }
    };

    _switchToCurrent = () => {
        this.setState({
            activeSource: {
                type: 'groovy',
                id: 'current'
            }
        });
    };

    _switchToChangelog = (changelog: ChangelogType) => () => {
        this.setState({
            activeSource: {
                type: 'diff',
                id: changelog.id,
                before: changelog.before,
                after: changelog.after,
                templateSource: changelog.templateDiff
            }
        });
    };

    render() {
        const {
            script, template, title, scriptName, children, collapsible, withChangelog, onEdit, onDelete,
            additionalButtons, additionalPrimaryButtons, additionalParameters, dropdownItems, headerless, focused, noCode
        } = this.props;
        const {activeSource, showCode, changelogsReady, changelogs, executions, executionsReady, onlyLastExecutions} = this.state;

        let codeBlock: ReactNode = null;
        let templateBlock: ReactNode = null;
        let executionBar: ReactNode = null;

        const isOpen: boolean = showCode || !collapsible;

        if (isOpen && script) {
            if (template) {
                templateBlock = (
                    <div style={{overflow: 'hidden'}}>
                        <EditorThemeContextConsumer>
                            {context =>
                                <Editor
                                    readOnly={true}
                                    mode={activeSource.id === 'current' ? 'velocity' : 'diff'}
                                    value={activeSource.id === 'current' ? template.body : activeSource.templateSource}
                                    {...context}
                                />
                            }
                        </EditorThemeContextConsumer>
                    </div>
                );
            }

            let changelogsNode: ReactNode = null;

            if (withChangelog) {
                if (changelogsReady) {
                    changelogsNode = (
                        <Changelog
                            changelogs={changelogs || script.changelogs}
                            switchToChangelog={this._switchToChangelog}
                            switchToCurrent={this._switchToCurrent}
                        />
                    );
                } else {
                    changelogsNode = <div className="scriptChangelogs" style={{width: '150px'}}><LoadingSpinner/></div>;
                }
            }

            let editorEl: ReactNode;

            if (noCode && activeSource.id === 'current') {
                editorEl = (
                    <EmptyState header="No code"/>
                );
            } else {
                editorEl = (
                    <EditorThemeContextConsumer>
                        {context =>
                            <Editor
                                readOnly={true}
                                mode={activeSource.id === 'current' ? 'groovy' : 'diff'}
                                value={activeSource.id === 'current' ? script && script.scriptBody : activeSource.source || activeSource.after}
                                original={activeSource.before}
                                {...context}
                            />
                        }
                    </EditorThemeContextConsumer>
                );
            }

            codeBlock = (
                <div className="flex-row editor">
                    {changelogsNode}
                    <div className="flex-grow flex-column">
                        <div style={{overflow: 'hidden'}}>
                            {editorEl}
                        </div>
                        {templateBlock}
                    </div>
                </div>
            );

            if ((executions && executions.length) || !executionsReady) {
                executionBar = (
                    <div className="executions">
                        {executionsReady &&
                            <div className="flex-row">
                                <ExecutionBar executions={executions}/>
                                {onlyLastExecutions && <div className="flex-grow"/>}
                                {onlyLastExecutions &&
                                    <div>
                                        <Button
                                            appearance="subtle"
                                            iconBefore={<RecentIcon label=""/>}
                                            spacing="compact"

                                            onClick={this._showAllExecutions}
                                        >
                                            {CommonMessages.showAll}
                                        </Button>
                                    </div>
                                }
                            </div>
                        }
                        {!executionsReady && <Spinner size="small"/>}
                    </div>
                );
            }
        }

        const buttons: Array<ReactElement<any>> = [];

        if (collapsible && script) {
            buttons.push(
                <Button
                    key="toggleCode"

                    appearance="subtle"
                    iconBefore={<BitbucketSourceIcon label=""/>}
                    onClick={this._showCode}
                >
                    {showCode ? CommonMessages.hideCode : CommonMessages.showCode}
                </Button>
            );
        }

        if (additionalPrimaryButtons) {
            buttons.push(...additionalPrimaryButtons);
        }

        if (onEdit) {
            buttons.push(
                <Button
                    key="edit-button"
                    appearance="subtle"
                    iconBefore={<EditIcon label=""/>}

                    onClick={onEdit}
                />
            );
        }

        if (onDelete) {
            buttons.push(
                <Button
                    key="edit-button"
                    appearance="subtle"
                    iconBefore={<TrashIcon label=""/>}

                    onClick={onDelete}
                />
            );
        }

        if (additionalButtons) {
            buttons.push(...additionalButtons);
        }

        if (dropdownItems && dropdownItems.length) {
            buttons.push(
                <DropdownMenu
                    key="etc"

                    position="bottom right"

                    triggerType="button"
                    triggerButtonProps={{
                        appearance: 'subtle',
                        iconBefore: <MoreVerticalIcon label=""/>
                    }}
                >
                    <DropdownItemGroup>
                        {dropdownItems.map(({label, ...itemProps}, i: number) =>
                            <DropdownItem key={i} {...itemProps}>
                                {label}
                            </DropdownItem>
                        )}
                    </DropdownItemGroup>
                </DropdownMenu>
            );
        }

        return (
            <div className={`scriptRow${!isOpen ? ' collapsed' : ''}${template ? ' withTemplate' : ''}${focused ? ' focused' : ''}`}>
                {!headerless &&
                <div className="flex-row title">
                    {title
                        ? (
                            <div className="flex-grow flex-vertical-middle">
                                {title}
                            </div>
                        )
                        : (
                            <div className="flex-grow flex-row">
                                <div className="flex-vertical-middle flex-none">
                                    <CodeIcon label=""/>
                                </div>
                                {' '}
                                <div className="flex-vertical-middle">
                                    <h3 title={script ? script.name : undefined}>
                                        {scriptName || (script && script.name)}
                                    </h3>
                                </div>
                                {script && !!script.warningCount &&
                                    <div className="flex-vertical-middle flex-none errorCount">
                                        <div>
                                            <Badge
                                                max={99}
                                                appearance={{ backgroundColor: colors.Y400, textColor: colors.N0 }}
                                            >
                                                {script.warningCount}
                                            </Badge>
                                        </div>
                                    </div>
                                }
                                {script && !!script.errorCount &&
                                    <div className="flex-vertical-middle flex-none errorCount">
                                        <div>
                                            <Badge
                                                max={99}
                                                appearance="important"
                                            >
                                                {script.errorCount}
                                            </Badge>
                                        </div>
                                    </div>
                                }
                                <div className="flex-grow"/>
                            </div>
                        )
                    }
                    <div className="flex-none flex-row">
                        <ButtonGroup>
                            {buttons}
                        </ButtonGroup>
                    </div>
                </div>
                }
                <div className="children">
                    {children}
                </div>
                {isOpen && <div className="ScriptBody">
                    {script && script.description && <div className="scriptDescription">{script.description}</div>}
                    {additionalParameters && <ScriptParameters params={additionalParameters}/>}
                    {codeBlock}
                    {executionBar}
                </div>}
            </div>
        );
    }
}
