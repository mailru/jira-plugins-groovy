// eslint-disable-next-line import/no-unresolved
import $ from 'jquery';

import {ajaxGet, getPluginBaseUrl} from './ajaxHelper';

import {AuditLogData} from '../app-audit/types';
import {EntityAction, EntityType} from '../common/types';


export class AuditLogService {
    getAuditLogPage(
        offset: number,
        user: ReadonlyArray<string>,
        category: ReadonlyArray<EntityType>,
        action: ReadonlyArray<EntityAction>
    ): Promise<AuditLogData> {
        return ajaxGet(`${getPluginBaseUrl()}/auditLog/all?${$.param({ offset, user, category, action })}`);
    }
}
