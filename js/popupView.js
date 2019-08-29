define([
    'core/js/adapt'
], function(Adapt) {

    var PopupView = Backbone.View.extend({

        className: "icon-popup-popup",

        events: {
          'click .icon-popup-close-button': 'closePopup'
        },

        initialize: function() {
          this.listenToOnce(Adapt, "notify:opened", this.onOpened);

          // Audio
          this.audioIsEnabled = this.model.get('_audio')._isEnabled;
          if (this.audioIsEnabled && Adapt.audio) {
            this.audioChannel = this.model.get('_audio')._channel;
            this.audioSrc = this.model.get('_audio').src;
            this.audioId = this.model.get("_id");
          }

          this.render();
        },

        onOpened: function() {
          if (!this.audioIsEnabled) return;

          if (Adapt.audio.audioClip[this.audioChannel].status==1) {
            Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
            Adapt.trigger('audio:playAudio', this.audioSrc, this.audioId, this.audioChannel);
          }
        },

        render: function() {
          var data = this.model.toJSON();
          var template = Handlebars.templates["popup"];
          this.$el.html(template(data));
        },

        closePopup: function (event) {
          Adapt.trigger('notify:close');
        }

    });

    return PopupView;

});
