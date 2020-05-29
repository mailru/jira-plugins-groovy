import React, {ReactElement} from 'react';
import ReactDOM from 'react-dom';

import debounce from 'lodash/debounce';


type ElementVisibleCallback = () => void;

type ElementEntry = {
    el: Element,
    callback: ElementVisibleCallback
};

type LazyRenderContextType = {
    registerEl: (el: Element, callback: ElementVisibleCallback) => void,
    unregisterEl: (el: Element) => void
};

type ContextProps = {
    children: any
};

type LazilyRenderedProps = {
    children: (render: boolean) => any
};

type LazilyRenderedAllProps = LazilyRenderedProps & LazyRenderContextType;

const isPassiveListenerSupported = (): boolean => {
    let supported = false;

    try {
        const opts = Object.defineProperty({}, 'passive', {
            // eslint-disable-next-line getter-return
            get() {
                supported = true;
            }
        });

        // @ts-ignore
        window.addEventListener('test', null, opts);
        // @ts-ignore
        window.removeEventListener('test', null, opts);
    } catch (e) {}

    return supported;
};

const listenerOptions = isPassiveListenerSupported() ? {passive: true} : undefined;

function isElementVisible(el: Element): boolean {
    const {top, bottom} = el.getBoundingClientRect();

    return top < window.innerHeight && bottom >= 0;
}

const {Provider: LazyRenderContextProvider, Consumer: LazyRenderContextConsumer} = React.createContext<LazyRenderContextType>({
    registerEl: (_el: Element, callback: ElementVisibleCallback) => callback(),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unregisterEl: (_el: Element) => {}
});

type LazilyRenderedState = {render: boolean};

class LazilyRenderedInternal extends React.PureComponent<LazilyRenderedAllProps, LazilyRenderedState> {
    state: LazilyRenderedState = {
        render: false
    };

    containerRef = React.createRef<HTMLDivElement>();

    _setRendered = () => this.setState({ render: true });

    componentDidMount() {
        if (this.containerRef.current) {
            this.props.registerEl(this.containerRef.current, this._setRendered);
        }
    }

    render() {
        return (
            <div ref={this.containerRef}>
                {this.props.children(this.state.render)}
            </div>
        );
    }
}

export function LazilyRendered(props: LazilyRenderedProps): ReactElement {
    return (
        <LazyRenderContextConsumer>
            {(ctx: LazyRenderContextType): ReactElement => {
                return <LazilyRenderedInternal {...ctx} {...props}/>;
            }}
        </LazyRenderContextConsumer>
    );
}

export class LazilyRenderedContext extends React.PureComponent<ContextProps> {
    items: Array<ElementEntry> = [];

    _update = debounce(
        () => {
            console.debug('total items', this.items.length);
            const nowVisible = this.items.filter(item => isElementVisible(item.el));
            const nowVisibleEls = nowVisible.map(it => it.el);

            if (nowVisible.length) {
                this.items = this.items.filter(item => !nowVisibleEls.includes(item.el));

                console.debug('will render', nowVisible.length);
                requestAnimationFrame(() => {
                    ReactDOM.unstable_batchedUpdates(() => {
                        for (const item of nowVisible) {
                            item.callback();
                        }
                    });
                });
            }
        },
        300
    );

    _register = (el: Element, callback: ElementVisibleCallback) => {
        if (isElementVisible(el)) {
            callback();
        } else {
            this.items.push({el, callback});
        }
    };

    _unregister = (el: Element) => {
        this.items = this.items.filter(it => it.el !== el);
    };

    componentDidMount() {
        window.addEventListener('scroll', this._update, listenerOptions);
        window.addEventListener('resize', this._update);
    }

    componentWillUnmount() {
        // @ts-ignore
        window.removeEventListener('scroll', this._update, listenerOptions);
        window.removeEventListener('resize', this._update);
    }

    render() {
        return (
            <LazyRenderContextProvider
                value={{
                    registerEl: this._register,
                    unregisterEl: this._unregister
                }}
            >
                {this.props.children}
            </LazyRenderContextProvider>
        );

    }
}
