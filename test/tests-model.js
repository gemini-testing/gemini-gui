'use strict';

const App = require('../lib/app');
const Tests = require('../lib/tests-model');

describe('lib/tests-model', () => {
    const sandbox = sinon.sandbox.create();

    let app;

    const mkReuseBrowserResult_ = (browser, status, data, retries) => {
        return {name: browser, result: Object.assign({status}, data), retries};
    };

    const mkReuseState_ = (suite, state, browsers) => {
        return {
            name: state,
            suitePath: [suite, state],
            browsers: browsers.map((b) => mkReuseBrowserResult_(b.browser, b.status, b.ext, b.retries))
        };
    };

    const mkReuseSuite_ = (suite, states) => {
        return {
            name: suite,
            suitePath: [suite],
            children: states.map((state) => mkReuseState_(suite, state.name, state.browsers))
        };
    };

    const mkCollectionState_ = (suite, state, skip, ext) => {
        return Object.assign({
            name: state,
            suite: {name: suite, path: [suite]},
            shouldSkip: skip || (() => false)
        }, ext);
    };

    const mkCollectionSuite_ = (suite, states, browsers) => {
        return {
            name: suite,
            path: [suite],
            children: [],
            browsers,
            states: states.map((s) => mkCollectionState_(suite, s.name, s.skip, s.ext))
        };
    };

    const mkSuiteCollection_ = (collection) => {
        return {topLevelSuites: () => collection};
    };

    const createTests = (app, rawSuites, rawReuse) => {
        const suites = rawSuites.map((s) => mkCollectionSuite_(s.suite, s.states, s.browsers));
        const reuse = rawReuse && rawReuse.map((s) => mkReuseSuite_(s.suite, s.states));

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

    describe('without reuse', () => {
        it('suite and state should be skipped if state is skipped in all browsers', () => {
            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', skip: () => true}],
                browsers: ['bro-success', 'bro-fail', 'bro-skip']
            }])
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

        it('suite and state should be idle if state is not skipped in all browsers', () => {
            const shouldSkip = sandbox.stub().returns(false);
            shouldSkip.withArgs('bro1').returns(true);

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', skip: shouldSkip}],
                browsers: ['bro1', 'bro2']
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

        it('should add metaInfo field from state', () => {
            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }])
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

        it('should create reference url', () => {
            app.getScreenshotPath.returns('ref path');
            app.refPathToURL.withArgs('ref path', 'bro').returns('ref url');

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }])
                .then((tests) => {
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

    describe('with reuse', () => {
        it('suite and state should be skipped if state is skipped in all browsers', () => {
            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', skip: () => true}],
                browsers: ['bro-success', 'bro-fail', 'bro-skip']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro-success', status: 'success'},
                    {browser: 'bro-fail', status: 'fail'},
                    {browser: 'bro-skip', status: 'skipped'}
                ]}
            ]}])
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

        it('suite and state should be succeed if state is skipped or succeed in all browsers', () => {
            const shouldSkip = sandbox.stub().returns(false);
            shouldSkip.withArgs('bro-skip').returns(true);

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', skip: shouldSkip}],
                browsers: ['bro-success', 'bro-skip']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro-success', status: 'success'},
                    {browser: 'bro-skip', status: 'skipped'}
                ]}
            ]}])
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

        it('suite and state should be failed if state is failed in any browser', () => {
            const shouldSkip = sandbox.stub().returns(false);
            shouldSkip.withArgs('bro-skip').returns(true);

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', skip: shouldSkip}],
                browsers: ['bro-success', 'bro-fail', 'bro-skip']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro-success', status: 'success'},
                    {browser: 'bro-fail', status: 'fail'},
                    {browser: 'bro-skip', status: 'skipped'}
                ]}
            ]}])
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

        it('should add metaInfo field from reuse data', () => {
            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro', status: 'success', ext: {
                        metaInfo: JSON.stringify({sessionId: 'session-id', key: 'reuse-value'})
                    }}
                ]}
            ]}])
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

        it('should add metaInfo field from state', () => {
            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro', status: 'fail', ext: {
                        metaInfo: JSON.stringify({sessionId: 'session-id'})
                    }}
                ]}
            ]}])
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

        it('should create reference url', () => {
            app.getScreenshotPath.returns('ref path');
            app.refPathToURL.withArgs('ref path', 'bro').returns('ref url');

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro', status: 'fail', ext: {
                        metaInfo: JSON.stringify({sessionId: 'session-id'})
                    }}
                ]}
            ]}])
                .then((tests) => {
                    const test = tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro'
                    });

                    assert.isNotNull(test);
                    assert.equal(test.referenceURL, 'ref url');
                });
        });

        it('should create current url', () => {
            app.currentDir = 'current_dir';
            app.createCurrentPathFor.withArgs().returns('/reused/image/path');
            app.currentPathToURL.withArgs('/reused/image/path').returns('curr url');

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro', status: 'fail', ext: {
                        metaInfo: JSON.stringify({sessionId: 'session-id'}),
                        actualPath: 'actual/rel'
                    }}
                ]}
            ]}])
                .then((tests) => {
                    const test = tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro'
                    });

                    assert.isNotNull(test);
                    assert.equal(test.currentURL, 'curr url');
                });
        });

        it('should create diff url', () => {
            app.diffDir = 'diff_dir';
            app.createDiffPathFor.withArgs().returns('/reused/image/path');
            app.diffPathToURL.withArgs('/reused/image/path').returns('diff url');

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {browser: 'bro', status: 'fail', ext: {
                        metaInfo: JSON.stringify({sessionId: 'session-id'}),
                        diffPath: 'diff/rel'
                    }}
                ]}
            ]}])
                .then((tests) => {
                    const test = tests.find({
                        suite: {name: 'suite1', path: ['suite1']},
                        state: {name: 'state1'},
                        browserId: 'bro'
                    });

                    assert.isNotNull(test);
                    assert.equal(test.diffURL, 'diff url');
                });
        });

        it('should use data from retries if no image in result', () => {
            app.diffDir = 'diff_dir';
            app.createDiffPathFor.withArgs().returns('/reused/image/path');
            app.diffPathToURL.withArgs('/reused/image/path').returns('diff url');

            return createTests(app, [{
                suite: 'suite1',
                states: [{name: 'state1', ext: {metaInfo: {key: 'state-value'}}}],
                browsers: ['bro']
            }], [{suite: 'suite1', states: [
                {name: 'state1', browsers: [
                    {
                        browser: 'bro',
                        status: 'fail',
                        ext: {
                            metaInfo: 'fiasco'
                        },
                        retries: [
                            {
                                status: 'fail',
                                metaInfo: JSON.stringify({sessionId: 'session-id'}),
                                diffPath: 'diff/rel'
                            }
                        ]
                    }
                ]}
            ]}])
                .then((tests) => {
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
});
