import React, {ReactElement, ReactNode} from 'react';

import SectionMessage from '@atlaskit/section-message';


type MessageProps = {
    title?: ReactNode,
    children?: ReactNode
};

export function InfoMessage({title, children, ...props}: MessageProps): ReactElement {
    return (
        <SectionMessage
            appearance="info"
            title={title as string}
            {...props}
        >
            {children || null}
        </SectionMessage>
    );
}

export function ErrorMessage({title, children, ...props}: MessageProps): ReactElement {
    return (
        <SectionMessage
            appearance="error"
            title={title as string}
            {...props}
        >
            {children || null}
        </SectionMessage>
    );
}

export function SuccessMessage({title, children, ...props}: MessageProps): ReactElement {
    return (
        <SectionMessage
            appearance="confirmation"
            title={title as string}
            {...props}
        >
            {children || null}
        </SectionMessage>
    );
}
