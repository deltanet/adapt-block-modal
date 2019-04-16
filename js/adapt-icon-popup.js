define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');
    var IconPopup = Backbone.View.extend({

        className: "extension-icon-popup",

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.audioUpdated);
            this.listenTo(Adapt, "pageView:ready", this.alignItems);
            this.render();
        },

        events: {
            "click .icon-popup-graphic-button":"onItemClicked",
            "click .icon-popup-open-button":"onItemClicked"
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["icon-popup"];

            $(this.el).html(template(data)).appendTo('.' + this.model.get("_id") + '>.' +this.model.get("_type")+'-inner');

            this.$('.icon-popup-inner').addClass('icon-popup-'+this.model.get("_type"));

            this.elementId = this.model.get("_id");
            this.audioChannel = this.model.get('_iconPopup')._audio._channel;

            this.alignItems();
        },

        audioUpdated: function() {
          var that = this;
          _.delay(function() {
            that.alignItems();
          }, 300);
        },

        alignItems: function() {
          // Check for audio toggle button
          if ($('.'+this.elementId).find('.audio-toggle').length && $('.'+this.elementId).find('.audio-toggle').css('display') != 'none') {
            this.$('.icon-popup-inner').addClass("audio-enabled");
          } else {
            this.$('.icon-popup-inner').removeClass("audio-enabled");
          }

          var direction = "right";
          if (Adapt.config.get('_defaultDirection') == 'rtl') {
            direction = "left";
          }
          // Set width for padding on the title or body
          var width = this.$('.icon-popup-items').width() + 5;

          // Set padding on title or body
          if (this.model.get('displayTitle') == "") {
            $('.'+this.elementId).find('.'+this.model.get("_type")+'-body').css("padding-"+direction, width);
          } else {
            $('.'+this.elementId).find('.'+this.model.get("_type")+'-title').css("padding-"+direction, width);
          }
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var $link = $(event.currentTarget);
            var $item = $link.parent();
            var itemModel = this.model.get('_iconPopup')._items[$item.index()];

            // Check for type
            if(itemModel._type) {
              if(itemModel._type === "URL") {
                this.showItemUrl(itemModel);
              } else if(itemModel._type === "Popup") {
                this.showItemContent(itemModel);
              }
            } else {
              this.showItemContent(itemModel);
            }
        },

        showItemUrl: function(itemModel) {
          var url = itemModel._url._src;
          window.top.open(url);
        },

        showItemContent: function(itemModel) {
            if(this.isPopupOpen) return;// ensure multiple clicks don't open multiple notify popups

            // Set variable to use when adding the header image to the notify popup
            if(itemModel._notifyGraphic.src && !itemModel._notifyGraphic.src == "") {
              // Check for image alt tag
              if(itemModel._notifyGraphic.alt && !itemModel._notifyGraphic.alt == "") {
                this.headerImage = "<div class='icon-popup-prompt-image'><img aria-label='"+itemModel._notifyGraphic.alt+"' tabindex='0' src='"+itemModel._notifyGraphic.src+"'/></div>";
              } else {
                this.headerImage = "<div class='icon-popup-prompt-image'><img class='a11y-ignore' aria-hidden='true' tabindex='-1' src='"+itemModel._notifyGraphic.src+"'/></div>";
              }
            } else {
              this.headerImage = "";
            }

            // Check if image is present and set fullwidth style on body accordingly
            if(itemModel._itemGraphic.src && !itemModel._itemGraphic.src == "") {
              this.bodyClass = "<div class='icon-popup-notify-container'><div class='icon-popup-notify-body'>";
            } else {
              this.bodyClass = "<div class='icon-popup-notify-container'><div class='icon-popup-notify-body fullwidth'>";
            }

            // Set variable to use when adding the image to the notify popup
            if(itemModel._itemGraphic.src && !itemModel._itemGraphic.src == "") {
              // Check if body text is present
              if(itemModel.body == "") {
                // Check for image alt tag
                if(itemModel._itemGraphic.alt && !itemModel._itemGraphic.alt == "") {
                  this.itemImage = "<img class='icon-popup-notify-graphic fullwidth' aria-label='"+itemModel._itemGraphic.alt+"' tabindex='0' src='"+itemModel._itemGraphic.src+ "'/>";
                } else {
                  this.itemImage = "<img class='icon-popup-notify-graphic fullwidth a11y-ignore' aria-hidden='true' tabindex='-1' src='"+itemModel._itemGraphic.src+ "'/>";
                }
              } else {
                // Check for image alt tag
                if(itemModel._itemGraphic.alt && !itemModel._itemGraphic.alt == "") {
                  this.itemImage = "<img class='icon-popup-notify-graphic' aria-label='"+itemModel._itemGraphic.alt+"' tabindex='0' src='"+itemModel._itemGraphic.src+ "'/>";
                } else {
                  this.itemImage = "<img class='icon-popup-notify-graphic a11y-ignore' aria-hidden='true' tabindex='-1' src='"+itemModel._itemGraphic.src+ "/>";
                }
              }
            } else {
              this.itemImage = "";
            }

            Adapt.trigger("notify:popup", {
                title: this.headerImage+itemModel.title,
                body: this.bodyClass+itemModel.body+"</div>"+this.itemImage+"</div>"
            });

            this.isPopupOpen = true;

            ///// Audio /////
            if (this.model.get('_iconPopup')._audio._isEnabled && Adapt.audio && Adapt.audio.audioClip[this.audioChannel].status==1) {
              // Reset onscreen id
              Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
              // Trigger audio
              Adapt.trigger('audio:playAudio', itemModel._audio.src, this.model.get('_id'), this.audioChannel);
            }
            ///// End of Audio /////

            // Check completion
            if (itemModel._setCompletion) {
              this.model.set("_isComplete", true);
              this.model.set("_isInteractionComplete", true);
            }

            Adapt.once("notify:closed", _.bind(function() {
                this.isPopupOpen = false;
            }, this));
        }

    });

    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup") && view.model.get("_iconPopup")._isEnabled) {
          new IconPopup({model:view.model});
        }
    });

});
