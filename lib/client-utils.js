'use strict';

const format = require('util').format;

// this code is executed on client side, so we can not use features from es5
exports.wrapLinkByTag = function(text) {
    return text.replace(/https?:\/\/[^\s]*/g, function(url) {
        return format('<a target="_blank" href="%s">%s</a>', url, url);
    });
};
