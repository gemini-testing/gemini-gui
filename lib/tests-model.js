'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Index = require('./common/tests-index');
const clientUtils = require('./client-utils');

const getStatus = (skipped, reuse) => {
    if (skipped) {
        return 'skipped';
    }

    return _.get(reuse, 'result.status', 'idle');
};

const suiteOrStateStatus = (items) => {
    const groups = _.groupBy(items, 'status');

    if (!_.isEmpty(groups.error)) {
        return 'error';
    }

    if (!_.isEmpty(groups.fail)) {
        return 'fail';
    }

    if (!_.isEmpty(groups.idle)) {
        return 'idle';
    }

    if (!_.isEmpty(groups.success)) {
        return 'success';
    }

    return 'skipped';
};

function Tests(app) {
    this._app = app;
    this._index = new Index();
}

Tests.prototype = {
    constructor: Tests,

    get data() {
        return this._data;
    },

    get status() {
        return this._status;
    },

    initialize(suiteCollection, rawReuseSuites) {
        const reuseSuites = rawReuseSuites || [];
        return this._mapSuites(suiteCollection.topLevelSuites(), reuseSuites)
            .then((data) => {
                this._data = data;
                this._status = suiteOrStateStatus(this._data);
            });
    },

    _mapSuites: function(suites, reuseSuites) {
        return Promise.all(suites.map((suite) => {
            const reuse = _.find(reuseSuites, {name: suite.name, suitePath: suite.path});
            const reuseChildren = _.get(reuse, 'children') || [];

            return Promise.all([
                this._mapSuites(suite.children, reuseChildren),
                this._mapStates(suite, reuseChildren)
            ]).spread((children, states) => {
                const status = suiteOrStateStatus(children.concat(states));

                const data = {suite, children, states, status};
                data.suite.skipComment && (data.suite.skipComment = clientUtils.wrapLinkByTag(data.suite.skipComment));

                this._index.add(data);
                return data;
            });
        }));
    },

    _mapStates: function(suite, reuseStates) {
        return Promise.all(suite.states.map((state) => {
            const reuse = _.find(reuseStates, {name: state.name, suitePath: suite.path.concat(state.name)});

            return this._getBrowsersData(suite, state, _.get(reuse, 'browsers'))
                .then((browsers) => {
                    const status = suiteOrStateStatus(browsers);

                    const data = {suite, state, browsers, status};

                    this._index.add(data);
                    return data;
                });
        }));
    },

    _getBrowsersData: function(suite, state, reuseBrowsers) {
        return Promise.all(suite.browsers.map((browserId) => {
            const reuse = _.find(reuseBrowsers, {name: browserId});

            let extraMeta = {};
            if (reuse && reuse.result.metaInfo) {
                try {
                    extraMeta = JSON.parse(reuse.result.metaInfo);
                // eslint-disable-next-line no-empty
                } catch (e) {}
            }

            const metaInfoObj = Object.assign({}, state.metaInfo, extraMeta);
            const metaInfo = !_.isEmpty(metaInfoObj)
                ? JSON.stringify(metaInfoObj, null, 4)
                : 'Meta info is not available';

            const referencePath = this._app.getScreenshotPath(suite, state.name, browserId);
            const status = getStatus(state.shouldSkip(browserId), reuse);

            const reuseResult = reuse && _.findLast(
                [].concat(reuse.retries, reuse.result),
                (res) => res && (res.actualPath || res.diffPath)
            );

            let currentPath;
            let diffPath;

            if (reuseResult) {
                // if status is 'success' then actualPath is present, but there is no image
                currentPath = reuseResult.actualPath && status !== 'success' && this._app.createCurrentPathFor();
                diffPath = reuseResult.diffPath && this._app.createDiffPathFor();
            }

            const copyImagePromises = [
                currentPath ? this._app.copyImage(reuse.result.actualPath, currentPath) : Promise.resolve(),
                diffPath ? this._app.copyImage(reuse.result.diffPath, diffPath) : Promise.resolve()
            ];

            return Promise.all(copyImagePromises)
                .then(() => {
                    if (status === 'skipped') {
                        suite.skipComment = _.get(reuse, 'result.reason');
                    }

                    const data = {
                        suite,
                        state,
                        browserId,
                        metaInfo,
                        referenceURL: this._app.refPathToURL(referencePath, browserId),
                        currentURL: currentPath && this._app.currentPathToURL(currentPath),
                        diffURL: diffPath && this._app.diffPathToURL(diffPath),
                        rootUrl: this._app.getRootUrlforBrowser(browserId),
                        status,
                        stack: status === 'error' && _.get(reuse, 'result.reason')
                    };

                    if (data.status === 'fail') {
                        this._app.addFailedTest({suite, state, browserId, referencePath, currentPath});
                    }

                    this._index.add(data);
                    return data;
                });
        }));
    },

    find: function(query) {
        return this._index.find(query);
    }
};

module.exports = Tests;
