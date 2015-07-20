import React from 'react';

export default class ImageBox extends React.Component {
    render() {
        return (
            <div className="image-box">
                <div className="image-box__image">
                    <img src={this.props.referenceURL} alt="Reference image" />
                </div>
            </div>
        );
    }
}
