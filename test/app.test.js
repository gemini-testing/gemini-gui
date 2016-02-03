'use strict';

var _ = require('lodash'),
    proxyquire = require('proxyquire'),
    q = require('q'),
    fs = require('q-io/fs'),
    RunnerFactory = require('../lib/runner'),
    AllSuitesRunner = require('../lib/runner/all-suites-runner'),
    App,

    mkDummyCollection = require('./utils').mkDummyCollection;

describe('App', function() {
    var sandbox = sinon.sandbox.create(),
        suiteCollection,
        Gemini,
        app;

    function stubFs_() {
        sandbox.stub(fs, 'exists').returns(q(false));
        sandbox.stub(fs, 'removeTree').returns(q());
        sandbox.stub(fs, 'makeDirectory').returns(q());
        sandbox.stub(fs, 'makeTree').returns(q());
        sandbox.stub(fs, 'copy').returns(q());
    }

    function mkApp_(config) {
        return new App(config || {});
    }

    beforeEach(function() {
        suiteCollection = mkDummyCollection();

        Gemini = sandbox.stub();
        Gemini.prototype.browserIds = [];
        Gemini.prototype.readTests = sandbox.stub().returns(q(suiteCollection));
        Gemini.prototype.test = sandbox.stub().returns(q());

        App = proxyquire('../lib/app', {
            './find-gemini': sandbox.stub().returns(Gemini)
        });

        app = mkApp_();
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('initialize', function() {
        beforeEach(function() {
            stubFs_();
        });

        it('should remove old fs tree for current images dir if it exists', function() {
            app.currentDir = 'current_dir';

            fs.exists.withArgs('current_dir').returns(q(true));

            return app.initialize()
                .then(function() {
                    expect(fs.removeTree).to.be.calledWith('current_dir');
                });
        });

        it('should remove old fs tree for diff images dir if it exists', function() {
            app.diffDir = 'diff_dir';

            fs.exists.withArgs('diff_dir').returns(q(true));

            return app.initialize()
                .then(function() {
                    expect(fs.removeTree).to.be.calledWith('diff_dir');
                });
        });

        it('should create new tree for current images dir', function() {
            app.currentDir = 'current_dir';

            return app.initialize()
                .then(function() {
                    expect(fs.makeDirectory).to.be.calledWith('current_dir');
                });
        });

        it('should create new tree for diff images dir', function() {
            app.currentDir = 'diff_dir';

            return app.initialize()
                .then(function() {
                    expect(fs.makeDirectory).to.be.calledWith('diff_dir');
                });
        });

        it('should read tests', function() {
            var app = mkApp_({
                testFiles: ['test_file', 'another_test_file'],
                grep: 'grep'
            });

            return app.initialize()
                .then(function() {
                    expect(Gemini.prototype.readTests)
                        .to.be.calledWith(['test_file', 'another_test_file'], 'grep');
                });
        });
    });

    describe('run', function() {
        it('should create and execute runner', function() {
            var runnerInstance = sinon.createStubInstance(AllSuitesRunner);
            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            expect(runnerInstance.run).to.be.called();
        });

        it('should pass run handler to runner which will execute gemeni', function() {
            var runnerInstance = sinon.createStubInstance(AllSuitesRunner);

            runnerInstance.run.yields();
            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            expect(Gemini.prototype.test).to.be.called();
        });
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

    describe('updateReferenceImage', function() {
        function mkDummyTest_(params) {
            return _.defaults(params || {}, {
                suite: {path: 'default_suite_path'},
                state: 'default_state',
                browserId: 'default_browser',
                referencePath: 'default_reference_path',
                currentPath: 'default_current_path'
            });
        }

        beforeEach(function() {
            stubFs_();
            sandbox.stub(app, 'refPathToURL');
        });

        it('should reject reference update if no failed test registered', function() {
            var test = mkDummyTest_();

            return expect(app.updateReferenceImage(test))
                .to.be.rejectedWith('No such test failed');
        });

        it('should create directory tree for reference image before saving', function() {
            var test = mkDummyTest_({referencePath: 'path/to/reference/image.png'});

            app.addFailedTest(test);
            return app.updateReferenceImage(test)
                .then(function() {
                    expect(fs.makeTree).to.be.calledWith('path/to/reference');
                });
        });

        it('should copy current image to reference folder', function() {
            var test = mkDummyTest_({
                referencePath: 'path/to/reference/image.png',
                currentPath: 'path/to/current/image.png'
            });

            app.addFailedTest(test);
            return app.updateReferenceImage(test)
                .then(function() {
                    expect(fs.copy).to.be.calledWith('path/to/current/image.png', 'path/to/reference/image.png');
                });
        });

        it('should be resolved with URL to updated reference', function() {
            var test = mkDummyTest_();

            app.refPathToURL.returns(q('http://dummy_ref.url'));
            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(function(result) {
                    expect(result).to.be.equal('http://dummy_ref.url');
                });
        });
    });

    describe('refPathToURL', function() {
        beforeEach(function() {
            app.referenceDirs = {
                'browser_id': 'browser_reference_dir'
            };
        });

        it('should append timestamp to resulting URL', function() {
            var result = app.refPathToURL('full_path', 'browser_id');

            return expect(result).to.match(/\?t=\d+/);
        });
    });

    describe('currentPathToURL', function() {
        it('should append timestamp to resulting URL', function() {
            var result = app.currentPathToURL('full_path');

            return expect(result).to.match(/\?t=\d+/);
        });
    });
});

