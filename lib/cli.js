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
        .option('--hostname <hostname>', 'Hostname to launch server on', 'localhost')
        .option('-c, --config <file>', 'Gemini config file', path.resolve, '')
        .option('-g, --grep <pattern>', 'run only suites matching the pattern', RegExp)
        .option('-s, --set <set>', 'set to run', collect)
        .option('-a, --auto-run', 'auto run immediately')
        .option('-O, --no-open', 'not to open a browser window after starting the server')
        .option('--reuse <filepath|url>', 'Filepath to gemini tests results directory OR url to tar.gz archive to reuse')
        .parse(process.argv);

    program.on('--help', () => {
        console.log('Also you can override gemini config options.');
        console.log('See all possible options in gemini documentation.');
    });

    program.testFiles = [].concat(program.args);

    server.start(program).then((result) => {
        console.log(`GUI is running at ${chalk.cyan(result.url)}`);
        console.warn(`${chalk.red('Warning: this package is deprecated. Use html-reporter instead.')}`);
        console.warn(`${chalk.red('See: https://github.com/gemini-testing/gemini-gui#how-to-migrate')}`);
        if (program.open) {
            opener(result.url);
        }
    }).done();
};
