import React from 'react';

import Select from '@atlaskit/select';

import {FormField} from './FormField';
import {OldSelectItem, OldSelectValue} from './types';

import {FieldProps, FormFieldProps, LoadableFieldProps, MutableFieldProps} from '../types';


type LookupMapType<T extends OldSelectValue> = Map<OldSelectValue, OldSelectItem<T>>;

function getLookupMap<T extends OldSelectValue>(items: ReadonlyArray<OldSelectItem<T>>): LookupMapType<T> {
    const lookupMap = new Map();
    for (const item of items) {
        lookupMap.set(item.value, item);
    }

    return lookupMap;
}

let i = 0;

type Props<T extends OldSelectValue> = FieldProps & FormFieldProps & LoadableFieldProps & MutableFieldProps<ReadonlyArray<OldSelectValue>> & {
    items: ReadonlyArray<OldSelectItem<T>>,
};

type State<T extends OldSelectValue> = {
    lookupMap: LookupMapType<T>
};

export class MultiSelect<T extends OldSelectValue> extends React.PureComponent<Props<T>, State<T>> {
    i = i++;

    _onChange = (val: Array<OldSelectItem<T>>) => {
        let newVal: Array<OldSelectValue> = [];

        if (val) {
            newVal = val.map(item => item.value);
        }

        this.props.onChange(newVal);
    };

    constructor(props: Props<T>) {
        super(props);

        this.state = {
            lookupMap: getLookupMap(props.items)
        };
    }

    componentDidUpdate(prevProps: Props<T>) {
        const {items} = this.props;

        if (prevProps.items !== items) {
            this.setState({
                lookupMap: getLookupMap(items)
            });
        }
    }

    render() {
        const {label, name, isInvalid, isRequired, isDisabled, invalidMessage, value} = this.props;
        const {lookupMap} = this.state;

        return (
            <FormField
                name={name}
                label={label || ''}
                isRequired={isRequired}

                isDisabled={isDisabled}
                isInvalid={isInvalid}
                invalidMessage={invalidMessage}
            >
                {props =>
                    <Select
                        {...props}

                        isMulti={true}

                        isLoading={this.props.isLoading}
                        options={this.props.items}

                        styles={{menu: base => ({...base, zIndex: 10})}}

                        value={value ? value.map(key => lookupMap.get(key)).filter(e => e) : []}
                        onChange={this._onChange}
                    />
                }
            </FormField>
        );
    }
}
