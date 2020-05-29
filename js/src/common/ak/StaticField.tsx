import React, {ReactElement, ReactNode} from 'react';

import {Label} from '@atlaskit/field-base';

import './StaticField.less';


type StaticFieldValueProps = {
    children: ReactNode
};

function StaticFieldValue({children}: StaticFieldValueProps): ReactElement {
    return <div className="static-field">{children}</div>;
}

type StaticFieldProps = {
    label: string,
    isValidationHidden: boolean,
    children: ReactNode
};

export function StaticField({label, children, isValidationHidden}: StaticFieldProps): ReactElement {
    if (isValidationHidden) {
        return (
            <StaticFieldValue>
                {children}
            </StaticFieldValue>
        );
    }

    return (
        <div>
            <Label label={label}/>
            <StaticFieldValue>
                {children}
            </StaticFieldValue>
        </div>
    );
}

StaticField.defaultProps = {
    isValidationHidden: false
};
