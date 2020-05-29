import React, {ReactElement} from 'react';

import ModalDialog from '@atlaskit/modal-dialog';

import {ExecutionType} from './types';

import {VoidCallback} from '../types';

import {CommonMessages, FieldMessages} from '../../i18n/common.i18n';
import {StaticField} from '../ak';


type Props = {
    onClose: VoidCallback,
    execution: ExecutionType
};

export function ExecutionDialog({onClose, execution}: Props): ReactElement {
    const bindings = execution.extraParams;

    return (<ModalDialog
        width="x-large"
        heading="Execution info" //todo: i18n
        onClose={onClose}
        actions={[
            {
                text: CommonMessages.cancel,
                onClick: onClose
            }
        ]}
    >
        <div className="flex-column">
            <StaticField label={FieldMessages.date}>
                {execution.date}
            </StaticField>
            <StaticField label={FieldMessages.time}>
                {execution.time}{' ms'}
            </StaticField>
            <StaticField label={FieldMessages.successful}>
                {execution.success ? 'yes' : 'no'}
            </StaticField>
            {bindings &&
                <div className="flex-column">
                    {Object.keys(bindings).map(key =>
                        <StaticField label={key} key={key}>
                            <pre style={{overflowX: 'auto'}}>
                                {bindings[key]}
                            </pre>
                        </StaticField>
                    )}
                </div>
            }
            {execution.error &&
                <StaticField label={CommonMessages.error}>
                    <pre style={{overflowX: 'auto'}}>
                        {execution.error}
                    </pre>
                </StaticField>
            }
            {execution.log &&
                <StaticField label={CommonMessages.log}>
                    <pre style={{overflowX: 'auto'}}>
                        {execution.log}
                    </pre>
                </StaticField>
            }
        </div>
    </ModalDialog>);
}
