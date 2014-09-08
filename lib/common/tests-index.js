'use strict';

function TestsIndex() {
    this._index = {};
}

TestsIndex.prototype = {
    constructor: TestsIndex,

    add: function(item) {
        if (item.suiteId == null) {
            return;
        }

        var indexData = this._index[item.suiteId];
        if (!indexData) {
            indexData = this._index[item.suiteId] = {
                suite: null,
                states: {}
            };
        }

        if (item.stateName == null) {
            indexData.suite = item;
            return;
        }

        var stateData = indexData.states[item.stateName];
        if (!stateData) {
            stateData = indexData.states[item.stateName] = {
                state: null,
                browsers: {}
            };
        }

        if (item.browserId == null) {
            stateData.state = item;
            return;
        }
        stateData.browsers[item.browserId] = item;
    },

    find: function(query) {
        var indexData = this._index[query.suiteId];
        if (!indexData) {
            return null;
        }
        if (query.stateName == null) {
            return indexData.suite;
        }
        var stateData = indexData.states[query.stateName];
        if (!stateData) {
            return null;
        }

        if (query.browserId == null) {
            return stateData.state;
        }

        return stateData.browsers[query.browserId] || null;
    }
};

module.exports = TestsIndex;
