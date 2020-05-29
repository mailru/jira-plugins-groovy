import React from 'react';

import Button from '@atlaskit/button';
import Tooltip from '@atlaskit/tooltip';

import {BindingType} from './types';


type BindingProps = {
    binding: BindingType,
    onOpenDoc?: () => void
};

export class Binding extends React.PureComponent<BindingProps> {
    render () {
        const {binding, onOpenDoc} = this.props;

        return (
            <div className="flex-row">
                <div className="flex-none">{binding.name}</div>
                <div className="flex-grow"/>
                <div className="flex-none" style={{marginLeft: '5px'}}>
                    <Tooltip content={<code>{binding.fullClassName}</code>}>
                        {binding.javaDoc
                            ? (
                                <a
                                    href={binding.javaDoc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {binding.className}
                                </a>
                            )
                            : binding.classDoc && onOpenDoc
                                ? <Button appearance="link" spacing="none" onClick={onOpenDoc}>{binding.className}</Button>
                                : <abbr>{binding.className}</abbr>
                        }
                    </Tooltip>
                </div>

            </div>
        );
    }
}
