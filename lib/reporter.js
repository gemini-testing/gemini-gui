'use strict';
var _ = require('lodash');

function convertData(data) {
    var result = _.omit(data, ['suite', 'state']);
    if (data.suite) {
        result.suiteId = data.suite.id;
        result.suiteName = data.suite.name;
    }
    if (data.state) {
        result.stateName = data.state.name;
    }
    return result;
}
module.exports = function(app) {
    return function reporter(runner) {
        function proxy(event) {
            runner.on(event, function(data) {
                app.sendClientEvent(event, convertData(data));
            });
        }

        proxy('begin');
        proxy('beginSuite');
        proxy('beginState');

        runner.on('endTest', function(data) {
            var response = {
                suiteId: data.suite.id,
                stateName: data.state.name,
                browserId: data.browserId,
                equal: data.equal,
                referenceURL: app.refPathToURL(data.referencePath),
                currentURL: app.currentPathToURL(data.currentPath)
            };

            if (data.equal) {
                app.sendClientEvent('endTest', response);
                return;
            }
            app.addFailedTest({
                suiteId: data.suite.id,
                stateName: data.state.name,
                browserId: data.browserId,
                referencePath: data.referencePath,
                currentPath: data.currentPath
            });
            app.buildDiff(data)
                .done(function(diffURL) {
                    response.diffURL = diffURL;
                    app.sendClientEvent('endTest', response);
                });
        });

        runner.on('error', function(error) {
            app.sendClientEvent('error', {
                suiteId: error.suite.id,
                stateName: error.state.name,
                browserId: error.browserId,
                stack: error.stack || error.message
            });
        });

        proxy('skipState');
        proxy('endState');
        proxy('endSuite');
        proxy('end');
    };
};
