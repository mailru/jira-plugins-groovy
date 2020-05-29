import React, {ReactNode} from 'react';

import Avatar from '@atlaskit/avatar';

import memoize from 'lodash/memoize';

import {LargeSelect} from './LargeSelect';
import {FormField} from './FormField';
import {SingleValueType} from './types';

import {ajaxGet} from '../../service';
import {OptMutableFieldProps, FieldProps, FormFieldProps, SelectProps, AkFormFieldProps} from '../types';


const formatValueFactory = memoize(
    (displayValue: boolean): ((value: SingleValueType) => ReactNode) => {
        return function formatValue(data: SingleValueType): ReactNode {
            return (
                <div className="flex-row">
                    {data.imgSrc && <Avatar size="xsmall" src={data.imgSrc}/>}
                    <span className="flex-vertical-middle" style={{marginLeft: data.imgSrc ? '5px' : ''}}>
                        {data.label}{displayValue ? ` (${data.value})` : null}
                    </span>
                </div>
            );
        };
    }
);

let i = 0;

type ValueType<T extends SingleValueType> = T | Array<T>;

type Props<T extends SingleValueType> =
    FieldProps &
    FormFieldProps &
    OptMutableFieldProps<ValueType<T>> &
    AkFormFieldProps &
    SelectProps & {
    src: string,
    displayValue: boolean
};

type DataType<T extends SingleValueType> = {
    complete: boolean,
    options: ReadonlyArray<T>
};

type AsyncPickerState<T extends SingleValueType> = {
    filter: string,
    data: DataType<T>,
    fetching: number | null
};

export class AsyncPicker<T extends SingleValueType> extends React.PureComponent<Props<T>, AsyncPickerState<T>> {
    static defaultProps = {
        isValidationHidden: false,
        displayValue: false
    };

    i = i++;

    state: AsyncPickerState<T> = {
        filter: '',
        data: {
            complete: false,
            options: []
        },
        fetching: null
    };

    reqId = 0;

    _getOptions = (filter: string) => {
        const reqId = ++this.reqId;

        const needsFetching = !this.state.data.complete;
        this.setState({ fetching: needsFetching ? this.reqId : null, filter });

        if (needsFetching) {
            ajaxGet(this.props.src + (filter ? `?q=${filter}` : ''))
                .then((data: DataType<T>) => {
                    this.setState((state: AsyncPickerState<T>): any => {
                        if (reqId === state.fetching) {
                            return {
                                data,
                                fetching: null
                            };
                        } else {
                            return {};
                        }
                    });
                }
            );
        }
    };

    _onFilterChange = (filter: string) => {
        this._getOptions(filter);
    };

    componentDidMount() {
        const {value} = this.props;

        if (!Array.isArray(value)) {
            this._getOptions(value ? value.label : '');
        }
    }

    componentDidUpdate(prevProps: Props<T>) {
        const {value, src} = this.props;

        if (prevProps.value !== value) {
            if (!Array.isArray(value)) {
                this._getOptions(value ? value.label : '');
            }
        }

        if (prevProps.src !== src && !Array.isArray(value)) {
            this.setState(
                { data: {complete: false, options: [] }},
                () => this._getOptions(value ? value.label : '')
            );
        }
    }

    render() {
        const {label, name, isRequired, isLabelHidden, isInvalid, invalidMessage, isValidationHidden, displayValue} = this.props;
        const {fetching, data} = this.state;

        if (isValidationHidden) {
            return (
                <LargeSelect
                    {...this.props}
                    shouldFitContainer={true}

                    hasAutocomplete={true}
                    onInputChange={this._onFilterChange}

                    isLoading={!!fetching}
                    options={data.options}

                    validationState={isInvalid ? 'error' : 'default'}

                    formatOptionLabel={formatValueFactory(displayValue)}
                />
            );
        }

        return (
            <FormField
                name={name}
                label={label || ''}
                isLabelHidden={isLabelHidden}
                isRequired={isRequired}

                isInvalid={isInvalid}
                invalidMessage={invalidMessage}
            >
                {props =>
                    <LargeSelect
                        {...props}
                        {...this.props}

                        hasAutocomplete={true}
                        onInputChange={this._onFilterChange}

                        isLoading={!!fetching}
                        options={data.options}

                        formatOptionLabel={formatValueFactory(displayValue)}
                    />
                }
            </FormField>
        );
    }
}
