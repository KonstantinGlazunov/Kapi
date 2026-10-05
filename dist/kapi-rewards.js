(function () {
  "use strict";

  const SLOTS = ["hat", "glasses", "neck", "back", "badge"];
  const KAPI_REWARDS = Object.freeze([
    { id: "badge-star", xp: 20, slot: "badge", asset: "star-badge", de: "Stern-Abzeichen", ru: "Значок-звезда" },
    { id: "hat-red", xp: 50, slot: "hat", asset: "red-cap", de: "Rote Kappe", ru: "Красная кепка" },
    { id: "glasses", xp: 90, slot: "glasses", asset: "glasses", de: "Brille", ru: "Очки" },
    { id: "neck-scarf", xp: 140, slot: "neck", asset: "scarf", de: "Halstuch", ru: "Шарф" },
    { id: "backpack", xp: 200, slot: "back", asset: "backpack", de: "Rucksack", ru: "Рюкзак" },
    { id: "hat-blue", xp: 280, slot: "hat", asset: "blue-cap", de: "Blaue Kappe", ru: "Синяя кепка" },
    { id: "medal", xp: 380, slot: "badge", asset: "medal", de: "Medaille", ru: "Медаль" },
    { id: "crown", xp: 500, slot: "hat", asset: "crown", de: "Krone", ru: "Корона" }
  ]);

  class KapiRewardSystem {
    getRewards() { return KAPI_REWARDS; }
    emptyOutfit() { return Object.fromEntries(SLOTS.map((slot) => [slot, null])); }

    migrate(profile) {
      const legacy = !Array.isArray(profile.unlockedRewards);
      const needsSave = legacy || !profile.equippedOutfit || typeof profile.equippedOutfit !== "object";
      const earned = legacy ? KAPI_REWARDS.filter((reward) => reward.xp <= (Number(profile.totalXp) || 0)).map((reward) => reward.id) : profile.unlockedRewards;
      profile.unlockedRewards = [...new Set(earned.filter((id) => KAPI_REWARDS.some((reward) => reward.id === id)))];
      const old = profile.equippedOutfit && typeof profile.equippedOutfit === "object" ? profile.equippedOutfit : {};
      profile.equippedOutfit = this.emptyOutfit();
      for (const slot of SLOTS) {
        const reward = KAPI_REWARDS.find((item) => item.id === old[slot]);
        if (reward?.slot === slot && profile.unlockedRewards.includes(reward.id)) profile.equippedOutfit[slot] = reward.id;
      }
      return needsSave;
    }

    getNextReward(totalXp) {
      const currentXp = Math.max(0, Number(totalXp) || 0);
      const reward = KAPI_REWARDS.find((item) => currentXp < item.xp);
      if (!reward) return { reward: null, currentXp, targetXp: null, remainingXp: 0, progress: 1, allUnlocked: true };
      return { reward, currentXp, targetXp: reward.xp, remainingXp: reward.xp - currentXp,
        progress: Math.min(1, currentXp / reward.xp), allUnlocked: false };
    }

    unlock(profile, oldXp, newXp) {
      const unlocked = new Set(profile.unlockedRewards);
      const events = [];
      for (const reward of KAPI_REWARDS) {
        if (oldXp < reward.xp && newXp >= reward.xp && !unlocked.has(reward.id)) {
          profile.unlockedRewards.push(reward.id);
          unlocked.add(reward.id);
          events.push({ type: "rewardUnlocked", rewardId: reward.id });
        }
      }
      return events;
    }

    equip(profile, rewardId) {
      const reward = KAPI_REWARDS.find((item) => item.id === rewardId);
      if (!reward || !profile.unlockedRewards.includes(rewardId)) return false;
      profile.equippedOutfit[reward.slot] = rewardId;
      return true;
    }
    unequip(profile, slot) {
      if (!SLOTS.includes(slot)) return false;
      profile.equippedOutfit[slot] = null;
      return true;
    }

    getEffectiveOutfit(profile, sessionOutfit = {}, scene = "idle") {
      const outfit = { ...this.emptyOutfit(), ...profile.equippedOutfit };
      if (scene === "horn" && sessionOutfit.hat === "party") outfit.hat = "party";
      if (scene === "dance" && sessionOutfit.medal === "star") outfit.badge = "session-star";
      return outfit;
    }
  }

  window.KapiRewardSystem = KapiRewardSystem;
  window.KAPI_REWARDS = KAPI_REWARDS;
})();
