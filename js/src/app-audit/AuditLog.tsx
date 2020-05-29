import React, {ReactElement} from 'react';

import Page from '@atlaskit/page';
import PageHeader from '@atlaskit/page-header';
import Tooltip from '@atlaskit/tooltip';
import Avatar, {AvatarItem} from '@atlaskit/avatar';
import Lozenge from '@atlaskit/lozenge';
import Button from '@atlaskit/button';
import {DynamicTableStateless} from '@atlaskit/dynamic-table';
import Pagination from '@atlaskit/pagination';
import Breadcrumbs from '@atlaskit/breadcrumbs';

import {RowType, HeadType} from '@atlaskit/dynamic-table/dist/esm/types';

import UndoIcon from '@atlaskit/icon/glyph/undo';

import {ActionIcon} from './ActionIcon';
import {AuditLogFilter} from './AuditLogFilter';

import {AuditLogEntry, AuditLogData, AuditLogFilterType} from './types';

import {
    adminScriptService,
    auditLogService,
    globalObjectService,
    jqlScriptService,
    listenerService,
    registryService,
    restService,
    scheduledTaskService
} from '../service';
import {CommonMessages, FieldMessages, PageTitleMessages} from '../i18n/common.i18n';
import {AuditMessages, CategoryNameMessages} from '../i18n/audit.i18n';

import {InfoMessage, RouterLink} from '../common/ak';
import {ScrollToTop} from '../common/ScrollToTop';
import {withRoot} from '../common/script-list';
import {EntityType} from '../common/types';


const tableHead: HeadType = {
    cells: [
        {
            content: FieldMessages.date,
            // @ts-ignore
            width: '120px'
        },
        {
            content: AuditMessages.user,
            // @ts-ignore
            width: '200px'
        },
        {
            content: '',
            // @ts-ignore
            width: '30px'
        },
        {
            content: AuditMessages.script,
            // @ts-ignore
            width: '250px'
        },
        {
            content: AuditMessages.description
        },
        {
            content: '',
            // @ts-ignore
            width: '35px'
        }
    ]
};


type Props = {

};

type State = {
    filter: AuditLogFilterType,
    offset: number,
    isReady: boolean,
    rows: Array<RowType>,
    data: AuditLogData
};

function getScriptLink(type: EntityType, id: number | null): string | null {
    if (!id) {
        return null;
    }

    switch(type) {
        case 'REGISTRY_SCRIPT':
            return `/registry/script/view/${id}`;
        case 'CUSTOM_FIELD':
            return `fields/${id}/view`;
        case 'ADMIN_SCRIPT':
            return `admin-scripts/${id}/view`;
        case 'LISTENER':
            return `listeners/${id}/view`;
        case 'REST':
            return `rest/${id}/view`;
        case 'SCHEDULED_TASK':
            return `scheduled/${id}/view`;
        case 'GLOBAL_OBJECT':
            return `go/${id}/view`;
        default:
            return null;
    }
}

export class AuditLog extends React.Component<Props, State> {
    state: State = {
        offset: 0,
        isReady: false,
        rows: [],
        data: {
            offset: 0,
            limit: 1,
            total: 0,
            size: 0,
            isLast: true,
            values: []
        },
        filter: {
            users: [],
            categories: [],
            actions: []
        }
    };

    _restore = (category: EntityType, id: number) => () => {
        let promise: Promise<void> | null = null;
        switch (category) {
            case 'ADMIN_SCRIPT':
                promise = adminScriptService.restoreScript(id);
                break;
            case 'REGISTRY_SCRIPT':
                promise = registryService.restoreScript(id);
                break;
            case 'REGISTRY_DIRECTORY':
                promise = registryService.restoreDirectory(id);
                break;
            case 'LISTENER':
                promise = listenerService.restoreListener(id);
                break;
            case 'REST':
                promise = restService.restoreScript(id);
                break;
            case 'SCHEDULED_TASK':
                promise = scheduledTaskService.restore(id);
                break;
            case 'JQL_FUNCTION':
                promise = jqlScriptService.restoreScript(id);
                break;
            case 'GLOBAL_OBJECT':
                promise = globalObjectService.restoreScript(id);
                break;
            default:
                console.error('unknown category', category);
        }

        if (promise) {
            this.setState({ isReady: false });

            promise
                .then(
                    () => this._loadList(this.state.offset, this.state.filter),
                    (error) => {
                        this.setState({ isReady: true });
                        throw error;
                    }
                );
        }
    };

    _loadList(offset: number, filter: AuditLogFilterType) {
        this.setState({
            isReady: false
        });

        auditLogService
            .getAuditLogPage(offset, filter.users.map(it => it.value), filter.categories, filter.actions)
            .then(data => this.setState({
                data,
                rows: data.values.map((value: AuditLogEntry): RowType => {
                    const link = getScriptLink(value.category, value.scriptId);

                    return {
                        key: value.id.toString(10),
                        cells: [
                            {
                                content: value.date
                            },
                            {
                                content: (
                                    <AvatarItem
                                        backgroundColor="transparent"
                                        avatar={<Avatar src={value.user.avatarUrl} appearance="square"/>}

                                        primaryText={value.user.displayName}
                                        secondaryText={value.user.name}
                                    />
                                )
                            },
                            {
                                content: <ActionIcon action={value.action}/>
                            },
                            {
                                content: (
                                    <div className="flex-column">
                                        <div>
                                            <Lozenge>
                                                {CategoryNameMessages[value.category]}
                                            </Lozenge>
                                        </div>
                                        {value.parentName &&
                                            <div className="muted-text">
                                                {value.parentName}
                                            </div>
                                        }
                                        <div className={value.deleted ? 'crossed-text' : ''}>
                                            {link && !value.deleted ? <RouterLink href={link}>{value.scriptName}</RouterLink> : value.scriptName}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                content: value.description
                            },
                            {
                                content: value.deleted && (value.action === 'DELETED') && !!value.scriptId && (
                                    <Tooltip content={AuditMessages.restore}>
                                        <Button
                                            iconBefore={<UndoIcon label="Undo"/>}

                                            onClick={this._restore(value.category, value.scriptId)}
                                        />
                                    </Tooltip>
                                )
                            }
                        ]
                    };
                }),
                isReady: true
            }));
    }

    _goToPage = (_event: any, page: number) => this._loadList(this.state.data.limit * (page-1), this.state.filter);

    _updateFilter = (filter: AuditLogFilterType) => {
        this.setState({ filter }, () => this._loadList(0, filter));
    };

    componentDidMount() {
        this._loadList(0, this.state.filter);
    }

    _renderPagination(): ReactElement<typeof Pagination> {
        const {data} = this.state;

        return (
            <Pagination
                selectedIndex={(data.offset/data.limit + 1) || 0}
                pages={[ ...Array(Math.ceil(data.total/data.limit) || 0) ].map((_, i) => i + 1)}
                onChange={this._goToPage}

                i18n={{
                    prev: CommonMessages.prev,
                    next: CommonMessages.next
                }}
            />
        );
    }

    render() {
        const {isReady, rows, filter} = this.state;

        return (
            <Page>
                <PageHeader
                    bottomBar={
                        <div className="flex-row">
                            <AuditLogFilter value={filter} onChange={this._updateFilter}/>
                        </div>
                    }

                    breadcrumbs={<Breadcrumbs>{withRoot([])}</Breadcrumbs>}
                >
                    {PageTitleMessages.audit}
                </PageHeader>
                <ScrollToTop/>

                <div className="page-content">
                    {this._renderPagination()}
                    <DynamicTableStateless
                        head={tableHead}
                        emptyView={<InfoMessage title={AuditMessages.noItems}/>}

                        isLoading={!isReady}
                        rows={rows}
                    />
                    {this._renderPagination()}
                </div>
            </Page>
        );
    }
}

