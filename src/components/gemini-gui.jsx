import React from 'react';
import Suite from './suite';
import GUIControls from './gui-controls';
import ServerConnection from './server-connection';
import 'whatwg-fetch'

export default class GeminiGUI extends React.Component {
    constructor() {
        super();
        this.state = {
            suites: []
        };
    }

    render() {
        const suitesView = this.state.suites.map(
            (suite) => (<Suite key={suite.suiteId} data={suite} />)
        );
        //TODO: stats
        return (
            <div className='gemini-gui'>
                <GUIControls onRun={this._handleRun} />
                {suitesView}
            </div>
        );
    }

    componentDidMount() {
        this._connection = new ServerConnection(this.props.url);
        this._connection.on('beginState', function(data) {
            console.log(data);
        });

        this.setState({
            suites: this.props.suites
        });
    }

    _handleRun() {
        fetch('/run', {method: 'post'})
            .then((response) => {
                if (response.status !== 200) {
                    console.error(response);
                    return;
                }
                return response.json();
            })
            .fail((e) => console.error(e));
    }
}
