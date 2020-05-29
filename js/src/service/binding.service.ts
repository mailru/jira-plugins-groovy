import {ajaxGet, getPluginBaseUrl} from './ajaxHelper';

import {ClassDoc} from '../common/editor/types';


export class BindingService {
    getGlobalBindingTypes(): Promise<{string: ClassDoc}> {
        return ajaxGet(`${getPluginBaseUrl()}/binding/all`);
    }
}
