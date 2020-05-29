import React from 'react';

import {Label} from '@atlaskit/field-base';

import {LargeSelect} from './LargeSelect';

import {OldSelectItem, OldSelectValue} from './types';

import {FieldProps, MutableFieldProps} from '../types';


type SingleSelectProps<T extends OldSelectValue> = FieldProps & MutableFieldProps<OldSelectItem<T>> & {
    options: Array<OldSelectItem<T>>,
    name?: string
};

export class SingleSelect<T extends OldSelectValue> extends React.PureComponent<SingleSelectProps<T>> {
    render() {
        const {label, isRequired, isLabelHidden, options, value, onChange, ...props} = this.props;

        return (
            <div>
                <Label label={label || ''} isRequired={isRequired} isLabelHidden={isLabelHidden}/>
                <LargeSelect value={value} onChange={onChange} options={options} {...props}/>
            </div>
        );
    }
}
