import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {ListenerType} from '../app-listeners/types';
import {ChangelogType} from '../common/script/types';


export class ListenerService {
    getAllListeners(): Promise<Array<ListenerType>> {
        return ajaxGet(`${getPluginBaseUrl()}/listener/all`);
    }

    getListener(id: number): Promise<ListenerType> {
        return ajaxGet(`${getPluginBaseUrl()}/listener/${id}`);
    }

    createListener(data: any): Promise<ListenerType> {
        return ajaxPost(`${getPluginBaseUrl()}/listener`, data);
    }

    updateListener(id: number, data: any): Promise<ListenerType> {
        return ajaxPut(`${getPluginBaseUrl()}/listener/${id}`, data);
    }

    deleteListener(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/listener/${id}`);
    }

    restoreListener(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/listener/${id}/restore`);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/listener/${id}/changelogs`);
    }
}
