export type ParamTypeEnum = 'BOOLEAN' | 'STRING' | 'TEXT' | 'LONG' | 'DOUBLE' | 'CUSTOM_FIELD' | 'USER' | 'MULTI_USER' | 'GROUP' | 'RESOLUTION' | 'SCRIPT';

export type ParamType = {
    name: string,
    displayName: string,
    paramType: ParamTypeEnum,
    optional: boolean
};

export type ScriptType = 'CONDITION' | 'VALIDATOR' | 'FUNCTION';

export type ScriptDescriptionType = {
    id: number,
    name: string,
    description: string | null,
    params: Array<ParamType> | null
};
