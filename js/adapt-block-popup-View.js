/*
* adapt-block-popup
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Robert Peek <robert@delta-net.co.uk>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var BlockPopupView = Backbone.View.extend({

        className: "block-popup",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.preRender();
            this.render();
        },

        events: {
            "click .block-popup-graphic-button":"openPopup",
            "click .block-popup-open-button":"openPopup",
            "click .content-popup-icon-close":"closeContent",
            "click .block-popup-shadow":"closeContent",
        },

        preRender: function() {
        },

        render: function () {
            // Convert model data into JSON
            var data = this.model.toJSON();
            var template = Handlebars.templates["block-popup"];

            var extLoc = this.model.get('_blockPopup')._location;
            // Push data into template and append template
            if(extLoc=="article"){
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > .article-inner ");
            }
            if(extLoc=="block"){
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > .block-inner ");
            }
            if(extLoc=="component"){
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id") + " > .component-inner ");
            }
            // Defer is used here to make sure the template has rendered before calling postRender
            // This way postRender can manipulate this view after it has been rendered
            _.defer(_.bind(function() {
                this.postRender();
            }, this));
        },

        postRender: function() {
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
            this.$(".block-popup-content-item").css({
                display:"none"
            });
            
            this.$(".block-popup-content-item").eq(index).css({
                display:"block"
            });

            var $content = this.$(".block-popup-content");
            $content.css({ 
                marginTop: -($content.height() / 2) + "px"
            }).velocity({
                opacity: 1,
                translateY: 0
            },{
                display: "block"
            });

            this.$(".block-popup-shadow").velocity({
                opacity: 1
            },{
                display: "block"
            });
        },

        getCurrentItem: function(index) {
            return this.model.get('_blockPopup')._items[index];
        },

        closeContent: function(event) {
            if (event) event.preventDefault();
            this.$(".block-popup-content").velocity({
                opacity: 0,
                translateY: "-50px"
            },{
                display: "none"
            });

            Adapt.trigger('popup:closed');

            this.$(".block-popup-shadow").velocity({
                opacity: 0
            },{
                display: "none"
            });
        }

    });
    
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_blockPopup")) {
          new BlockPopupView({model:view.model});
        }
    });
});