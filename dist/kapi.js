(function () {
  "use strict";

  const STATE_ALIASES = {
    happy: "correct",
    try: "wrong",
    party: "horn",
    handshake: "levelUp"
  };

  const STATE_CONFIG = {
    idle: { priority: 0, loop: true },
    idleBlink: { priority: 5, duration: 340 },
    hey: { priority: 30, duration: 3400, sound: "hey" },
    correct: { priority: 40, duration: 680, sound: "correct" },
    wrong: { priority: 50, duration: 720, sound: "wrong" },
    flag: { priority: 60, duration: 2300, sound: "flag" },
    horn: { priority: 70, duration: 2500, sound: "party" },
    dance: { priority: 80, duration: 2700, sound: "dance" },
    levelUp: { priority: 90, duration: 1500, sound: "handshake", next: "dance" },
    trainingFinished: { priority: 100, loop: true, sound: "complete" }
  };

  const ASSETS = {
    idle: "assets/capybara.webp",
    idleBlink: "assets/capybara.webp",
    hey: "assets/kapi-welcome-sprite.webp",
    correct: "assets/capybara.webp",
    wrong: "assets/capybara.webp",
    flag: "assets/kapi-flag.webp",
    horn: "assets/kapi-party.webp",
    dance: "assets/kapi-dance.webp",
    levelUp: "assets/kapi-handshake.webp",
    trainingFinished: "assets/kapi-dance.webp"
  };

  class KapiAnimator {
    play() { throw new Error("KapiAnimator.play() must be implemented"); }
    stop() {}
    setLoop() {}
    setSurface() {}
  }

  class CssKapiAnimator extends KapiAnimator {
    constructor(elements) {
      super();
      this.elements = elements;
      this.surface = "home";
      this.loop = false;
    }

    setSurface(surface) {
      this.surface = surface;
    }

    setLoop(loop) {
      this.loop = Boolean(loop);
    }

    play(state, options = {}) {
      const surface = options.surface || this.surface;
      const host = this.elements[`${surface}Host`];
      if (!host) return;
      this.clearStateClasses(host);
      host.classList.add("kapi-host", `kapi-state-${state}`);
      host.dataset.kapiState = state;
      host.dataset.kapiLoop = String(this.loop);

      if (surface === "home") {
        const spriteState = state === "idle" || state === "idleBlink" || state === "hey";
        host.style.backgroundImage = `url("${spriteState ? "assets/kapi-welcome-sprite.webp" : ASSETS[state] || ASSETS.idle}")`;
        host.style.backgroundSize = spriteState ? "400% 100%" : "contain";
        host.style.backgroundPosition = spriteState ? "0 0" : "center";
        host.style.backgroundRepeat = "no-repeat";
      } else {
        const image = this.elements[`${surface}Image`];
        if (image) image.src = state === "hey" ? ASSETS.idle : (ASSETS[state] || ASSETS.idle);
      }
    }

    stop(surface = this.surface) {
      const host = this.elements[`${surface}Host`];
      if (!host) return;
      this.clearStateClasses(host);
      delete host.dataset.kapiState;
      delete host.dataset.kapiLoop;
    }

    renderBanner(state) {
      const card = this.elements.bannerCard;
      const image = this.elements.bannerImage;
      if (!card || !image) return;
      card.dataset.kapiState = state;
      image.src = ASSETS[state] || ASSETS.flag;
      if (this.elements.bannerBurst) {
        this.elements.bannerBurst.innerHTML = ["horn", "dance", "levelUp", "trainingFinished"].includes(state)
          ? Array.from({ length: 9 }, (_, index) => `<i style="--burst-index:${index}"></i>`).join("")
          : "";
      }
    }

    clearBanner() {
      const card = this.elements.bannerCard;
      if (card) delete card.dataset.kapiState;
      if (this.elements.bannerBurst) this.elements.bannerBurst.innerHTML = "";
    }

    clearStateClasses(host) {
      [...host.classList]
        .filter((name) => name.startsWith("kapi-state-"))
        .forEach((name) => host.classList.remove(name));
    }
  }

  class KapiStateMachine {
    constructor(animator, options = {}) {
      this.animator = animator;
      this.soundPlayer = options.soundPlayer || (() => {});
      this.onStateChange = options.onStateChange || (() => {});
      this.random = options.random || Math.random;
      this.surface = "home";
      this.state = "idle";
      this.currentOptions = {};
      this.queue = [];
      this.stateTimer = 0;
      this.idleTimer = 0;
      this.animator.setSurface(this.surface);
      this.enter("idle", { surface: this.surface }, true);
    }

    normalize(state) {
      return STATE_ALIASES[state] || state;
    }

    setSurface(surface, initialState = "idle") {
      this.reset(surface, initialState);
    }

    reset(surface = this.surface, initialState = "idle") {
      this.clearTimers();
      this.queue = [];
      this.animator.stop(this.surface);
      this.surface = surface;
      this.animator.setSurface(surface);
      this.enter(this.normalize(initialState), { surface }, true);
    }

    trigger(rawState, options = {}) {
      const state = this.normalize(rawState);
      const next = STATE_CONFIG[state];
      if (!next) return false;
      const current = STATE_CONFIG[this.state] || STATE_CONFIG.idle;

      if (this.state === "trainingFinished" && state !== "trainingFinished") return false;
      if (state === "idle") {
        this.enter("idle", { surface: options.surface || this.surface }, true);
        return true;
      }
      if (next.priority > current.priority || this.state === "idle" || this.state === "idleBlink") {
        this.queue = this.queue.filter((item) => STATE_CONFIG[item.state].priority >= next.priority);
        this.enter(state, options, true);
        return true;
      }
      if (next.priority === current.priority && this.queue.length < 4) {
        this.queue.push({ state, options });
        return true;
      }
      return false;
    }

    renderBanner(rawState) {
      this.animator.renderBanner?.(this.normalize(rawState));
    }

    clearBanner() {
      this.animator.clearBanner?.();
    }

    enter(state, options = {}, internal = false) {
      window.clearTimeout(this.stateTimer);
      window.clearTimeout(this.idleTimer);
      this.stateTimer = 0;
      this.idleTimer = 0;
      const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
      this.state = state;
      this.currentOptions = options;
      this.surface = options.surface || this.surface;
      this.animator.setSurface(this.surface);
      this.animator.setLoop(Boolean(config.loop));
      this.animator.play(state, { ...options, surface: this.surface });
      this.onStateChange(state, this.surface);
      if (config.sound && options.silent !== true) this.soundPlayer(config.sound, state);

      if (config.duration) {
        this.stateTimer = window.setTimeout(() => this.finishState(), config.duration);
      } else if (state === "idle") {
        this.scheduleIdleMicroAnimation();
      }
      return internal;
    }

    finishState() {
      const finishedState = this.state;
      const finishedOptions = this.currentOptions;
      const config = STATE_CONFIG[finishedState] || STATE_CONFIG.idle;
      this.stateTimer = 0;

      if (config.next) {
        this.enter(config.next, { ...finishedOptions, silent: false }, true);
        return;
      }
      if (typeof finishedOptions.onComplete === "function") finishedOptions.onComplete(finishedState);
      const queued = this.queue.shift();
      if (queued) this.enter(queued.state, queued.options, true);
      else this.enter("idle", { surface: this.surface }, true);
    }

    scheduleIdleMicroAnimation() {
      if (this.surface === "result") return;
      const delay = 3200 + Math.round(this.random() * 4200);
      this.idleTimer = window.setTimeout(() => {
        if (this.state === "idle") this.enter("idleBlink", { surface: this.surface, silent: true }, true);
      }, delay);
    }

    clearTimers() {
      window.clearTimeout(this.stateTimer);
      window.clearTimeout(this.idleTimer);
      this.stateTimer = 0;
      this.idleTimer = 0;
    }
  }

  window.KapiAnimator = KapiAnimator;
  window.CssKapiAnimator = CssKapiAnimator;
  window.KapiStateMachine = KapiStateMachine;
  window.KAPI_STATE_CONFIG = Object.freeze({ ...STATE_CONFIG });
})();
