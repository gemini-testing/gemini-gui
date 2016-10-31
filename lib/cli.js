'use strict';
const path = require('path');
const opener = require('opener');
const chalk = require('chalk');
const program = require('commander');

const pkg = require('../package.json');
const server = require('./server');

const collect = (newValue, array) => (array || []).concat(newValue);

exports.run = () => {
    program
        .version(pkg.version)
        .allowUnknownOption(true)
        .option('-b, --browser <browser>', 'run test only in the specified browser', collect)
        .option('-p, --port <port>', 'Port to launch server on', 8000)
        .option('-h, --hostname <hostname>', 'Hostname to launch server on', 'localhost')
        .option('-c, --config <file>', 'Gemini config file', path.resolve, '')
        .option('-g, --grep <pattern>', 'run only suites matching the pattern', RegExp)
        .option('-s, --set <set>', 'set to run', collect)
        .option('-a, --auto-run', 'auto run immediately')
        .parse(process.argv);

    program.on('--help', () => {
        console.log('Also you can override gemini config options.');
        console.log('See all possible options in gemini documentation.');
    });

    program.testFiles = [].concat(program.args);
    server.start(program).then((result) => {
        console.log(`GUI is running at ${chalk.cyan(result.url)}`);
        opener(result.url);
    }).done();
};
