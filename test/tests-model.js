'use strict';

const App = require('../lib/app');
const Tests = require('../lib/tests-model');

describe('tests-model', () => {
    const sandbox = sinon.sandbox.create();

    let app;

    const stubBrowserResult_ = (browser, status, data) => {
        const statusObj = {};
        statusObj[status] = true;
        return {name: browser, result: Object.assign({}, data, statusObj)};
    };

    const mkSuiteCollection_ = (collection) => {
        return {topLevelSuites: () => collection};
    };

    const createTests = (app, suites, reuse) => {
        const tests = new Tests(app);
        return tests.initialize(mkSuiteCollection_(suites), reuse)
            .then(() => tests);
    };

    const assertIdle = (item) => {
        assert.isNotNull(item);
        assert.equal(item.status, 'idle');
    };

    const assertSkipped = (item) => {
        assert.isNotNull(item);
        assert.equal(item.status, 'skipped');
    };

    const assertSuccess = (item) => {
        assert.isNotNull(item);
        assert.equal(item.status, 'success');
    };

    const assertFail = (item) => {
        assert.isNotNull(item);
        assert.equal(item.status, 'fail');
    };

    beforeEach(() => {
        app = sinon.createStubInstance(App);
    });

    [
        {
            title: 'without reuse'
        },
        {
            title: 'with reuse',
            reuse: [{
                name: 'suite1',
                suitePath: ['suite1'],
                children: [{
                    name: 'state1',
                    suitePath: ['suite1', 'state1'],
                    browsers: [
                        stubBrowserResult_('bro-success', 'success'),
                        stubBrowserResult_('bro-fail', 'fail'),
                        stubBrowserResult_('bro-skip', 'skipped')
                    ]
                }]
            }]
        }
    ].forEach((testSetup) => {
        it(`${testSetup.title} suite and state should be skipped if state is skipped in all browsers`, () => {
            return createTests(app, [{
                name: 'suite1',
                path: ['suite1'],
                children: [],
                browsers: ['bro-success', 'bro-fail', 'bro-skip'],
                states: [{
                    name: 'state1',
                    suite: {name: 'suite1', path: ['suite1']},
                    shouldSkip: () => true
                }]
            }], testSetup.reuse)
                .then((tests) => {
                    assertSkipped(tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro-success'
                    }));

                    assertSkipped(tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro-fail'
                    }));

                    assertSkipped(tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro-skip'
                    }));

                    assertSkipped(tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'}
                    }));

                    assertSkipped(tests.find({
                        suite: {name: 'suite1', path: ['suite1']}
                    }));
                });
        });
    });

    it('without reuse suite and state should be idle if state is not skipped in all browsers', () => {
        const shouldSkip = sandbox.stub().returns(false);
        shouldSkip.withArgs('bro1').returns(true);

        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro1', 'bro2'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                shouldSkip
            }]
        }])
            .then((tests) => {
                assertSkipped(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro1'
                }));

                assertIdle(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro2'
                }));

                assertIdle(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'}
                }));

                assertIdle(tests.find({
                    suite: {name: 'suite1', path: ['suite1']}
                }));
            });
    });

    it('with reuse suite and state should be succeed if state is skipped or succeed in all browsers', () => {
        const shouldSkip = sandbox.stub().returns(false);
        shouldSkip.withArgs('bro-skip').returns(true);

        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro-success', 'bro-skip'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                shouldSkip
            }]
        }], [{
            name: 'suite1',
            suitePath: ['suite1'],
            children: [{
                name: 'state1',
                suitePath: ['suite1', 'state1'],
                browsers: [
                    stubBrowserResult_('bro-success', 'success'),
                    stubBrowserResult_('bro-skip', 'skipped')
                ]
            }]
        }])
            .then((tests) => {
                assertSuccess(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro-success'
                }));

                assertSkipped(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro-skip'
                }));

                assertSuccess(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'}
                }));

                assertSuccess(tests.find({
                    suite: {name: 'suite1', path: ['suite1']}
                }));
            });
    });

    it('with reuse suite and state should be failed if state is failed in any browser', () => {
        const shouldSkip = sandbox.stub().returns(false);
        shouldSkip.withArgs('bro-skip').returns(true);

        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro-success', 'bro-fail', 'bro-skip'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                shouldSkip
            }]
        }], [{
            name: 'suite1',
            suitePath: ['suite1'],
            children: [{
                name: 'state1',
                suitePath: ['suite1', 'state1'],
                browsers: [
                    stubBrowserResult_('bro-success', 'success'),
                    stubBrowserResult_('bro-fail', 'fail'),
                    stubBrowserResult_('bro-skip', 'skipped')
                ]
            }]
        }])
            .then((tests) => {
                assertSuccess(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro-success'
                }));

                assertFail(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro-fail'
                }));

                assertSkipped(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro-skip'
                }));

                assertFail(tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'}
                }));

                assertFail(tests.find({
                    suite: {name: 'suite1', path: ['suite1']}
                }));
            });
    });

    it('with reuse should add metaInfo field from reuse data', () => {
        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                metaInfo: {key: 'state-value'},
                shouldSkip: () => false
            }]
        }], [{
            name: 'suite1',
            suitePath: ['suite1'],
            children: [{
                name: 'state1',
                suitePath: ['suite1', 'state1'],
                browsers: [
                    stubBrowserResult_('bro', 'success', {
                        metaInfo: JSON.stringify({sessionId: 'session-id', key: 'reuse-value'})
                    })
                ]
            }]
        }])
            .then((tests) => {
                const test = tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro'
                });

                assert.isNotNull(test);
                assert.isString(test.metaInfo);
                assert.equal(JSON.parse(test.metaInfo).sessionId, 'session-id');
                assert.equal(JSON.parse(test.metaInfo).key, 'reuse-value');
            });
    });

    [
        {
            title: 'without reuse',
            collection: [{
                name: 'suite1',
                path: ['suite1'],
                children: [],
                browsers: ['bro'],
                states: [{
                    name: 'state1',
                    suite: {name: 'suite1', path: ['suite1']},
                    metaInfo: {key: 'state-value'},
                    shouldSkip: () => false
                }]
            }]
        },
        {
            title: 'with reuse',
            collection: [{
                name: 'suite1',
                path: ['suite1'],
                children: [],
                browsers: ['bro'],
                states: [{
                    name: 'state1',
                    suite: {name: 'suite1', path: ['suite1']},
                    metaInfo: {key: 'state-value'},
                    shouldSkip: () => false
                }]
            }],
            reuse: [{
                name: 'suite1',
                suitePath: ['suite1'],
                children: [{
                    name: 'state1',
                    suitePath: ['suite1', 'state1'],
                    browsers: [
                        stubBrowserResult_('bro', 'fail', {
                            metaInfo: JSON.stringify({sessionId: 'session-id'})
                        })
                    ]
                }]
            }]
        }
    ].forEach((testSetup) => {
        it(`${testSetup.title} should add metaInfo field from state`, () => {
            return createTests(app, testSetup.collection, testSetup.reuse)
                .then((tests) => {
                    const test = tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro'
                    });

                    assert.isNotNull(test);
                    assert.isString(test.metaInfo);
                    assert.equal(JSON.parse(test.metaInfo).key, 'state-value');
                });
        });

        it(`${testSetup.title} should create reference url`, () => {
            app.getScreenshotPath.withArgs(testSetup.collection[0], 'state1', 'bro').returns('ref path');
            app.refPathToURL.withArgs('ref path', 'bro').returns('ref url');

            return createTests(app, testSetup.collection, testSetup.reuse)
                .then((tests) => {
                    assert.calledOnce(app.getScreenshotPath);
                    assert.calledWithExactly(app.getScreenshotPath, testSetup.collection[0], 'state1', 'bro');

                    assert.calledOnce(app.refPathToURL);
                    assert.calledWithExactly(app.refPathToURL, 'ref path', 'bro');

                    const test = tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro'
                    });

                    assert.isNotNull(test);
                    assert.equal(test.referenceURL, 'ref url');
                });
        });
    });

    it('with reuse should create current url', () => {
        app.currentDir = 'current_dir';
        app.createCurrentPathFor.withArgs().returns('/reused/image/path');
        app.currentPathToURL.withArgs('/reused/image/path').returns('curr url');

        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                metaInfo: {key: 'state-value'},
                shouldSkip: () => false
            }]
        }], [{
            name: 'suite1',
            suitePath: ['suite1'],
            children: [{
                name: 'state1',
                suitePath: ['suite1', 'state1'],
                browsers: [
                    stubBrowserResult_('bro', 'fail', {
                        metaInfo: JSON.stringify({sessionId: 'session-id'}),
                        actualPath: 'actual/rel'
                    })
                ]
            }]
        }])
            .then((tests) => {
                assert.calledWithExactly(app.copyImage, 'actual/rel', '/reused/image/path');
                assert.calledWithExactly(app.currentPathToURL, '/reused/image/path');

                const test = tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro'
                });

                assert.isNotNull(test);
                assert.equal(test.currentURL, 'curr url');
            });
    });

    it('with reuse should create diff url', () => {
        app.diffDir = 'diff_dir';
        app.createDiffPathFor.withArgs().returns('/reused/image/path');
        app.diffPathToURL.withArgs('/reused/image/path').returns('diff url');

        return createTests(app, [{
            name: 'suite1',
            path: ['suite1'],
            children: [],
            browsers: ['bro'],
            states: [{
                name: 'state1',
                suite: {name: 'suite1', path: ['suite1']},
                metaInfo: {key: 'state-value'},
                shouldSkip: () => false
            }]
        }], [{
            name: 'suite1',
            suitePath: ['suite1'],
            children: [{
                name: 'state1',
                suitePath: ['suite1', 'state1'],
                browsers: [
                    stubBrowserResult_('bro', 'fail', {
                        metaInfo: JSON.stringify({sessionId: 'session-id'}),
                        diffPath: 'diff/rel'
                    })
                ]
            }]
        }])
            .then((tests) => {
                assert.calledWithExactly(app.copyImage, 'diff/rel', '/reused/image/path');
                assert.calledWithExactly(app.diffPathToURL, '/reused/image/path');

                const test = tests.find({
                    suite: {name: 'suite1', path: ['suite1']},
                    state: {name: 'state1'},
                    browserId: 'bro'
                });

                assert.isNotNull(test);
                assert.equal(test.diffURL, 'diff url');
            });
    });
});
