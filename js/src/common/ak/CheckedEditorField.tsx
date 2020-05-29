import React, {ComponentPropsWithRef} from 'react';

import {debounce, isEqual} from 'lodash';

import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {EditorField} from './EditorField';

import {extrasService} from '../../service';
import {getMarkers} from '../error';
import {transformMarkers, AnnotationType, ValidationState} from '../editor';

import {SyntaxError} from '../types';


type State = {
    validationState: ValidationState
};

export type StaticCheckScriptType = 'CONSOLE' | 'WORKFLOW_GENERIC' | 'ADMIN_SCRIPT' | 'REST' | 'CUSTOM_FIELD' | 'SCHEDULED_TASK' | 'LISTENER' | 'JQL' | 'GLOBAL_OBJECT';

type Props = JSX.LibraryManagedAttributes<typeof EditorField, ComponentPropsWithRef<typeof EditorField>> & {
    scriptType: StaticCheckScriptType,
    typeParams?: {[key in string]: string | undefined}
};

type AnnotationsType = Array<AnnotationType>;
type MonacoType = typeof monaco;

export class CheckedEditorField extends React.Component<Props, State> {
    state: State = {
        validationState: 'valid'
    };

    editor: monaco.editor.IEditor | null = null;
    monaco: typeof monaco | null = null;
    lastRequestedValue: string | null = null;
    cachedPromise: Promise<AnnotationsType> | null = null;

    _setEditor = (editor: monaco.editor.IEditor, monaco: MonacoType) => {
        this.editor = editor;
        this.monaco = monaco;

        this._runLinter();
    };

    _checkScript = (value: string, callback: (annotations: Array<AnnotationType>) => void) => {
        const {scriptType, typeParams} = this.props;

        if (this.lastRequestedValue !== value) {
            this.cachedPromise = null;
        }

        this.lastRequestedValue = value;

        if (!value) {
            this.setState({ validationState: 'valid' });
            callback([]);
            return;
        }

        let promise: Promise<AnnotationsType> | null = this.cachedPromise;

        if (!promise) {
            this.setState({ validationState: 'waiting' });

            promise = this.cachedPromise = extrasService
                .checkScript(value, scriptType, typeParams)
                .then((result: Array<SyntaxError>): AnnotationsType => {
                    if (value === this.lastRequestedValue) {
                        const hasErrors = result.some(it => it.type === 'error');

                        this.setState({ validationState: result.length ? (hasErrors ? 'hasErrors' : 'hasWarnings') : 'valid' });
                        return transformMarkers(getMarkers(result));
                    }
                    return [];
                })
                .catch((e): AnnotationsType => {
                    if (value === this.lastRequestedValue) {
                        const {response} = e;

                        if (response.status === 400) {
                            this.setState({ validationState: 'hasErrors' });
                            return transformMarkers(getMarkers(response.data.error));
                        } else {
                            this.setState({ validationState: 'checkFailed' });
                            throw e;
                        }
                    }
                    return [];
                });
        }

        if (promise) {
            promise.then(annotations => callback(annotations));
        } else {
            console.error('no promise');
        }
    };

    componentDidUpdate(prevProps: Props) {
        if (!isEqual(prevProps.typeParams, this.props.typeParams) || prevProps.value !== this.props.value) {
            if (this.editor) {
                this.cachedPromise = null;
                this.lastRequestedValue = null;
                this._runLinter();
            }
        }
    }

    _runLinter = debounce(
        () => {
            const {monaco, editor} = this;
            if (monaco && editor) {
                this._checkScript(this.props.value || '', markers => {
                    monaco.editor.setModelMarkers(editor.getModel() as monaco.editor.ITextModel, 'linter', markers);
                });
            }
        },
        1000
    );

    render() {
        const {scriptType, typeParams, ...props} = this.props;
        const {validationState} = this.state;

        return (<EditorField
            {...props}
            editorDidMount={this._setEditor}
            linter={this._checkScript}
            validationState={validationState}
        />);
    }
}
