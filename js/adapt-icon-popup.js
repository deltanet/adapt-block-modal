define([
  'core/js/adapt',
  './iconPopupView'
], function (Adapt, IconPopupView) {

  var IconPopup = _.extend({

    initialize: function () {
      this.listenToOnce(Adapt, 'app:dataReady', this.onDataReady);
    },

    onDataReady: function () {
      this.setupEventListeners();
    },

    setupEventListeners: function () {
      this.listenTo(Adapt, 'articleView:postRender blockView:postRender componentView:postRender', this.onABCReady);
    },

    onABCReady: function (view) {
      var config = view.model.get('_iconPopup');

      if (!config) return;

      if (!config._isEnabled) return;

      // Only render view if it DOESN'T already exist - Work around for hotgraphic component
      if (!$('.' + view.model.get('_id')).find('.iconpopup').length) {
        new IconPopupView({model:view.model});
      }
    }

  }, Backbone.Events);

  IconPopup.initialize();

  return IconPopup;

});
