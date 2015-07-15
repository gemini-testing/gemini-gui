'use strict';

var path = require('path'),
    q = require('q'),
    fs = require('q-io/fs'),
    temp = require('temp'),
    findGemini = require('./find-gemini'),

    Tests = require('./tests-model'),
    Index = require('./common/tests-index'),
    EventSource = require('./event-source'),
    reporter = require('./reporter');

function removeTreeIfExists(path) {
    return fs.exists(path)
        .then(function(exists) {
            if (exists) {
                return fs.removeTree(path);
            }
        });
}

function App(options) {
    this.diffDir = temp.path('gemini-gui-diff');
    this.currentDir = temp.path('gemini-gui-curr');
    this._eventSource = new EventSource();

    var Gemini = findGemini();
    this._gemini = new Gemini(options.configFile, options);
    this.referenceDir = path.resolve(this._gemini.config.system.projectRoot, 'gemini/screens');
    this.browserIds = this._gemini.browserIds;
}

App.prototype.addClient = function(connection) {
    this._eventSource.addConnection(connection);
};

App.prototype.sendClientEvent = function(event, data) {
    this._eventSource.emit(event, data);
};

App.prototype.readTests = function(paths) {
    var _this = this;
    if (!this._tests) {
        return this._gemini.readTests(paths)
            .then(function(rootSuite) {
                _this._rootSuite = rootSuite;
                _this._tests = new Tests(_this, rootSuite);
                return _this._tests.data;
            });
    }
    return q.resolve(this._tests.data);
};

App.prototype.run = function(paths) {
    var _this = this;
    this._failedTests = new Index();
    return this._recreateTmpDirs()
        .then(function() {
            return _this._gemini.test(paths, {
                reporters: [reporter(_this)],
                tempDir: _this.currentDir
            });
        });
};

App.prototype._recreateTmpDirs = function() {
    var _this = this;
    return q.all([removeTreeIfExists(this.currentDir), removeTreeIfExists(this.diffDir)])
        .then(function() {
            return q.all([
                fs.makeDirectory(_this.currentDir),
                fs.makeDirectory(_this.diffDir)
            ]);
        });
};

App.prototype.buildDiff = function(failureReport) {
    var _this = this;
    return this._buildDiffFile(failureReport)
        .then(function(diffPath) {
            return _this.diffPathToURL(diffPath);
        });
};

App.prototype._buildDiffFile = function(failureReport) {
    var diffPath = temp.path({dir: this.diffDir, suffix: '.png'});
    if (typeof failureReport.saveDiffTo === 'function') {
        // gemini 0.10.0+ method
        return failureReport.saveDiffTo(diffPath).thenResolve(diffPath);
    }

    // gemini < 0.10 method
    return this._gemini.buildDiff(
            failureReport.referencePath,
            failureReport.currentPath,
            diffPath
        ).thenResolve(diffPath);
};

App.prototype.addFailedTest = function(test) {
    this._failedTests.add(test);
};

App.prototype.updateReferenceImage = function(testData) {
    var _this = this,
        test = this._failedTests.find(testData);
    if (!test) {
        return q.reject(new Error('No such test failed'));
    }
    return fs.copy(test.currentPath, test.referencePath)
        .then(function() {
            // add query string timestamp to avoid caching on client
            return _this.refPathToURL(test.referencePath) + '?t=' + new Date().valueOf();
        });
};

App.prototype.getScreenshotPath = function(suite, stateName, browserId) {
    return this._gemini.getScreenshotPath(suite, stateName, browserId);
};

App.prototype.getBrowserCapabilites = function(browserId) {
    return this._gemini.getBrowserCapabilites(browserId);
};

App.prototype.refPathToURL = function(fullPath) {
    return this._pathToURL(this.referenceDir, fullPath, App.refPrefix);
};

App.prototype.currentPathToURL = function(fullPath) {
    return this._pathToURL(this.currentDir, fullPath, App.currentPrefix);
};

App.prototype.diffPathToURL = function(fullPath) {
    return this._pathToURL(this.diffDir, fullPath, App.diffPrefix);
};

App.prototype._pathToURL = function(rootDir, fullPath, prefix) {
    var relPath = path.relative(rootDir, fullPath);
    return prefix + '/' + encodeURI(relPath);
};

App.refPrefix = '/ref';
App.currentPrefix = '/curr';
App.diffPrefix = '/diff';

module.exports = App;
