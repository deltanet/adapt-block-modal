import Adapt from 'core/js/adapt';
import 'libraries/mediaelement-and-player';
import 'libraries/mediaelement-fullscreen-hook';
import offlineStorage from 'core/js/offlineStorage';

/*
  * Default shortcut keys trap a screen reader user inside the player once in focus. These keys are unnecessary
  * as one may traverse the player in a linear fashion without needing to know or use shortcut keys. Below is
  * the removal of the default shortcut keys.
  *
  * The default seek interval functions are passed two different data types from mejs which they handle incorrectly. One
  * is a duration integer the other is the player object. The default functions error on slider key press and so break
  * accessibility. Below is a correction.
  */
Object.assign(window.mejs.MepDefaults, {
  keyActions: [],
  defaultSeekForwardInterval: duration => {
    if (typeof duration === 'object') return duration.duration * 0.05;
    return duration * 0.05;
  },
  defaultSeekBackwardInterval: duration => {
    if (typeof duration === 'object') return duration.duration * 0.05;
    return duration * 0.05;
  }
});

// The following function is used to to prevent a memory leak in Internet Explorer
// See: http://javascript.crockford.com/memory/leak.html
const purge = function (d) {
  let a = d.attributes;
  if (a) {
    for (let i = a.length - 1; i >= 0; i -= 1) {
      const n = a[i].name;
      if (typeof d[n] === 'function') {
        d[n] = null;
      }
    }
  }
  a = d.childNodes;
  if (a) {
    for (let i = 0, count = a.length; i < count; i += 1) {
      purge(d.childNodes[i]);
    }
  }
};

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

    // Video
    if (this.model.get('_video') && this.model.get('_video')._media.cc) {
      this.listenTo(Adapt, {
        'remove': this.onRemove,
        'media:stop': this.onMediaStop,
        'audio:updateAudioStatus': this.setVideoVolume
      });

      _.bindAll(this, 'onMediaElementPlay', 'onMediaElementPause', 'onMediaElementEnded', 'onMediaElementTimeUpdate', 'onMediaElementSeeking');

      // set initial player state attributes
      this.model.set({
        '_isMediaEnded': false,
        '_isMediaPlaying': false
      });
    }

    this.render();
  }

  onOpened() {
    if (this.model.get('_video') && this.model.get('_video')._media.cc) {
      this.setupPlayer();
      this.addMejsButtonClass();
    }

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

  addMejsButtonClass() {
    this.$('.mejs-overlay-button').addClass('icon');
  }

  setupPlayer() {
    this.model.set('_playerOptions', {});

    const modelOptions = this.model.get('_playerOptions');

    modelOptions.features = ['playpause','progress','current','duration'];
    
    if (this.model.get('_video')._media.cc) {
      modelOptions.features.unshift('tracks');
    }
    modelOptions.features.push('fullscreen');
    modelOptions.features.push('volume');

    /*
    Unless we are on Android/iOS and using native controls, when MediaElementJS initializes the player
    it will invoke the success callback prior to performing one last call to setPlayerSize.
    This call to setPlayerSize is deferred by 50ms so we add a delay of 100ms here to ensure that
    we don't invoke setReadyStatus until the player is definitely finished rendering.
    */
    modelOptions.success = _.debounce(this.onPlayerReady.bind(this), 100);

    if (this.model.get('_video')._media.cc) {
      const startLanguage = Adapt.config.get('_defaultLanguage') || 'en';
      if (!offlineStorage.get('captions')) {
        offlineStorage.set('captions', startLanguage);
      }
      modelOptions.startLanguage = this.checkForSupportedCCLanguage(offlineStorage.get('captions'));
    }

    if (modelOptions.alwaysShowControls === undefined) {
      modelOptions.alwaysShowControls = false;
    }
    if (modelOptions.hideVideoControlsOnLoad === undefined) {
      modelOptions.hideVideoControlsOnLoad = true;
    }

    modelOptions.autoRewind = false;
    modelOptions.alwaysShowControls = true;
    modelOptions.toggleCaptionsButtonWhenOnlyOne = true;

    // create the player
    this.$('video').mediaelementplayer(modelOptions);
    this.cleanUpPlayer();
  }

  cleanUpPlayer() {
    this.$('.iconpopup__video-inner').children('.mejs-offscreen').remove();
    this.$('[role=application]').removeAttr('role tabindex');
    this.$('[aria-controls]').removeAttr('aria-controls');
  }

  setupEventListeners() {
    // handle other completion events in the event Listeners
    $(this.mediaElement).on({
      'play': this.onMediaElementPlay,
      'pause': this.onMediaElementPause,
      'ended': this.onMediaElementEnded
    });

    // occasionally the mejs code triggers a click of the captions language
    // selector during setup, this slight delay ensures we skip that
    _.delay(this.listenForCaptionsChange.bind(this), 250);
  }

  /**
    * Sets up the component to detect when the user has changed the captions so that it can store the user's
    * choice in offlineStorage and notify other media components on the same page of the change
    * Also sets the component up to listen for this event from other media components on the same page
  */
  listenForCaptionsChange() {
    if(!this.model.get('_video')._media.cc) return;

    this.$('.mejs-captions-button button').on('click.mediaCaptionsChange', _.debounce(function() {
      const srclang = this.mediaElement.player.selectedTrack ? this.mediaElement.player.selectedTrack.srclang : 'none';
      offlineStorage.set('captions', srclang);
      Adapt.trigger('media:captionsChange', this, srclang);
    }.bind(this), 250)); // needs debouncing because the click event fires twice

    this.listenTo(Adapt, 'media:captionsChange', this.onCaptionsChanged);
  }

  /**
    * Handles updating the captions in this instance when learner changes captions in another
    * media component on the same page
    * @param {Backbone.View} view The view instance that triggered the event
    * @param {string} lang The captions language the learner chose in the other media component
  */
  onCaptionsChanged(view, lang) {
    if (view && view.cid === this.cid) return; //ignore the event if we triggered it

    lang = this.checkForSupportedCCLanguage(lang);

    this.mediaElement.player.setTrack(lang);

    // because calling player.setTrack doesn't update the cc button's languages popup...
    const $inputs = this.$('.mejs-captions-selector input');
    $inputs.filter(':checked').prop('checked', false);
    $inputs.filter('[value="' + lang + '"]').prop('checked', true);
  }

  /**
    * When the learner selects a captions language in another media component, that language may not be available
    * in this instance, in which case default to the course config `_defaultLanguage` if that's set - or "none" if it's not
    * @param {string} lang The language we're being asked to switch to e.g. "de"
    * @return {string} The language we're actually going to switch to - or "none" if there's no good match
  */
  checkForSupportedCCLanguage(lang) {
    if (!lang || lang === 'none') return 'none';

    if(_.findWhere(this.model.get('_video')._media.cc, {srclang: lang})) return lang;

    return Adapt.config.get('_defaultLanguage') || 'none';
  }

  onMediaElementPlay(event) {
    this.queueGlobalEvent('play');

    Adapt.trigger('audio:stopAllChannels');
    Adapt.trigger("media:stop", this);

    this.model.set({
      '_isMediaPlaying': true,
      '_isMediaEnded': false
    });
  }

  onMediaElementPause(event) {
    this.queueGlobalEvent('pause');

    this.model.set('_isMediaPlaying', false);
  }

  onMediaElementEnded(event) {
    this.queueGlobalEvent('ended');

    this.model.set('_isMediaEnded', true);

    this.$('.mejs-overlay-button').addClass("replay");
  }

  onMediaElementSeeking(event) {
    let maxViewed = this.model.get('_maxViewed');
    if(!maxViewed) {
      maxViewed = 0;
    }
    if (event.target.currentTime > maxViewed) {
      event.target.currentTime = maxViewed;
    }
  }

  onMediaElementTimeUpdate(event) {
    let maxViewed = this.model.get('_maxViewed');
    if (!maxViewed) {
      maxViewed = 0;
    }
    if (event.target.currentTime > maxViewed) {
      this.model.set('_maxViewed', event.target.currentTime);
    }
  }

  // Overrides the default play/pause functionality to stop accidental playing on touch devices
  setupPlayPauseToggle() {
    // bit sneaky, but we don't have a this.mediaElement.player ref on iOS devices
    const player = this.mediaElement.player;

    if (!player) {
      console.log("MediaAutoplay.setupPlayPauseToggle: OOPS! there's no player reference.");
      return;
    }

    // stop the player dealing with this, we'll do it ourselves
    player.options.clickToPlayPause = false;

    this.onOverlayClick = this.onOverlayClick.bind(this);
    this.onMediaElementClick = this.onMediaElementClick.bind(this);

    // play on 'big button' click
    this.$('.mejs-overlay-button').on("click", this.onOverlayClick);

    // pause on player click
    this.$('.mejs-mediaelement').on("click", this.onMediaElementClick);
  }

  onMediaStop(view) {
    // Make sure this view isn't triggering media:stop
    if (view && view.cid === this.cid) return;

    if (!this.mediaElement || !this.mediaElement.player) return;

    this.mediaElement.player.pause();
  }

  onOverlayClick() {
    const player = this.mediaElement.player;
    if (!player) return;

    player.play();
  }

  onMediaElementClick(event) {
    const player = this.mediaElement.player;
    if (!player) return;

    const isPaused = player.media.paused;
    if(!isPaused) player.pause();
  }

  onRemove() {
    this.$('.mejs-overlay-button').off("click", this.onOverlayClick);
    this.$('.mejs-mediaelement').off("click", this.onMediaElementClick);

    if (this.model.get('_video')._media.cc) {
      this.$('.mejs-captions-button button').off('click.mediaCaptionsChange');
    }

    const modelOptions = this.model.get('_playerOptions');
    delete modelOptions.success;

    if (this.mediaElement && this.mediaElement.player) {
      const player_id = this.mediaElement.player.id;

      purge(this.$el[0]);
      this.mediaElement.player.remove();

      if (mejs.players[player_id]) {
        delete mejs.players[player_id];
      }
    }

    if (this.mediaElement) {
      $(this.mediaElement).off({
        'play': this.onMediaElementPlay,
        'pause': this.onMediaElementPause,
        'ended': this.onMediaElementEnded,
        'seeking': this.onMediaElementSeeking,
        'timeupdate': this.onMediaElementTimeUpdate
      });

      this.mediaElement.src = "";
      $(this.mediaElement.pluginElement).remove();
      delete this.mediaElement;
    }
  }

  onPlayerReady(mediaElement, domObject) {
    this.mediaElement = mediaElement;

    let player = this.mediaElement.player;
    if (!player) player = mejs.players[this.$('.mejs-container').attr('id')];

    const hasTouch = mejs.MediaFeatures.hasTouch;
    if (hasTouch) {
      this.setupPlayPauseToggle();
    }

    this.cleanUpPlayerAfter();

    this.setupEventListeners();
    this.setVideoVolume();

    if (this.model.get('_video')._autoPlay) {
      this.playMediaElement(true);
    }
  }

  cleanUpPlayerAfter() {
    this.$("[aria-valuemax='NaN']").attr("aria-valuemax", 0);
  }

  /**
    * Queue firing a media event to prevent simultaneous events firing, and provide a better indication of how the
    * media  player is behaving
    * @param {string} eventType
  */
  queueGlobalEvent(eventType) {
    const t = Date.now();
    const lastEvent = this.lastEvent || { time: 0 };
    const timeSinceLastEvent = t - lastEvent.time;
    const debounceTime = 500;

    this.lastEvent = {
      time: t,
      type: eventType
    };

    // Clear any existing timeouts
    clearTimeout(this.eventTimeout);

    // Always trigger 'ended' events
    if (eventType === 'ended') {
      return this.triggerGlobalEvent(eventType);
    }

    // Fire the event after a delay, only if another event has not just been fired
    if (timeSinceLastEvent > debounceTime) {
      this.eventTimeout = setTimeout(this.triggerGlobalEvent.bind(this, eventType), debounceTime);
    }
  }

  triggerGlobalEvent(eventType) {
    const player = this.mediaElement.player;

    const eventObj = {
      type: eventType,
      src: this.mediaElement.src,
      platform: this.mediaElement.pluginType
    };

    if (player) eventObj.isVideo = player.isVideo;

    Adapt.trigger('media', eventObj);
  }

  playMediaElement(state) {
    if (!this.mediaElement) return;

    if (state) {
      Adapt.trigger('audio:stopAllChannels');
      this.mediaElement.play();
      } else if (state === false) {
        this.mediaElement.pause();
    }
  }

  setVideoVolume() {
    if (!this.mediaElement) return;
    // Check for audio extension
    if (!Adapt.audio) return;
    if (Adapt.course.get('_audio') && Adapt.course.get('_audio')._isEnabled) {
      // If audio is turned on
      if (Adapt.audio.audioStatus == 1){
        if (this.model.get('_video')._startVolume) {
          this.mediaElement.player.setVolume(parseInt(this.model.get('_video')._startVolume)/100);
        } else {
          this.mediaElement.player.setVolume(this.mediaElement.player.options.startVolume);
        }
      } else {
        this.mediaElement.player.setVolume(0);
      }
    } else {
      if (this.model.get('_video')._startVolume) {
        this.mediaElement.player.setVolume(parseInt(this.model.get('_video')._startVolume)/100);
      } else {
        this.mediaElement.player.setVolume(this.mediaElement.player.options.startVolume);
      }
    }
  }

  closePopup(event) {
    Adapt.trigger('notify:close');
  }
}
