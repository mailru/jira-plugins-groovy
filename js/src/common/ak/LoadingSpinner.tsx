import React, {ReactElement} from 'react';

import Spinner from '@atlaskit/spinner';

import './LoadingSpinner.less';


export function LoadingSpinner(): ReactElement {
    return (
        <div className="LoadingSpinner">
            <div className="flex-horizontal-middle">
                <Spinner size="medium"/>
            </div>
        </div>
    );
}
