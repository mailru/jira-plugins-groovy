import React from 'react';

import {preferenceService} from '../../service';


export type EditorThemeContextType = {
    isLight: boolean,
    toggleTheme: () => void
};

type Props = {
    children: any
};

type State = {
    isLight: boolean
};

function isLight(): boolean {
    return !(preferenceService.get('ru.mail.groovy.isLight') === 'false');
}

export const {Provider: EditorThemeContextProvider, Consumer: EditorThemeContextConsumer} = React.createContext({
    isLight: isLight(),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    toggleTheme: () => {},
});


export class EditorThemeContext extends React.Component<Props, State> {
    state: State = {
        isLight: !(preferenceService.get('ru.mail.groovy.isLight') === 'false')
    };

    interval: NodeJS.Timeout | null = null;

    _toggleTheme = () => this.setState(
        state => ({isLight: !state.isLight}),
        () => preferenceService.put('ru.mail.groovy.isLight', this.state.isLight.toString())
    );

    componentDidMount() {
        this.interval = setInterval(() => {
            const storedIsLight = isLight();
            if (this.state.isLight !== storedIsLight) {
                this.setState({ isLight: storedIsLight });
            }
        }, 3000);
    }

    render() {
        return (
            <EditorThemeContextProvider
                value={{
                    isLight: this.state.isLight,
                    toggleTheme: this._toggleTheme
                }}
            >
                {this.props.children}
            </EditorThemeContextProvider>
        );

    }
}
