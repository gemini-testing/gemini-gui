'use strict';

var inherit = require('inherit'),
    Runner = require('./runner');

var SpecificSuiteRunner = inherit(Runner, {
    __constructor: function(collection, specificTests) {
        this.__base(collection);
        this._specificTests = specificTests;
    },

    run: function(runHandler) {
        this._filter();

        return this.__base(runHandler);
    },

    _filter: function() {
        var testsToRun = this._specificTests.map(function(test) {
            return {
                suite: test.suite.path.replace(/,/g, ' '), //converting path to suite fullName
                state: test.state.name,
                browserId: test.browserId
            };
        });

        var _this = this;

        this._collection.disableAll();
        testsToRun.forEach(function(test) {
            _this._collection.enable(test.suite, {state: test.state, browser: test.browserId});
        });
    }
});

module.exports = SpecificSuiteRunner;
