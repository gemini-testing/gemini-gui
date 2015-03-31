'use strict';
module.exports = function(app) {

    return function reporter(runner) {
        function proxy(event) {
            runner.on(event, function(data) {
                app.sendClientEvent(event, data);
            });
        }

        proxy('begin');
        proxy('beginSuite');
        proxy('beginState');

        runner.on('endTest', function(data) {
            var response = {
                suiteId: data.suiteId,
                stateName: data.stateName,
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
                suiteId: data.suiteId,
                stateName: data.stateName,
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
                suiteId: error.suiteId,
                stateName: error.stateName,
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
