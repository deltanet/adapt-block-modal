import Adapt from 'core/js/adapt';
import IconPopupView from './iconPopupView';

class IconPopup extends Backbone.Controller {

  initialize() {
    this.listenToOnce(Adapt, 'app:dataReady', this.onDataReady);
  }

  onDataReady() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.listenTo(Adapt, 'articleView:postRender blockView:postRender componentView:postRender', this.onABCReady);
  }

  onABCReady(view) {
    const config = view.model.get('_iconPopup');

    if (!config) return;

    if (!config._isEnabled) return;

    if (!$('.' + view.model.get('_id')).find('.iconpopup').length) {
      new IconPopupView({model:view.model});
    }
  }
}

export default new IconPopup();
