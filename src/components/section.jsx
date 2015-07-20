import React from 'react';
import classNames from 'classnames';

export default class Section extends React.Component {
    constructor() {
        super();
        this.state = {
            collapsed: true
        };
    }

    render() {
        const classes = classNames({
            section: true,
            'section_collapsed': this.state.collapsed,
            'section_status_idle': this.props.status === 'idle',
            'section_status_queued': this.props.status === 'queued',
            'section_status_success': this.props.status === 'success',
            'section_status_fail': this.props.status === 'fail',
            'section_status_skip': this.props.status === 'skip'
        });

        //TODO: should work without bind
        return (
            <div className={classes}>
                <div className='section__title' onClick={this._handleTitleClick.bind(this)}>{this.props.title}</div>
                <div className="section__body section__body_guided">
                    {this.props.children}
                </div>
            </div>
        );
    }

    _handleTitleClick() {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }
}
