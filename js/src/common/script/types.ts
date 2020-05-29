export type IssueReference = {
    key: string,
    summary: string
};

//todo: move to common
export type JiraUser = {
    name: string,
    displayName: string,
    avatarUrl?: string
};

export type ChangelogType = {
    id: number,
    comment: string,
    before?: string,
    after?: string,
    templateDiff?: string,
    author: JiraUser,
    date: string,
    issueReferences: Array<IssueReference>,
    warnings: number,
    errors: number
};

export type ExecutionType = {
    id: number,
    scriptId: string,
    time: number,
    success: boolean,
    slow: boolean,
    date: string,
    extraParams: {[key in string]: string},
    error?: string,
    log?: string
};

export type ScriptId = number | string;

export type ScriptType = {
    id: ScriptId,
    name: string,
    description?: string | null,
    scriptBody?: string,
    inline?: boolean,
    changelogs?: Array<ChangelogType>,
    errorCount?: number,
    warningCount?: number
};
