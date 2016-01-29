'use strict';

var _ = require('lodash'),
    AllSuitesRunner = require('./all-suites-runner'),
    SpecificSuitesRunner = require('./specific-suites-runner');

exports.create = function(collection, specificSuites) {
    if (_.isEmpty(specificSuites)) {
        return new AllSuitesRunner(collection);
    }
    return new SpecificSuitesRunner(collection, [].concat(specificSuites));
};
