import React, {Fragment, ReactNode} from 'react';

import memoizeOne from 'memoize-one';

import ModalDialog from '@atlaskit/modal-dialog';

import {PropField} from './PropField';

import {AdminScriptOutcomeType, AdminScriptType} from './types';
import {customRenderers} from './customRenderers';

import {CommonMessages} from '../i18n/common.i18n';
import {AdminScriptMessages} from '../i18n/admin.i18n';

import {VoidCallback} from '../common/types';
import {ParamType} from '../app-workflow/types';
import {adminScriptService} from '../service';
import {LoadingSpinner} from '../common/ak/LoadingSpinner';
import {SingleValueType} from '../common/ak/types';
import {ErrorMessage, InfoMessage, SuccessMessage} from '../common/ak/messages';


type Props = {
    script: AdminScriptType,
    onClose: VoidCallback
};

type State = {
    stage: 'params' | 'running' | 'done',
    values: {[key in string]: any},
    outcome: AdminScriptOutcomeType | null,
};

const selectTypes = ['CUSTOM_FIELD', 'USER', 'GROUP', 'RESOLUTION'];


export class RunDialog extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        let values;
        if (props.script.defaultValues) {
            values = {...props.script.defaultValues};
        } else {
            values = {};
        }

        this.state = {
            stage: 'params',
            values: values,
            outcome: null
        };
    }

    _run = () => {
        const {script} = this.props;
        const {values} = this.state;

        this.setState({
            stage: 'running',
            outcome: null
        });

        const params: {[key in string]: any} = {};

        if (script.params) {
            for (const param of script.params) {
                let value: string | null|SingleValueType |ReadonlyArray<SingleValueType>|boolean = values[param.name];

                if (param.paramType === 'MULTI_USER' && Array.isArray(value)) {
                    value = value.map(it => it.value).join(';');
                } else if (selectTypes.includes(param.paramType) && typeof value !== 'string' && typeof value !== 'boolean' && !Array.isArray(value)) {
                    value = value && 'value' in value ? value.value : null;
                } else if (param.paramType === 'BOOLEAN') {
                    value = value || false;
                }

                params[param.name] = value;
            }
        }

        const promise = script.builtIn && script.builtInKey
            ? adminScriptService.runBuiltInScript(script.builtInKey, params)
            : adminScriptService.runUserScript(script.id, params);

        promise
            .then(outcome => this.setState({
                outcome,
                stage: 'done'
            }));
    };

    _updateValue = memoizeOne(field => (value: any) => this.setState(state => ({
        values: {
            ...state.values,
            [field]: value
        }
    })));

    _renderFields = (): ReactNode => {
        const {params} = this.props.script;

        if (!params || !params.length) {
            return <InfoMessage title={AdminScriptMessages.noParams}/>;
        }

        return (
            <div className="flex-column">
                {params.map((param: ParamType): ReactNode =>
                    <PropField
                        key={param.name}
                        label={param.displayName}
                        isRequired={!param.optional}
                        onChange={this._updateValue(param.name)}

                        value={{
                            type: param.paramType,
                            value: this.state.values[param.name]
                        }}
                    />
                )}
            </div>
        );
    };

    _getActions = () => {
        const {onClose} = this.props;
        const {stage, outcome} = this.state;

        switch (stage) {
            case 'params':
                return [
                    {
                        text: CommonMessages.run,
                        onClick: this._run,
                    },
                    {
                        text: CommonMessages.cancel,
                        onClick: onClose,
                    }
                ];
            case 'done':
                if (outcome && outcome.success) {
                    return [
                        {
                            text: CommonMessages.close,
                            onClick: onClose,
                        },
                        {
                            text: AdminScriptMessages.modifyAndRun,
                            onClick: () => this.setState({ stage: 'params' })
                        },
                        {
                            text: AdminScriptMessages.runAgain,
                            onClick: this._run
                        }
                    ];
                } else {
                    return [
                        {
                            text: CommonMessages.back,
                            onClick: () => this.setState({ stage: 'params' })
                        },
                        {
                            text: CommonMessages.close,
                            onClick: onClose,
                        }
                    ];
                }
            default:
                return [];
        }
    };

    _renderOutcome() {
        const {script} = this.props;
        const {outcome} = this.state;

        if (!outcome) {
            return null;
        }

        let result: ReactNode = null;

        if (outcome.success) {
            if (script.builtIn && script.builtInKey && customRenderers.hasOwnProperty(script.builtInKey)) {
                result = (
                    <Fragment>
                        <SuccessMessage title="Done"/>
                        {customRenderers[script.builtInKey](outcome.message)}
                    </Fragment>
                );
            } else {
                result = (
                    <Fragment>
                        <SuccessMessage title="Done">
                            {!script.html &&
                                <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                                    {outcome.message && outcome.message.toString()}
                                </pre>
                            }
                        </SuccessMessage>
                        {script.html && outcome.message && <div dangerouslySetInnerHTML={{__html: outcome.message}}/>}
                    </Fragment>
                );
            }
        } else {
            result = <ErrorMessage title="Error occurred">{outcome.message}</ErrorMessage>;
        }

        return result;
    }

    render() {
        const {script, onClose} = this.props;
        const {stage, outcome} = this.state;

        const isDone = stage === 'done' && outcome;

        let content: ReactNode = null;

        if (stage === 'params') {
            content = this._renderFields();
        } else if (stage === 'running') {
            content = <LoadingSpinner/>;
        } else if (isDone) {
            content = this._renderOutcome();
        }

        return (
            <ModalDialog
                width={isDone ? (script.resultWidth || 'medium') : 'medium'}
                scrollBehavior="outside"

                isHeadingMultiline={false}
                heading={script.name}

                onClose={stage !== 'running' ? onClose : undefined}
                actions={this._getActions()}
            >
                {content}
            </ModalDialog>
        );
    }
}
