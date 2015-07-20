import React from 'react';
import Section from './section';
import State from './state';

export default class Suite extends React.Component {
    render() {
        const data = this.props.data;
        const subSuites = data.children.map((child) => (<Suite key={child.suiteId} data={child} />));
        const states = data.states.map((state) => (<State key={state.name} data={state} />));
        return (
            <Section title={data.name}>
                {subSuites}
                {states}
            </Section>
        );
    }
};
