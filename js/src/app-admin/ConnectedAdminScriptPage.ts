import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';
import {createSelector} from 'reselect';

import orderBy from 'lodash/orderBy';

import {ScriptPage} from '../common/script-list';

import {orderedItemsSelector, updateFilter} from '../common/redux';


const itemsSelector = orderedItemsSelector();
//put built-in scripts in beginning of list
const reorderedItemsSelector = createSelector(
    [itemsSelector],
    items => orderBy(items, 'builtIn', 'desc')
);

export const ConnectedAdminScriptPage = connect(
    memoizeOne(
        ({watches, isReady, ...state}) => ({
            items: reorderedItemsSelector(state),
            filter: state.filter,
            watches, isReady
        })
    ),
    { updateFilter }
)(ScriptPage);
