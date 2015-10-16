/*
* adapt-icon-popup
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var IconPopupView = Backbone.View.extend({

        className: "extension-icon-popup",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.preRender();
            this.render();
        },

        events: {
            "click .icon-popup-graphic-button":"openPopup",
            "click .icon-popup-open-button":"openPopup"
        },

        preRender: function() {},

        render: function () {

            var data = this.model.toJSON();
            var template = Handlebars.templates["icon-popup"];

            $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > ."+this.model.get("_type")+"-inner");
        },
        
        openPopup: function(event) {

            if (event) event.preventDefault();

            var $item = $(event.currentTarget);
            var currentItem = this.getCurrentItem($item.index());
            if (currentItem._itemGraphic.src != null) {
                var popupObject = {
                    title: currentItem.title,
                    body: "<div class='icon-popup-notify-body-small'>" +
                    currentItem.body + "</div><img class='icon-popup-notify-graphic-small' src='"+
                    currentItem._itemGraphic.src +"' alt='"+
                    currentItem._itemGraphic.alt +"'/>"
                };
            } else {
                var popupObject = {
                    title: currentItem.title,
                    body: "<div class='icon-popup-notify-body'>" + currentItem.body +"'/>"
                };
            }

            Adapt.trigger("notify:popup", popupObject);
            $item.addClass("visited");

        },

        getCurrentItem: function(index) {
            return this.model.get('_iconPopup')._items[index];
        }

    });
    
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup")) {
          new IconPopupView({model:view.model});
        }
    });
});