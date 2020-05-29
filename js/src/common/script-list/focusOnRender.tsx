import React, {ComponentType} from 'react';
import ReactDOM from 'react-dom';

import {withRouter, RouteComponentProps} from 'react-router-dom';

import {BasicScriptComponentProps} from './types';

import {ItemType} from '../redux';


type State = {focused: boolean};
export function focusOnRender<T extends ItemType, P extends BasicScriptComponentProps<T>>(WrappedComponent: ComponentType<P>): ComponentType<P> {
    class FocusOnRenderComponent extends React.PureComponent<P & RouteComponentProps, State> {
        state: State = {
            focused: false
        };

        componentDidMount() {
            const {location, script} = this.props;

            const locationState = location.state as any;

            if (locationState && script && locationState.focus === script.id) {
                this.setState({ focused: true }, () => {
                    // eslint-disable-next-line react/no-find-dom-node
                    const domNode = ReactDOM.findDOMNode(this);
                    if (domNode instanceof Element) {
                        domNode.scrollIntoView(true);
                        window.scrollBy(0, -50);
                    } else {
                        console.warn('domNode is not element', domNode);
                    }
                });
            }
        }

        render() {
            const {history, location, match, ...props} = this.props;

            return <WrappedComponent {...props as (P & RouteComponentProps)} focused={this.state.focused}/>;
        }
    }

    return withRouter(FocusOnRenderComponent) as React.ComponentType<P>;
}
