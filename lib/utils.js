'use strict';

const fs = require('fs');
const zlib = require('zlib');

const Promise = require('bluebird');
const tar = require('tar-fs');
const format = require('util').format;

exports.decompress = function(source, destination) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(source)
            .on('error', reject)
            .pipe(zlib.createGunzip())
            .on('error', reject)
            .pipe(tar.extract(destination))
            .on('error', reject)
            .on('finish', resolve);
    });
};

// this code is executed on client side, so we can not use features from es5
exports.wrapLinkByTag = function(text) {
    return text.replace(/https?:\/\/[^\s]*/g, function(url) {
        return format('<a target="_blank" href="%s">%s</a>', url, url);
    });
};

class ExtendableError extends Error {
    constructor(message, cause) {
        super();

        this.message = message;
        Error.captureStackTrace(this, this.constructor);
        if (cause && cause.stack) {
            this.stack = this.stack.concat('\n\nCaused by:\n' + cause.stack);
        }
    }
}

exports.ExtendableError = ExtendableError;
