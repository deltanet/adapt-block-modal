define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var IconPopup = Backbone.View.extend({

        className: "extension-icon-popup",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.preRender();
            this.render();
        },

        events: {
            "click .icon-popup-graphic-button":"onItemClicked",
            "click .icon-popup-open-button":"onItemClicked"
        },

        preRender: function() {},

        render: function () {

            var data = this.model.toJSON();
            var template = Handlebars.templates["icon-popup"];

            // Article
            if(this.model.get("_type")=="article") {
                $(this.el).html(template(data)).prependTo('.' + this.model.get("_id"));
            } else {
                $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + '>.' +this.model.get("_type")+'-inner');
            }
           
            this.$('.icon-popup-inner').addClass('icon-popup-'+this.model.get("_type"));

        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var $link = $(event.currentTarget);
            var $item = $link;
            var itemModel = this.model.get('_iconPopup')._items[$link.index() - 1];

            this.showItemContent(itemModel);
        },

        showItemContent: function(itemModel) {
            if(this.isPopupOpen) return;// ensure multiple clicks don't open multiple notify popups

            console.log(itemModel);

            Adapt.trigger("notify:popup", {
                title: itemModel.title,
                body: "<div class='icon-popup-notify-body'>" + itemModel.body + "</div>" +
                    "<img class='icon-popup-notify-graphic' src='" +
                    itemModel._itemGraphic.src + "' alt='" +
                    itemModel._itemGraphic.alt + "'/></div>"
            });

            this.isPopupOpen = true;

            ///// Audio /////
            if (this.model.get('_iconPopup')._audio._isEnabled && Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].status==1) {
                // Determine which filetype to play
                if (Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].canPlayType('audio/ogg')) this.audioFile = itemModel._audio.ogg;
                if (Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].canPlayType('audio/mpeg')) this.audioFile = itemModel._audio.mp3;
                // Trigger audio
                Adapt.trigger('audio:playAudio', this.audioFile, this.model.get('_id'), this.model.get('_iconPopup')._audio._channel);
            }
            ///// End of Audio /////

            Adapt.once("notify:closed", _.bind(function() {
                this.isPopupOpen = false;
            }, this));
        }

    });
    
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup")) {
          new IconPopup({model:view.model});
        }
    });

});