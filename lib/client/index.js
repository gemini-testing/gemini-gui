/*jshint browser:true*/
'use strict';
var SectionList = require('./section-list'),
    xhr = require('./xhr'),
    byId = document.getElementById.bind(document),
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
        console.log('endTest', e.data);
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
        console.log('endState', e.data);
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName
            });

        sections.markIfFinished(section);
    });

    eventSource.addEventListener('endSuite', function(e) {
        console.log('endSuite', e.data);
        var data = JSON.parse(e.data),
            section = sections.findSection({
                suiteId: data.suiteId,
                stateName: data.stateName,
                browserId: data.browserId
            });

        sections.markIfFinished(section);
    });

    //eventSource.addEventListener('beginTest', function(e) {
        //var data = JSON.parse(e.data);
        //sections.findSection(data.testId).status = 'running';
        //sections.findSection(data.testId, data.browserId).status = 'running';
    //});

    //eventSource.addEventListener('testResult', function(e) {
        //var data = JSON.parse(e.data),
            //section = sections.findSection(data.testId, data.browserId);

        //if (data.success) {
            //section.setAsSuccess(data);
        //} else {
            //section.setAsFailure(data);
            //sections.findSection(data.testId).expand();
            //section.expand();
        //}
    //});

    //eventSource.addEventListener('endTest', function(e) {
        //var data = JSON.parse(e.data),
            //section = sections.findSection(data.testId, data.browserId);
        //section.status =  (data.allSucceeded? 'success' : 'fail');
    //});
}

function run() {
    xhr.post('/run', function(error, data) {
        if (!error) {
            sections.markAllAsQueued();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    sections = new SectionList();
    listenForEvents();

    byId('expandAll').addEventListener('click', sections.expandAll.bind(sections));
    byId('collapseAll').addEventListener('click', sections.collapseAll.bind(sections));
    byId('expandErrors').addEventListener('click', sections.expandErrors.bind(sections));
    byId('run').addEventListener('click', run);
});
