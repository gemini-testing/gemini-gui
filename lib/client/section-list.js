/*jshint browser:true*/
'use strict';
var Section = require('./section'),
    Index = require('../common/tests-index'),
    map = Array.prototype.map,
    every = Array.prototype.every;

function SectionList() {
    this._sectionsIndex = new Index();
    this._sections = map.call(document.querySelectorAll('.section'), function(node) {
        var parentNode = this._findParentSectionNode(node),
            section = new Section(node, parentNode && this._sectionForNode(parentNode));

        this._sectionsIndex.add(section);
        return section;
    }, this);
}

SectionList.prototype = {
    constructor: SectionList,

    expandAll: function() {
        this._sections.forEach(function(section) {
            section.expand();
        });
    },

    collapseAll: function() {
        this._sections.forEach(function(section) {
            section.collapse();
        });
    },

    expandErrors: function() {
        this._sections.forEach(function(section) {
            section.expandIfError();
        });
    },

    markAllAsQueued: function() {
        this._sections.forEach(function(section) {
            section.status = 'queued';
        });
    },

    markIfFinished: function(section) {
        if (section.status === 'fail') {
            //already marked as fail
            return;
        }
        var nodes = section.domNode.querySelectorAll('.section');
        var allChildrenFinished = every.call(nodes, function(node) {
            return this._sectionForNode(node).isFinished();
        }, this);

        if (allChildrenFinished) {
            section.status = 'success';
        }
    },

    findSection: function(query) {
        return this._sectionsIndex.find(query);
    },

    findParent: function(section) {
        if (section.browserId) {
            return this.findSection({
                suite: section.suite,
                state: section.state
            });
        }

        if (section.state && section.state.name) {
            return this.findSection({suite: section.suite});
        }
        var parentSectionNode = this._findParentSectionNode(section.domNode);
        if (parentSectionNode) {
            return this._sectionForNode(parentSectionNode);
        }
        return null;
    },

    _findParentSectionNode: function(node) {
        while ((node = node.parentNode)) {
            if (node.classList && node.classList.contains('section')) {
                return node;
            }
        }
        return null;
    },

    _sectionForNode: function(domNode) {
        var query = {
            suite: {path: domNode.getAttribute('data-suite-path')},
            state: {name: domNode.getAttribute('data-state-name')},
            browserId: domNode.getAttribute('data-browser-id')
        };

        return this.findSection(query);
    }
};

module.exports = SectionList;
