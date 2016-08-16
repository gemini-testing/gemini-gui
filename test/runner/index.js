'use strict';

const RunnerFactory = require('../../lib/runner');
const AllSuitesRunner = require('../../lib/runner/all-suites-runner');
const SpecificSuitesRunner = require('../../lib/runner/specific-suites-runner');
const mkDummyCollection = require('../utils').mkDummyCollection;

describe('RunnerFactory', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => sandbox.restore());

    describe('create', () => {
        it('should create AllSuitesRunner if no specific tests passed', () => {
            assert.instanceOf(RunnerFactory.create(), AllSuitesRunner);
        });

        it('should pass collection to AllSuitesRunner', () => {
            const collection = mkDummyCollection();
            const runner = RunnerFactory.create(collection);
            const runHandler = sandbox.stub();

            runner.run(runHandler);

            assert.calledWith(runHandler, collection);
        });

        it('should create SpecificSuitesRunner if specific tests passed', () => {
            assert.instanceOf(RunnerFactory.create(null, ['test']), SpecificSuitesRunner);
        });

        it('should pass suite collection and tests to SpecificSuiteRunner', () => {
            const collection = mkDummyCollection();
            const tests = [{
                suite: {path: 'suite'},
                state: {name: 'state'},
                browserId: 'browser'
            }];

            const runner = RunnerFactory.create(collection, tests);
            const runHandler = sandbox.stub();

            runner.run(runHandler);

            assert.calledWith(runHandler, collection);
            assert.calledOnce(collection.enable);
            assert.calledWith(collection.enable, 'suite', {state: 'state', browser: 'browser'});
        });
    });
});
