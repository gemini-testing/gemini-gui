'use strict';

const _ = require('lodash');

const SpecificSuiteRunner = require('../../lib/runner/specific-suites-runner');
const mkDummyCollection = require('../utils').mkDummyCollection;

describe('SpecificSuiteRunner', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => sandbox.restore());

    describe('run', () => {
        const run_ = (params) => {
            params = _.defaults(params || {}, {
                collection: mkDummyCollection(),
                runHandler: params.runHandler || sandbox.stub().named('default_run_handler'),
                tests: [{
                    suite: {path: 'default_suite'},
                    state: {name: 'default_state'},
                    browserId: 'default_browser_id'
                }]
            });

            return new SpecificSuiteRunner(params.collection, params.tests)
                .run(params.runHandler);
        };

        it('should disable all suites in collection', () => {
            const collection = mkDummyCollection();

            run_({collection});

            assert.called(collection.disableAll);
        });

        it('should enable specific suites', () => {
            const collection = mkDummyCollection(),
                tests = [{
                    suite: {path: 'suite'},
                    state: {name: 'state'},
                    browserId: 'browser'
                }];

            run_({collection, tests});

            assert.calledOnce(collection.enable);
            assert.calledWith(collection.enable, 'suite', {state: 'state', browser: 'browser'});
        });

        it('should execute run handler', () => {
            const collection = mkDummyCollection();
            const runHandler = sandbox.stub().named('run_handler');

            run_({runHandler, collection});

            assert.calledWith(runHandler, collection);
        });

        it('should return result of run handler', () => {
            const runHandler = sandbox.stub().named('run_handler').returns('some_result');
            const result = run_({runHandler});

            assert.equal(result, 'some_result');
        });
    });
});
