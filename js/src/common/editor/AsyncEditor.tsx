import onigasmWasm from 'onigasm/lib/onigasm.wasm';

// eslint-disable-next-line import/no-unresolved
import * as monaco from 'monaco-editor';
import {Registry} from 'monaco-textmate';
import {wireTmGrammars} from 'monaco-editor-textmate';
import {loadWASM} from 'onigasm';

import {CodeMirrorInternal} from './CmInternal';

import groovyGrammar from './groovy-lang.json';

import {ajaxPost, getPluginBaseUrl} from '../../service/ajaxHelper';


export default () => loadWASM(onigasmWasm)
    .then(() => {
        monaco.languages.register({ id: 'groovy' });

        const grammarRegistry = new Registry({
            getGrammarDefinition: (scopeName: string) => {
                if (scopeName === 'source.groovy') {
                    return Promise.resolve({
                        format: 'json',
                        content: groovyGrammar
                    });
                }

                return Promise.reject();
            }
        });

        const grammars = new Map();
        grammars.set('groovy', 'source.groovy');

        monaco.languages.registerHoverProvider('groovy', {
            provideHover: function (model, position) {
                return ajaxPost(
                    `${getPluginBaseUrl()}/ast/hover`,
                    {
                        code: model.getValue(),
                        position: {
                            line: position.lineNumber,
                            column: position.column
                        }
                    }
                ).then(res => {
                    return {
                        range: new monaco.Range(res.range.startLine, res.range.startColumn, res.range.endLine, res.range.endColumn),
                        contents: res.contents
                    };
                });
            }
        });

        return wireTmGrammars(monaco, grammarRegistry, grammars)
            .then(() => CodeMirrorInternal);
    });
