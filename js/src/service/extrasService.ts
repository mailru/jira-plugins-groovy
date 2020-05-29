import {getPluginBaseUrl, ajaxPost} from './ajaxHelper';

import {SyntaxError} from '../common/types';


export class ExtrasService {
    clearCache(): Promise<void> {
        return ajaxPost(`${getPluginBaseUrl()}/extras/clearCache`);
    }

    checkScript(scriptBody: string, scriptType: string, additionalParams: {[key in string]: string | undefined} = {}): Promise<ReadonlyArray<SyntaxError>> {
        return ajaxPost(`${getPluginBaseUrl()}/staticCheck`, { scriptBody, scriptType, additionalParams });
    }
}
