'use strict';

function EventSource() {
    this._connections = [];
}

EventSource.prototype = {
    constructor: EventSource,

    addConnection: function(connection) {
        this._connections.push(connection);
    },

    emit: function(event, data) {
        this._connections.forEach(function(connection) {
            connection.write('event: ' + event + '\n');
            connection.write('data: ' + JSON.stringify(data) + '\n');
            connection.write('\n\n');
        });
    }
};

module.exports = EventSource;
