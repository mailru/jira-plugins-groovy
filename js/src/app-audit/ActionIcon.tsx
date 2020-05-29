import React, {ReactElement} from 'react';

import Tooltip from '@atlaskit/tooltip';

import QuestionIcon from '@atlaskit/icon/glyph/question';
import AddCircleIcon from '@atlaskit/icon/glyph/add-circle';
import EditFilledIcon from '@atlaskit/icon/glyph/edit-filled';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import CrossCircleIcon from '@atlaskit/icon/glyph/cross-circle';
import ArrowRightCircleIcon from '@atlaskit/icon/glyph/arrow-right-circle';
import UndoIcon from '@atlaskit/icon/glyph/undo';

import {EntityAction} from '../common/types';


type Props = {
    action: EntityAction
};

export function ActionIcon({action}: Props): ReactElement {
    let icon: ReactElement | null = null;
    switch (action) {
        case 'CREATED':
            icon = <AddCircleIcon label={action}/>;
            break;
        case 'UPDATED':
            icon = <EditFilledIcon label={action}/>;
            break;
        case 'DELETED':
            icon = <TrashIcon label={action}/>;
            break;
        case 'ENABLED':
            icon = <CheckCircleIcon label={action}/>;
            break;
        case 'DISABLED':
            icon = <CrossCircleIcon label={action}/>;
            break;
        case 'MOVED':
            icon = <ArrowRightCircleIcon label={action}/>;
            break;
        case 'RESTORED':
            icon = <UndoIcon label={action}/>;
            break;
        default:
            icon = <QuestionIcon label={action}/>;
            break;
    }

    return (
        <Tooltip content={action}>
            {icon}
        </Tooltip>
    );
}
