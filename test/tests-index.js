'use strict';

const TestsIndex = require('../lib/common/tests-index');
const data = {
    onlySuite: {
        suite: {path: 'path/to/test'}
    },

    suiteState: {
        suite: {path: 'path/to/test'},
        state: {name: 'state'}
    },

    suiteStateBrowser: {
        suite: {path: 'path/to/test'},
        state: {name: 'state'},
        browserId: 'browser'
    }
};

describe('TestsIndex', () => {
    beforeEach(() => {
        this.index = new TestsIndex();
        this.index.add(data.onlySuite);
        this.index.add(data.suiteState);
        this.index.add(data.suiteStateBrowser);
    });

    describe('add', () => {
        it('should silently fall if no suite.path specified', () => {
            const fn = () => this.index.add({noSuite: true});

            assert.doesNotThrow(fn);
        });
    });

    describe('find', () => {
        it('should be able to find by suite', () => {
            const foundSuite = this.index.find(data.onlySuite);

            assert.deepEqual(foundSuite, data.onlySuite);
        });

        it('should be able to find by suite and state', () => {
            const foundSuiteState = this.index.find(data.suiteState);

            assert.deepEqual(foundSuiteState, data.suiteState);
        });

        it('should be able to find by suite, state and browser', () => {
            const foundSuiteStateBrowser = this.index.find(data.suiteStateBrowser);

            assert.deepEqual(foundSuiteStateBrowser, data.suiteStateBrowser);
        });

        it('should return null if suite is not found', () => {
            const foundSuite = this.index.find({suite: {path: 'another/test'}});

            assert.isNull(foundSuite);
        });

        it('should return null if state is not found', () => {
            const suite = {path: 'path/to/test'};
            const state = {name: 'another'};

            const foundSuiteState = this.index.find({suite, state});

            assert.isNull(foundSuiteState);
        });

        it('should return null if browser is not found', () => {
            const suite = {path: 'path/to/test'};
            const state = {name: 'state'};
            const browserId = 'bro';

            const foundSuiteStateBrowser = this.index.find({suite, state, browserId});

            assert.isNull(foundSuiteStateBrowser);
        });
    });
});
