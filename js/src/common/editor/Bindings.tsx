import React, {Fragment} from 'react';

import {Label} from '@atlaskit/field-base';
import InlineMessage from '@atlaskit/inline-message';
import Lozenge from '@atlaskit/lozenge';
import Tooltip from '@atlaskit/tooltip';

import QuestionIcon from '@atlaskit/icon/glyph/question';

import {GlobalBindings} from './GlobalBindings';
import {ClassDocViewer} from './ClassDocViewer';
import {Binding} from './Binding';

import {BindingType, ClassDoc, ReturnType} from './types';

import {CommonMessages} from '../../i18n/common.i18n';


type Props = {
    bindings: ReadonlyArray<BindingType>,
    returnTypes?: ReadonlyArray<ReturnType>
};

type State = {
    viewingDoc: ClassDoc | null
};

export class Bindings extends React.PureComponent<Props, State> {
    state: State = {
        viewingDoc: null
    };

    _viewDoc = (doc: ClassDoc) => this.setState({ viewingDoc: doc });

    _closeDoc = () => this.setState({ viewingDoc: null });

    render() {
        const {bindings, returnTypes} = this.props;
        const {viewingDoc} = this.state;

        return (
            <Fragment>
                {viewingDoc && <ClassDocViewer classDoc={viewingDoc} onClose={this._closeDoc}/>}
                <InlineMessage type="info" placement="top-end">
                    <div className="flex-column Bindings">
                        <GlobalBindings onOpenDoc={this._viewDoc}/>
                        <hr className="full-width"/>
                        {bindings.map(binding => <Binding key={binding.name} binding={binding}/>)}
                        {returnTypes &&
                            <Fragment>
                                <hr className="full-width"/>
                                <Label label={CommonMessages.returnTypes} isFirstChild={true}/>
                                {returnTypes.map((e, i) =>
                                    <div className="flex-row" key={i}>
                                        {e.label &&
                                            <Fragment>
                                                <div className="flex-none">
                                                    <Lozenge>{e.label}</Lozenge>
                                                </div>
                                                <div className="flex-grow"/>
                                            </Fragment>
                                        }
                                        {e.optional &&
                                            <div className="flex-vertical-middle">
                                                <Tooltip content="Optional">
                                                    <QuestionIcon size="small" label="optional"/>
                                                </Tooltip>
                                            </div>
                                        }
                                        <div className="flex-none" style={{marginLeft: '5px'}}>
                                            {e.javaDoc
                                                ? (
                                                    <a
                                                        href={e.javaDoc}
                                                        title={e.fullClassName}

                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {e.className}
                                                    </a>
                                                )
                                                : <abbr title={e.fullClassName}>{e.className}</abbr>
                                            }
                                        </div>
                                    </div>
                                )}
                            </Fragment>
                        }
                    </div>
                </InlineMessage>
            </Fragment>
        );
    }
}
