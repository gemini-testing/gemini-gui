import React from 'react';

export default class GUIControls extends React.Component {
    render() {
        return (
            <div className='gui-controls'>
                <button className='button' onClick={this.props.onRun}>Run</button>

                <button className='button' onClick={this.props.onExpandAll}>Expand all</button>
                <button className='button' onClick={this.props.onCollapseAll}>Collapse all</button>
                <button className='button' onClick={this.props.onExpandErrors}>Expand errors</button>
            </div>
        );
    }
}
