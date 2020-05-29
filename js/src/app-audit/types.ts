//@flow
import {EntityAction, EntityType, Page} from '../common/types';
import {JiraUser} from '../common/script/types';
import {SingleValueType} from '../common/ak/types';


export type AuditLogEntry = {
    id: number,
    date: string,
    action: EntityAction,
    category: EntityType,
    user: JiraUser,
    deleted: boolean,
    scriptId: number | null,
    description: string | null,
    parentName: string | null,
    scriptName: string | null
};

export type AuditLogData = Page<AuditLogEntry>;

export type AuditLogFilterType = {
    users: ReadonlyArray<SingleValueType>,
    categories: ReadonlyArray<EntityType>,
    actions: ReadonlyArray<EntityAction>
};
