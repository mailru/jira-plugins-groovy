import {connect} from 'react-redux';

import memoizeOne from 'memoize-one';

import {ScriptPage} from './ScriptPage';

import {orderedItemsSelector, updateFilter} from '../redux';


const itemsSelector = orderedItemsSelector();

export const ConnectedScriptPage = connect(
    memoizeOne(
        ({watches, isReady, ...state}) => ({
            items: itemsSelector(state),
            filter: state.filter,
            watches, isReady
        })
    ),
    { updateFilter }
)(ScriptPage);
