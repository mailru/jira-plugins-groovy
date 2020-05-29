import React, {ReactNode, SyntheticEvent} from 'react';
import {Link} from 'react-router-dom';


type Props = {
    children: ReactNode,
    className?: string,
    href: string,
    onMouseEnter?: (event: SyntheticEvent<any>) => void,
    onMouseLeave?: (event: SyntheticEvent<any>) => void,
};

export class RouterLink extends React.PureComponent<Props, {}> {
    render() {
        const {
            children,
            className,
            href,
            onMouseEnter,
            onMouseLeave,
        } = this.props;

        return (
            <Link
                className={className}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                to={href}
            >
                {children}
            </Link>
        );
    }
}
