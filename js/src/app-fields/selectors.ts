import {createSelector} from 'reselect';

import {BasicState, NamedItemType} from '../common/redux';


export const fieldConfigSelectorFactory = <T extends NamedItemType>() =>
    createSelector(
        [
            (state: BasicState<T>) => state.items,
            (_state: any, props: {id: number}) => props.id],
        (items, id) => items.find(it => it.id === id)
    );
