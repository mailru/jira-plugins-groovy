import React from 'react';

import {connect} from 'react-redux';

import Flag, {FlagGroup} from '@atlaskit/flag';
import Spinner from '@atlaskit/spinner';

import {RootState} from './redux';


type Props = {
    ready: boolean
};

class UsageStatusFlagInternal extends React.PureComponent<Props> {
    render() {
        const {ready} = this.props;

        if (ready) {
            return null;
        }

        return (
            <FlagGroup>
                <Flag
                    id="script-usage"
                    icon={<Spinner invertColor={true}/>}
                    title="Collecting script usage info"
                    appearance="info"
                />
            </FlagGroup>
        );
    }
}

export const UsageStatusFlag = connect(
    (state: RootState) => ({
        ready: state.scriptUsage.ready
    })
)(UsageStatusFlagInternal);
