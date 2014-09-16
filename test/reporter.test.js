'use strict';
var EventEmitter = require('events').EventEmitter,
    q = require('q'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    App = require('../lib/app'),
    reporter = require('../lib/reporter');

describe('reporter', function() {
    beforeEach(function() {
        this.app = sinon.createStubInstance(App);
    });

    function emitToReporter(event, data, app) {
        var reporterFunc = reporter(app),
            emitter = new EventEmitter();
        reporterFunc(emitter);

        emitter.emit(event, data);
    }

    function itShouldProxyEvent(event, data) {
        it('should proxy ' + event, function() {
            emitToReporter(event, data, this.app);
            expect(this.app.sendClientEvent).to.have.been.calledWith(event, data);
        });
    }

    itShouldProxyEvent('begin', {});
    itShouldProxyEvent('beginSuite', {
        suiteName: 'test',
        suiteId: 1,
        browserId: 'bro'
    });

    itShouldProxyEvent('beginState', {
        suiteName: 'test',
        suiteId: 1,
        browserId: 'bro',
        stateName: 'state'
    });

    itShouldProxyEvent('skipState', {
        suiteName: 'test',
        suiteId: 1,
        browserId: 'bro',
        stateName: 'state'
    });

    itShouldProxyEvent('endState', {
        suiteName: 'test',
        suiteId: 1,
        browserId: 'bro',
        stateName: 'state'
    });

    itShouldProxyEvent('endSuite', {
        suiteName: 'test',
        suiteId: 1,
        browserId: 'bro'
    });

    itShouldProxyEvent('end', {});

    it('should replace paths with URLs if endTest emitted with equal images', function() {
        this.app.refPathToURL.withArgs('ref.png').returns('/ref/image.png');
        this.app.currentPathToURL.withArgs('curr.png').returns('/curr/image.png');

        emitToReporter('endTest', {
            suiteId: 1,
            suiteName: 'test',
            stateName: 'state',
            browserId: 'browser',
            equal: true,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        expect(this.app.sendClientEvent).to.have.been.calledWith('endTest', {
            suiteId: 1,
            stateName: 'state',
            browserId: 'browser',
            equal: true,
            referenceURL: '/ref/image.png',
            currentURL: '/curr/image.png'
        });
    });

    it('should build diff if images are not equal', function() {
        this.app.buildDiff.returns(q());
        emitToReporter('endTest', {
            suiteId: 1,
            suiteName: 'test',
            stateName: 'state',
            browserId: 'browser',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        expect(this.app.buildDiff).to.have.been.calledWith('ref.png', 'curr.png');
    });

    it('should register failure', function() {
        this.app.buildDiff.returns(q());
        emitToReporter('endTest', {
            suiteId: 1,
            suiteName: 'test',
            stateName: 'state',
            browserId: 'browser',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        expect(this.app.addFailedTest).to.have.been.calledWith({
            suiteId: 1,
            stateName: 'state',
            browserId: 'browser',
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        });
    });

    it('should send event with diffURL to the client', function() {
        this.app.refPathToURL.withArgs('ref.png').returns('/ref/image.png');
        this.app.currentPathToURL.withArgs('curr.png').returns('/curr/image.png');
        this.app.buildDiff.returns(q('/diff/image.png'));

        emitToReporter('endTest', {
            suiteId: 1,
            suiteName: 'test',
            stateName: 'state',
            browserId: 'browser',
            equal: false,
            referencePath: 'ref.png',
            currentPath: 'curr.png'
        }, this.app);

        var _this = this;
        return q().then(function() {
            expect(_this.app.sendClientEvent).to.have.been.calledWith('endTest', {
                suiteId: 1,
                stateName: 'state',
                browserId: 'browser',
                equal: false,
                referenceURL: '/ref/image.png',
                currentURL: '/curr/image.png',
                diffURL: '/diff/image.png'
            });
        });
    });

    it('should report error stack', function() {
        var error = new Error('example');
        error.suiteId = 1;
        error.browserId = 'browser';
        error.stateName = 'state';

        emitToReporter('error', error, this.app);
        expect(this.app.sendClientEvent).to.have.been.calledWith('error', {
            suiteId: 1,
            stateName: 'state',
            browserId: 'browser',
            stack: error.stack

        });
    });
});
