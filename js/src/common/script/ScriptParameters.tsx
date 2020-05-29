import React, {ReactNode} from 'react';

import {Label} from '@atlaskit/field-base';

import {notNull} from '../tsUtil';


export type ScriptParam = {
    label: string,
    value: ReactNode
};

type ScriptParametersProps = {
    params: Array<ScriptParam | null>
};

export class ScriptParameters extends React.PureComponent<ScriptParametersProps> {
    render() {
        const {params} = this.props;

        return (
            <div className="scriptParams">
                {params.filter(notNull).map((param, i) =>
                    <div className="item" key={i}>
                        <div className="label">
                            <Label label={`${param.label}:`} isFirstChild={true}/>
                        </div>
                        <div className="value">
                            {param.value}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
