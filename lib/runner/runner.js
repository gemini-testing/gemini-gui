'use strict';

var inherit = require('inherit');

var Runner = inherit({
    __constructor: function(collection) {
        this._collection = collection;
    },

    run: function(runHandler) {
        return runHandler(this._collection);
    }
});

module.exports = Runner;
