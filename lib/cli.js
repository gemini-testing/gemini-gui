'use strict';
var path = require('path'),
    opener = require('opener'),
    chalk = require('chalk'),
    pkg = require('../package.json'),
    server = require('./server');

module.exports = require('coa').Cmd()
    .name(process.argv[1])
    .title(pkg.description)
    .helpful()
    .opt()
        .name('version')
        .title('Show version')
        .long('version')
        .flag()
        .end()
    .opt()
        .name('port')
        .title('Port to launch server on')
        .long('port')
        .short('p')
        .def(8000)
        .end()
    .opt()
        .name('hostname')
        .title('Hostname to launch server on')
        .long('hostname')
        .short('h')
        .def('localhost')
        .end()
    .opt()
        .name('configFile')
        .title('Gemini config file')
        .long('config')
        .short('c')
        .val(function(config) {
            return path.resolve(config);
        })
        .end()
    .opt()
        .name('rootUrl')
        .long('root-url').short('r')
        .title('Override root url')
        .end()
    .opt()
        .name('gridUrl')
        .long('grid-url').short('g')
        .title('Override grid url')
        .end()
    .opt()
        .name('screenshotsDir')
        .long('screenshots-dir').short('s')
        .title('Override screenshots dir')
        .end()
    .opt()
        .name('debug')
        .long('debug')
        .flag()
        .title('Turn on debugging output to the console')
        .end()
    .arg()
        .name('testFiles')
        .title('Paths to files or directories, containing tests')
        .arr()
        .end()
    .act(function(options, args) {
        if (options.version) {
            return pkg.version;
        }

        options.testFiles = args.testFiles;
        return server.start(options).then(function(result) {
            console.log('GUI is running at %s', chalk.cyan(result.url));
            opener(result.url);
        });
    });
