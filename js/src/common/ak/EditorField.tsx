import React, {ReactNode} from 'react';

import Base from '@atlaskit/field-base';

import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {FieldProps, MutableFieldProps, AkFormFieldProps} from '../types';

import Editor, {EditorThemeContextConsumer, ValidationState, LinterType, BindingType, MarkerType, ReturnType} from '../editor';


import './EditorField.less';


type EditorFieldProps = FieldProps & MutableFieldProps<string> & AkFormFieldProps & {
    mode: string,
    markers?: ReadonlyArray<MarkerType>,
    bindings?: ReadonlyArray<BindingType> | null,
    returnTypes?: ReadonlyArray<ReturnType>,
    resizable?: boolean,
    validationState?: ValidationState,
    editorDidMount?: (editor: monaco.editor.IEditor, monacoInst: typeof monaco) => void,
    linter?: LinterType,
};

export class EditorField extends React.Component<EditorFieldProps> {
    static defaultProps = {
        mode: 'groovy',
        isValidationHidden: false
    };

    _decorateEditor = (editor: ReactNode): ReactNode => {
        const {isInvalid, invalidMessage, isValidationHidden, isRequired, isDisabled} = this.props;

        return (
            <Base
                invalidMessage={invalidMessage}
                isPaddingDisabled={true}
                isDisabled={isDisabled}
                isFitContainerWidthEnabled={true}
                isValidationHidden={isValidationHidden}
                isInvalid={isInvalid}
                isRequired={isRequired}
            >
                {editor}
            </Base>
        );
    };

    render() {
        const {value, label, isRequired, isLabelHidden, mode, shouldFitContainer, isInvalid, invalidMessage, isValidationHidden, ...props} = this.props;

        return (
            <div className="ak-editor">
                <EditorThemeContextConsumer>
                    {context =>
                        <Editor
                            decorator={this._decorateEditor}
                            mode={mode}
                            value={value || ''}
                            {...context}
                            {...props}
                        />
                    }
                </EditorThemeContextConsumer>
            </div>
        );
    }
}
