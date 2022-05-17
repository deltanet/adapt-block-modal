import Adapt from 'core/js/adapt';

export default class PopupView extends Backbone.View {

  className() {
    return 'iconpopup__popup';
  }

  events() {
    return {
      'click .js-iconpopup-close-btn-click': 'closePopup'
    };
  }

  initialize() {
    this.listenToOnce(Adapt, 'notify:opened', this.onOpened);

    // Audio
    this.audioIsEnabled = this.model.get('audioIsEnabled');
    if (this.audioIsEnabled) {
      this.audioChannel = this.model.get('audioChannel');
      this.audioSrc = this.model.get('_audio').src;
      this.audioId = this.model.get('audioId');
    }

    this.render();
  }

  onOpened() {
    if (!this.audioIsEnabled) return;

    if (Adapt.audio.audioClip[this.audioChannel].status==1) {
      Adapt.audio.audioClip[this.audioChannel].onscreenID = "";
      Adapt.trigger('audio:playAudio', this.audioSrc, this.audioId, this.audioChannel);
    }
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['popup'];
    this.$el.html(template(data));
  }

  closePopup(event) {
    Adapt.trigger('notify:close');
  }
}
