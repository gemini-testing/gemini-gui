'use strict';
var path = require('path'),
    resolve = require('resolve'),
    semver = require('semver'),
    chalk = require('chalk'),

    COMPATIBLE_GEMINI = ' >= 0.8.x < 0.12.0';

module.exports = function findGemini() {
    var geminiPackage;
    try {
        geminiPackage = resolve.sync('gemini/package.json', {
            basedir: process.cwd()
        });
    } catch (e) {
        console.error(chalk.red('Error:'), 'gemini not found');
        console.error('Local gemini installation is required to use GUI');
        console.error('Run ', chalk.cyan('npm install gemini'), 'to install gemini');
        throw e;
    }

    var version = require(geminiPackage).version;
    if (!semver.satisfies(version, COMPATIBLE_GEMINI)) {
        console.error(chalk.red('Error:'), 'installed gemini is not compatible with GUI');
        console.error('gemini version should be in range', chalk.cyan(COMPATIBLE_GEMINI));
        throw new Error('No compatible version');
    }

    var modulePath = path.dirname(geminiPackage);
    return require(path.join(modulePath, 'api'));
};
