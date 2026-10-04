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
    idleBlink: { priority: 1, duration: 340 },
    idleHeadMove: { priority: 1, duration: 1200 },
    idleLookLeft: { priority: 1, duration: 1400 },
    idleLookRight: { priority: 1, duration: 1400 },
    hey: { priority: 5, duration: 3400, sound: "hey" },
    correct: { priority: 10, duration: 1050, sound: "correct" },
    wrong: { priority: 20, duration: 1500, sound: "wrong" },
    errorRecovered: { priority: 30, duration: 1050, sound: "recovered" },
    errorMastered: { priority: 35, duration: 1300, sound: "mastered" },
    flag: { priority: 40, duration: 1600, sound: "flag" },
    horn: { priority: 50, duration: 2100, sound: "party" },
    dance: { priority: 60, duration: 2400, sound: "dance" },
    levelUp: { priority: 80, duration: 1500, sound: "levelUp", next: "dance" },
    completion: { priority: 90, duration: 1900, sound: "complete20", next: "trainingFinished" },
    perfectTraining: { priority: 95, duration: 2400, sound: "perfect", next: "trainingFinished" },
    trainingFinished: { priority: 90, loop: true }
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
    headNod: "assets/kapi-rig-v2/head-nod.png",
    headHop: "assets/kapi-rig-v2/head-hop.png",
    headCheer: "assets/kapi-rig-v2/head-cheer.png",
    headWrong: "assets/kapi-rig-v2/head-wrong.png",
    headRecovered: "assets/kapi-rig-v2/head-recovered.png",
    headMastered: "assets/kapi-rig-v2/head-mastered.png",
    headFlag: "assets/kapi-rig-v2/head-flag.png",
    headHorn: "assets/kapi-rig-v2/head-horn-v2.png",
    headDance: "assets/kapi-rig-v2/head-dance.png",
    headLevel: "assets/kapi-rig-v2/head-level.png",
    headComplete: "assets/kapi-rig-v2/head-complete.png",
    headPerfect: "assets/kapi-rig-v2/head-perfect.png",
    armRightFlag: "assets/kapi-rig-v2/arm-right-flag.png",
    torso: "assets/kapi-rig-v2/torso.png",
    armLeftUpper: "assets/kapi-rig-v4/arm-left-upper.png",
    armRightUpper: "assets/kapi-rig-v4/arm-right-upper.png",
    armLeftForearm: "assets/kapi-rig-v4/arm-left-forearm.png",
    armRightForearm: "assets/kapi-rig-v4/arm-right-forearm.png",
    pawLeft: "assets/kapi-rig-v3/paw-left.png",
    pawRight: "assets/kapi-rig-v3/paw-right.png",
    legLeft: "assets/kapi-rig-v3/leg-left.png",
    legRight: "assets/kapi-rig-v3/leg-right.png",
    footLeft: "assets/kapi-rig-v3/foot-left.png",
    footRight: "assets/kapi-rig-v3/foot-right.png"
  };

  const ARM_JOINTS = {
    left: { upper: "armLeftUpper", forearm: "armLeftForearm", paw: "pawLeft", shoulder: [244, 54], elbow: [58, 287], forearmElbow: [210, 48], wrist: [47, 231], pawWrist: [168, 16] },
    right: { upper: "armRightUpper", forearm: "armRightForearm", paw: "pawRight", shoulder: [50, 54], elbow: [236, 288], forearmElbow: [35, 48], wrist: [198, 230], pawWrist: [31, 16] }
  };

  const LEG_JOINTS = {
    left: { leg: "legLeft", foot: "footLeft", hip: [229, 48], ankle: [211, 288], footAnkle: [238, 24] },
    right: { leg: "legRight", foot: "footRight", hip: [41, 48], ankle: [59, 286], footAnkle: [52, 24] }
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
      const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      this.reducedMotion = motionPreference?.matches === true;
      motionPreference?.addEventListener?.("change", (event) => { this.reducedMotion = event.matches; });
      Object.values(RIG_PARTS).forEach((source) => this.loadImage(source));
    }

    setSurface(surface) {
      if (this.surface !== surface) this.pause(this.surface);
      this.surface = surface;
      const record = this.ensure(surface);
      if (record && !record.frameRequest) {
        this.resize(record);
        this.render(record, performance.now());
      }
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
        variant: "hop",
        previousHead: "head",
        transitionFrom: null,
        stateStartedAt: performance.now(),
        transitionStartedAt: 0,
        transitionDuration: 180,
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

    motion(state, elapsed, variant = "hop") {
      if (state === "errorRecovered") return { state: "correct", elapsed, variant: "recovered" };
      if (state === "errorMastered") return { state: "correct", elapsed, variant: "mastered" };
      return { state, elapsed, variant };
    }

    finalePose(method, state, elapsed) {
      const perfect = state === "perfectTraining";
      const introDuration = perfect ? 800 : 600;
      const introState = perfect ? "correct" : "levelUp";
      const introEnd = perfect ? 1300 : 1500;
      if (elapsed < introDuration) return this[method](introState, elapsed * introEnd / introDuration, "mastered");
      const progress = Math.min(1, (elapsed - introDuration) / 240);
      const eased = progress * progress * (3 - 2 * progress);
      return this.blendValues(this[method](introState, introEnd, "mastered"), this[method]("dance", elapsed - introDuration), eased);
    }

    pose(state, elapsed, variant) {
      if (state === "completion" || state === "perfectTraining") return this.finalePose("pose", state, elapsed);
      ({ state, elapsed, variant } = this.motion(state, elapsed, variant));
      const t = elapsed / 1000;
      const pose = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
      if (this.reducedMotion) return pose;
      if (state === "idle" || state.startsWith("idleLook") || state === "idleHeadMove") {
        pose.y = -3.5 + Math.sin(t * 1.55) * 3.5;
        pose.x = Math.sin(t * .78) * 1.4;
        pose.rotation = Math.sin(t * .72) * .009;
        pose.scaleX = 1 + Math.sin(t * 1.55) * .004;
        pose.scaleY = 1 - Math.sin(t * 1.55) * .007;
      } else if (state === "idleBlink") {
        const blink = Math.sin(Math.min(1, elapsed / 340) * Math.PI);
        pose.y = blink * 2;
        pose.scaleY = 1 - blink * .035;
        pose.scaleX = 1 + blink * .012;
      } else if (state === "hey") {
        const wave = Math.sin(t * 8.2);
        pose.y = -6 - Math.abs(Math.sin(t * 3.8)) * 5;
        pose.rotation = wave * .018;
      } else if (state === "correct") {
        const duration = { nod: 760, hop: 1050, cheer: 1200, recovered: 1050, mastered: 1300 }[variant] || 1050;
        const p = Math.min(1, elapsed / duration);
        const gesture = Math.sin(p * Math.PI);
        if (variant === "nod") {
          const down = Math.sin(p * Math.PI);
          pose.y = down * 5;
          pose.rotation = Math.sin(p * Math.PI * 2) * .008;
          pose.scaleX = 1 + down * .009;
          pose.scaleY = 1 - down * .012;
        } else if (variant === "hop") {
          const anticipation = p < .18 ? Math.sin(p / .18 * Math.PI) : 0;
          const flight = p < .18 ? 0 : Math.sin(Math.min(1, (p - .18) / .82) * Math.PI);
          const landing = p > .82 ? Math.sin((p - .82) / .18 * Math.PI) : 0;
          pose.y = anticipation * 8 - flight * 30 + landing * 7;
          pose.scaleX = 1 + anticipation * .04 - flight * .025 + landing * .055;
          pose.scaleY = 1 - anticipation * .055 - flight * .02 - landing * .065;
        } else {
          const strength = { cheer: .72, recovered: .82, mastered: 1 }[variant] ?? .72;
          pose.y = -gesture * 7 * strength;
          pose.rotation = Math.sin(p * Math.PI * 2) * .012 * strength;
          pose.scaleX = 1 + gesture * .012 * strength;
          pose.scaleY = 1 + gesture * .018 * strength;
        }
      } else if (state === "wrong") {
        const p = Math.min(1, elapsed / 1500);
        const reachRaw = p < .24 ? p / .24 : p > .80 ? (1 - p) / .20 : 1;
        const reach = Math.max(0, Math.min(1, reachRaw));
        const easedReach = reach * reach * (3 - 2 * reach);
        const scratchProgress = Math.max(0, Math.min(1, (p - .24) / .56));
        const scratchEnvelope = p >= .24 && p <= .80 ? Math.sin(scratchProgress * Math.PI) : 0;
        const scratch = Math.sin(scratchProgress * Math.PI * 6) * scratchEnvelope;
        pose.rotation = easedReach * -.035 + scratch * .004;
        pose.x = easedReach * -4;
        pose.y = easedReach * 4;
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
        const beat = Math.sin(t * 6.4);
        pose.x = beat * 7;
        pose.y = -Math.abs(beat) * 8;
        pose.rotation = beat * .055;
        pose.scaleX = 1 + Math.abs(beat) * .014;
        pose.scaleY = 1 + Math.abs(beat) * .022;
      } else if (state === "levelUp") {
        const pulse = Math.sin(Math.min(1, elapsed / 1500) * Math.PI);
        pose.x = pulse * 6;
        pose.y = -pulse * 8;
        pose.rotation = -pulse * .025;
        pose.scaleX = 1 + pulse * .03;
        pose.scaleY = 1 + pulse * .025;
      }
      return pose;
    }

    limbPose(state, elapsed, variant) {
      if (state === "completion" || state === "perfectTraining") return this.finalePose("limbPose", state, elapsed);
      ({ state, elapsed, variant } = this.motion(state, elapsed, variant));
      const t = elapsed / 1000;
      const idle = this.reducedMotion ? 0 : Math.sin(t * 1.55);
      const result = {
        head: idle * .015,
        headX: 0,
        headY: 0,
        headScaleX: 1,
        headScaleY: 1,
        leftShoulder: .04 + idle * .012,
        leftElbow: -1.22 + idle * .018,
        leftWrist: .10 - idle * .015,
        rightShoulder: -.04 - idle * .012,
        rightElbow: 1.22 - idle * .018,
        rightWrist: -.10 + idle * .015,
        leftHip: .02,
        rightHip: -.02,
        leftAnkle: -.03,
        rightAnkle: .03
      };
      if (this.reducedMotion) {
        if (state === "wrong") result.head = -.035;
        else if (state !== "idle" && !state.startsWith("idle")) {
          result.head = .02;
          result.rightShoulder = -.30;
          result.rightElbow = 1.05;
        }
        return result;
      }
      if (state.startsWith("idleLook") || state === "idleHeadMove") {
        const micro = Math.sin(Math.min(1, elapsed / (state === "idleHeadMove" ? 1200 : 1400)) * Math.PI);
        const direction = state === "idleLookLeft" ? -1 : 1;
        result.head = micro * .025 * direction;
        result.headX = state === "idleHeadMove" ? 0 : micro * 3 * direction;
        result.headY = state === "idleHeadMove" ? micro * 3 : 0;
      }
      if (state === "hey") {
        const wave = Math.sin(t * 8.2);
        result.head = -.035 + wave * .012;
        result.rightShoulder = -1.62 + wave * .045;
        result.rightElbow = -.52 + wave * .16;
        result.rightWrist = wave * .34;
        result.leftShoulder = .06;
        result.leftElbow = -1.20;
        result.leftWrist = .08;
      } else if (state === "correct") {
        const duration = { nod: 760, hop: 1050, cheer: 1200, recovered: 1050, mastered: 1300 }[variant] || 1050;
        const p = Math.min(1, elapsed / duration);
        const gesture = Math.sin(p * Math.PI);
        if (variant === "nod") {
          const down = Math.sin(p * Math.PI);
          result.head = Math.sin(p * Math.PI * 2) * .035;
          result.headY = down * 31;
          result.headScaleX = 1 + down * .025;
          result.headScaleY = 1 - down * .075;
        } else if (variant === "hop") {
          const anticipation = p < .18 ? Math.sin(p / .18 * Math.PI) : 0;
          const flight = p < .18 ? 0 : Math.sin(Math.min(1, (p - .18) / .82) * Math.PI);
          result.head = -flight * .018;
          result.leftShoulder = .04 + flight * .48 - anticipation * .12;
          result.rightShoulder = -.04 - flight * .48 + anticipation * .12;
          result.leftElbow = -1.22 + flight * .26;
          result.rightElbow = 1.22 - flight * .26;
          result.leftHip = .02 + flight * .13;
          result.rightHip = -.02 - flight * .13;
          result.leftAnkle = -.03 - flight * .28 + anticipation * .12;
          result.rightAnkle = .03 + flight * .28 - anticipation * .12;
        } else {
          const strength = { cheer: 1, recovered: .88, mastered: 1 }[variant] ?? 1;
          result.head = Math.sin(p * Math.PI * 2) * .018 * strength;
          if (variant === "recovered") {
            // A single relieved clap close to the chest.
            result.leftShoulder = .04 - gesture * .39;
            result.rightShoulder = -.04 + gesture * .39;
            result.leftElbow = -1.22 - gesture * .68;
            result.rightElbow = 1.22 + gesture * .68;
            result.leftWrist = .10 - gesture * .20;
            result.rightWrist = -.10 + gesture * .20;
          } else if (variant === "mastered") {
            // One confident paw rises beside the star clip; the other stays grounded.
            result.rightShoulder = -.04 - gesture * .82;
            result.rightElbow = 1.22 - gesture * 2.72;
            result.rightWrist = -.10 + gesture * .28;
            result.leftShoulder = .08;
            result.leftElbow = -1.28;
          } else {
            result.leftShoulder = .04 + gesture * 1.96 * strength;
            result.rightShoulder = -.04 - gesture * 1.96 * strength;
            result.leftElbow = -1.22 + gesture * .82 * strength;
            result.rightElbow = 1.22 - gesture * .82 * strength;
            result.leftWrist = .10 - gesture * .12;
            result.rightWrist = -.10 + gesture * .12;
          }
          result.leftHip = .02 + gesture * .05 * strength;
          result.rightHip = -.02 - gesture * .05 * strength;
        }
      } else if (state === "wrong") {
        const p = Math.min(1, elapsed / 1500);
        const reachRaw = p < .24 ? p / .24 : p > .80 ? (1 - p) / .20 : 1;
        const reach = Math.max(0, Math.min(1, reachRaw));
        const easedReach = reach * reach * (3 - 2 * reach);
        const scratchProgress = Math.max(0, Math.min(1, (p - .24) / .56));
        const scratchEnvelope = p >= .24 && p <= .80 ? Math.sin(scratchProgress * Math.PI) : 0;
        const scratch = Math.sin(scratchProgress * Math.PI * 6) * scratchEnvelope;
        result.head = -easedReach * .055 + scratch * .008;
        result.headY = easedReach * 3;
        result.leftShoulder = .08;
        result.leftElbow = -1.25;
        // Lift the elbow outward, then fold the forearm behind the ear.
        // The head is drawn last and naturally occludes the paw/forearm.
        result.rightShoulder = -.04 - easedReach * .55 - scratch * .055;
        result.rightElbow = 1.22 - easedReach * 3.32 + scratch * .19;
        result.rightWrist = -.10 + easedReach * .30 + scratch * .28;
      } else if (state === "flag") {
        const wave = Math.sin(t * 5.6);
        result.rightShoulder = -1.72 + wave * .10;
        result.rightElbow = -.42 + wave * .14;
        result.rightWrist = wave * .22;
        result.head = wave * .025;
      } else if (state === "horn") {
        const pulse = Math.sin(t * 5.4);
        result.leftShoulder = .18 + pulse * .08;
        result.rightShoulder = -.18 - pulse * .08;
        result.leftElbow = -1.12 + pulse * .10;
        result.rightElbow = 1.12 - pulse * .10;
        result.leftWrist = .08 - pulse * .05;
        result.rightWrist = -.08 + pulse * .05;
        result.head = pulse * .022;
      } else if (state === "dance" || state === "trainingFinished") {
        const beat = Math.sin(t * 6.4);
        const half = Math.sin(t * 3.2);
        const upLeft = .5 + .5 * half;
        const upRight = .5 - .5 * half;
        result.head = -beat * .035;
        result.leftShoulder = .04 + upLeft * .82;
        result.rightShoulder = -.04 - upRight * .82;
        result.leftElbow = -1.22 + upLeft * .52;
        result.rightElbow = 1.22 - upRight * .52;
        result.leftWrist = .10 - upLeft * .12;
        result.rightWrist = -.10 + upRight * .12;
        result.leftHip = .02 - beat * .10;
        result.rightHip = -.02 - beat * .10;
        result.leftAnkle = -.03 + beat * .14;
        result.rightAnkle = .03 + beat * .14;
      } else if (state === "levelUp") {
        const p = Math.sin(Math.min(1, elapsed / 1500) * Math.PI);
        result.rightShoulder = -.04 - p * 1.25;
        result.rightElbow = 1.22 - p * .28;
        result.leftShoulder = .04 + p * .30;
        result.head = -p * .035;
      }
      return result;
    }

    drawPart(context, name, x, y, scale, rotation, pivotX, pivotY, scaleX = 1, scaleY = 1) {
      const entry = this.loadImage(RIG_PARTS[name]);
      if (!entry.ready) return;
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(scale * scaleX, scale * scaleY);
      context.drawImage(entry.image, -pivotX, -pivotY);
      context.restore();
    }

    drawArmLayer(context, side, shoulderX, shoulderY, scale, shoulderRotation, elbowRotation, wristRotation, layer) {
      const joint = ARM_JOINTS[side];
      const upper = this.loadImage(RIG_PARTS[joint.upper]);
      const forearm = this.loadImage(RIG_PARTS[joint.forearm]);
      const paw = this.loadImage(RIG_PARTS[joint.paw]);
      if (!upper.ready || !forearm.ready || !paw.ready) return;
      context.save();
      context.translate(shoulderX, shoulderY);
      context.rotate(shoulderRotation);
      context.scale(scale, scale);
      if (layer === "upper") {
        context.drawImage(upper.image, -joint.shoulder[0], -joint.shoulder[1]);
      } else {
        context.translate(joint.elbow[0] - joint.shoulder[0], joint.elbow[1] - joint.shoulder[1]);
        context.rotate(elbowRotation);
        context.drawImage(forearm.image, -joint.forearmElbow[0], -joint.forearmElbow[1]);
        context.translate(joint.wrist[0] - joint.forearmElbow[0], joint.wrist[1] - joint.forearmElbow[1]);
        context.rotate(wristRotation);
        context.drawImage(paw.image, -joint.pawWrist[0], -joint.pawWrist[1]);
      }
      context.restore();
    }

    drawLegLayer(context, side, hipX, hipY, scale, hipRotation, ankleRotation, layer) {
      const joint = LEG_JOINTS[side];
      const leg = this.loadImage(RIG_PARTS[joint.leg]);
      const foot = this.loadImage(RIG_PARTS[joint.foot]);
      if (!leg.ready || !foot.ready) return;
      context.save();
      context.translate(hipX, hipY);
      context.rotate(hipRotation);
      context.scale(scale, scale);
      if (layer === "leg") {
        context.drawImage(leg.image, -joint.hip[0], -joint.hip[1]);
      } else {
        context.translate(joint.ankle[0] - joint.hip[0], joint.ankle[1] - joint.hip[1]);
        context.rotate(ankleRotation);
        context.drawImage(foot.image, -joint.footAnkle[0], -joint.footAnkle[1]);
      }
      context.restore();
    }

    blendValues(from, to, progress) {
      return Object.fromEntries(Object.keys(to).map((key) => [key, from[key] + (to[key] - from[key]) * progress]));
    }

    headAsset(state, variant) {
      if (state === "wrong") return "headWrong";
      if (state === "correct") return variant === "nod" ? "headNod" : variant === "hop" ? "headHop" : "headCheer";
      if (state === "errorRecovered") return "headRecovered";
      if (state === "errorMastered") return "headMastered";
      if (state === "flag") return "headFlag";
      if (state === "horn") return "headHorn";
      if (["dance", "trainingFinished"].includes(state)) return "headDance";
      if (state === "levelUp") return "headLevel";
      if (state === "completion") return "headComplete";
      if (state === "perfectTraining") return "headPerfect";
      return "head";
    }

    drawRigPose(record, pose, limbs, opacity = 1, options = {}) {
      if (opacity <= 0) return;
      const drawBody = options.drawBody !== false;
      const drawHead = options.drawHead !== false;
      const requestedHead = options.headAsset || "head";
      const headAsset = this.loadImage(RIG_PARTS[requestedHead]).ready ? requestedHead : "head";
      const context = record.context;
      const canvas = record.canvas;
      const unit = Math.min(canvas.width, canvas.height) / 700;
      context.save();
      context.globalAlpha = opacity;
      context.translate(canvas.width / 2 + pose.x * unit, canvas.height / 2 + pose.y * unit);
      context.rotate(pose.rotation);
      context.scale(unit * pose.scaleX, unit * pose.scaleY);
      context.translate(-350, -350);

      if (drawBody) {
        const flagArm = options.state === "flag" && this.loadImage(RIG_PARTS.armRightFlag).ready;
        const flagWave = Math.sin((options.elapsed || 0) / 1000 * 5.6);
        this.drawLegLayer(context, "left", 319, 470, .37, limbs.leftHip, limbs.leftAnkle, "leg");
        this.drawLegLayer(context, "right", 381, 470, .37, limbs.rightHip, limbs.rightAnkle, "leg");
        this.drawPart(context, "torso", 350, 389, .69, 0, 280.5, 229);
        this.drawArmLayer(context, "left", 275, 304, .365, limbs.leftShoulder, limbs.leftElbow, limbs.leftWrist, "upper");
        if (flagArm) this.drawPart(context, "armRightFlag", 440, 345, .58, flagWave * .035, 150, 570);
        else this.drawArmLayer(context, "right", 425, 304, .365, limbs.rightShoulder, limbs.rightElbow, limbs.rightWrist, "upper");
        this.drawLegLayer(context, "left", 319, 470, .37, limbs.leftHip, limbs.leftAnkle, "foot");
        this.drawLegLayer(context, "right", 381, 470, .37, limbs.rightHip, limbs.rightAnkle, "foot");
        this.drawArmLayer(context, "left", 275, 304, .365, limbs.leftShoulder, limbs.leftElbow, limbs.leftWrist, "lower");
        if (!flagArm) this.drawArmLayer(context, "right", 425, 304, .365, limbs.rightShoulder, limbs.rightElbow, limbs.rightWrist, "lower");
      }
      if (drawHead) this.drawPart(context, headAsset, 350 + limbs.headX, 190 + limbs.headY, .70, limbs.head, 244, 215, limbs.headScaleX, limbs.headScaleY);
      context.restore();
    }

    drawRig(record, state, elapsed, opacity = 1) {
      this.drawRigPose(record, this.pose(state, elapsed, record.variant), this.limbPose(state, elapsed, record.variant), opacity, { headAsset: this.headAsset(state, record.variant), state, elapsed });
    }

    drawEffects(record, state, elapsed, variant) {
      const context = record.context;
      const unit = Math.min(record.canvas.width, record.canvas.height) / 700;
      if (state === "wrong") {
        const p = Math.min(1, elapsed / 1500);
        const scratchProgress = Math.max(0, Math.min(1, (p - .24) / .56));
        const scratchEnvelope = p >= .24 && p <= .80 ? Math.sin(scratchProgress * Math.PI) : 0;
        const alpha = scratchEnvelope;
        if (alpha <= 0) return;
        context.save();
        context.globalAlpha = alpha * .8;
        context.translate(record.canvas.width / 2 + 104 * unit, record.canvas.height / 2 - 214 * unit);
        context.strokeStyle = "#8b5a2b";
        context.lineWidth = 5 * unit;
        context.lineCap = "round";
        for (let index = 0; index < 3; index += 1) {
          const phase = scratchProgress * Math.PI * 6 + index * .7;
          const x = (index * 9 + Math.sin(phase) * 3) * unit;
          context.beginPath();
          context.moveTo(x, -10 * unit);
          context.quadraticCurveTo(x + 5 * unit, 0, x, 10 * unit);
          context.stroke();
        }
        context.restore();
      } else if (state === "correct" && variant === "nod") {
        const p = Math.min(1, elapsed / 760);
        const alpha = Math.sin(p * Math.PI);
        if (alpha <= 0) return;
        context.save();
        context.globalAlpha = alpha;
        context.translate(record.canvas.width / 2 - 172 * unit, record.canvas.height / 2 - 202 * unit);
        context.scale(.82 + alpha * .18, .82 + alpha * .18);
        context.beginPath();
        context.moveTo(-24 * unit, -1 * unit);
        context.lineTo(-7 * unit, 17 * unit);
        context.lineTo(28 * unit, -24 * unit);
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#ffffff";
        context.lineWidth = 19 * unit;
        context.stroke();
        context.strokeStyle = "#16a34a";
        context.lineWidth = 10 * unit;
        context.stroke();
        context.restore();
      } else if (state === "correct" && variant === "cheer") {
        const p = Math.min(1, elapsed / 1200);
        const alpha = Math.sin(p * Math.PI);
        const points = [[-190, -165, .9], [185, -185, 1], [-220, -25, .62], [220, -42, .68]];
        context.save();
        context.translate(record.canvas.width / 2, record.canvas.height / 2);
        context.globalAlpha = alpha;
        context.fillStyle = "#f8c438";
        for (const [x, y, scale] of points) {
          const radius = 14 * unit * scale * (.8 + alpha * .35);
          context.save();
          context.translate(x * unit, y * unit);
          context.rotate(p * Math.PI + x);
          context.beginPath();
          for (let index = 0; index < 8; index += 1) {
            const angle = index * Math.PI / 4 - Math.PI / 2;
            const length = index % 2 ? radius * .36 : radius;
            const px = Math.cos(angle) * length;
            const py = Math.sin(angle) * length;
            if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
          }
          context.closePath();
          context.fill();
          context.restore();
        }
        context.restore();
      }
    }

    snapshot(record, now) {
      const target = {
        pose: this.pose(record.state, now - record.stateStartedAt, record.variant),
        limbs: this.limbPose(record.state, now - record.stateStartedAt, record.variant)
      };
      const transitionProgress = record.transitionFrom
        ? Math.min(1, (now - record.transitionStartedAt) / record.transitionDuration)
        : 1;
      if (record.transitionFrom && transitionProgress < 1) {
        const eased = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
        return {
          pose: this.blendValues(record.transitionFrom.pose, target.pose, eased),
          limbs: this.blendValues(record.transitionFrom.limbs, target.limbs, eased)
        };
      }
      record.transitionFrom = null;
      return target;
    }

    render(record, now) {
      const context = record.context;
      if (!context) return;
      context.clearRect(0, 0, record.canvas.width, record.canvas.height);
      const transitionProgress = record.transitionFrom
        ? Math.min(1, (now - record.transitionStartedAt) / record.transitionDuration)
        : 1;
      const eased = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
      const targetHead = this.headAsset(record.state, record.variant);
      const current = this.snapshot(record, now);
      this.drawRigPose(record, current.pose, current.limbs, 1, { drawHead: false, state: record.state, elapsed: now - record.stateStartedAt });
      if (record.previousHead !== targetHead && transitionProgress < 1) {
        this.drawRigPose(record, current.pose, current.limbs, 1 - eased, { drawBody: false, headAsset: record.previousHead });
        this.drawRigPose(record, current.pose, current.limbs, eased, { drawBody: false, headAsset: targetHead });
      } else {
        this.drawRigPose(record, current.pose, current.limbs, 1, { drawBody: false, headAsset: targetHead });
        record.previousHead = targetHead;
      }
      this.drawEffects(record, record.state, now - record.stateStartedAt, record.variant);
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
      if (!record) return;
      const now = performance.now();
      record.previousHead = this.headAsset(record.state, record.variant);
      record.transitionFrom = this.snapshot(record, now);
      record.state = state;
      record.variant = options.variant || "hop";
      record.stateStartedAt = now;
      record.transitionStartedAt = now;
      if (!record.frameRequest) this.render(record, now);
    }

    stop(surface = this.surface) {
      this.pause(surface);
    }

    pause(surface) {
      const record = this.instances.get(surface);
      if (!record) return;
      cancelAnimationFrame(record.frameRequest);
      record.frameRequest = 0;
    }

    renderBanner(state, options = {}) {
      const card = this.elements.bannerCard;
      if (card) card.dataset.kapiState = state;
      this.play(state, { ...options, surface: "banner" });
      if (this.elements.bannerBurst) {
        this.elements.bannerBurst.innerHTML = !this.reducedMotion && ["horn", "dance", "levelUp", "trainingFinished", "errorMastered", "completion", "perfectTraining"].includes(state)
          ? Array.from({ length: 9 }, (_, index) => `<i style="--burst-index:${index}"></i>`).join("")
          : "";
      }
    }

    clearBanner() {
      const card = this.elements.bannerCard;
      if (card) delete card.dataset.kapiState;
      this.pause("banner");
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
      this.lastIdleVariant = null;
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
      const nextPriority = options.priority ?? next.priority;
      const currentPriority = this.currentOptions.priority ?? current.priority;
      const replaceFeedback = nextPriority <= 20 && currentPriority <= 20;
      if (nextPriority > currentPriority || this.state.startsWith("idle") || replaceFeedback) {
        // Never replay stale feedback after a celebration.
        this.queue = [];
        this.enter(state, options, true);
        return true;
      }
      return false;
    }

    renderBanner(rawState, options = {}) {
      window.clearTimeout(this.bannerTimer);
      const state = this.normalize(rawState);
      this.animator.renderBanner?.(state, options);
      const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
      const duration = options.duration ?? config.duration;
      if (duration) this.bannerTimer = window.setTimeout(() => {
        this.animator.play(config.next === "trainingFinished" ? "trainingFinished" : "idle", { surface: "banner" });
      }, duration);
    }

    clearBanner() {
      window.clearTimeout(this.bannerTimer);
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
      const sound = options.sound ?? config.sound;
      if (sound && options.silent !== true) this.soundPlayer(sound, state);

      const duration = options.duration ?? config.duration;
      if (duration) {
        this.stateTimer = window.setTimeout(() => this.finishState(), duration);
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
        const { duration, sound, variant, ...continuation } = finishedOptions;
        this.enter(config.next, { ...continuation, silent: true }, true);
        return;
      }
      if (typeof finishedOptions.onComplete === "function") finishedOptions.onComplete(finishedState);
      this.enter("idle", { surface: this.surface }, true);
    }

    scheduleIdleMicroAnimation() {
      if (this.surface === "result" || this.animator.reducedMotion) return;
      const delay = 3200 + Math.round(this.random() * 4200);
      this.idleTimer = window.setTimeout(() => {
        if (this.state !== "idle") return;
        const variants = ["idleHeadMove", "idleLookLeft", "idleLookRight"].filter((name) => name !== this.lastIdleVariant);
        this.lastIdleVariant = variants[Math.min(variants.length - 1, Math.floor(this.random() * variants.length))];
        this.enter(this.lastIdleVariant, { surface: this.surface, silent: true }, true);
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
