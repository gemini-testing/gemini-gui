/*jshint browser:true*/
'use strict';
var SectionList = require('./section-list'),
    xhr = require('./xhr'),
    byId = document.getElementById.bind(document),
    runButton,
    sections,
    forEach = Array.prototype.forEach,
    filter = Array.prototype.filter,
    hbruntime = require('hbsfy/runtime');

hbruntime.registerPartial('cswitcher', require('../views/partials/cswitcher.hbs'));

function failAllParents(section) {
    while ((section = sections.findParent(section))) {
        section.status = 'fail';
        section.expand();
    }
}

function listenForEvents() {
    var eventSource = new EventSource('/events');

    eventSource.addEventListener('beginSuite', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({suite: data.suite});

        if (section && section.status === 'queued') {
            section.status = 'running';
        }
    });

    eventSource.addEventListener('beginState', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state
            });

        if (section && section.status === 'queued') {
            section.status = 'running';
        }
    });

    eventSource.addEventListener('endTest', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state,
                browserId: data.browserId
            });

        if (data.equal) {
            section.setAsSuccess(data);
        } else {
            section.setAsFailure(data);
            section.expand();
            failAllParents(section);
        }
    });

    eventSource.addEventListener('skipState', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state,
                browserId: data.browserId
            });
        section.setAsSkipped();
        var stateSection = sections.findSection({
            suite: data.suite,
            state: data.state
        });

        sections.markIfFinished(stateSection);
    });

    eventSource.addEventListener('error', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state,
                browserId: data.browserId
            });
        section.setAsError({stack: data.stack});
        section.expand();
        failAllParents(section);
    });

    eventSource.addEventListener('endState', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state
            });

        sections.markIfFinished(section);
    });

    eventSource.addEventListener('endSuite', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suite: data.suite,
                state: data.state,
                browserId: data.browserId
            });

        sections.markIfFinished(section);
    });

    eventSource.addEventListener('end', function(e) {
        runButton.disabled = false;
    });
}

function run() {
    runButton.disabled = true;
    xhr.post('/run', function(error, data) {
        if (!error) {
            sections.markAllAsQueued();
        }
    });
}

function handleColorSwitch(target, sources) {
    var imageBox = findClosest(target, 'image-box');

    sources.forEach(function(item) {
        item.classList.remove('cswitcher__item_selected');
    });
    forEach.call(imageBox.classList, function(cls) {
        if (/cswitcher_color_\d+/.test(cls)) {
            imageBox.classList.remove(cls);
        }
    });

    target.classList.add('cswitcher__item_selected');
    imageBox.classList.add('cswitcher_color_' + target.dataset.id);
}

function bodyClick(e) {
    var target = e.target;
    if (target.classList.contains('cswitcher__item')) {
        handleColorSwitch(
            target,
            filter.call(target.parentNode.childNodes, function(node) {
                return node.nodeType === Node.ELEMENT_NODE;
            })
        );
    }
}

function findClosest(context, cls) {
    while ((context = context.parentNode)) {
        if (context.classList.contains(cls)) {
            return context;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    sections = new SectionList();
    runButton = byId('run');
    listenForEvents();

    byId('expandAll').addEventListener('click', sections.expandAll.bind(sections));
    byId('collapseAll').addEventListener('click', sections.collapseAll.bind(sections));
    byId('expandErrors').addEventListener('click', sections.expandErrors.bind(sections));
    runButton.addEventListener('click', run);
    document.body.addEventListener('click', bodyClick);
});
