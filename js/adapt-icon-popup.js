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
            "click .icon-popup-graphic-button":"openPopup",
            "click .icon-popup-open-button":"openPopup"
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
        
        openPopup: function(event) {

            if (event) event.preventDefault();

            var $item = $(event.currentTarget).parent();
            var currentItem = this.getCurrentItem($item.index());
            var popupObject = {
                title: currentItem.title,
                body: "<div class='icon-popup-notify-body'>" +
                currentItem.body + "</div><img class='icon-popup-notify-graphic' src='"+
                currentItem._itemGraphic.src +"' alt='"+
                currentItem._itemGraphic.alt +"'/>"
            };

            Adapt.trigger("notify:popup", popupObject);
            $item.addClass("visited");

            ///// Audio /////
            if (this.model.get('_iconPopup')._audio._isEnabled && Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].status==1) {
                // Determine which filetype to play
                if (Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].canPlayType('audio/ogg')) this.audioFile = currentItem._audio.ogg;
                if (Adapt.audio.audioClip[this.model.get('_iconPopup')._audio._channel].canPlayType('audio/mpeg')) this.audioFile = currentItem._audio.mp3;
                // Trigger audio
                Adapt.trigger('audio:playAudio', this.audioFile, this.model.get('_id'), this.model.get('_iconPopup')._audio._channel);
            }
            ///// End of Audio /////

        },

        getCurrentItem: function(index) {
            return this.model.get("_iconPopup")._items[index];
        }

    });
    
    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup")) {
          new IconPopup({model:view.model});
        }
    });

});