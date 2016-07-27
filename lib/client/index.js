/*jshint browser:true*/
'use strict';

var Controller = require('./controller'),
    forEach = Array.prototype.forEach,
    filter = Array.prototype.filter,
    hbruntime = require('hbsfy/runtime');

hbruntime.registerPartial('cswitcher', require('../views/partials/cswitcher.hbs'));
hbruntime.registerPartial('suite-controls', require('../views/partials/suite-controls.hbs'));
hbruntime.registerPartial('controls', require('../views/partials/controls.hbs'));
hbruntime.registerPartial('meta-info', require('../views/partials/meta-info.hbs'));

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

    if (target.classList.contains('meta-info__switcher')) {
        toggleMetaInfo(target);
    }
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

function findClosest(context, cls) {
    while ((context = context.parentNode)) {
        if (context.classList.contains(cls)) {
            return context;
        }
    }
}

function toggleMetaInfo(target) {
    target.closest('.meta-info').classList.toggle('meta-info_collapsed');
}

document.addEventListener('DOMContentLoaded', function() {
    window.controller = new Controller();
    document.body.addEventListener('click', bodyClick);
});
