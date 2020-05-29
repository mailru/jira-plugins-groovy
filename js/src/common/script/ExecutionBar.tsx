//@flow
import React, {ReactNode} from 'react';

import Tooltip from '@atlaskit/tooltip';
import {colors} from '@atlaskit/theme';

import ErrorIcon from '@atlaskit/icon/glyph/error';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import WarningIcon from '@atlaskit/icon/glyph/warning';

import {ExecutionDialog} from './ExecutionDialog';
import {ExecutionType} from './types';

import {VoidCallback} from '../types';

import {FieldMessages} from '../../i18n/common.i18n';

import './ExecutionBar.less';


type ExecutionBarProps = {
    executions: ReadonlyArray<ExecutionType>
};

type ExecutionBarState = {
    displayedExecution?: ExecutionType | null
};

export class ExecutionBar extends React.PureComponent<ExecutionBarProps, ExecutionBarState> {
    state: ExecutionBarState = {
        displayedExecution: null
    };

    _showExecution = (execution: ExecutionType) => () => this.setState({ displayedExecution: execution });

    _hideExecution = () => this.setState({ displayedExecution: null });

    render() {
        const {displayedExecution} = this.state;

        return (
            <div className="executionBar">
                {this.props.executions.map(execution =>
                    <ExecutionItem key={execution.id} execution={execution} onClick={this._showExecution(execution)}/>
                )}
                {displayedExecution && <ExecutionDialog onClose={this._hideExecution} execution={displayedExecution}/>}
            </div>
        );
    }
}

type ExecutionItemProps = {
    execution: ExecutionType,
    onClick: VoidCallback
};

class ExecutionItem extends React.PureComponent<ExecutionItemProps> {
    _getIcon = (): ReactNode => {
        const {execution} = this.props;

        if (!execution.success) {
            return <ErrorIcon label="error" size="small" primaryColor={colors.R300}/>;
        }
        if (execution.slow) {
            return <WarningIcon label="warning" size="small" primaryColor={colors.Y300}/>;
        }

        return <CheckCircleIcon label="success" size="small" primaryColor={colors.G300}/>;
    };

    render() {
        const execution = this.props.execution;
        const params = execution.extraParams || {};

        return (
            <Tooltip
                content={
                    <div className="flex-column">
                        <strong>
                            {execution.extraParams.type || ''}
                        </strong>
                        {params.issue && <span>{FieldMessages.issue}{': '}{params.issue}</span>}
                        <span>
                            {execution.date}{' - '}{execution.time}{' ms'}
                        </span>
                    </div>
                }
            >
                <div className="executionItem" onClick={this.props.onClick}>
                    {this._getIcon()}
                </div>
            </Tooltip>
        );
    }
}
