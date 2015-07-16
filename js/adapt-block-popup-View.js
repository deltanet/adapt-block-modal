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
            // Listen to Adapt 'remove' event which is called when navigating through the router
            // This cleans up zombie views and prevents memory leaks
            this.listenTo(Adapt, 'remove', this.remove);
            // On initialize start the render process
            this.preRender();
            this.render();
        },

        events: {
            "click .block-popup-open-button":"openPopup",
            "click .content-popup-icon-close":"closeContent",
        },

        preRender: function() {
        },

        render: function () {
            // Convert model data into JSON
            var data = this.model.toJSON();
            // Get handlebars template
            var template = Handlebars.templates["block-popup"];
            // Set variable to determine where to insert the extension
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
            // trigger popupManager - this sets all tabindex elements to -1
            Adapt.trigger('popup:opened');
            // set close button to 0 - this prevents the user from tabbing outside of the popup whilst open
            this.$('.content-popup-icon-close').attr('tabindex', 0);
            
            this.$(".block-popup-content").css({
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

        closeContent: function(event) {
            if (event) event.preventDefault();
            this.$(".block-popup-content").velocity({
                opacity: 0,
                translateY: "-50px"
            },{
                display: "none"
            });
            // trigger popup closed to reset the tab index back to 0
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