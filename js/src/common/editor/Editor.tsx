import React, {ReactNode} from 'react';

import memoizeOne from 'memoize-one';

import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import {colors} from '@atlaskit/theme';

import QuestionCircleIcon from '@atlaskit/icon/glyph/question-circle';
import CrossCircleIcon from '@atlaskit/icon/glyph/cross-circle';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import WarningIcon from '@atlaskit/icon/glyph/jira/failed-build-status';

import {Resizable} from 'react-resizable';

import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {Bindings} from './Bindings';
import {CodeMirror} from './CM';

import {BindingType, MarkerType, ReturnType} from './types';

import {CommonMessages} from '../../i18n/common.i18n';

import './Editor.less';


export type CodeMirrorType = {
    setSize: (width?: number|string, height?: number|string) => void,
    performLint: () => void
};

type ResizeCallbackData = {
    node: HTMLElement,
    size: {width: number, height: number}
};

type CodeMirrorOptions = any;

type EditorPosition = {
    line: number,
    ch: number
};

export type AnnotationType = {
    message: string,
    source: string,
    severity: number,
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
};

export type ValidationState = 'waiting' | 'valid' | 'checkFailed' | 'hasErrors' | 'hasWarnings';

type MarkersCallback = (annotations: Array<AnnotationType>) => void;
export type LinterType = (value: string, callback: MarkersCallback) => void;

type MonacoType = typeof monaco;

type EditorProps = {
    mode: string,
    value?: string,
    original?: string,
    onChange?: (value: string) => void,
    isDisabled?: boolean,

    isLight: boolean,
    toggleTheme: () => void,

    markers?: ReadonlyArray<MarkerType>,
    bindings?: ReadonlyArray<BindingType> | null,
    returnTypes?: ReadonlyArray<ReturnType>,
    readOnly?: boolean,
    decorated?: boolean,
    resizable?: boolean,
    decorator?: (node: ReactNode) => ReactNode,
    linter?: LinterType,
    validationState?: ValidationState,
    editorDidMount?: (editor: monaco.editor.IEditor, monaco: MonacoType) => void
};

type EditorState = {
    height: number
};

export function transformMarkers(markers?: Array<MarkerType>): Array<AnnotationType> {
    if (markers) {
        return markers.map(
            (marker: MarkerType): AnnotationType => {
                return {
                    message: marker.message,
                    severity: marker.severity === 'error' ? 8 : 4,
                    startLineNumber: marker.startRow,
                    startColumn: marker.startCol,
                    endLineNumber: marker.endRow,
                    endColumn: marker.endCol,
                    source: 'linter'
                };
            }
        );
    }
    return [];
}

//todo: handle window resize
//todo: remember height for console
//todo: change to PureComponent
//todo: move theme state to redux
export class Editor extends React.Component<EditorProps, EditorState> {
    static defaultProps = {
        isLight: false
    };

    editor: monaco.editor.IEditor | null = null;
    monaco: MonacoType | null = null;

    state: EditorState = {
        height: 300
    };

    _setEditor = (editor: monaco.editor.IEditor, monaco: MonacoType) => {
        this.editor = editor;
        this.monaco = monaco;
        this.editor.layout();

        if (this.props.editorDidMount) {
            this.props.editorDidMount(editor, monaco);
        }
    };

    _onChange = (value: string) => {
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    };

    _resize = (_e: any, {size}: ResizeCallbackData) => {
        this.setState({height: size.height});
    };

    componentDidUpdate(prevProps: EditorProps, prevState: EditorState) {
        if (prevState.height !== this.state.height) {
            if (this.editor) {
                this.editor.layout();
            }
        }
    }

    _getOptions = memoizeOne(
        (readOnly?: boolean, isDisabled?: boolean, mode?: string, isLight?: boolean): CodeMirrorOptions => {
            return {
                theme: isLight ? 'vs' : 'vs-dark',
                mode: mode,
                readOnly: readOnly || isDisabled || false,
                lineNumbers: true,
                foldGutter: true,
                gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                //todo: remove for now, too big performance hit
                //viewportMargin: Infinity
            };
        }
    );

    _renderValidationIcon() {
        switch (this.props.validationState) {
            case 'hasErrors':
                return <CrossCircleIcon label="error" primaryColor={colors.R400}/>;
            case 'hasWarnings':
                return <WarningIcon label="warning" primaryColor={colors.Y400}/>;
            case 'checkFailed':
                return <QuestionCircleIcon label="what" primaryColor={colors.R400} />;
            case 'valid':
                return <CheckCircleIcon label="ok" primaryColor={colors.G400}/>;
            case 'waiting':
                return <Spinner/>;
            default:
                return null;
        }
    }

    render() {
        const {onChange, value, original, isLight, toggleTheme, bindings, returnTypes, decorated, resizable, decorator, readOnly, isDisabled, mode, validationState} = this.props;

        const options = this._getOptions(readOnly, isDisabled, mode, isLight);

        let el: ReactNode = (
            <CodeMirror
                options={options}

                onBeforeChange={onChange && this._onChange}
                value={value || ''}
                original={original}
                editorDidMount={this._setEditor}
            />
        );

        if (resizable) {
            el = (
                <Resizable height={this.state.height} width={100} axis="y" onResize={this._resize}>
                    <div style={{width: '100%', height: `${this.state.height}px`, overflow: 'hidden'}}>
                        {el}
                    </div>
                </Resizable>
            );
        } else {
            el = (
                <div style={{width: '100%', height: '300px', overflow: 'hidden'}}>
                    {el}
                </div>
            );
        }

        if (decorator) {
            el = decorator(el);
        }

        return (
            <div className="Editor">
                <div className={`CodeEditor ${decorated ? 'DecoratedEditor' : ''}`}>
                    {el}
                </div>
                <div className="EditorInfo">
                    <div style={{color: 'grey'}}>
                        {CommonMessages.editorMode}{' '}
                        <strong>{options.mode}</strong>
                    </div>
                    <div className="flex-grow"/>
                    <div className="flex-vertical-middle">
                        <Button appearance="link" spacing="none" onClick={toggleTheme}>
                            {CommonMessages.switchTheme}
                        </Button>
                    </div>
                    {bindings &&
                        <div style={{marginLeft: '4px'}}>
                            <Bindings returnTypes={returnTypes} bindings={bindings}/>
                        </div>
                    }
                    {validationState && <div style={{marginLeft: '4px'}}>{this._renderValidationIcon()}</div>}
                </div>
            </div>
        );
    }
}

