import React, {ReactElement, ReactNode} from 'react';

import ErrorIcon from '@atlaskit/icon/glyph/error';

import './FieldError.less';


type FieldErrorProps = {
    error: ReactNode
};

export function FieldError({error}: FieldErrorProps): ReactElement {
    return (
        <div className="FieldError">
            <ErrorIcon label="error icon" />
            {error}
        </div>
    );
}
