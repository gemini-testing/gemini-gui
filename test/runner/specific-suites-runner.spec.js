'use strict';

var _ = require('lodash'),
    SpecificSuiteRunner = require('../../lib/runner/specific-suites-runner'),

    mkDummyCollection = require('../utils').mkDummyCollection;

describe('SpecificSuiteRunner', function() {
    var sandbox = sinon.sandbox.create();

    afterEach(function() {
        sandbox.restore();
    });

    describe('run', function() {
        function run_(params) {
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
        }

        it('should disable all suites in collection', function() {
            var collection = mkDummyCollection();

            run_({collection: collection});

            expect(collection.disableAll).to.be.called();
        });

        it('should enable specific suites', function() {
            var collection = mkDummyCollection(),
                tests = [{
                        suite: {path: 'suite'},
                        state: {name: 'state'},
                        browserId: 'browser'
                    }];

            run_({
                collection: collection,
                tests: tests
            });

            expect(collection.enable).to.be.calledOnce
                .and.to.be.calledWith('suite', {state: 'state', browser: 'browser'});
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
