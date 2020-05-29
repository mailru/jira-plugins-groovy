const LOAD_ITEMS = 'LOAD_ITEMS';

const DELETE_ITEM = 'DELETE_ITEM';
const UPDATE_ITEM = 'UPDATE_ITEM';
const ADD_ITEM = 'ADD_ITEM';

const ADD_WATCH = 'ADD_WATCH';
const REMOVE_WATCH = 'REMOVE_WATCH';

const UPDATE_FILTER = 'UPDATE_FILTER';

export type ItemType = {
    id: number
};

export type NamedItemType = ItemType & {
    name: string,
    description: string | null | undefined
};

export type ItemListType<T extends NamedItemType> = ReadonlyArray<T>;
export type WatchesListType = ReadonlyArray<number>;

export type LoadAction<T extends NamedItemType> = {
    type: typeof LOAD_ITEMS,
    items: ItemListType<T>,
    watches: WatchesListType
};

export type DeleteItemAction = {
    type: typeof DELETE_ITEM,
    id: number
};

export type AddItemAction<T extends NamedItemType> = {
    type: typeof ADD_ITEM,
    item: T
};

export type UpdateItemAction<T extends NamedItemType> = {
    type: typeof UPDATE_ITEM,
    item: T
};

type Action<T extends NamedItemType> = LoadAction<T> | DeleteItemAction | AddItemAction<T> | UpdateItemAction<T>;

export function itemsReducer<T extends NamedItemType>(state: ItemListType<T>, action: Action<T>): ItemListType<T> {
    if (state === undefined) {
        return [];
    }

    switch (action.type) {
        case LOAD_ITEMS:
            return action.items;
        case DELETE_ITEM: {
            const {id} = action;
            return state.filter(it => it.id !== id);
        }
        case ADD_ITEM:
            return [...state, action.item];
        case UPDATE_ITEM: {
            const {item} = action;
            return state.map(it => (it.id === item.id) ? item : it);
        }
        default:
            return state;
    }
}

type WatcherAction<T> = {
    type: T,
    id: number
};

export type AddWatchAction = WatcherAction<typeof ADD_WATCH>;
export type RemoveWatchAction = WatcherAction<typeof REMOVE_WATCH>;

type WatcherActionType<T extends NamedItemType> = LoadAction<T> | DeleteItemAction | AddItemAction<T> | AddWatchAction | RemoveWatchAction;

export function watchesReducer<T extends NamedItemType>(state: WatchesListType, action: WatcherActionType<T>): WatchesListType {
    if (state === undefined) {
        return [];
    }

    switch (action.type) {
        case LOAD_ITEMS:
            return action.watches;
        case DELETE_ITEM:
        case REMOVE_WATCH: {
            const {id} = action;
            return state.filter(it => it !== id);
        }
        case ADD_ITEM:
            return [...state, action.item.id];
        case ADD_WATCH:
            return [...state, action.id];
        default:
            return state;
    }
}

export function readinessReducer<T extends NamedItemType>(state: boolean, action: LoadAction<T>): boolean {
    if (state === undefined) {
        return false;
    }

    if (action.type === LOAD_ITEMS) {
        return true;
    }

    return state;
}

export type WholeObjectAction<Field extends string, V> = {
    type: typeof LOAD_ITEMS,
} & {[key in Field]: V};

export function wholeObjectReducerFactory<T, Field extends string>(field: Field, defaultValue: T): (value: T, action: WholeObjectAction<Field, T>) => (T | null) {
    return function(state: T, action: WholeObjectAction<Field, T>): T | null {
        if (state === undefined) {
            return defaultValue;
        }

        if (action.type === LOAD_ITEMS) {
            return action[field];
        }

        return state;
    };
}

export const addItem = <T extends ItemType>(item: T) => ({
    type: ADD_ITEM,
    item: item
});
export const updateItem = <T extends ItemType>(item: T) => ({
    type: UPDATE_ITEM,
    item: item
});
export const deleteItem = (id: number) => ({
    type: DELETE_ITEM,
    id: id
});

export const ItemActionCreators = {
    loadItems: <T extends NamedItemType>(items: ItemListType<T>, watches: WatchesListType, extraFields?: {[key in string]: any}): LoadAction<T> => {
        return {
            ...extraFields,
            type: LOAD_ITEMS, items, watches
        };
    }
};

export const WatchActionCreators = {
    addWatch: (id: number): AddWatchAction => {
        return {
            type: ADD_WATCH, id
        };
    },
    removeWatch: (id: number): RemoveWatchAction => {
        return {
            type: REMOVE_WATCH, id
        };
    }
};

export type UpdateFilterAction = {
    type: typeof UPDATE_FILTER,
    filter: string
};

export const updateFilter = (filter: string) => ({ type: UPDATE_FILTER, filter });

export function filterReducer(state: string | undefined, action: UpdateFilterAction): string {
    if (state === undefined) {
        return '';
    }

    if (action.type === UPDATE_FILTER) {
        return action.filter;
    }

    return state;
}
