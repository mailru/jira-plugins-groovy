import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {AdminScriptType, AdminScriptOutcomeType} from '../app-admin/types';
import {ChangelogType} from '../common/script/types';


export class AdminScriptService {
    getAllScripts(): Promise<Array<AdminScriptType>> {
        return ajaxGet(`${getPluginBaseUrl()}/adminScript/all`);
    }

    getScript(id: number): Promise<AdminScriptType> {
        return ajaxGet(`${getPluginBaseUrl()}/adminScript/${id}`);
    }

    createScript(data: any): Promise<AdminScriptType> {
        return ajaxPost(`${getPluginBaseUrl()}/adminScript`, data);
    }

    updateScript(id: number, data: any): Promise<AdminScriptType> {
        return ajaxPut(`${getPluginBaseUrl()}/adminScript/${id}`, data);
    }

    deleteScript(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/adminScript/${id}`);
    }

    restoreScript(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/adminScript/${id}/restore`);
    }

    runBuiltInScript(key: string, params: any): Promise<AdminScriptOutcomeType> {
        return ajaxPost(`${getPluginBaseUrl()}/adminScript/run/builtIn/${key}`, params);
    }

    runUserScript(id: number, params: any): Promise<AdminScriptOutcomeType> {
        return ajaxPost(`${getPluginBaseUrl()}/adminScript/run/user/${id}`, params);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/adminScript/${id}/changelogs`);
    }
}
