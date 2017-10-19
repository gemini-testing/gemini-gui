'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const LargeDownload = require('large-download');

const utils = require('./utils');
const extract = utils.decompress;
const ReuseError = utils.Error;

const downloadReport = (reuseUrl, timeout) => {
    const tempDir = temp.mkdirSync('gemini-gui-reuse');
    const archiveName = 'report.tar.gz';
    const archivePath = path.resolve(tempDir, archiveName);

    return new LargeDownload({link: reuseUrl, destination: archivePath, retries: 3, timeout})
        .load()
        .then(() => extract({source: archivePath, destination: tempDir}))
        // tempDir at this moment contains only report archive and unpacked report in some directory
        .then(() => {
            const reportDirName = fs.readdirSync(tempDir)
                .find((f) => fs.statSync(path.resolve(tempDir, f)).isDirectory());
            return path.resolve(tempDir, reportDirName);
        })
        .catch((e) => {
            throw new ReuseError(`Failed to reuse report from ${reuseUrl}`, e);
        });
};

const prepareReport = (urlOrPath, timeout) => {
    return fs.existsSync(urlOrPath)
        ? Promise.resolve(path.resolve(urlOrPath))
        : downloadReport(urlOrPath, timeout);
};

module.exports = (urlOrPath, timeout) => {
    if (!urlOrPath) {
        return Promise.resolve();
    }

    return prepareReport(urlOrPath, timeout)
        .then((report) => {
            try {
                const data = require(path.resolve(report, 'data'));
                return {data, report};
            } catch (e) {
                throw new ReuseError(`Nothing to reuse in ${report}`, e);
            }
        });
};
