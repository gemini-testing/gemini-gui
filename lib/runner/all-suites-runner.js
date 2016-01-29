'use strict';

var inherit = require('inherit'),
    Runner = require('./runner');

var AllSuitesRunner = inherit(Runner, {
    run: function(runHandler) {
        this._collection.enableAll();

        return this.__base(runHandler);
    }
});

module.exports = AllSuitesRunner;
