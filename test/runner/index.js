'use strict';

var RunnerFactory = require('../../lib/runner'),
    AllSuitesRunner = require('../../lib/runner/all-suites-runner'),
    SpecificSuitesRunner = require('../../lib/runner/specific-suites-runner'),

    mkDummyCollection = require('../utils').mkDummyCollection;

describe('RunnerFactory', function() {
    var sandbox = sinon.sandbox.create();

    afterEach(function() {
        sandbox.restore();
    });

    describe('create', function() {
        it('should create AllSuitesRunner if no specific tests passed', function() {
            expect(RunnerFactory.create()).to.be.instanceOf(AllSuitesRunner);
        });

        it('should pass collection to AllSuitesRunner', function() {
            var collection = mkDummyCollection(),
                runner = RunnerFactory.create(collection),
                runHandler = sandbox.stub();

            runner.run(runHandler);

            expect(runHandler).to.be.calledWith(collection);
        });

        it('should create SpecificSuitesRunner if specific tests passed', function() {
            expect(RunnerFactory.create(null, ['test'])).to.be.instanceOf(SpecificSuitesRunner);
        });

        it('should pass suite collection and tests to SpecificSuiteRunner', function() {
            var collection = mkDummyCollection(),
                tests = [{
                    suite: {path: 'suite'},
                    state: {name: 'state'},
                    browserId: 'browser'
                }],
                runner = RunnerFactory.create(collection, tests),
                runHandler = sandbox.stub();

            runner.run(runHandler);

            expect(runHandler).to.be.calledWith(collection);
            expect(collection.enable).to.be.calledOnce
                .and.to.be.calledWith('suite', {state: 'state', browser: 'browser'});
        });
    });
});
