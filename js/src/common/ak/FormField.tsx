import React, {ReactNode} from 'react';

import {ErrorMessage, Field} from '@atlaskit/form';


type ChildrenProps = {
    name: string;
    isRequired: boolean | undefined;
    isDisabled: boolean | undefined;
    isInvalid: boolean | undefined;
    isValidationHidden: true;
}

type Props = {
    label: string,
    isLabelHidden: boolean,
    name: string,
    isRequired?: boolean,
    isDisabled?: boolean,

    isInvalid?: boolean,
    invalidMessage?: ReactNode,

    children: (childProps: ChildrenProps) => ReactNode,

    helperText?: string
};

//todo: refactor children to function like Field
export class FormField extends React.PureComponent<Props> {
    static defaultProps = {
        isLabelHidden: false
    };

    render() {
        const {children, isInvalid, isRequired, isDisabled, invalidMessage, name, ...etc} = this.props;

        //todo: update
        return (
            <Field
                name={name || ''}
                isRequired={isRequired}

                {...etc}
            >
                {() => (
                    <React.Fragment>
                        {children({name, isInvalid, isRequired, isDisabled, isValidationHidden: true})}
                        {isInvalid && <ErrorMessage><div>{invalidMessage}</div></ErrorMessage>}
                    </React.Fragment>
                )}
            </Field>
        );
    }
}
