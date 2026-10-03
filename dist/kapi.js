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

  const RIG_PARTS = {
    head: "assets/kapi-rig-v2/head.png",
    torso: "assets/kapi-rig-v2/torso.png",
    armLeftUpper: "assets/kapi-rig-v2/arm-left-upper.png",
    armLeftLower: "assets/kapi-rig-v2/arm-left-lower.png",
    armRightUpper: "assets/kapi-rig-v2/arm-right-upper.png",
    armRightLower: "assets/kapi-rig-v2/arm-right-lower.png",
    legLeft: "assets/kapi-rig-v2/leg-left.png",
    legRight: "assets/kapi-rig-v2/leg-right.png",
    footLeft: "assets/kapi-rig-v2/foot-left.png",
    footRight: "assets/kapi-rig-v2/foot-right.png"
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

  class CanvasKapiAnimator extends KapiAnimator {
    constructor(elements) {
      super();
      this.elements = elements;
      this.surface = "home";
      this.instances = new Map();
      this.images = new Map();
      this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
      Object.values(RIG_PARTS).forEach((source) => this.loadImage(source));
    }

    setSurface(surface) {
      this.surface = surface;
      this.ensure(surface);
    }

    setLoop() {}

    getCanvas(surface) {
      if (surface === "banner") return this.elements.bannerImage;
      return this.elements[`${surface}Host`]?.querySelector("canvas") || null;
    }

    ensure(surface) {
      if (this.instances.has(surface)) return this.instances.get(surface);
      const canvas = this.getCanvas(surface);
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      const record = {
        canvas,
        context: canvas.getContext("2d", { alpha: true }),
        state: "idle",
        previousState: null,
        stateStartedAt: performance.now(),
        transitionStartedAt: 0,
        transitionDuration: 260,
        observer: null,
        frameRequest: 0
      };
      this.instances.set(surface, record);
      canvas.closest(".kapi-host, .motivation-art")?.classList.add("kapi-rive-active", "kapi-rive-ready");
      if (typeof ResizeObserver === "function") {
        record.observer = new ResizeObserver(() => this.resize(record));
        record.observer.observe(canvas);
      }
      this.resize(record);
      this.render(record, performance.now());
      return record;
    }

    loadImage(source) {
      if (this.images.has(source)) return this.images.get(source);
      const image = new Image();
      const promise = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
      });
      image.decoding = "async";
      image.src = source;
      const entry = { image, promise, ready: false };
      promise.then(() => { entry.ready = true; }).catch(() => {});
      this.images.set(source, entry);
      return entry;
    }

    resize(record) {
      const rect = record.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (record.canvas.width !== width || record.canvas.height !== height) {
        record.canvas.width = width;
        record.canvas.height = height;
      }
    }

    pose(state, elapsed) {
      const t = elapsed / 1000;
      const pose = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
      if (this.reducedMotion) return pose;
      if (state === "idle") {
        pose.y = -3.8 + Math.sin(t * 1.55) * 3.8;
        pose.x = Math.sin(t * .78) * 1.6;
        pose.rotation = Math.sin(t * .72) * .012;
        pose.scaleX = 1 + Math.sin(t * 1.55) * .006;
        pose.scaleY = 1 - Math.sin(t * 1.55) * .009;
      } else if (state === "idleBlink") {
        const blink = Math.sin(Math.min(1, elapsed / 340) * Math.PI);
        pose.y = blink * 2;
        pose.scaleY = 1 - blink * .035;
        pose.scaleX = 1 + blink * .012;
      } else if (state === "hey") {
        const wave = Math.sin(t * 7.4);
        pose.y = -5 - Math.abs(Math.sin(t * 3.7)) * 7;
        pose.rotation = wave * .027;
        pose.scaleX = 1 + Math.abs(wave) * .012;
        pose.scaleY = 1 - Math.abs(wave) * .007;
      } else if (state === "correct") {
        const progress = Math.min(1, elapsed / 680);
        const lift = Math.sin(progress * Math.PI);
        pose.y = -lift * 22;
        pose.rotation = Math.sin(progress * Math.PI * 2) * .055 * (1 - progress);
        pose.scaleX = 1 + lift * .035;
        pose.scaleY = 1 + lift * .065;
      } else if (state === "wrong") {
        const progress = Math.min(1, elapsed / 720);
        const damping = 1 - progress;
        pose.x = Math.sin(progress * Math.PI * 5) * 9 * damping;
        pose.rotation = Math.sin(progress * Math.PI * 5) * .04 * damping;
        pose.y = Math.sin(progress * Math.PI) * 3;
      } else if (state === "flag") {
        pose.y = -5 - Math.abs(Math.sin(t * 4.1)) * 7;
        pose.rotation = Math.sin(t * 4.1) * .038;
        pose.scaleX = 1 + Math.sin(t * 4.1 + 1) * .012;
        pose.scaleY = 1 - Math.sin(t * 4.1 + 1) * .008;
      } else if (state === "horn") {
        const bounce = Math.abs(Math.sin(t * 5.4));
        pose.y = -bounce * 11;
        pose.rotation = Math.sin(t * 2.7) * .03;
        pose.scaleX = 1 + bounce * .025;
        pose.scaleY = 1 + bounce * .045;
      } else if (state === "dance" || state === "trainingFinished") {
        const beat = Math.sin(t * 7.2);
        pose.x = beat * 8;
        pose.y = -Math.abs(Math.sin(t * 7.2)) * 12;
        pose.rotation = beat * .085;
        pose.scaleX = 1 + Math.abs(beat) * .025;
        pose.scaleY = 1 + Math.abs(beat) * .035;
      } else if (state === "levelUp") {
        const pulse = Math.sin(Math.min(1, elapsed / 1500) * Math.PI);
        pose.x = pulse * 6;
        pose.y = -pulse * 8;
        pose.rotation = -pulse * .025;
        pose.scaleX = 1 + pulse * .085;
        pose.scaleY = 1 + pulse * .055;
      }
      return pose;
    }

    limbPose(state, elapsed) {
      const t = elapsed / 1000;
      const idle = Math.sin(t * 1.55);
      const result = {
        head: idle * .018,
        leftUpper: .16 + idle * .018,
        leftLower: -.08 + idle * .022,
        rightUpper: -.16 - idle * .018,
        rightLower: .08 - idle * .022,
        leftLeg: .03,
        rightLeg: -.03,
        leftFoot: 0,
        rightFoot: 0
      };
      if (this.reducedMotion) return result;
      if (state === "hey") {
        const wave = Math.sin(t * 8.5);
        result.head = -.045 + wave * .012;
        result.rightUpper = -2.18 + wave * .08;
        result.rightLower = -.62 + wave * .42;
        result.leftUpper = .24;
      } else if (state === "correct") {
        const p = Math.min(1, elapsed / 680);
        const lift = Math.sin(p * Math.PI);
        result.head = Math.sin(p * Math.PI * 2) * .035;
        result.leftUpper = .16 + lift * 2.04;
        result.rightUpper = -.16 - lift * 2.04;
        result.leftLower = -.1 - lift * .28;
        result.rightLower = .1 + lift * .28;
        result.leftFoot = -lift * .15;
        result.rightFoot = lift * .15;
      } else if (state === "wrong") {
        const p = Math.min(1, elapsed / 720);
        const shake = Math.sin(p * Math.PI * 5) * (1 - p);
        result.head = shake * .08;
        result.leftUpper = .32;
        result.rightUpper = -.32;
        result.leftLower = .18;
        result.rightLower = -.18;
      } else if (state === "flag") {
        const wave = Math.sin(t * 5.6);
        result.rightUpper = -2.12 + wave * .13;
        result.rightLower = -.25 + wave * .18;
        result.leftUpper = .28 + wave * .025;
        result.head = wave * .025;
      } else if (state === "horn") {
        const pulse = Math.sin(t * 5.4);
        result.leftUpper = 1.22 + pulse * .11;
        result.rightUpper = -1.22 - pulse * .11;
        result.leftLower = -.68 - pulse * .08;
        result.rightLower = .68 + pulse * .08;
        result.head = pulse * .022;
      } else if (state === "dance" || state === "trainingFinished") {
        const beat = Math.sin(t * 7.2);
        result.head = beat * .055;
        result.leftUpper = .25 + beat * .62;
        result.rightUpper = -.25 + beat * .62;
        result.leftLower = -.12 - beat * .22;
        result.rightLower = .12 - beat * .22;
        result.leftLeg = beat * .13;
        result.rightLeg = beat * .13;
        result.leftFoot = -beat * .12;
        result.rightFoot = -beat * .12;
      } else if (state === "levelUp") {
        const p = Math.sin(Math.min(1, elapsed / 1500) * Math.PI);
        result.rightUpper = -.16 - p * 1.25;
        result.rightLower = .08 + p * .75;
        result.leftUpper = .16 + p * .3;
        result.head = -p * .035;
      }
      return result;
    }

    drawPart(context, name, x, y, scale, rotation, pivotX, pivotY) {
      const entry = this.loadImage(RIG_PARTS[name]);
      if (!entry.ready) return;
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(scale, scale);
      context.drawImage(entry.image, -pivotX, -pivotY);
      context.restore();
    }

    drawArm(context, side, shoulderX, shoulderY, scale, upperRotation, lowerRotation) {
      const upperName = side === "left" ? "armLeftUpper" : "armRightUpper";
      const lowerName = side === "left" ? "armLeftLower" : "armRightLower";
      const upper = this.loadImage(RIG_PARTS[upperName]);
      const lower = this.loadImage(RIG_PARTS[lowerName]);
      if (!upper.ready || !lower.ready) return;
      const upperPivotX = upper.image.naturalWidth / 2;
      const lowerPivotX = lower.image.naturalWidth / 2;
      context.save();
      context.translate(shoulderX, shoulderY);
      context.rotate(upperRotation);
      context.scale(scale, scale);
      context.drawImage(upper.image, -upperPivotX, -18);
      context.translate(0, upper.image.naturalHeight * .72);
      context.rotate(lowerRotation);
      context.drawImage(lower.image, -lowerPivotX, -20);
      context.restore();
    }

    drawRig(record, state, elapsed, opacity) {
      if (opacity <= 0) return;
      const context = record.context;
      const canvas = record.canvas;
      const pose = this.pose(state, elapsed);
      const limbs = this.limbPose(state, elapsed);
      const unit = Math.min(canvas.width, canvas.height) / 700;
      context.save();
      context.globalAlpha = opacity;
      context.translate(canvas.width / 2 + pose.x * unit, canvas.height / 2 + pose.y * unit);
      context.rotate(pose.rotation);
      context.scale(unit * pose.scaleX, unit * pose.scaleY);
      context.translate(-350, -350);

      this.drawPart(context, "footLeft", 290, 568, .60, limbs.leftFoot, 111, 28);
      this.drawPart(context, "footRight", 410, 568, .60, limbs.rightFoot, 112, 28);
      this.drawPart(context, "torso", 350, 389, .69, 0, 280.5, 229);
      this.drawArm(context, "left", 236, 300, .58, limbs.leftUpper, limbs.leftLower);
      this.drawArm(context, "right", 464, 300, .58, limbs.rightUpper, limbs.rightLower);
      this.drawPart(context, "head", 350, 190, .70, limbs.head, 244, 215);
      context.restore();
    }

    render(record, now) {
      const context = record.context;
      if (!context) return;
      context.clearRect(0, 0, record.canvas.width, record.canvas.height);
      const transitionProgress = record.previousState
        ? Math.min(1, (now - record.transitionStartedAt) / record.transitionDuration)
        : 1;
      const eased = 1 - Math.pow(1 - transitionProgress, 3);
      if (record.previousState && transitionProgress < 1) {
        this.drawRig(record, record.previousState, now - record.previousStartedAt, 1 - eased);
      } else {
        record.previousState = null;
      }
      this.drawRig(record, record.state, now - record.stateStartedAt, eased);
      record.frameRequest = requestAnimationFrame((time) => this.render(record, time));
    }

    play(state, options = {}) {
      const surface = options.surface || this.surface;
      const host = this.elements[`${surface}Host`];
      if (host) {
        host.dataset.kapiState = state;
        host.classList.add("kapi-rive-active");
      }
      const record = this.ensure(surface);
      if (!record || record.state === state) return;
      const now = performance.now();
      record.previousState = record.state;
      record.previousStartedAt = record.stateStartedAt;
      record.state = state;
      record.stateStartedAt = now;
      record.transitionStartedAt = now;
    }

    stop(surface = this.surface) {
      this.play("idle", { surface });
    }

    renderBanner(state) {
      const card = this.elements.bannerCard;
      if (card) card.dataset.kapiState = state;
      this.play(state, { surface: "banner" });
      if (this.elements.bannerBurst) {
        this.elements.bannerBurst.innerHTML = ["horn", "dance", "levelUp", "trainingFinished"].includes(state)
          ? Array.from({ length: 9 }, (_, index) => `<i style="--burst-index:${index}"></i>`).join("")
          : "";
      }
    }

    clearBanner() {
      const card = this.elements.bannerCard;
      if (card) delete card.dataset.kapiState;
      this.play("idle", { surface: "banner" });
      if (this.elements.bannerBurst) this.elements.bannerBurst.innerHTML = "";
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
  window.CanvasKapiAnimator = CanvasKapiAnimator;
  window.RiveKapiAnimator = CanvasKapiAnimator;
  window.KapiStateMachine = KapiStateMachine;
  window.KAPI_STATE_CONFIG = Object.freeze({ ...STATE_CONFIG });
})();
