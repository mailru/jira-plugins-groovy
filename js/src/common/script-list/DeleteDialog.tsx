import React from 'react';
import {connect} from 'react-redux';

import ModalDialog from '@atlaskit/modal-dialog';

import {deleteItem} from '../redux';
import {VoidCallback} from '../types';
import {CommonMessages} from '../../i18n/common.i18n';


export type DeleteI18n = {
    heading: string,
    areYouSure: (name: string) => string
};

export type DeleteDialogProps = {
    id: number,
    name: string,
    onConfirm: () => Promise<void>
};

type Props = DeleteDialogProps & {
    deleteItem: typeof deleteItem,
    onClose: VoidCallback,
    i18n: DeleteI18n,
    closeAfterDelete: boolean
};

type State = {
    waiting: boolean
};

export class DeleteDialog extends React.PureComponent<Props, State> {
    static defaultProps = {
        closeAfterDelete: true
    };

    state: State = {
        waiting: false
    };

    _doDelete = () => {
        const {id, deleteItem, onConfirm, onClose, closeAfterDelete} = this.props;

        this.setState({ waiting: true });
        onConfirm().then(() => {
            this.setState({ waiting: false });
            deleteItem(id);
            if (closeAfterDelete) {
                onClose();
            }
        });
    };

    render() {
        const {waiting} = this.state;
        const {name, onClose, i18n} = this.props;

        return (
            <ModalDialog
                appearance="danger"
                width="small"

                heading={i18n.heading}

                onClose={!waiting ? onClose : undefined}

                actions={[
                    {
                        text: CommonMessages.delete,

                        isDisabled: waiting,
                        isLoading: waiting,

                        onClick: this._doDelete
                    },
                    {
                        text: CommonMessages.cancel,
                        isDisabled: waiting,
                        onClick: onClose
                    }
                ]}
            >
                {i18n.areYouSure(name)}
            </ModalDialog>
        );
    }
}

export const ConnectedDeleteDialog = connect(() => ({}), { deleteItem })(DeleteDialog);
