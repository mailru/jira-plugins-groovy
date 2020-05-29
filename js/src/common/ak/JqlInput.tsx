import React, {ReactNode} from 'react';

import debounce from 'lodash/debounce';

import TextArea from '@atlaskit/textarea';
import Spinner from '@atlaskit/spinner';
import {colors} from '@atlaskit/theme';

import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';

import {FormField} from './FormField';

import {jiraService} from '../../service';
import {CommonMessages} from '../../i18n/common.i18n';

import {FieldProps, ErrorType, MutableTextFieldProps, FormFieldProps} from '../types';
import {JqlQueryValidationResult} from '../../service';


type Props = FieldProps & FormFieldProps & MutableTextFieldProps<string, HTMLTextAreaElement> & {
    shouldFitContainer?: boolean
};

type State = {
    validating: boolean,
    isInvalid: boolean | null,
    invalidMessage: ReactNode,
    issues: number | null
};

export class JqlInput extends React.Component<Props, State> {
    state: State = {
        validating: false,
        isInvalid: null,
        invalidMessage: null,
        issues: null
    };

    _validate = (query: string) => {
        this.setState({
            validating: true
        });

        jiraService
            .validateQuery(query)
            .then((data: JqlQueryValidationResult) => {
                this.setState({
                    validating: false,
                    isInvalid: false,
                    invalidMessage: null,
                    issues: data.total
                });
            })
            .catch(({response}: ErrorType) => {
                const data = response.data;
                if (data) {
                    this.setState(
                        (state: State, {value}: Props) => {
                            if (query === value && data.errorMessages) {
                                return {
                                    validating: false,
                                    isInvalid: true,
                                    invalidMessage: (
                                        <div className="flex flex-column">
                                            {data.errorMessages.map((message, i) => <div key={i}>{message}</div>)}
                                        </div>
                                    ),
                                    issues: null
                                };
                            }

                            return null;
                        });
                }
            });
    };

    _debouncedValidate = debounce(this._validate, 500, { maxWait: 5000 });

    constructor(props: Props) {
        super(props);

        this._debouncedValidate(props.value);
    }

    componentDidUpdate(prevProps: Props) {
        const {value} = this.props;

        if (prevProps.value !== value) {
            this._debouncedValidate(value);
        }
    }

    render() {
        const {label, name, isRequired, value, onChange, isInvalid, invalidMessage, ...restProps} = this.props;
        const {issues, validating} = this.state;

        let invalid: boolean = isInvalid || false;
        let invalidMsg: ReactNode = invalidMessage;

        if (this.state.isInvalid) {
            invalid = this.state.isInvalid;
            invalidMsg = this.state.invalidMessage;
        }

        return (
            <div>
                <FormField
                    name={name}
                    label={label || ''}
                    isRequired={isRequired}

                    isInvalid={invalid}
                    invalidMessage={invalidMsg}
                >
                    {props =>
                        <TextArea
                            {...props}
                            {...restProps}
                            isInvalid={invalid}

                            value={value}
                            onChange={onChange}
                        />
                    }
                </FormField>
                {validating &&
                    <div className="ak-description">
                        <Spinner size="small"/>
                        {' '}{CommonMessages.validating}
                    </div>
                }
                {!!issues &&
                    <div className="ak-description">
                        <CheckCircleIcon size="small" label="" primaryColor={colors.G500}/>
                        {' '}{CommonMessages.issuesFound(issues.toString())}
                    </div>
                }
            </div>
        );
    }
}
