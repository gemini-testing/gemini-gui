'use strict';
var sinon = require('sinon'),
    expect = require('chai').expect,
    EventSource = require('../lib/event-source');

describe('EventSource', function() {
    beforeEach(function() {
        this.source = new EventSource();
        this.connection = {
            write: sinon.stub()
        };

        this.source.addConnection(this.connection);
    });

    it('should send event to connections in text/event-stream format', function() {
        this.source.emit('event', {data: 'value'});

        expect(this.connection.write.callCount).to.equal(3);
        expect(this.connection.write.firstCall.args[0]).to.equal('event: event\n');
        expect(this.connection.write.secondCall.args[0]).to.equal('data: {"data":"value"}\n');
        expect(this.connection.write.thirdCall.args[0]).to.equal('\n\n');
    });
});
