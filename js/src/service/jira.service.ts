import {ajaxGet, ajaxPost, getBaseUrl, getPluginBaseUrl} from './ajaxHelper';

import {JqlQueryValidationResult} from './types';

import {ProjectType, IssueEventType} from '../common/types';


export class JiraService {
    getAllProjects(): Promise<Array<ProjectType>> {
        return ajaxGet(`${getBaseUrl()}/rest/api/2/project`);
    }

    getEventTypes(): Promise<Array<IssueEventType>> {
        return ajaxGet(`${getPluginBaseUrl()}/jira-api/eventType`);
    }

    validateQuery(query: string): Promise<JqlQueryValidationResult> {
        return ajaxPost(
            `${getBaseUrl()}/rest/api/2/search`,
            {
                jql: query,
                validateQuery: true,
                maxResults: 0
            }
        );
    }
}
