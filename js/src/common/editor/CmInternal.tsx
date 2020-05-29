import React from 'react';
import memoizeOne from 'memoize-one';

import MonacoEditor, {MonacoDiffEditor} from 'react-monaco-editor';

//todo: props types
export class CodeMirrorInternal extends React.PureComponent<any> {
    _transformOptions = memoizeOne(
        (options: any): any => {
            const {readOnly, ...etc} = options;

            return {
                readOnly,
                scrollBeyondLastLine: !!readOnly,
                renderSideBySide: false,
                scrollbar: {
                    alwaysConsumeMouseWheel: false
                }
            };
        }
    );

    render() {
        const {value, original, onBeforeChange, options, editorDidMount, ...etc} = this.props;
        //todo: value, onBeforeChange, options
        const {theme, mode} = options;

        if (mode === 'diff') {
            return (
                <MonacoDiffEditor
                    value={value}
                    original={original}
                    theme={theme}
                    language="groovy"
                    editorDidMount={editorDidMount}
                    options={this._transformOptions(options)}
                />
            );
        } else {
            return (
                <MonacoEditor
                    value={value}
                    theme={theme}
                    language={mode}
                    onChange={onBeforeChange}
                    editorDidMount={editorDidMount}
                    options={this._transformOptions(options)}
                />
            );
        }
    }
}
