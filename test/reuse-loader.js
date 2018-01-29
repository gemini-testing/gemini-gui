'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const proxyquire = require('proxyquire');
const temp = require('temp');

const utils = require('./../lib/utils');

describe('lib/reuse-loader', () => {
    const sandbox = sinon.sandbox.create();

    const mkLargeDownload = (load) => {
        const largeDownload = sinon.stub();
        largeDownload.prototype.load = load || (() => Promise.resolve());
        return largeDownload;
    };

    const requireReuseDataFunc = (opts) => {
        opts = opts || {};

        return proxyquire('../lib/reuse-loader', {
            'large-download': opts.largeDownload || mkLargeDownload(),
            './utils': {
                decompress: opts.decompress || sinon.stub().returns(Promise.resolve()),
                Error: utils.Error
            }
        });
    };

    const stubModules = () => {
        sandbox.stub(temp, 'mkdirSync');
        sandbox.stub(fs, 'existsSync').returns(false);
        sandbox.stub(fs, 'mkdirSync');
        sandbox.stub(fs, 'readdirSync').returns([]);
        sandbox.stub(fs, 'statSync').returns({isDirectory: () => false});
        sandbox.stub(path, 'resolve').returns('path');
    };

    afterEach(() => sandbox.restore());

    it('should resolve if no url or path is passed', () => {
        const loadReuseData = requireReuseDataFunc();
        stubModules();

        return assert.isFulfilled(loadReuseData());
    });

    it('should reject if error occurred while reading file from fs', () => {
        const loadReuseData = requireReuseDataFunc();
        stubModules();
        fs.existsSync.returns(true);
        path.resolve.onSecondCall().throws(new Error('read file error'));

        return loadReuseData('path')
            .then(
                () => assert.fail('should reject'),
                (err) => {
                    assert.include(err.message, 'Nothing to reuse in ');
                    assert.include(err.stack, 'read file error');
                }
            );
    });

    it('should download archive if valid url specified', () => {
        const largeDownloadMock = mkLargeDownload();
        const loadReuseData = requireReuseDataFunc({largeDownload: largeDownloadMock});
        stubModules();

        return loadReuseData('url')
            .then(() => {
                assert.calledOnce(largeDownloadMock);
                assert.calledWith(largeDownloadMock, sinon.match({link: 'url'}));
            });
    });

    it('should reject if download fails', () => {
        const largeDownloadMock = mkLargeDownload(() => Promise.reject(new Error('download failed')));
        const loadReuseData = requireReuseDataFunc({largeDownload: largeDownloadMock});
        stubModules();

        return loadReuseData('url')
            .then(
                () => assert.fail('should reject'),
                (err) => {
                    assert.calledOnce(largeDownloadMock);

                    assert.include(err.message, 'Failed to reuse report from ');
                    assert.include(err.stack, 'download failed');
                }
            );
    });

    it('should decompress archive if archive is downloaded', () => {
        const decompressMock = sinon.stub().returns(Promise.resolve());
        const loadReuseData = requireReuseDataFunc({decompress: decompressMock});
        stubModules();

        return loadReuseData('url')
            .then(() => assert.calledOnce(decompressMock));
    });

    it('should reject if decompress fails', () => {
        const decompressMock = sinon.stub().returns(Promise.reject(new Error('extract failed')));
        const loadReuseData = requireReuseDataFunc({decompress: decompressMock});
        stubModules();

        return loadReuseData('url')
            .then(
                () => assert.fail('should reject'),
                (err) => {
                    assert.include(err.message, 'Failed to reuse report from ');
                    assert.include(err.stack, 'extract failed');
                }
            );
    });

    it('should choose folder from temp dir for reuse', () => {
        const loadReuseData = requireReuseDataFunc();
        stubModules();
        temp.mkdirSync.returns('/tempdir');
        fs.readdirSync.returns(['r-archive', 'r-dir']);
        path.resolve.withArgs('/tempdir', 'r-dir').returns('/temp/r-dir');
        fs.statSync.withArgs('/temp/r-dir').returns({isDirectory: () => true});

        return loadReuseData('url')
            .then((reuseData) => {
                assert.isDefined(reuseData);
                assert.equal(reuseData.report, '/temp/r-dir');
            });
    });
});
