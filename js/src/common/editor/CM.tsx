import React from 'react';

import Loadable from 'react-loadable';

import Spinner from '@atlaskit/spinner';


window.self.MonacoEnvironment = {
    getWorkerUrl: () => {
        return '/jira/download/resources/ru.mail.jira.plugins.groovy:entrypoint-editor-worker/ru/mail/jira/plugins/groovy/js/editor-worker.js';
    }
};

export const CodeMirror = Loadable({
    loader: () => import('./AsyncEditor').then(it => it.default()),
    // eslint-disable-next-line react/display-name
    loading: () => <Spinner/>
});
