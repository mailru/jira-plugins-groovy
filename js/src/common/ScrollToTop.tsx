import React from 'react';

import {withRouter, RouteComponentProps} from 'react-router-dom';


class ScrollToTopInternal extends React.PureComponent<RouteComponentProps> {
    componentDidMount() {
        const {location} = this.props;

        // @ts-ignore
        if (!(location.state && location.state.focus)) {
            window.scrollTo(0, 0);
            // eslint-disable-next-line no-console
            console.log('scrolling to top');
        }
    }

    render() {
        return null;
    }
}

export const ScrollToTop = withRouter(ScrollToTopInternal);
