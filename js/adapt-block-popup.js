/*
* adapt-extension
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/

define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var BlockPopupView = require('extensions/adapt-block-popup/js/adapt-block-popup-View');

    // Listen to when the data is all loaded
    Adapt.on('app:dataReady', function() {
        console.log('Plugin has loaded and data is ready');
    });

});