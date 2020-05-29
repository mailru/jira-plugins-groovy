import React from 'react';

import {MultiSelect} from './MultiSelect';

import {OldSelectItem, OldSelectValue} from './types';

import {FieldProps, FormFieldProps, MutableFieldProps} from '../types';


export type LoaderOptionType<T extends OldSelectValue> = {
    value: T,
    name: string,
    label?: string
};

type Props<T extends OldSelectValue> = FieldProps & FormFieldProps & MutableFieldProps<ReadonlyArray<OldSelectValue>> & {
    loader: () => Promise<Array<LoaderOptionType<T>>>
};

type State<T extends OldSelectValue> = {
    ready: boolean,
    options: ReadonlyArray<OldSelectItem<T>>
};


function mapOption<T extends OldSelectValue>({value, label, name}: LoaderOptionType<T>): OldSelectItem<T> {
    if (label != null && value != null) {
        return {label, value};
    }

    return {
        value: value,
        label: name
    };
}

//$FlowFixMe todo: https://github.com/facebook/flow/issues/5256
export class AsyncLoadingMultiSelect<T extends OldSelectValue = string> extends React.PureComponent<Props<T>, State<T>> {
    state: State<T> = {
        options: [],
        ready: false
    };

    componentDidMount() {
        this.setState({ready: false});

        this.props
            .loader()
            .then((options: Array<LoaderOptionType<T>>) => {
                this.setState({
                    ready: true,
                    options: options.map(mapOption)
                });
            });
    }

    render() {
        const {label, name, isRequired, isDisabled, value, onChange} = this.props;
        const {ready, options} = this.state;

        return (
            <MultiSelect
                name={name}
                label={label}
                isRequired={isRequired}
                isDisabled={isDisabled}
                shouldFitContainer={true}

                isLoading={!ready}
                items={options}

                onChange={onChange}
                value={value}
            />
        );
    }
}
