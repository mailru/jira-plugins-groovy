import {HttpMethod, ScriptEntity} from '../common/types';


export type RestScriptType = ScriptEntity & {
    uuid: string,
    methods: ReadonlyArray<HttpMethod>,
    groups: ReadonlyArray<string>
};
