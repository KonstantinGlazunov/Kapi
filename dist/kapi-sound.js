(function () {
  "use strict";

  const PATTERNS = {
    start: [[440, 0, .09], [660, .1, .12]],
    correct: [[660, 0, .10], [880, .07, .12]],
    wrong: [[240, 0, .13]],
    recovered: [[587, 0, .12], [784, .14, .17]],
    mastered: [[523, 0, .10], [659, .12, .10], [784, .24, .22]],
    flag: [[523, 0, .08], [659, .09, .08], [784, .18, .20]],
    party: [[392, 0, .12], [523, .12, .12], [659, .24, .12], [784, .36, .22]],
    dance: [[659, 0, .08], [784, .1, .08], [880, .2, .08], [784, .3, .08], [988, .4, .18]],
    levelUp: [[392, 0, .12], [523, .14, .12], [659, .28, .12], [784, .44, .28], [523, .44, .28]],
    complete10: [[523, 0, .12], [659, .14, .12], [784, .3, .25]],
    complete20: [[440, 0, .12], [554, .15, .12], [660, .30, .12], [880, .48, .28]],
    complete30: [[392, 0, .12], [523, .14, .12], [659, .28, .12], [784, .44, .12], [1047, .6, .3]],
    perfect: [[523, 0, .10], [784, .13, .10], [1047, .27, .14], [659, .46, .32], [784, .46, .32], [1047, .46, .32]],
    tap: [[360, 0, .035]],
    highFive: [[290, 0, .045], [420, .025, .045]]
  };
  const PRIORITY = { start: 1, correct: 10, wrong: 20, recovered: 30, mastered: 35, flag: 40, party: 50, dance: 60, levelUp: 80, complete10: 90, complete20: 90, complete30: 90, perfect: 95 };
  const ALIASES = { streak: "flag", handshake: "levelUp", complete: "complete20" };

  class KapiSoundManager {
    constructor(options = {}) {
      this.isEnabled = options.isEnabled || (() => true);
      this.random = options.random || Math.random;
      this.contextFactory = options.contextFactory || (() => new (window.AudioContext || window.webkitAudioContext)());
      this.context = null;
      this.unlocked = false;
      this.channels = new Map(["feedback", "achievement", "voice", "foley"].map((name) => [name, new Set()]));
      this.lastCorrect = -1;
    }

    unlock() {
      this.unlocked = true;
      if (!this.isEnabled()) return;
      try {
        this.context ||= this.contextFactory();
        if (this.context.state === "suspended") this.context.resume()?.catch(() => {});
      } catch { /* Audio is optional; learning must always continue. */ }
    }

    setEnabled(enabled) {
      if (!enabled) this.stopAll();
      else this.unlock();
    }

    stopChannel(channel) {
      const active = this.channels.get(channel);
      active?.forEach((entry) => {
        entry.nodes.forEach(({ oscillator, gain }) => {
          try { oscillator.stop(); } catch { /* Already stopped. */ }
          oscillator.disconnect();
          gain.disconnect();
        });
      });
      active?.clear();
      if (channel === "voice") window.speechSynthesis?.cancel();
    }

    stopAll() { this.channels.forEach((_, channel) => this.stopChannel(channel)); }

    play(rawType, options = {}) {
      const type = ALIASES[rawType] || rawType;
      if (!this.isEnabled() || !this.unlocked || !PATTERNS[type]) return false;
      this.unlock();
      if (!this.context) return false;
      const channel = options.channel || (type === "highFive" ? "foley" : ["correct", "wrong", "tap", "start"].includes(type) ? "feedback" : "achievement");
      if (!this.channels.has(channel)) return false;
      const now = this.context.currentTime;
      const achievements = [...this.channels.get("achievement")].filter((entry) => entry.until > now);
      const priority = PRIORITY[type] || 0;
      if (channel === "feedback" && achievements.length) return false;
      if (channel === "foley" && achievements.length && options.allowWithAchievement !== true) return false;
      if (channel === "achievement") {
        if (achievements.some((entry) => entry.priority > priority)) return false;
        this.stopChannel("feedback");
        this.stopChannel("voice");
        this.stopChannel("foley");
      }
      this.stopChannel(channel);
      let transpose = 1;
      if (type === "correct") {
        const variants = [0, 1, 2].filter((value) => value !== this.lastCorrect);
        this.lastCorrect = variants[Math.min(variants.length - 1, Math.floor(this.random() * variants.length))];
        transpose = [1, .94, 1.06][this.lastCorrect];
      }
      const entry = { priority, until: now, nodes: [] };
      this.channels.get(channel).add(entry);
      try {
        const volume = channel === "achievement" ? .065 : type === "wrong" ? .035 : .05;
        for (const [frequency, delay, duration] of PATTERNS[type]) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency * transpose;
          gain.gain.setValueAtTime(.0001, now + delay);
          gain.gain.exponentialRampToValueAtTime(volume, now + delay + .012);
          gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration);
          oscillator.connect(gain).connect(this.context.destination);
          const node = { oscillator, gain };
          entry.nodes.push(node);
          oscillator.onended = () => {
            oscillator.disconnect(); gain.disconnect();
            entry.nodes = entry.nodes.filter((item) => item !== node);
            if (!entry.nodes.length) this.channels.get(channel).delete(entry);
          };
          oscillator.start(now + delay);
          oscillator.stop(now + delay + duration + .02);
          entry.until = Math.max(entry.until, now + delay + duration + .02);
        }
        return true;
      } catch {
        this.stopChannel(channel);
        return false;
      }
    }

    speak(text, language) {
      if (!this.unlocked || !this.isEnabled() || !window.speechSynthesis) return false;
      if ([...this.channels.get("achievement")].some((entry) => entry.until > (this.context?.currentTime || 0))) return false;
      this.stopChannel("voice");
      try {
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 1.12; utterance.pitch = 1.25; utterance.volume = .55;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch { return false; }
    }
  }

  window.KapiSoundManager = KapiSoundManager;
})();
