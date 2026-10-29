(function () {
  'use strict';
  const variants = {
    'neck-scarf': [
      { id: 'berry', asset: 'scarf-berry', ru: 'Ягодный шарф', de: 'Beerentuch' },
      { id: 'sky', asset: 'scarf-sky', ru: 'Звёздный шарф', de: 'Sternentuch' }
    ],
    backpack: [
      { id: 'stars', asset: 'backpack-stars', ru: 'Звёздный рюкзак', de: 'Sternenrucksack' },
      { id: 'forest', asset: 'backpack-forest', ru: 'Походный рюкзак', de: 'Wanderrucksack' }
    ]
  };
  const copy = {
    ru: { title: 'К лесному озеру', places: ['Лесная поляна', 'Лесной мостик', 'Сосновый привал', 'Лесное озеро'],
      next: ['Первая остановка — мостик', 'Перейдём мостик и найдём привал', 'Озеро уже близко', 'Мы добрались до озера!'],
      start: ['В путь!', 'Продолжить путь', 'К озеру!', 'Потренироваться'],
      arrival: ['В путь!', 'Добрались до мостика!', 'Нашли уютный привал!', 'Мы у озера!'],
      choose: 'Выбери снаряжение', take: 'Берём с собой', later: 'Выберу позже', goal: 'Выбрать оформление', preview: 'Будущая вещь', selected: 'Выбрано', home: 'Продолжить путь', lake: 'К озеру', stop: 'К результатам' },
    de: { title: 'Zum Waldsee', places: ['Waldlichtung', 'Waldbrücke', 'Kiefernrast', 'Waldsee'],
      next: ['Erster Halt: die Brücke', 'Über die Brücke zum Rastplatz', 'Der See ist schon ganz nah', 'Wir sind am Waldsee!'],
      start: ['Los geht’s!', 'Weiterreisen', 'Zum See!', 'Trainieren'],
      arrival: ['Los geht’s!', 'An der Brücke angekommen!', 'Ein gemütlicher Rastplatz!', 'Wir sind am See!'],
      choose: 'Wähle deine Ausrüstung', take: 'Nehmen wir mit', later: 'Später auswählen', goal: 'Design auswählen', preview: 'Dein nächster Gegenstand', selected: 'Ausgewählt', home: 'Weiterreisen', lake: 'Zum See', stop: 'Zum Ergebnis' }
  };
  function normalize(profile) {
    const old = profile.journey;
    profile.journey = { step: Math.max(0, Math.min(3, Math.floor(Number(old?.step) || 0))), sessions: Array.isArray(old?.sessions) ? old.sessions.filter(x => typeof x === 'string').slice(-3) : [] };
    const choices = profile.cosmeticVariants;
    profile.cosmeticVariants = {};
    for (const [reward, options] of Object.entries(variants)) {
      profile.cosmeticVariants[reward] = options.some(x => x.id === choices?.[reward]) ? choices[reward] : options[0].id;
    }
    return profile;
  }
  function complete(profile, session) {
    normalize(profile);
    if (!session.completed || profile.journey.sessions.includes(session.id) || profile.journey.step >= 3) return false;
    profile.journey.step++;
    profile.journey.sessions.push(session.id);
    return true;
  }
  function variant(profile, id) { return variants[id]?.find(x => x.id === profile.cosmeticVariants?.[id]) || variants[id]?.[0]; }
  window.KapiJourney = { variants, copy, normalize, complete, variant };
})();

(function () {
  "use strict";

  const SLOTS = ["hat", "glasses", "neck", "back", "badge"];
  const KAPI_REWARDS = Object.freeze([
    { id: "badge-star", xp: 20, slot: "badge", asset: "star-badge", de: "Stern-Abzeichen", ru: "Значок-звезда" },
    { id: "hat-red", xp: 50, slot: "hat", asset: "red-cap", de: "Rote Kappe", ru: "Красная кепка" },
    { id: "glasses", xp: 90, slot: "glasses", asset: "glasses", de: "Brille", ru: "Очки" },
    { id: "neck-scarf", xp: 140, slot: "neck", asset: "scarf-berry", de: "Neues Halstuch", ru: "Новый шарф" },
    { id: "backpack", xp: 200, slot: "back", asset: "backpack-stars", de: "Neuer Rucksack", ru: "Новый рюкзак" },
    { id: "hat-blue", xp: 280, slot: "hat", asset: "blue-cap", de: "Blaue Kappe", ru: "Синяя кепка" },
    { id: "medal", xp: 380, slot: "badge", asset: "medal", de: "Medaille", ru: "Медаль" },
    { id: "hat-pompom", xp: 440, slot: "hat", asset: "pompom-hat", de: "Bommelmütze", ru: "Шапочка с помпоном" },
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
      // This newly added reward is also available to existing high-XP profiles.
      const addedHat = (Number(profile.totalXp) || 0) >= 440 && !profile.unlockedRewards.includes("hat-pompom");
      if (addedHat) profile.unlockedRewards.push("hat-pompom");
      const old = profile.equippedOutfit && typeof profile.equippedOutfit === "object" ? profile.equippedOutfit : {};
      profile.equippedOutfit = this.emptyOutfit();
      for (const slot of SLOTS) {
        const reward = KAPI_REWARDS.find((item) => item.id === old[slot]);
        if (reward?.slot === slot && profile.unlockedRewards.includes(reward.id)) profile.equippedOutfit[slot] = reward.id;
      }
      return needsSave || addedHat;
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
