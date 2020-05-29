import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {ScheduledTaskType, RunNowResultType} from '../app-scheduled/types';
import {ChangelogType} from '../common/script/types';


export class ScheduledTaskService {
    getAllTasks(): Promise<ReadonlyArray<ScheduledTaskType>> {
        return ajaxGet(`${getPluginBaseUrl()}/scheduled/all`);
    }

    get(id: number): Promise<ScheduledTaskType> {
        return ajaxGet(`${getPluginBaseUrl()}/scheduled/${id}`);
    }

    create(data: any): Promise<ScheduledTaskType> {
        return ajaxPost(`${getPluginBaseUrl()}/scheduled`, data);
    }

    doDelete(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/scheduled/${id}`);
    }

    restore(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/scheduled/${id}/restore`);
    }

    update(id: number, data: any): Promise<ScheduledTaskType> {
        return ajaxPut(`${getPluginBaseUrl()}/scheduled/${id}`, data);
    }

    setEnabled(id: number, enabled: boolean): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/scheduled/${id}/enabled/${enabled.toString()}`);
    }

    runNow(id: number): Promise<RunNowResultType> {
        return ajaxPost(`${getPluginBaseUrl()}/scheduled/${id}/runNow`);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/scheduled/${id}/changelogs`);
    }

}
