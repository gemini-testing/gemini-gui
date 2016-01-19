/*jshint browser:true*/
'use strict';
var Controller = require('./controller'),
    forEach = Array.prototype.forEach,
    filter = Array.prototype.filter,
    hbruntime = require('hbsfy/runtime');

hbruntime.registerPartial('cswitcher', require('../views/partials/cswitcher.hbs'));

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

document.addEventListener('DOMContentLoaded', function() {
    document.controller = new Controller();
    document.body.addEventListener('click', bodyClick);
});
