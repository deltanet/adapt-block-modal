/*
* adapt-icon-popup
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/

define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var IconPopupView = require('extensions/adapt-icon-popup/js/adapt-icon-popup-View');

    // Listen to when the data is all loaded
    Adapt.on('app:dataReady', function() {
        //console.log('adapt-icon-popup extension has loaded and data is ready');
    });

});