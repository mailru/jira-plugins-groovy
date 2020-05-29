declare module 'AJS' {
    // eslint-disable-next-line import/no-unresolved
    import jquery from 'jquery';


    type FlagParameters = {
        title?: string,
        type?: 'success' | 'info' | 'warning' | 'error',
        body?: string,
        close?: 'auto' | 'manual' | 'never'
    };

    interface Meta {
        get(key: string): string
    }

    type FlagType = {
        close(): void
    };

    interface AJS {
        contextPath(): string,
        flag(params: FlagParameters): FlagType,
        getText(key: string, ...params: string[]): string,
        toInit: (func: Function) => void,
        $: typeof jquery,
        Meta: Meta,
    }

    const ajs: AJS;

    export default ajs;
}

declare module 'extDefine' {
    export default function(name: string, factory: () => any): void;
}
