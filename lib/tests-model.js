'use strict';

var Index = require('./common/tests-index');
//
//TODO:
function Tests(app, rootSuite) {
    this._app = app;
    this._index = new Index();
    this._data = this._mapSuites(rootSuite);
}

Tests.prototype = {
    constructor: Tests,
    get data() {
        return this._data;
    },

    _mapSuites: function(rootSuite) {
        return rootSuite.children.map(function(suite) {
            var data =  {
                suiteId: suite.id,
                name: suite.name,
                children: this._mapSuites(suite),
                status: 'idle',
                states: this._mapStates(suite)
            };
            this._index.add(data);
            return data;
        }, this);
    },

    _mapStates: function(suite) {
        return suite.states.map(function(state) {
            var data = {
                suiteId: suite.id,
                stateName: state.name,
                browsers: this._getBrowsersData(suite, state)
            };
            this._index.add(data);
            return data;
        }, this);
    },

    _getBrowsersData: function(suite, state) {
        return this._app.browserIds.map(function(browserId) {
            var fullPath = this._app.getScreenshotPath(suite, state.name, browserId),
                data =  {
                    suiteId: suite.id,
                    stateName: state.name,
                    browserId: browserId,
                    skipped: state.shouldSkip(this._app.getBrowserCapabilites(browserId)),
                    referenceURL: this._app.refPathToURL(fullPath, browserId)
                };
            this._index.add(data);
            return data;
        }, this);
    },

    find: function(query) {
        return this._index.find(query);
    }
};

module.exports = Tests;
