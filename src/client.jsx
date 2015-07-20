import React from 'react';
import GeminiGUI from './components/gemini-gui';

export function render(suites, element) {
    return React.render((<GeminiGUI url='/events' suites={suites} />), element);
}
