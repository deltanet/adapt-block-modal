/*
* adapt-icon-popup
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var IconPopupView = Backbone.View.extend({

        className: "icon-popup",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.preRender();
            this.render();
        },

        events: {
            "click .icon-popup-graphic-button":"openPopup",
            "click .icon-popup-open-button":"openPopup",
            "click .content-popup-icon-close":"closeContent",
            "click .icon-popup-shadow":"closeContent",
        },

        preRender: function() {
        },

        render: function () {

            var data = this.model.toJSON();
            var template = Handlebars.templates["icon-popup"];

            var extLoc = this.model.get('_iconPopup')._location;
            // Push data into template and append template
            if(extLoc=="article"){
                $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + " > .article-inner ");
            }
            if(extLoc=="block"){
                $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + " > .block-inner ");
            }
            if(extLoc=="component"){
                $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + " > .component-inner ");
            }
        },
        
        openPopup: function(event) {

            if (event) event.preventDefault();
            Adapt.trigger('popup:opened');
            this.$('.content-popup-icon-close').attr('tabindex', 0);

            var $item = $(event.currentTarget);
            var index = $item.index();
            console.log(index);
            $item.addClass("visited");
            this.showContentWithItemIndex(index);
            $(".content-popup-icon-close").focus();
        },

        showContentWithItemIndex: function(index) {
            this.$(".icon-popup-content-item").css({
                display:"none"
            });
            
            this.$(".icon-popup-content-item").eq(index).css({
                display:"block"
            });

            var $content = this.$(".icon-popup-content");
            $content.css({ 
                marginTop: -($content.height() / 2) + "px"
            }).velocity({
                opacity: 1,
                translateY: 0
            },{
                display: "block"
            });

            this.$(".icon-popup-shadow").velocity({
                opacity: 1
            },{
                display: "block"
            });
        },

        closeContent: function(event) {
            if (event) event.preventDefault();
            this.$(".icon-popup-content").velocity({
                opacity: 0,
                translateY: "-50px"
            },{
                display: "none"
            });

            Adapt.trigger('popup:closed');

            this.$(".icon-popup-shadow").velocity({
                opacity: 0
            },{
                display: "none"
            });
        }

    });
    
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup")) {
          new IconPopupView({model:view.model});
        }
    });
});