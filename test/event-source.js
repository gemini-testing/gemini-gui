'use strict';

const EventSource = require('../lib/event-source');

describe('EventSource', () => {
    beforeEach(() => {
        this.source = new EventSource();
        this.connection = {
            write: sinon.stub()
        };

        this.source.addConnection(this.connection);
    });

    it('should send event to connections in text/event-stream format', () => {
        this.source.emit('event', {data: 'value'});

        assert.strictEqual(this.connection.write.callCount, 3);
        assert.equal(this.connection.write.firstCall.args[0], 'event: event\n');
        assert.equal(this.connection.write.secondCall.args[0], 'data: {"data":"value"}\n');
        assert.equal(this.connection.write.thirdCall.args[0], '\n\n');
    });

    it('should handle circular references format', () => {
        const a = {b: true};
        a.c = a;

        this.source.emit('event', a);

        assert.strictEqual(this.connection.write.callCount, 3);
        assert.equal(this.connection.write.firstCall.args[0], 'event: event\n');
        assert.equal(this.connection.write.secondCall.args[0], 'data: {"b":true,"c":"[Circular ~]"}\n');
        assert.equal(this.connection.write.thirdCall.args[0], '\n\n');
    });
});
