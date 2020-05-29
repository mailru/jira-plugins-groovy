import {preferenceService} from '../../service';


const SWITCH_THEME = 'SWITCH_THEME';

const switchTheme = (isLight: boolean) => ({
    type: SWITCH_THEME,
    isLight: isLight
}) as const;

export const EditorActionCreators = {
    switchTheme
};

type State = {
    isLight: boolean
};

export function editorReducer(state: State, action: ReturnType<typeof switchTheme>): State {
    if (state === undefined) {
        return {
            isLight: !(preferenceService.get('ru.mail.groovy.isLight') === 'false')
        };
    }

    if (action.type === SWITCH_THEME) {
        return {
            ...state,
            isLight: action.isLight
        };
    }

    return state;
}

export function subscribeToChanges(store: any, stateKey: string) {
    store.subscribe(() => {
        preferenceService.put('ru.mail.groovy.isLight', store.state[stateKey].isLight);
    });
}
