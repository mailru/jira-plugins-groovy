declare module '@atlaskit/dropdown-menu' {
    import React from 'react';

    import {ButtonProps} from '@atlaskit/button';
    // eslint-disable-next-line import/no-extraneous-dependencies
    import Item, {WithClick, WithFocus} from '@atlaskit/item';

    type DropdownItemProps = React.ComponentProps<typeof Item> & WithClick & WithFocus;

    type SelectableDropdownItemProps = DropdownItemProps & {
        id: string
    }

    export class DropdownItem extends React.Component<DropdownItemProps> {}
    export class DropdownItemRadio extends React.Component<SelectableDropdownItemProps> {}
    export class DropdownItemCheckbox extends React.Component<SelectableDropdownItemProps> {}

    type DropdownItemGroupProps = {
        children: React.ReactChild | ReadonlyArray<React.ReactChild> | null,
        title?: string,
        elemAfter?: React.ReactNode
    }

    type SelectableDropdownItemGroupProps = DropdownItemProps & {
        id: string
    }

    export class DropdownItemGroup extends React.Component<DropdownItemGroupProps> {}
    export class DropdownItemGroupRadio extends React.Component<SelectableDropdownItemGroupProps> {}
    export class DropdownItemGroupCheckbox extends React.Component<SelectableDropdownItemGroupProps> {}

    type Props = {
        appearance?: 'default' | 'tall',
        /** Value passed to the Layer component to determine when to reposition the droplist */
        boundariesElement?: 'viewport' | 'window' | 'scrollParent',
        /** Content that will be rendered inside the layer element. Should typically be
         * `DropdownItemGroup` or `DropdownItem`, or checkbox / radio variants of those. */
        children?: React.ReactNode,
        /** If true, a Spinner is rendered instead of the items */
        isLoading?: boolean,
        /** Controls the open state of the dropdown. */
        isOpen?: boolean,
        /** Position of the menu. See the documentation of @atlaskit/layer for more details. */
        position?: string,
        /** Determines if the dropdown menu should be positioned fixed. Useful for breaking out of overflow scroll/hidden containers, however, extra layout
         management will be required to control scroll behaviour when this property is enabled as the menu will not update position with the target on scroll. */
        isMenuFixed?: boolean,
        /** Deprecated. Option to display multiline items when content is too long.
         * Instead of ellipsing the overflown text it causes item to flow over multiple lines.
         */
        shouldAllowMultilineItems?: boolean,
        /** Option to fit dropdown menu width to its parent width */
        shouldFitContainer?: boolean,
        /** Allows the dropdown menu to be placed on the opposite side of its trigger if it does not
         * fit in the viewport. */
        shouldFlip?: boolean,
        /** Content which will trigger the dropdown menu to open and close. Use with `triggerType`
         * to easily get a button trigger. */
        trigger?: React.ReactNode,
        /** Props to pass through to the trigger button. See @atlaskit/button for allowed props. */
        triggerButtonProps?: ButtonProps,
        /** Controls the type of trigger to be used for the dropdown menu. The default trigger allows
         * you to supply your own trigger component. Setting this prop to `button` will render a
         * Button component with an 'expand' icon, and the `trigger` prop contents inside the
         * button. */
        triggerType?: 'default' | 'button',
        /** Callback to know when the menu is correctly positioned after it is opened */
        onPositioned?: Function,
        onOpenChange?: (obj: {isOpen: boolean}) => void
    };

    export default class DropdownMenu extends React.Component<Props> {}
}
