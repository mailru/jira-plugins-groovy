import React, {ReactElement} from 'react';

import {BreadcrumbsItem} from '@atlaskit/breadcrumbs';

import {RouterLink} from '../ak';
import {notNull} from '../tsUtil';


export const withRoot = (breadcrumbs: Array<ReactElement<typeof BreadcrumbsItem> | null>) => [
    <BreadcrumbsItem
        key="root"
        text="MyGroovy"

        component={RouterLink}
        href="/"
    />,
    ...breadcrumbs
].filter(notNull);
