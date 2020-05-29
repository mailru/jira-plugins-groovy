import {createSelector} from 'reselect';

import {filterReducer, ItemListType, NamedItemType} from './actions';


export type BasicState<T extends NamedItemType> = {
    items: ItemListType<T>,
    filter: ReturnType<typeof filterReducer>
}

export const orderedItemsSelector = <T extends NamedItemType>() =>
    createSelector(
        [
            (state: BasicState<T>) => state.items,
            (state: BasicState<T>) => state.filter,
        ],
        (items, rawFilter): ReadonlyArray<NamedItemType> => {
            const filter = rawFilter.toLocaleLowerCase();

            return [...(items || [])]
                .filter((script: NamedItemType): boolean => {
                    let matchesFilter = true;
                    if (filter.length >= 2) {
                        matchesFilter = script.name.toLocaleLowerCase().includes(filter);

                        if (!matchesFilter && script.description) {
                            matchesFilter = script.description.toLocaleLowerCase().includes(filter);
                        }
                    }
                    return matchesFilter;
                })
                .sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
        }
    );

export const createItemSelector = <T extends NamedItemType>() =>
    createSelector(
        [
            (state: BasicState<T>) => state.items,
            (_state: BasicState<T>, props: {id: number}) => props.id
        ],
        (items, id) => items.find(it => it.id === id)
    );
