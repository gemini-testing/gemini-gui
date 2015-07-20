import React from 'react';
import Section from './section';
import ImageBox from './image-box';

export default class Browser extends React.Component {
    render() {
        const data = this.props.data;
        return (
            <Section title={data.browserId} status={data.status}>
                <ImageBox referenceURL={data.referenceURL} />
            </Section>
        );
    }
 
}
