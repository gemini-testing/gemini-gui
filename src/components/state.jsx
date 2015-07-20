import React from 'react';
import Section from './section';
import Browser from './browser';

export default class State extends React.Component {
    render() {
        const data = this.props.data;
        const browsers = data.browsers.map(
            (browser) => (<Browser key={browser.browserId} data={browser} />)
        );

        return (
            <Section title={data.stateName}>
                {browsers}
            </Section>
        );
    }
}
