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
        .name('config')
        .title('Gemini config file')
        .long('config')
        .short('c')
        .def('.gemini.yml')
        .val(function(config) {
            return path.resolve(config);
        })
        .end()
    .act(function(options, args) {
        if (options.version) {
            return pkg.version;
        }

        return server.start(options).then(function(result) {
            console.log('GUI is running at %s', chalk.cyan(result.url));
            opener(result.url);
        });
    });
