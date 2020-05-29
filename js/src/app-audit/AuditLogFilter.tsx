import React, {Fragment} from 'react';

import memoize from 'lodash/memoize';

import Button, {ButtonGroup} from '@atlaskit/button';
import InlineDialog from '@atlaskit/inline-dialog';
import DropdownMenuStateless, {DropdownItemGroupCheckbox, DropdownItemCheckbox} from '@atlaskit/dropdown-menu';

import PeopleGroupIcon from '@atlaskit/icon/glyph/people-group';

import {AuditLogFilterType} from './types';

import {getPluginBaseUrl} from '../service';
import {AsyncPicker} from '../common/ak';
import {AuditMessages, CategoryNameMessages} from '../i18n/audit.i18n';
import {entityTypes, entityActions} from '../common/types';
import {CommonMessages} from '../i18n/common.i18n';


type State = {
    activeEl: null | 'users' | 'categories' | 'actions'
};

type Props = {
    value: AuditLogFilterType,
    onChange: (filter: AuditLogFilterType) => void
};

export class AuditLogFilter extends React.PureComponent<Props, State> {
    state: State = {
        activeEl: null
    };

    _updateField = memoize((field, defaultVal: any) => (value: any) => this.props.onChange({ ...this.props.value, [field]: value || defaultVal }));

    _toggleType = memoize(type => () => {
        const {categories} = this.props.value;

        if (categories.includes(type)) {
            this._updateField('categories', [])(categories.filter(it => it !== type));
        } else {
            this._updateField('categories', [])([...categories, type]);
        }
    });

    _toggleAction = memoize(action => () => {
        const {actions} = this.props.value;

        if (actions.includes(action)) {
            this._updateField('actions', [])(actions.filter(it => it !== action));
        } else {
            this._updateField('actions', [])([...actions, action]);
        }
    });

    _toggleOpen = memoize(activeEl => () => this.setState(state => ({ activeEl: state.activeEl === activeEl ? null : activeEl })));

    _renderUsers = () => {
        const {value} = this.props;

        return (
            <div style={{width: '300px'}}>
                <AsyncPicker
                    name="user"
                    isLabelHidden={true}
                    src={`${getPluginBaseUrl()}/jira-api/userPicker`}

                    isMulti={true}
                    onChange={this._updateField('users', [])}
                    value={value.users}
                />
            </div>
        );
    };

    render() {
        const {activeEl} = this.state;
        const {value} = this.props;

        return (
            <ButtonGroup>
                <InlineDialog
                    content={this._renderUsers()}
                    isOpen={activeEl === 'users'}
                    onClose={this._toggleOpen('users')}
                >
                    <Button
                        iconBefore={<PeopleGroupIcon label=""/>}
                        onClick={this._toggleOpen('users')}
                    >
                        {AuditMessages.user}{' '}
                        {value.users.length ? <strong>{'('}{value.users.length}{')'}</strong> : `(${CommonMessages.all})`}
                    </Button>
                </InlineDialog>
                <DropdownMenuStateless
                    trigger={
                        <Fragment>
                            {AuditMessages.category}{' '}
                            {value.categories.length ? <strong>{'('}{value.categories.length}{')'}</strong> : `(${CommonMessages.all})`}
                        </Fragment>
                    }
                    triggerType="button"

                    isOpen={activeEl === 'categories'}
                    onOpenChange={this._toggleOpen('categories')}
                >
                    <DropdownItemGroupCheckbox id="categories">
                        {entityTypes.map(type =>
                            <DropdownItemCheckbox
                                id={type} key={type}
                                onClick={this._toggleType(type)}
                                isSelected={value.categories.includes(type)}
                            >
                                {CategoryNameMessages[type]}
                            </DropdownItemCheckbox>
                        )}
                    </DropdownItemGroupCheckbox>
                </DropdownMenuStateless>
                <DropdownMenuStateless
                    trigger={
                        <Fragment>
                            {AuditMessages.action}{' '}
                            {value.actions.length ? <strong>{'('}{value.actions.length}{')'}</strong> : `(${CommonMessages.all})`}
                        </Fragment>
                    }
                    triggerType="button"

                    isOpen={activeEl === 'actions'}
                    onOpenChange={this._toggleOpen('actions')}
                >
                    <DropdownItemGroupCheckbox id="categories">
                        {entityActions.map(action =>
                            <DropdownItemCheckbox
                                id={action} key={action}
                                onClick={this._toggleAction(action)}
                                isSelected={value.actions.includes(action)}
                            >
                                {action}
                            </DropdownItemCheckbox>
                        )}
                    </DropdownItemGroupCheckbox>
                </DropdownMenuStateless>
            </ButtonGroup>
        );
    }
}
