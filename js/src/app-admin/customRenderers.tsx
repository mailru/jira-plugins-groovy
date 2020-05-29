import React, {ReactNode} from 'react';

import DynamicTable from '@atlaskit/dynamic-table';
import Lozenge from '@atlaskit/lozenge';
import Badge from '@atlaskit/badge';


export type CustomRenderer = (data: any) => ReactNode;

export const customRenderers: {[key in string]: CustomRenderer} = {
    // eslint-disable-next-line react/display-name
    recentErrors: (items: ReadonlyArray<any>): ReactNode => {
        return (
            <DynamicTable
                rowsPerPage={20}
                head={{
                    cells: [
                        {
                            key: 'type',
                            content: 'Type',
                            isSortable: true
                        },
                        {
                            content: 'Name'
                        },
                        {
                            key: 'errorCount',
                            content: 'Errors',
                            isSortable: true
                        },
                        {
                            key: 'lastError',
                            content: 'Last error',
                            isSortable: true,
                        }
                    ]
                }}
                rows={
                    items.map(item => ({
                        cells: [
                            {
                                key: item.type || 'UNKNOWN',
                                content: (
                                    <Lozenge
                                        appearance={item.type ? 'new' : 'default'}
                                        isBold={true}
                                    >
                                        {item.type || 'UNKNOWN'}
                                    </Lozenge>
                                )
                            },
                            {
                                content: item.url ? <a href={item.url}>{item.name}</a> : item.name
                            },
                            {
                                key: item.errorCount,
                                content: (
                                    <Badge
                                        appearance="important"
                                    >
                                        {item.errorCount}
                                    </Badge>
                                )
                            },
                            {
                                key: item.lastErrorTimestamp,
                                content: item.lastErrorDate
                            }
                        ]
                    }))
                }
            />
        );
    }
};

