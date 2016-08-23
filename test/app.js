'use strict';

const _ = require('lodash');
const proxyquire = require('proxyquire');
const q = require('q');
const fs = require('q-io/fs');

const RunnerFactory = require('../lib/runner');
const AllSuitesRunner = require('../lib/runner/all-suites-runner');
const mkDummyCollection = require('./utils').mkDummyCollection;

describe('App', () => {
    const sandbox = sinon.sandbox.create();

    let suiteCollection;
    let Gemini;
    let App;
    let app;
    let runner;

    const stubFs_ = () => {
        sandbox.stub(fs, 'exists').returns(q(false));
        sandbox.stub(fs, 'removeTree').returns(q());
        sandbox.stub(fs, 'makeDirectory').returns(q());
        sandbox.stub(fs, 'makeTree').returns(q());
        sandbox.stub(fs, 'copy').returns(q());
    };

    const mkApp_ = (config) => new App(config || {});

    beforeEach(() => {
        suiteCollection = mkDummyCollection();

        runner = {emit: sandbox.spy()};

        Gemini = sandbox.stub();
        Gemini.prototype.browserIds = [];
        Gemini.prototype.readTests = sandbox.stub().returns(q(suiteCollection));
        Gemini.prototype.test = sandbox.stub().returns(q());
        Gemini.prototype.on = sandbox.stub().yields(runner);

        App = proxyquire('../lib/app', {
            './find-gemini': sandbox.stub().returns(Gemini)
        });

        app = mkApp_();
    });

    afterEach(() => sandbox.restore());

    describe('initialize', () => {
        beforeEach(() => stubFs_());

        it('should remove old fs tree for current images dir if it exists', () => {
            app.currentDir = 'current_dir';

            fs.exists.withArgs('current_dir').returns(q(true));

            return app.initialize()
                .then(() => assert.calledWith(fs.removeTree, 'current_dir'));
        });

        it('should remove old fs tree for diff images dir if it exists', () => {
            app.diffDir = 'diff_dir';

            fs.exists.withArgs('diff_dir').returns(q(true));

            return app.initialize()
                .then(() => assert.calledWith(fs.removeTree, 'diff_dir'));
        });

        it('should create new tree for current images dir', () => {
            app.currentDir = 'current_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.makeDirectory, 'current_dir'));
        });

        it('should create new tree for diff images dir', () => {
            app.currentDir = 'diff_dir';

            return app.initialize()
                .then(() => assert.calledWith(fs.makeDirectory, 'diff_dir'));
        });

        it('should read tests', () => {
            const app = mkApp_({
                testFiles: ['test_file', 'another_test_file'],
                grep: 'grep'
            });

            return app.initialize()
                .then(() => {
                    assert.calledWith(Gemini.prototype.readTests,
                        ['test_file', 'another_test_file'], 'grep');
                });
        });
    });

    describe('run', () => {
        it('should create and execute runner', () => {
            const runnerInstance = sinon.createStubInstance(AllSuitesRunner);

            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            assert.called(runnerInstance.run);
        });

        it('should pass run handler to runner which will execute gemeni', () => {
            const runnerInstance = sinon.createStubInstance(AllSuitesRunner);

            runnerInstance.run.yields();
            sandbox.stub(RunnerFactory, 'create').returns(runnerInstance);

            app.run();

            assert.called(Gemini.prototype.test);
        });
    });

    describe('addNoReferenceTest', () => {
        beforeEach(() => sandbox.stub(app, 'addFailedTest'));

        it('should add to test reference image path', () => {
            const test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath').returns('some_screenshot_path');
            app.addNoReferenceTest(test);

            assert.equal(test.referencePath, 'some_screenshot_path');
        });

        it('should add test with no reference error to failed tests', () => {
            const test = {
                suite: {id: 1},
                state: {name: 'state'},
                browserId: 'browser'
            };

            sandbox.stub(app, 'getScreenshotPath');
            app.addNoReferenceTest(test);

            assert.calledWith(app.addFailedTest, test);
        });
    });

    describe('updateReferenceImage', () => {
        const mkDummyTest_ = (params) => {
            return _.defaults(params || {}, {
                suite: {path: 'default_suite_path'},
                state: 'default_state',
                browserId: 'default_browser',
                referencePath: 'default/reference/path',
                currentPath: 'default/current/path'
            });
        };

        beforeEach(() => {
            stubFs_();
            sandbox.stub(app, 'refPathToURL');
        });

        it('should reject reference update if no failed test registered', () => {
            const test = mkDummyTest_();

            return assert.isRejected(app.updateReferenceImage(test), 'No such test failed');
        });

        it('should create directory tree for reference image before saving', () => {
            const test = mkDummyTest_({referencePath: 'path/to/reference/image.png'});

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWith(fs.makeTree, 'path/to/reference'));
        });

        it('should copy current image to reference folder', () => {
            const referencePath = 'path/to/reference/image.png';
            const currentPath = 'path/to/current/image.png';

            const test = mkDummyTest_({referencePath, currentPath});

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWith(fs.copy, currentPath, referencePath));
        });

        it('should emit updateResult event with result argument by emit', () => {
            const test = mkDummyTest_({referencePath: 'path/to/reference.png'});

            const result = {
                imagePath: 'path/to/reference.png',
                updated: true,
                suite: test.state.suite,
                state: test.state,
                browserId: test.browserId
            };

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.calledWithExactly(runner.emit, 'updateResult', result));
        });

        it('should emit updateResult event only after copy current image to reference folder', () => {
            const test = mkDummyTest_();

            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then(() => assert.isTrue(runner.emit.calledAfter(fs.copy)));
        });

        it('should be resolved with URL to updated reference', () => {
            const test = mkDummyTest_();

            app.refPathToURL.returns(q('http://dummy_ref.url'));
            app.addFailedTest(test);

            return app.updateReferenceImage(test)
                .then((result) => assert.equal(result, 'http://dummy_ref.url'));
        });
    });

    describe('refPathToURL', () => {
        beforeEach(() => {
            app.referenceDirs = {
                'browser_id': 'browser_reference_dir'
            };
        });

        it('should append timestamp to resulting URL', () => {
            const result = app.refPathToURL('full_path', 'browser_id');

            return assert.match(result, /\?t=\d+/);
        });
    });

    describe('currentPathToURL', () => {
        it('should append timestamp to resulting URL', () => {
            const result = app.currentPathToURL('full_path');

            return assert.match(result, /\?t=\d+/);
        });
    });
});
