import {ajaxDelete, ajaxGet, ajaxPost, ajaxPut, getPluginBaseUrl} from './ajaxHelper';

import {JqlScriptType} from '../app-jql/types';
import {ChangelogType} from '../common/script/types';


export class JqlScriptService {
    getAllScripts(): Promise<Array<JqlScriptType>> {
        return ajaxGet(`${getPluginBaseUrl()}/jql/all`);
    }

    getScript(id: number): Promise<JqlScriptType> {
        return ajaxGet(`${getPluginBaseUrl()}/jql/${id}`);
    }

    createScript(data: any): Promise<JqlScriptType> {
        return ajaxPost(`${getPluginBaseUrl()}/jql`, data);
    }

    updateScript(id: number, data: any): Promise<JqlScriptType> {
        return ajaxPut(`${getPluginBaseUrl()}/jql/${id}`, data);
    }

    deleteScript(id: number): Promise<void> {
        return ajaxDelete(`${getPluginBaseUrl()}/jql/${id}`);
    }

    restoreScript(id: number): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/jql/${id}/restore`);
    }

    getChangelogs(id: number): Promise<ReadonlyArray<ChangelogType>> {
        return ajaxGet(`${getPluginBaseUrl()}/jql/${id}/changelogs`);
    }
}
