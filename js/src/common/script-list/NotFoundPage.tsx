import React from 'react';

import EmptyState from '@atlaskit/empty-state';


// eslint-disable-next-line react/prefer-stateless-function
export class NotFoundPage extends React.PureComponent<{}> {
    render() {
        return <EmptyState header="Not found" description="¯\_(ツ)_/¯"/>;
    }
}
