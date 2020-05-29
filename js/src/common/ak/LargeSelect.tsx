import React, {ComponentPropsWithoutRef} from 'react';

import Select, {createFilter} from '@atlaskit/select';


const filterFunction = createFilter(null);

type State = {
    options: ReadonlyArray<any>,
    filter: string
};

type OptionType = {
    label: string,
    value: string,
    data: any
}

type Props = ComponentPropsWithoutRef<typeof Select>;

export class LargeSelect extends React.PureComponent<Props, State> {
    state: State = {
        options: [],
        filter: ''
    };

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        return {
            options: LargeSelect._getOptions(prevState.filter, nextProps)
        };
    }

    static _getOptions = function(filter: string, props: Props): ReadonlyArray<any> {
        if (!props.options) {
            return [];
        }

        const filteredOptions = props.options.filter((it: OptionType) => filterFunction(it, filter));

        if (filter.length <= 3 && filteredOptions.length > 100) {
            return filteredOptions.slice(0, 100);
        }

        return filteredOptions;
    };

    _onFilterChange = (filter: string) => {
        this.setState(
            {
                options: LargeSelect._getOptions(filter, this.props),
                filter
            },
            () => {
                if (this.props.onInputChange) {
                    this.props.onInputChange(filter);
                }
            }
        );
    };

    render() {
        const {options: ignoreOptions, ...props} = this.props;
        const {options} = this.state;

        return (
            <Select
                {...props}

                styles={{ menu: base => ({ ...base, zIndex: 10 }) }}
                options={options}
                onInputChange={this._onFilterChange}
            />
        );
    }
}
