import React from 'react';
import GeminiGUI from './gemini-gui';

export function render(suites) {
    const ui = (<GeminiGUI url='/events' suites={suites} />);
    return React.renderToString(ui);
};
