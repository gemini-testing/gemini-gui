'use strict';

exports.post = function(url, data, callback) {
    if (!callback) {
        callback = data;
        data = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        var data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
            callback(null, data);
        } else {
            callback(new Error(data.error));
        }
    };

    if (data) {
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send();
    }
};
