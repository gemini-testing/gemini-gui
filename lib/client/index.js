/*jshint browser:true*/
'use strict';
var SectionList = require('./section-list'),
    xhr = require('./xhr'),
    byId = document.getElementById.bind(document),
    runButton,
    sections;

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
            section = sections.findSection({suiteId: data.suiteId});

        if (section.status === 'queued') {
            section.status = 'running';
        }
    });

    eventSource.addEventListener('beginState', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName
            });

        if (section.status === 'queued') {
            section.status = 'running';
        }
    });

    eventSource.addEventListener('endTest', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName,
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
                suiteId: data.suiteId,
                stateName: data.stateName,
                browserId: data.browserId
            });
        section.setAsSkipped();
        var stateSection = sections.findSection({
            suiteId: data.suiteId,
            stateName: data.stateName
        });

        sections.markIfFinished(stateSection);
    });

    eventSource.addEventListener('error', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName,
                browserId: data.browserId
            });
        section.setAsError({stack: data.stack});
        section.expand();
        failAllParents(section);
    });

    eventSource.addEventListener('endState', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName
            });

        sections.markIfFinished(section);
    });

    eventSource.addEventListener('endSuite', function(e) {
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName,
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

document.addEventListener('DOMContentLoaded', function() {
    sections = new SectionList();
    runButton = byId('run');
    listenForEvents();

    byId('expandAll').addEventListener('click', sections.expandAll.bind(sections));
    byId('collapseAll').addEventListener('click', sections.collapseAll.bind(sections));
    byId('expandErrors').addEventListener('click', sections.expandErrors.bind(sections));
    runButton.addEventListener('click', run);
});
