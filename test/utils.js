'use strict';

const format = require('util').format;

const mkDummyCollection_ = () => {
    const collection = sinon.stub().named('SuiteCollection');

    ['enable', 'enableAll', 'disable', 'disableAll'].forEach((method) => {
        collection[method] = sinon.stub().named(format('SuiteCollection.%s()', method));
    });

    collection.topLevelSuites = sinon.stub()
        .named('SuiteCollection.topLevelSuites()')
        .returns([]);

    return collection;
};

exports.mkDummyCollection = mkDummyCollection_;
