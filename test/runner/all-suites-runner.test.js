'use strict';

var _ = require('lodash'),
    AllSuitesRunner = require('../../lib/runner/all-suites-runner'),

    mkDummyCollection = require('../utils').mkDummyCollection;

describe('AllSuitesRunner', function() {
    var sandbox = sinon.sandbox.create();

    afterEach(function() {
        sandbox.restore();
    });

    describe('run', function() {
        function run_(params) {
            params = _.defaults(params || {}, {
                collection: params.collection || mkDummyCollection(),
                runHandler: params.runHandler || sandbox.stub().named('default_run_handler')
            });

            return new AllSuitesRunner(params.collection)
                .run(params.runHandler);
        }

        it('should enable all suites in collection', function() {
            var collection = mkDummyCollection();

            run_({collection: collection});

            expect(collection.enableAll).to.be.called();
        });

        it('should execute run handler', function() {
            var collection = mkDummyCollection(),
                runHandler = sandbox.stub().named('run_handler');

            run_({
                runHandler: runHandler,
                collection: collection
            });

            expect(runHandler).to.be.calledWith(collection);
        });

        it('should return result of run handler', function() {
            var runHandler = sandbox.stub().named('run_handler').returns('some_result'),
                result = run_({runHandler: runHandler});

            expect(result).to.be.equal('some_result');
        });
    });
});
