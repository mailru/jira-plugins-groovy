//@flow
import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {GlobalObjectScriptType} from '../app-go/types';
import {ChangelogType} from '../common/script/types';


export class GlobalObjectService {
    getAllScripts(): Promise<ReadonlyArray<GlobalObjectScriptType>> {
        return ajaxGet(`${getPluginBaseUrl()}/go/all`);
    }

    getScript(id: number): Promise<GlobalObjectScriptType> {
        return ajaxGet(`${getPluginBaseUrl()}/go/${id}`);
    }

    createScript(data: any): Promise<GlobalObjectScriptType> {
        return ajaxPost(`${getPluginBaseUrl()}/go`, data);
    }

    updateScript(id: number, data: any): Promise<GlobalObjectScriptType> {
        return ajaxPut(`${getPluginBaseUrl()}/go/${id}`, data);
    }

    deleteScript(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/go/${id}`);
    }

    restoreScript(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/go/${id}/restore`);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/go/${id}/changelogs`);
    }
}
