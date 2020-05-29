import React from 'react';

import memoizeOne from 'memoize-one';
import {connect} from 'react-redux';

import {Draggable} from 'react-beautiful-dnd';

import Badge from '@atlaskit/badge';
import {colors} from '@atlaskit/theme';

import CodeIcon from '@atlaskit/icon/glyph/code';

import {RegistryScript, PublicRegistryScriptProps} from './RegistryScript';
import {ScriptUsageType} from './types';
import {RootState} from './redux';

import {focusOnRender} from '../common/script-list';


type Props = {
    index: number,
    scriptUsage: ScriptUsageType
};

export class DraggableRegistryScriptInternal extends React.PureComponent<PublicRegistryScriptProps & Props> {
    render() {
        const {script, scriptUsage, index, ...otherProps} = this.props;
        const isUsed = !scriptUsage.ready || ((scriptUsage.items[script.id] || 0) > 0);

        return (
            <div className="DraggableScript">
                <Draggable index={index} draggableId={`${this.props.script.id}`} type="script">
                    {(provided) => (
                        <RegistryScript
                            title={
                                <div className="flex-grow flex-row" {...provided.dragHandleProps}>
                                    <div className="flex-vertical-middle flex-none">
                                        <CodeIcon label=""/>
                                    </div>
                                    {' '}
                                    <div className="flex-vertical-middle">
                                        <h3 title={script.name} className={!isUsed ? 'muted-text' : undefined}>
                                            {script.name}
                                        </h3>
                                    </div>
                                    {!!script.warningCount &&
                                        <div className="flex-vertical-middle flex-none errorCount">
                                            <div>
                                                <Badge
                                                    max={99}
                                                    appearance={{ backgroundColor: colors.Y400, textColor: colors.N0 }}
                                                >
                                                    {script.warningCount}
                                                </Badge>
                                            </div>
                                        </div>
                                    }
                                    {!!script.errorCount &&
                                        <div className="flex-vertical-middle flex-none errorCount">
                                            <div>
                                                <Badge
                                                    max={99}
                                                    appearance="important"
                                                >
                                                    {script.errorCount}
                                                </Badge>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                            wrapperProps={{ ...provided.draggableProps, ref: provided.innerRef }}
                            script={script}
                            {...otherProps}
                        />
                    )}
                </Draggable>
            </div>
        );
    }
}

export const DraggableRegistryScript = focusOnRender(
    connect(
        memoizeOne( ({scriptUsage}: RootState) => ({ scriptUsage }) )
    )(DraggableRegistryScriptInternal)
);
