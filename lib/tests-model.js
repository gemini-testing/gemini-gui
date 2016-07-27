'use strict';

var Index = require('./common/tests-index');
//
//TODO:
function Tests(app, suiteCollection) {
    this._app = app;
    this._index = new Index();
    this._data = this._mapSuites(suiteCollection.topLevelSuites());
}

Tests.prototype = {
    constructor: Tests,
    get data() {
        return this._data;
    },

    _mapSuites: function(suites) {
        return suites.map(function(suite) {
            var data =  {
                suite: suite,
                children: this._mapSuites(suite.children),
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
                suite: suite,
                state: state,
                browsers: this._getBrowsersData(suite, state)
            };
            this._index.add(data);
            return data;
        }, this);
    },

    _getBrowsersData: function(suite, state) {
        return suite.browsers.map(function(browserId) {
            var fullPath = this._app.getScreenshotPath(suite, state.name, browserId),
                data =  {
                    suite: suite,
                    state: state,
                    browserId: browserId,
                    metaInfo: state && state.metaInfo? JSON.stringify(state.metaInfo, null, 4) : 'Meta info is not available',
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
