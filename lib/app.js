'use strict';

const path = require('path');
const q = require('q');
const fs = require('q-io/fs');
const temp = require('temp');
const _ = require('lodash');
const chalk = require('chalk');

const findGemini = require('./find-gemini');
const reporter = require('./reporter');
const Tests = require('./tests-model');
const Index = require('./common/tests-index');
const EventSource = require('./event-source');
const Runner = require('./runner');

const removeTreeIfExists = (path) => {
    return fs.exists(path)
        .then((exists) => exists && fs.removeTree(path));
};

const filterBrowsers = _.intersection;

const checkUnknownBrowsers = (browsersFromConfig, browsersFromCli) => {
    const unknownBrowsers = _.difference(browsersFromCli, browsersFromConfig);

    if (!_.isEmpty(unknownBrowsers)) {
        console.warn('%s Unknown browser ids: %s. Use one of the browser ids specified in the config file: %s',
            chalk.yellow('WARNING:'), unknownBrowsers.join(', '), browsersFromConfig.join(', '));
    }
};

module.exports = class App {
    constructor(options) {
        this._options = options;
        this.diffDir = temp.path('gemini-gui-diff');
        this.currentDir = temp.path('gemini-gui-curr');
        this._failedTests = new Index();

        this._eventSource = new EventSource();

        const Gemini = findGemini();
        this._gemini = new Gemini(this._options.config, {cli: true, env: true});
        _.set(this._gemini.config, 'system.tempDir', this.currentDir);

        this._gemini.on('startRunner', (runner) => this._runner = runner);

        const browserIds = this._gemini.browserIds;
        checkUnknownBrowsers(browserIds, this._options.browser);

        this.referenceDirs = _.zipObject(
            browserIds,
            browserIds.map((id) => this._gemini.config.forBrowser(id).screenshotsDir)
        );
    }

    initialize() {
        return this._recreateTmpDirs()
            .then(this._readTests.bind(this));
    }

    addClient(connection) {
        this._eventSource.addConnection(connection);
    }

    sendClientEvent(event, data) {
        this._eventSource.emit(event, data);
    }

    getTests() {
        return q(this._tests.data);
    }

    _readTests() {
        return this._gemini.readTests(this._options.testFiles, this._options.grep)
            .then((collection) => {
                this._collection = collection;
                return collection.topLevelSuites();
            })
            .then((suites) => {
                if (!this._options.browser) {
                    return;
                }

                suites.map((suite) => {
                    suite.browsers = filterBrowsers(suite.browsers, this._options.browser);
                });
            })
            .then(() => {
                this._tests = new Tests(this, this._collection);
            });
    }

    run(specificTests) {
        return Runner.create(this._collection, specificTests)
            .run((collection) => this._gemini.test(collection, {
                reporters: [reporter(this), 'flat']
            }));
    }

    _recreateTmpDirs() {
        return q.all([removeTreeIfExists(this.currentDir), removeTreeIfExists(this.diffDir)])
            .then(() => q.all([
                fs.makeDirectory(this.currentDir),
                fs.makeDirectory(this.diffDir)
            ]));
    }

    buildDiff(failureReport) {
        return this._buildDiffFile(failureReport)
            .then((diffPath) => this.diffPathToURL(diffPath));
    }

    _buildDiffFile(failureReport) {
        const diffPath = temp.path({dir: this.diffDir, suffix: '.png'});
        return failureReport.saveDiffTo(diffPath).thenResolve(diffPath);
    }

    addNoReferenceTest(test) {
        //adding ref path here because gemini requires real suite to calc ref path
        //and on client we have just stringified path
        test.referencePath = this.getScreenshotPath(test.suite, test.state.name, test.browserId);
        this.addFailedTest(test);
    }

    addFailedTest(test) {
        this._failedTests.add(test);
    }

    updateReferenceImage(testData) {
        const test = this._failedTests.find(testData);

        if (!test) {
            return q.reject(new Error('No such test failed'));
        }

        const result = {
            imagePath: test.referencePath,
            updated: true,
            suite: test.state.suite,
            state: test.state,
            browserId: test.browserId
        };

        return fs.makeTree(path.dirname(test.referencePath))
            .then(() => fs.copy(test.currentPath, test.referencePath))
            .then(() => {
                this._runner.emit('updateResult', result);
                return this.refPathToURL(test.referencePath, test.browserId);
            });
    }

    getScreenshotPath(suite, stateName, browserId) {
        return this._gemini.getScreenshotPath(suite, stateName, browserId);
    }

    getBrowserCapabilites(browserId) {
        return this._gemini.getBrowserCapabilites(browserId);
    }

    refPathToURL(fullPath, browserId) {
        return this._appendTimestampToURL(
            this._pathToURL(this.referenceDirs[browserId], fullPath, App.refPrefix + '/' + browserId)
        );
    }

    currentPathToURL(fullPath) {
        return this._appendTimestampToURL(
            this._pathToURL(this.currentDir, fullPath, App.currentPrefix)
        );
    }

    // add query string timestamp to avoid caching on client
    _appendTimestampToURL(URL) {
        return URL + '?t=' + new Date().valueOf();
    }

    diffPathToURL(fullPath) {
        return this._pathToURL(this.diffDir, fullPath, App.diffPrefix);
    }

    _pathToURL(rootDir, fullPath, prefix) {
        const relPath = path.relative(rootDir, fullPath);
        return prefix + '/' + encodeURI(relPath);
    }

    static get refPrefix() {
        return '/ref';
    }

    static get currentPrefix() {
        return '/curr';
    }

    static get diffPrefix() {
        return '/diff';
    }
};
