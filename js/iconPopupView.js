import Adapt from 'core/js/adapt';
import PopupView from './popupView';

export default class IconPopupView extends Backbone.View {

  className() {
    return 'iconpopup';
  }

  events() {
    return {
      'click .js-iconpopup-btn-click': 'onItemClicked'
    };
  }

  initialize() {
    this.listenTo(Adapt, {
      'remove': this.remove,
      'audio:updateAudioStatus device:resize device:changed': this.audioUpdated
    });

    this.listenTo(this.model, 'change:_component', this.remove);
    this.listenTo(this.model, 'change:_isSubmitted', this.checkAttempts);

    this.elementId = this.model.get('_id');
    this.elementType = this.model.get('_type');

    this.audioIsEnabled = this.model.get('_iconPopup')._audio._isEnabled;
    this.audioChannel = this.model.get('_iconPopup')._audio._channel;

    this.audioToggleIsVisible = false;

    this.popupView = null;
    this.isPopupOpen = false;

    this.render();
  }

  render() {
    const data = this.model.toJSON();
    const template = Handlebars.templates['iconpopup'];

    const audioElement = $('.'+this.elementId).find('.'+this.elementType+'-audio');

    if (audioElement.length) {
      $(this.el).html(template(data)).insertAfter(audioElement);
    } else {
      $(this.el).html(template(data)).prependTo('.'+this.elementId+'>.'+this.elementType+'__inner');
    }

    $('.'+this.elementId).addClass('is-iconpopup');

    this.$('.iconpopup__inner').addClass('iconpopup-'+this.elementType);

    if (!this.model.get('displayTitle') && !this.model.get('body')) {
      this.$('.iconpopup__inner').addClass('overlayed');
    }

    _.defer(() => {
      this.postRender();
    });
  }

  postRender() {
    this.alignItems();
    this.checkAttempts();
  }

  audioUpdated() {
    const that = this;

    _.delay(() => {
      that.alignItems();
    }, 1000);
  }

  alignItems() {
    // reset
    this.$('.iconpopup__btn').css('height', "");
    this.$('.iconpopup__btn').css('width', "");
    this.$('.iconpopup__btn').css('min-width', "");

    // Check for audio toggle button being visible
    if ($('.'+this.elementId).find('.audio__controls').length && $('.'+this.elementId).find('.audio__controls').css('display') != 'none') {
      this.audioToggleIsVisible = true;
      this.$('.iconpopup__inner').addClass('audio-enabled');
    } else {
      this.audioToggleIsVisible = false;
      this.$('.iconpopup__inner').removeClass('audio-enabled');
    }

    let width = this.$('.iconpopup__items').width() + 10;
    let titleHeight = Math.round($('.'+this.elementId).find('.'+this.elementType+'__title').outerHeight());

    if (this.audioToggleIsVisible) {
      const audioButtonwidth = $('.'+this.elementId).find('.audio__controls').outerWidth();
      width = (this.$('.iconpopup__items').width() + 10) + audioButtonwidth;
      titleHeight = Math.round($('.'+this.elementId).find('.audio__controls').outerHeight());
    }

    const elementWidth = $('.'+this.elementId).find('.'+this.elementType+'__header').width();
    const maxWidth = elementWidth - width;

    if (this.model.get('displayTitle') == '') {
      // Set width on title or body
      $('.'+this.elementId).find('.'+this.elementType+'-body__inner').css('max-width', maxWidth);
    } else {
      $('.'+this.elementId).find('.'+this.elementType+'-title__inner').css('max-width', maxWidth);

      const items = this.$('.iconpopup__items').children();

      for (let i = 0, l = items.length; i < l; i++) {
        const $item = this.$('.item-'+i).find('.iconpopup__btn');

        if ($item.hasClass('btn-text')) {
          $item.css('padding-top', 0);
          $item.css('padding-bottom', 0);
          $item.css('height', titleHeight);
          $item.css('min-width', titleHeight);
        } else if ($item.hasClass('btn-icon')) {
          $item.css('padding', 0);
          $item.css('height', titleHeight);
          $item.css('width', titleHeight);
        } else {
          $item.css('padding', 0);
          $item.css('height', titleHeight);
          $item.find('img').css('min-height', titleHeight);
          $item.find('img').css('max-height', titleHeight);
        }
      }
    }
  }

  checkAttempts() {
    const items = this.$('.iconpopup__items').children();

    for (let i = 0, l = items.length; i < l; i++) {
      const item = this.model.get('_iconPopup')._items[i];
      const $item = this.$(items[i]);

      if (item._onlyShowOnFinalAttempt && this.model.get('_attemptsLeft') > 1) {
        $item.hide();
      } else if (item._onlyShowOnFinalAttempt && this.model.get('_isSubmitted') && this.model.get('_attemptsLeft') == 1) {
        $item.hide();
      } else {
        $item.show();
      }
    }
  }

  onItemClicked(event) {
    if (event) event.preventDefault();

    const $link = $(event.currentTarget);

    $link.addClass('is-visited');

    const $item = $link.parent();
    const itemModel = this.model.get('_iconPopup')._items[$item.index()];

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
  }

  showItemUrl(itemModel) {
    const url = itemModel._url._src;
    window.top.open(url);
  }

  showPopup(itemModel) {
    if (this.isPopupOpen) return;

    Adapt.trigger('audio:stopAllChannels');

    this.isPopupOpen = true;

    const popupModel = new Backbone.Model(itemModel);

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
  }

  onPopupClosed() {
    this.isPopupOpen = false;
  }
}
