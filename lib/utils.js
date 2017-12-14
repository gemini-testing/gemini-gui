'use strict';

const fs = require('fs');
const zlib = require('zlib');

const Promise = require('bluebird');
const tar = require('tar-fs');

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
