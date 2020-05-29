import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {RestScriptType} from '../app-rest/types';
import {ChangelogType} from '../common/script/types';


export class RestService {
    getAllScripts(): Promise<ReadonlyArray<RestScriptType>> {
        return ajaxGet(`${getPluginBaseUrl()}/rest/all`);
    }

    getScript(id: number): Promise<RestScriptType> {
        return ajaxGet(`${getPluginBaseUrl()}/rest/${id}`);
    }

    createScript(data: any): Promise<RestScriptType> {
        return ajaxPost(`${getPluginBaseUrl()}/rest`, data);
    }

    updateScript(id: number, data: any): Promise<RestScriptType> {
        return ajaxPut(`${getPluginBaseUrl()}/rest/${id}`, data);
    }

    deleteScript(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/rest/${id}`);
    }

    restoreScript(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/rest/${id}/restore`);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/rest/${id}/changelogs`);
    }
}
