import {ScriptEntity} from '../common/types';
import {SingleValueType} from '../common/ak/types';

//todo: rename
export type ScheduledTaskTypeType = {
    name: string,
    fields: ReadonlyArray<'scriptBody'|'issueJql'|'workflowAction'|'transitionOptions'>
};

export type KeyedScheduledTaskTypeType = {
    key: string,
    name: string,
    fields: ReadonlyArray<'scriptBody'|'issueJql'|'workflowAction'|'transitionOptions'>
};

//todo: move somewhere else
export const types: {[key in string]: ScheduledTaskTypeType} = {
    BASIC_SCRIPT: {
        name: 'Basic script',
        fields: ['scriptBody']
    },
    ISSUE_JQL_SCRIPT: {
        name: 'JQL issue script',
        fields: ['issueJql', 'scriptBody']
    },
    DOCUMENT_ISSUE_JQL_SCRIPT: {
        name: 'JQL document issue script',
        fields: ['issueJql', 'scriptBody']
    },
    ISSUE_JQL_TRANSITION: {
        name: 'JQL issue transition',
        fields: ['issueJql', 'workflowAction', 'transitionOptions']
    }
};

export const typeList: ReadonlyArray<KeyedScheduledTaskTypeType> = Object
    .keys(types)
    .map( key => ({ ...(types[key]), key }) );


export type ScheduledTaskTypeEnum = 'BASIC_SCRIPT' | 'ISSUE_JQL_SCRIPT' | 'ISSUE_JQL_TRANSITION' | 'DOCUMENT_ISSUE_JQL_SCRIPT';

export type TransitionOptionsType = {
    skipConditions?: boolean,
    skipValidators?: boolean,
    skipPermissions?: boolean
};

export type RunOutcomeType = 'SUCCESS' | 'UNAVAILABLE' | 'ABORTED' | 'FAILED' | 'NOT_RAN';

export type RunInfoType = {
    startDate: string,
    duration: number,
    outcome: RunOutcomeType,
    message: string | null
};

export type ScheduledTaskType = ScriptEntity & {
    id: number,
    uuid: string,
    type: ScheduledTaskTypeEnum,
    enabled: boolean,
    scheduleExpression: string,
    user: SingleValueType | null,
    issueJql: string | null,
    issueWorkflow: SingleValueType | null,
    issueWorkflowAction: SingleValueType | null,
    transitionOptions: TransitionOptionsType | null,
    lastRunInfo: RunInfoType | null,
    nextRunDate: string | null
};

export type RunNowResultType = {
    time: number,
    runOutcome: RunOutcomeType,
    message: string | null
};
