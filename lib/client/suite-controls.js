'use strict';

function SuiteControls(parentNode) {
    this._acceptButton = parentNode.querySelector('.suite-controls__accept');
    this._retryButton = parentNode.querySelector('.suite-controls__retry');
}

SuiteControls.prototype = {
    setAsNewReference: function(retryHandler, acceptHandler) {
        this._setButtonEnabled(this._acceptButton, true);
        this._attachHandlers(retryHandler, acceptHandler);
    },

    setAsSuccess: function(retryHandler) {
        this._setButtonVisible(this._acceptButton, false);
        this._enableIfNotRunning(this._retryButton);
        this._attachHandlers(retryHandler);
    },

    setAsFailure: function(retryHandler, acceptHandler) {
        this._setButtonEnabled(this._acceptButton, true);
        this._enableIfNotRunning(this._retryButton);
        this._attachHandlers(retryHandler, acceptHandler);
    },

    toggleRetry: function(isEnabled) {
        this._setButtonEnabled(this._retryButton, isEnabled);
    },

    _enableIfNotRunning: function(button) {
        var isRunning = window.controller.state === 'running';

        this._setButtonEnabled(button, !isRunning);
    },

    _setButtonEnabled: function(button, isEnabled) {
        if (isEnabled) {
            button.classList.remove('suite-controls__item_disabled');
        } else {
            button.classList.add('suite-controls__item_disabled');
        }

        button.disabled = !isEnabled;
    },

    _setButtonVisible: function(button, isVisible) {
        if (isVisible) {
            button.classList.remove('suite-controls__item_hidden');
        } else {
            button.classList.add('suite-controls__item_hidden');
        }
    },

    _attachHandlers: function(retryHandler, acceptHandler) {
        if (retryHandler) {
            this._retryButton.addEventListener('click', retryHandler);
        }

        if (acceptHandler) {
            this._acceptButton.addEventListener('click', acceptHandler);
        }
    }
};

module.exports = SuiteControls;
