'use strict';

var stringify = require('json-stringify-safe');

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
            connection.write('data: ' + stringify(data) + '\n');
            connection.write('\n\n');
        });
    }
};

module.exports = EventSource;
