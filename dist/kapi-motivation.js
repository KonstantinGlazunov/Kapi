(function () {
  "use strict";

  // Events describe game facts. Only app.js owns answers, streaks and progress.
  const EVENTS = Object.freeze({
    correct: { priority: 10, scene: "correct", sound: "correct" },
    wrong: { priority: 20, scene: "wrong", sound: "wrong" },
    errorRecovered: { priority: 30, scene: "errorRecovered", sound: "recovered", banner: true },
    errorMastered: { priority: 35, scene: "errorMastered", sound: "mastered", banner: true },
    streak3: { priority: 40, scene: "flag", sound: "flag", banner: true },
    streak6: { priority: 50, scene: "horn", sound: "party", banner: true },
    streak10: { priority: 60, scene: "dance", sound: "dance", banner: true },
    levelUp: { priority: 80, scene: "levelUp", sound: "levelUp", banner: true },
    trainingComplete: { priority: 90, scene: "completion", sound: "complete20", banner: true },
    perfectTraining: { priority: 95, scene: "perfectTraining", sound: "perfect", banner: true }
  });

  class KapiMotivationController {
    constructor(machine, options = {}) {
      this.machine = machine;
      this.random = options.random || Math.random;
      this.onReaction = options.onReaction || (() => {});
      this.onOutfitChange = options.onOutfitChange || (() => {});
      this.resetSession();
    }

    resetSession() {
      this.seenBatches = new Set();
      this.awarded = new Set();
      this.lastVariant = null;
      this.outfit = {};
      this.onOutfitChange(this.getOutfit());
    }

    getOutfit() { return { ...this.outfit }; }

    normalize(event) {
      const value = typeof event === "string" ? { type: event } : event;
      if (!value) return null;
      const type = value.type === "streakMilestone" ? `streak${value.count}` : value.type;
      return EVENTS[type] ? { ...value, type } : null;
    }

    award(event) {
      // Rewards survive errors and animation changes, but not a new session.
      const awards = { streak6: { hat: "party" }, streak10: { medal: "star" }, perfectTraining: { special: "perfect" } };
      if (!awards[event.type] || this.awarded.has(event.type)) return;
      this.awarded.add(event.type);
      Object.assign(this.outfit, awards[event.type]);
      this.onOutfitChange(this.getOutfit());
    }

    handle(events, context = {}) {
      if (context.batchId != null) {
        if (this.seenBatches.has(context.batchId)) return null;
        this.seenBatches.add(context.batchId);
        if (this.seenBatches.size > 128) this.seenBatches.delete(this.seenBatches.values().next().value);
      }
      const candidates = events.map((event) => this.normalize(event)).filter(Boolean);
      // Apply every earned reward even if a more important scene wins.
      candidates.forEach((event) => this.award(event));
      const event = candidates.sort((a, b) => EVENTS[b.type].priority - EVENTS[a.type].priority)[0];
      if (!event) return null;
      const reaction = { ...EVENTS[event.type], ...event, surface: context.surface || "game" };
      if (event.type === "correct") {
        const requested = ["nod", "hop", "cheer"].includes(event.variant) ? event.variant : null;
        const variants = ["nod", "hop", "cheer"].filter((variant) => variant !== this.lastVariant);
        reaction.variant = requested || variants[Math.min(variants.length - 1, Math.floor(this.random() * variants.length))];
        reaction.duration = { nod: 760, hop: 1050, cheer: 1200 }[reaction.variant];
      }
      if (event.type === "trainingComplete") {
        reaction.total = [10, 20, 30].includes(event.total) ? event.total : 20;
        reaction.duration = { 10: 1400, 20: 1900, 30: 2300 }[reaction.total];
        reaction.sound = `complete${reaction.total}`;
      }
      const accepted = this.machine.trigger(reaction.scene, {
        surface: reaction.surface, priority: reaction.priority, variant: reaction.variant,
        duration: reaction.duration, sound: reaction.sound
      });
      if (!accepted) return null;
      if (reaction.variant) this.lastVariant = reaction.variant;
      this.onReaction(reaction, context);
      return reaction;
    }
  }

  window.KapiMotivationController = KapiMotivationController;
  window.KAPI_MOTIVATION_EVENTS = EVENTS;
})();
