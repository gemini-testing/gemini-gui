'use strict';

var format = require('util').format;

function mkDummyCollection_() {
    var collection = sinon.stub().named('SuiteCollection');

    ['enable', 'enableAll', 'disable', 'disableAll'].forEach(function(method) {
        collection[method] = sinon.stub().named(format('SuiteCollection.%s()', method));
    });
    collection.topLevelSuites = sinon.stub()
        .named('SuiteCollection.topLevelSuites()')
        .returns([]);

    return collection;
}

exports.mkDummyCollection = mkDummyCollection_;
