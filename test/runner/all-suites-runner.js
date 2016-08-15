'use strict';

const _ = require('lodash');

const AllSuitesRunner = require('../../lib/runner/all-suites-runner');
const mkDummyCollection = require('../utils').mkDummyCollection;

describe('AllSuitesRunner', () => {
    var sandbox = sinon.sandbox.create();

    afterEach(() => sandbox.restore());

    describe('run', () => {
        const run_ = (params) => {
            params = _.defaults(params || {}, {
                collection: params.collection || mkDummyCollection(),
                runHandler: params.runHandler || sandbox.stub().named('default_run_handler')
            });

            return new AllSuitesRunner(params.collection)
                .run(params.runHandler);
        };

        it('should enable all suites in collection', () => {
            const collection = mkDummyCollection();

            run_({collection});

            assert.called(collection.enableAll);
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
