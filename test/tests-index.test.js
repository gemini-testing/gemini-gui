'use strict';
var TestsIndex = require('../lib/common/tests-index'),
    expect = require('chai').expect,
    data = {
        onlySuite: {
            suite: {id: 1}
        },

        suiteState: {
            suite: {id: 1},
            state: {name: 'state'}
        },

        suiteStateBrowser: {
            suite: {id: 1},
            state: {name: 'state'},
            browserId: 'browser'
        }
    };
describe('TestsIndex', function() {
    beforeEach(function() {
        this.index = new TestsIndex();
        this.index.add(data.onlySuite);
        this.index.add(data.suiteState);
        this.index.add(data.suiteStateBrowser);
    });

    describe('add', function() {
        it('should silently fall if no suite.id specified', function() {
            expect(function() {
                this.index.add({noSuite: true});
            }.bind(this)).not.to.throw();
        });
    });

    describe('find', function() {
        it('should be able to find by suite', function() {
            expect(this.index.find(data.onlySuite)).to.be.equal(data.onlySuite);
        });

        it('should be able to find by suite and state', function() {
            expect(this.index.find(data.suiteState)).to.be.equal(data.suiteState);
        });

        it('should be able to find by suite, state and browser', function() {
            expect(this.index.find(data.suiteStateBrowser)).to.be.equal(data.suiteStateBrowser);
        });

        it('should return null if suite is not found', function() {
            expect(this.index.find({suite: {id: 2}})).to.be.equal(null);
        });

        it('should return null if state is not found', function() {
            expect(this.index.find({suite: {id: 1}, state: {name: 'another'}})).to.be.equal(null);
        });

        it('should return null if browser is not found', function() {
            expect(this.index.find({suite: {id: 1}, state: {name: 'state'}, browserId: 'bro'})).to.be.equal(null);
        });
    });
});
