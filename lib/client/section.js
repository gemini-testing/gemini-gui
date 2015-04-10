'use strict';
var successTemplate = require('../views/partials/success-result.hbs'),
    failTemplate = require('../views/partials/fail-result.hbs'),
    errorTemplate = require('../views/partials/error-result.hbs'),
    skipTemplate = require('../views/partials/skip-result.hbs'),
    xhr = require('./xhr');

var statusList = [
    'idle',
    'queued',
    'running',
    'success',
    'fail',
    'skip'
];

function statusClass(status) {
    return 'section_status_' + status;
}

function getInitialStatus(sectionNode) {
    var status;
    for (var i = 0; i< statusList.length; i++) {
        status = statusList[i];
        if (sectionNode.classList.contains(statusClass(status))) {
            return status;
        }
    }
    return null;
}

function Section(node, parent) {
    this.suiteId = node.getAttribute('data-suite-id');
    this.stateName = node.getAttribute('data-state-name');
    this.browserId = node.getAttribute('data-browser-id');
    this.domNode = node;
    this._status = getInitialStatus(node);
    this._titleNode = node.querySelector('.section__title');
    this._bodyNode = node.querySelector('.section__body');
    this._titleNode.addEventListener('click', this.toggle.bind(this));
    this._parent = parent;
}

Section.prototype = {
    constructor: Section,
    expand:function() {
        this.domNode.classList.remove('section_collapsed');
    },

    collapse: function() {
        this.domNode.classList.add('section_collapsed');
    },

    toggle: function() {
        this.domNode.classList.toggle('section_collapsed');
    },

    get status() {
        return this._status;
    },

    set status(value) {
        if (this._status) {
            this.domNode.classList.remove(statusClass(this._status));
        }

        this._status = value;
        this.domNode.classList.add(statusClass(this._status));
    },

    expandIfError: function() {
        if (this.status === 'fail') {
            this.expand();
        } else {
            this.collapse();
        }
    },

    setAsFailure: function(results) {
        this.status = 'fail';
        this._bodyNode.innerHTML = failTemplate(results);
        var replaceButton = this._bodyNode.querySelector('.image-box__replace');
        replaceButton.addEventListener('click', this.updateReference.bind(this));
    },

    setAsSuccess: function(results) {
        var failedChild = this.domNode.querySelector('.section.' + statusClass('fail'));
        if (failedChild) {
            return;
        }

        this.status = 'success';
        if (results) {
            this._bodyNode.innerHTML = successTemplate(results);
        }

        if (this._parent && this._parent.status === 'fail') {
            this._parent.setAsSuccess();
        }
    },

    setAsSkipped: function() {
        this.status = 'skipped';
        this._bodyNode.innerHTML = skipTemplate();
    },

    setAsError: function(error) {
        this.status = 'fail';
        this._bodyNode.innerHTML = errorTemplate(error);
    },

    isFinished: function() {
        return this.status !== 'queued' &&
            this.status !== 'running';
    },

    updateReference: function() {
        var _this = this,
            postData = {
                suiteId: this.suiteId,
                stateName: this.stateName,
                browserId: this.browserId
            };
        xhr.post('/update-ref', postData, function(error, response) {
            if (!error) {
                _this.setAsSuccess(response);
            }
        });
    }
};

module.exports = Section;
