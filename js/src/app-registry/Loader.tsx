import React, {Fragment, ReactNode} from 'react';
import {connect} from 'react-redux';
import {createStructuredSelector} from 'reselect';
import {withRouter, RouteComponentProps} from 'react-router-dom';

import {RootState} from './redux';

import {LoadingSpinner} from '../common/ak';


type Props = RouteComponentProps & {
    ready: boolean,
    children: ReactNode
};

export class LoaderInternal extends React.PureComponent<Props> {
    render() {
        const {ready, children} = this.props;

        if (ready) {
            return <Fragment>{children}</Fragment>;
        }

        return <LoadingSpinner/>;
    }
}

export const Loader = withRouter(
    connect(
        createStructuredSelector({
            ready: ({ready}: RootState) => ready
        })
    )(LoaderInternal)
);
