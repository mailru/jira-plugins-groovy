export type MarkerType = {
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    message: string,
    severity: 'error' | 'warning'
};

export type TypeDoc = {
    className: string,
    link: string | null
};

export type ParameterDoc = {
    type: TypeDoc,
    name: string
};

export type MethodDoc = {
    name: string,
    description: string | null,
    returnType: TypeDoc,
    parameters: ReadonlyArray<ParameterDoc>
};

export type ClassDoc = {
    builtIn: boolean,
    className: string,
    href: string | null,
    description: string | null,
    methods: ReadonlyArray<MethodDoc> | null
};

export type VariableType = {
    className: string,
    fullClassName: string,
    javaDoc?: string,
    classDoc?: ClassDoc
};

export type BindingType = VariableType & {
    name: string
};

export type ReturnType = VariableType & {
    label?: string,
    optional?: boolean
};
