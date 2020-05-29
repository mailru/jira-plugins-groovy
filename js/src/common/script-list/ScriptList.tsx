import React, {ComponentType} from 'react';

import {ScriptComponentProps, I18nType, DeleteCallbackType} from './types';

import {LoadingSpinner, InfoMessage} from '../ak';

import {ItemType} from '../redux';


type Props<T> = {
    i18n: I18nType,
    isReady: boolean,
    items: Array<T>,
    onDelete: DeleteCallbackType,
    ScriptComponent: ComponentType<ScriptComponentProps<T>>
};

export class ScriptList<T> extends React.PureComponent<Props<T&ItemType>> {
    render() {
        const {isReady, items, i18n, onDelete, ScriptComponent} = this.props;

        if (!isReady) {
            return <LoadingSpinner/>;
        }

        return (
            <div className="ScriptList page-content">
                {items.length
                    ? items.map(item => <ScriptComponent key={item.id} script={item} onDelete={onDelete}/>)
                    : <InfoMessage title={i18n.noItems}/>
                }
            </div>
        );
    }
}
