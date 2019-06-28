define([
    'core/js/adapt',
    './popupView'
], function(Adapt, PopupView) {

    var IconPopup = Backbone.View.extend({

        className: "extension-icon-popup",

        events: {
            "click .icon-popup-graphic-button":"onItemClicked",
            "click .icon-popup-open-button":"onItemClicked"
        },

        initialize: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'audio:updateAudioStatus', this.audioUpdated);
            this.listenTo(Adapt, "pageView:ready", this.render);

            this.elementId = this.model.get("_id");
            this.elementType = this.model.get("_type");
            this.audioChannel = this.model.get('_iconPopup')._audio._channel;

            this.popupView = null;
            this.isPopupOpen = false;
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates["icon-popup"];

            var audioElement = $('.'+this.elementId).find('.'+this.elementType+'-audio');

            if (audioElement.length) {
              $(this.el).html(template(data)).insertAfter(audioElement);
            } else {
              $(this.el).html(template(data)).prependTo('.'+this.elementId+'>.'+this.elementType+'-inner');
            }

            this.$('.icon-popup-inner').addClass('icon-popup-'+this.elementType);

            this.alignItems();
        },

        audioUpdated: function() {
          var that = this;
          _.delay(function() {
            that.alignItems();
          }, 300);
        },

        alignItems: function() {
          // Set var for audio toggle button being visible
          if ($('.'+this.elementId).find('.audio-toggle').length && $('.'+this.elementId).find('.audio-toggle').css('display') != 'none') {
            var audioEnabled = true;
            var audioButtonwidth = $('.'+this.elementId).find('.audio-toggle').outerWidth();
          } else {
            var audioEnabled = false;
          }

          // Check for audio toggle button
          if (audioEnabled) {
            var width = (this.$('.icon-popup-items').width() + 10) + audioButtonwidth;
          } else {
            var width = this.$('.icon-popup-items').width() + 10;
          }

          var elementWidth = $('.'+this.elementId).find('.'+this.elementType+'-header').width();
          var maxWidth = elementWidth - width;

          // Set width on title or body
          if (this.model.get('displayTitle') == "") {
            $('.'+this.elementId).find('.'+this.elementType+'-body').css("max-width", maxWidth);
          } else {
            $('.'+this.elementId).find('.'+this.elementType+'-title').css("max-width", maxWidth);
          }
        },

        onItemClicked: function(event) {
            if (event) event.preventDefault();

            var $link = $(event.currentTarget);
            var $item = $link.parent();
            var itemModel = this.model.get('_iconPopup')._items[$item.index()];

            // Check for type
            if (itemModel._type) {
              if (itemModel._type === "URL") {
                this.showItemUrl(itemModel);
              } else if (itemModel._type === "Popup") {
                this.showPopup(itemModel);
              }
            } else {
              this.showPopup(itemModel);
            }
        },

        showItemUrl: function(itemModel) {
          var url = itemModel._url._src;
          window.top.open(url);
        },

        showPopup: function(itemModel) {
          if (this.isPopupOpen) return;

          Adapt.trigger('audio:stopAllChannels');

          this.isPopupOpen = true;

          var popupModel = new Backbone.Model(itemModel);

          this.popupView = new PopupView({
              model: popupModel
          });

          Adapt.trigger("notify:popup", {
              _view: this.popupView,
              _isCancellable: true,
              _showCloseButton: false,
              _closeOnBackdrop: true,
              _classes: ''
          });

          this.listenToOnce(Adapt, {
              'popup:closed': this.onPopupClosed
          });

          // Check completion
          if (itemModel._setCompletion) {
            this.model.set("_isComplete", true);
            this.model.set("_isInteractionComplete", true);
          }
        },

        onPopupClosed: function() {
          this.isPopupOpen = false;
        }

    });

    Adapt.on('articleView:postRender blockView:postRender componentView:postRender', function(view) {
        if (view.model.get("_iconPopup") && view.model.get("_iconPopup")._isEnabled) {
          new IconPopup({model:view.model});
        }
    });

});
