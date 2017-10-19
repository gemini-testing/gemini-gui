'use strict';

const Promise = require('bluebird');
const format = require('util').format;

exports.decompress = Promise.promisify(require('node-targz').decompress);

// this code is executed on client side, so we can not use features from es5
exports.wrapLinkByTag = function(text) {
    return text.replace(/https?:\/\/[^\s]*/g, function(url) {
        return format('<a target="_blank" href="%s">%s</a>', url, url);
    });
};

exports.Error = function(message, cause) {
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
    if (cause && cause.stack) {
        this.stack = this.stack.concat('\n\nCaused by:\n' + cause.stack);
    }
};
