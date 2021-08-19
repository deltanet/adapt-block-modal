define([
  'core/js/adapt'
], function (Adapt) {

  var PopupView = Backbone.View.extend({

    className: 'iconpopup__popup',

    events: {
      'click .js-iconpopup-close-btn-click': 'closePopup'
    },

    initialize: function () {
      this.listenToOnce(Adapt, 'notify:opened', this.onOpened);

      // Audio
      this.audioIsEnabled = this.model.get('audioIsEnabled');
      if (this.audioIsEnabled) {
        this.audioChannel = this.model.get('audioChannel');
        this.audioSrc = this.model.get('_audio').src;
        this.audioId = this.model.get('audioId');
      }

      this.render();
    },

    onOpened: function () {
      if (!this.audioIsEnabled) return;

      if (Adapt.audio.audioClip[this.audioChannel].status==1) {
        Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
        Adapt.trigger('audio:playAudio', this.audioSrc, this.audioId, this.audioChannel);
      }
    },

    render: function () {
      var data = this.model.toJSON();
      var template = Handlebars.templates['popup'];
      this.$el.html(template(data));
    },

    closePopup: function (event) {
      Adapt.trigger('notify:close');
    }

  });

  return PopupView;

});
