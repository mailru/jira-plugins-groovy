import {ajaxDelete, ajaxGet, ajaxPost, getPluginBaseUrl} from './ajaxHelper';

import {EntityType} from '../common/types';


export class WatcherService {
    getAllWatches(type: EntityType): Promise<Array<number>> {
        return ajaxGet(`${getPluginBaseUrl()}/watch/${type}/all`);
    }

    startWatching(type: EntityType, id: number|string): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/watch/${type}/${id}`);
    }

    stopWatching(type: EntityType, id: number|string): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/watch/${type}/${id}`);
    }
}
