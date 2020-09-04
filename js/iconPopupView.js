define([
  'core/js/adapt',
  './popupView'
], function (Adapt, PopupView) {

  var IconPopupView = Backbone.View.extend({

    className: 'iconpopup',

    events: {
      'click .js-iconpopup-btn-click': 'onItemClicked'
    },

    initialize: function () {
      this.listenTo(Adapt, {
        'remove': this.onRemove,
        'audio:updateAudioStatus': this.audioUpdated,
        'pageView:ready': this.render
      });

      this.listenTo(this.model, 'change:_isSubmitted', this.checkAttempts);

      this.elementId = this.model.get('_id');
      this.elementType = this.model.get('_type');

      this.audioIsEnabled = this.model.get('_iconPopup')._audio._isEnabled;
      this.audioChannel = this.model.get('_iconPopup')._audio._channel;

      this.popupView = null;
      this.isPopupOpen = false;
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['iconpopup'];

      var audioElement = $('.'+this.elementId).find('.'+this.elementType+'-audio');

      if (audioElement.length) {
        $(this.el).html(template(data)).insertAfter(audioElement);
      } else {
        $(this.el).html(template(data)).prependTo('.'+this.elementId+'>.'+this.elementType+'__inner');
      }

      this.$('.iconpopup__inner').addClass('iconpopup-'+this.elementType);

      if (!this.model.get('displayTitle') && !this.model.get('body')) {
        this.$('.iconpopup__inner').addClass('overlayed');
      }

      _.defer(function () {
        this.postRender();
      }.bind(this));
    },

    postRender: function () {
      this.alignItems();
      this.checkAttempts();
    },

    audioUpdated: function () {
      var that = this;

      _.delay(function () {
        that.alignItems();
      }.bind(this), 300);
    },

    alignItems: function () {
      // Set var for audio toggle button being visible
      if ($('.'+this.elementId).find('.audio__controls').length && $('.'+this.elementId).find('.audio__controls').css('display') != 'none') {
        var audioEnabled = true;
        var audioButtonwidth = $('.'+this.elementId).find('.audio__controls').outerWidth();
        this.$('.iconpopup__inner').addClass('audio-enabled');
      } else {
        var audioEnabled = false;
        this.$('.iconpopup__inner').removeClass('audio-enabled');
      }

      // Check for audio toggle button
      if (audioEnabled) {
        var width = (this.$('.iconpopup__items').width() + 10) + audioButtonwidth;
      } else {
        var width = this.$('.iconpopup__items').width() + 10;
      }

      var elementWidth = $('.'+this.elementId).find('.'+this.elementType+'__header').width();
      var maxWidth = elementWidth - width;

      // Set width on title or body
      if (this.model.get('displayTitle') == '') {
        $('.'+this.elementId).find('.'+this.elementType+'-body__inner').css('max-width', maxWidth);
      } else {
        $('.'+this.elementId).find('.'+this.elementType+'-title__inner').css('max-width', maxWidth);
      }
    },

    checkAttempts: function () {
      var items = this.$('.iconpopup__items').children();

      for (var i = 0, l = items.length; i < l; i++) {
        var item = this.model.get('_iconPopup')._items[i];
        var $item = this.$(items[i]);

        if (item._onlyShowOnFinalAttempt && this.model.get('_attemptsLeft') > 1) {
          $item.hide();
        } else if (item._onlyShowOnFinalAttempt && this.model.get('_isSubmitted') && this.model.get('_attemptsLeft') == 1) {
          $item.hide();
        } else {
          $item.show();
        }
      }
    },

    onItemClicked: function (event) {
      if (event) event.preventDefault();

      var $link = $(event.currentTarget);
      var $item = $link.parent();
      var itemModel = this.model.get('_iconPopup')._items[$item.index()];

      // Check for type
      if (itemModel._type) {
        if (itemModel._type === 'URL') {
          this.showItemUrl(itemModel);
        } else if (itemModel._type === 'Popup') {
          this.showPopup(itemModel);
        }
      } else {
        this.showPopup(itemModel);
      }
    },

    showItemUrl: function (itemModel) {
      var url = itemModel._url._src;
      window.top.open(url);
    },

    showPopup: function (itemModel) {
      if (this.isPopupOpen) return;

      Adapt.trigger('audio:stopAllChannels');

      this.isPopupOpen = true;

      var popupModel = new Backbone.Model(itemModel);

      if (Adapt.audio && this.audioIsEnabled) {
        popupModel.set('audioIsEnabled', this.audioIsEnabled);
        popupModel.set('audioChannel', this.audioChannel);
        popupModel.set('audioId', this.elementId);
      } else {
        popupModel.set('audioIsEnabled', false);
      }

      this.popupView = new PopupView({
        model: popupModel
      });

      Adapt.notify.popup({
        _view: this.popupView,
        _isCancellable: true,
        _showCloseButton: false,
        _closeOnBackdrop: true,
        _classes: 'iconpopup'
      });

      this.listenToOnce(Adapt, {
        'popup:closed': this.onPopupClosed
      });

      // Check completion
      if (itemModel._setCompletion) {
        this.model.set('_isComplete', true);
        this.model.set('_isInteractionComplete', true);
      }
    },

    onPopupClosed: function () {
      this.isPopupOpen = false;
    },

    onRemove: function () {
      this.model.set('_iconPopupLoaded', false);
      this.remove();
    }

  });

  return IconPopupView;

});
