'use strict';

var sinon = require('sinon'),
    expect = require('chai').expect,
    proxyquire = require('proxyquire'),
    App;

describe('App', function() {
    var sandbox = sinon.sandbox.create(),
        Gemini,
        app;

    beforeEach(function() {
        Gemini = sandbox.stub();
        Gemini.prototype.browserIds = [];

        App = proxyquire('../lib/app', {
            './find-gemini': sandbox.stub().returns(Gemini)
        });

        app = new App({});
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('addNoReferenceTest', function() {
        beforeEach(function() {
            sandbox.stub(app, 'addFailedTest');
        });

        it('should add to test reference image path', function() {
            var test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath').returns('some_screenshot_path');
            app.addNoReferenceTest(test);

            expect(test.referencePath).to.be.equal('some_screenshot_path');
        });

        it('should add test with no reference error to failed tests', function() {
            var test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath');
            app.addNoReferenceTest(test);

            expect(app.addFailedTest).to.be.calledWith(test);
        });
    });
});

