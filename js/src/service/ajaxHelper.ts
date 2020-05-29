// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
import AJS from 'AJS';
// eslint-disable-next-line import/no-unresolved
import $ from 'jquery';

import {ErrorType, ErrorDataType, HttpMethod} from '../common/types';


export type PromiseCallback = (data: any) => void;
export type PromiseRejectCallback = (error: ErrorType) => void;

export function getBaseUrl(): string {
    return AJS.contextPath();
}

export function getPluginBaseUrl(version?: number): string {
    return `${getBaseUrl()}/rest/my-groovy/${version || 'latest'}`;
}

export function ajaxPromise(url: string, method: HttpMethod, _params?: any, data?: any): Promise<any> {
    return new Promise((resolve: PromiseCallback, reject: PromiseRejectCallback) => {
        $
            .ajax({
                url: url,
                type: method,
                contentType: method !== 'GET' ? 'application/json' : undefined,
                dataType: 'json',
                data: method !== 'GET' && method !== 'DELETE' ? JSON.stringify(data) : undefined
            })
            .then(
                (data: any) => {
                    resolve(data);
                },
                (response: JQueryXHR) => {
                    if (response.status === 401 && response.responseText) {
                        //assuming 401 means that websudo session is expired
                        AJS.flag({
                            type: 'error',
                            body: JSON.parse(response.responseText).message
                                + '<ul class="aui-nav-actions-list">'
                                + '<li><a href="javascript:location.reload()">Reload page</a></li>'
                                + '</ul>',
                        });
                        return;
                    }

                    if (!(response.status && response.statusText)) {
                        reject({
                            message: 'Error occurred',
                            response
                        });
                        return;
                    }

                    let data: ErrorDataType = {message: `${response.status}: ${response.statusText}`};

                    if (response.responseText) {
                        try {
                            data = JSON.parse(response.responseText);
                        } catch (e) {
                            data = {message: response.responseText};
                        }
                    }

                    reject({
                        response: {
                            ...response,
                            data: data
                        },
                        message: `${response.status}: ${response.statusText}`
                    });
                }
            );
    });
}

export function ajaxGet(url: string): Promise<any> {
    return ajaxPromise(url, 'GET');
}

export function ajaxDelete(url: string): Promise<any> {
    return ajaxPromise(url, 'DELETE');
}

export function ajaxPost(url: string, data?: any): Promise<any> {
    return ajaxPromise(url, 'POST', null, data);
}

export function ajaxPut(url: string, data: any): Promise<any> {
    return ajaxPromise(url, 'PUT', null, data);
}
