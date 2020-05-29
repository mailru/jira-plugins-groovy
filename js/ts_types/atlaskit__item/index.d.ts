declare module '@atlaskit/item' {
    import React from 'react';

    export type WithClick = {
        /** If true, the item appears greyed out and does not fire click events. */
        isDisabled?: boolean,
        /** If true, the item appears greyed out and does not fire click events. */
        href?: string,
        /** Standard onClick handler */
        onClick?: Function,
        /** Standard onKeyDown handler */
        onKeyDown?: Function
    }

    export type WithFocus = {
        /** If true, the item appears greyed out and does not fire click events. */
        isDisabled?: boolean,
        /** If true, the item is mounted but not rendered. */
        isHidden?: boolean
    }

    type Props = {
        /** Whether the Item should attempt to gain browser focus when mounted */
        autoFocus?: boolean,
        /** Main content to be shown inside the item. */
        children?: React.ReactNode,
        /** Secondary text to be shown underneath the main content. */
        description?: string,
        /** Content to be shown after the main content. Shown to the right of content (or to the left
         * in RTL mode). */
        elemAfter?: React.ReactNode,
        /** Content to be shown before the main content. Shown to the left of content (or to the right
         * in RTL mode). */
        elemBefore?: React.ReactNode,
        /** Link that the user will be redirected to when the item is clicked. If omitted, a
         *  non-hyperlink component will be rendered. */
        href?: string,
        /** Causes the item to be rendered with reduced spacing. */
        isCompact?: boolean,
        /** Causes the item to appear in a disabled state and click behaviours will not be triggered. */
        isDisabled?: boolean,
        /** Used to apply correct dragging styles when also using react-beautiful-dnd. */
        isDragging?: boolean,
        /** Causes the item to still be rendered, but with `display: none` applied. */
        isHidden?: boolean,
        /** Causes the item to appear with a persistent selected background state. */
        isSelected?: boolean,
        /** Optional function to be used for rendering links. Receives `href` and possibly `target`
         * as props. */
        linkComponent?: Function,
        /** Function to be called when the item is clicked, Receives the MouseEvent. */
        onClick?: Function,
        /** Function to be called when the item is pressed with a keyboard,
         * Receives the KeyboardEvent. */
        onKeyDown?: Function,
        /** Standard onmouseenter event */
        onMouseEnter?: Function,
        /** Standard onmouseleave event */
        onMouseLeave?: Function,
        /** Allows the role attribute of the item to be altered from it's default of
         *  `role="button"` */
        role?: string,
        /** Allows the `children` content to break onto a new line, rather than truncating the
         *  content. */
        shouldAllowMultiline?: boolean,
        /** Target frame for item `href` link to be aimed at. */
        target?: string,
        /** Standard browser title to be displayed on the item when hovered. */
        title?: string
    };

    export default class Item extends React.Component<Props> {}
}
