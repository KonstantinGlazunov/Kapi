(() => {
  "use strict";
  const catalog = window.KapiSkills;
  const WINDOW = 10;
  const WEAK_SHARE = .65;
  const CORE_DIVISORS = [1, 2, 10, 5];
  const DERIVED_DIVISORS = [4, 3, 9, 6, 8, 7];
  const TABLE_PHASES = [0, 1, 2, 10, 5, null, 4, 3, 9, 6, 8, 7];

  function migrate(profile) {
    if (!profile.subskillMastery || typeof profile.subskillMastery !== "object" || Array.isArray(profile.subskillMastery)) {
      profile.subskillMastery = {};
      return true;
    }
    let changed = false;
    for (const [id, entry] of Object.entries(profile.subskillMastery)) {
      if (!catalog.getSubskill(id) || !entry || typeof entry !== "object") {
        delete profile.subskillMastery[id]; changed = true; continue;
      }
      const recent = Array.isArray(entry.recentResults) ? entry.recentResults.filter((x) => x === 0 || x === 1).slice(-WINDOW) : [];
      if (!Array.isArray(entry.recentResults) || recent.length !== entry.recentResults.length) {
        entry.recentResults = recent; changed = true;
      }
    }
    return changed;
  }

  function status(entry) {
    if (!entry || !entry.attempts) return "new";
    const recent = entry.recentResults || [];
    return recent.length >= 5 && recent.slice(-5).reduce((sum, result) => sum + result, 0) >= 4
      && recent.at(-1) === 1 ? "secure" : "practice";
  }

  function recordEvidence(profile, problem, { firstAttempt, correct, source = "curriculum", now = new Date() }) {
    const { subskillId } = catalog.classifyProblem(problem);
    if (!subskillId) return null;
    migrate(profile);
    const entry = profile.subskillMastery[subskillId] ||= {
      attempts: 0, firstTryCorrect: 0, recentResults: [], practiceRetries: 0,
      lastPracticedAt: null, strength: 0, lastSource: null
    };
    if (firstAttempt) {
      entry.attempts = Math.min(1000000, entry.attempts + 1);
      if (correct) entry.firstTryCorrect = Math.min(1000000, entry.firstTryCorrect + 1);
      entry.recentResults.push(correct ? 1 : 0);
      entry.recentResults = entry.recentResults.slice(-WINDOW);
      entry.strength = Math.max(0, Math.min(5, entry.strength + (correct ? 1 : -1)));
    } else if (correct) entry.practiceRetries = Math.min(1000000, entry.practiceRetries + 1);
    entry.lastPracticedAt = new Date(now).toISOString();
    entry.lastSource = source;
    return entry;
  }

  function availableSubskills(skillId, profile) {
    const skill = catalog.getSkill(skillId);
    if (!skill) return [];
    if (skill.stage === 22 && !profile.divisionCoreSequence?.mixed) {
      const phase = Math.max(0, Math.min(3, profile.divisionCoreSequence?.phase || 0));
      return CORE_DIVISORS.slice(0, phase + (profile.divisionCoreSequence?.item >= 5 ? 1 : 0)).map((factor) => `divide:table:${factor}`);
    }
    if (skill.stage === 23 && !profile.multiplicationSequence?.mixed) {
      const phase = Math.max(0, Math.min(TABLE_PHASES.length - 1, profile.multiplicationSequence?.phase || 0));
      return [...new Set(TABLE_PHASES.slice(0, phase + (profile.multiplicationSequence?.item >= 5 ? 1 : 0))
        .map((factor) => `multiply:table:${factor ?? 1}`))];
    }
    if (skill.stage === 24 && !profile.divisionDerivedSequence?.mixed) {
      const phase = Math.max(0, Math.min(5, profile.divisionDerivedSequence?.phase || 0));
      return DERIVED_DIVISORS.slice(0, phase + (profile.divisionDerivedSequence?.item >= 5 ? 1 : 0)).map((factor) => `divide:table:${factor}`);
    }
    return [...skill.subskills];
  }

  function selectSubskill(profile, skillId, random = Math.random) {
    const eligible = availableSubskills(skillId, profile);
    if (!eligible.length) return null;
    const practiced = eligible.filter((id) => status(profile.subskillMastery?.[id]) === "practice");
    const newParts = eligible.filter((id) => status(profile.subskillMastery?.[id]) === "new");
    const secure = eligible.filter((id) => status(profile.subskillMastery?.[id]) === "secure");
    const focus = practiced.length ? practiced : newParts;
    const variety = [...newParts.filter((id) => !focus.includes(id)), ...secure];
    const group = focus.length && variety.length ? (random() < WEAK_SHARE ? focus : variety) : eligible;
    return group[Math.min(group.length - 1, Math.floor(random() * group.length))];
  }

  function makeProblemForSubskill(skillId, subskillId, generateStage, index, profile, recentKeys = []) {
    const skill = catalog.getSkill(skillId);
    const part = catalog.getSubskill(subskillId);
    if (!skill || !part || !availableSubskills(skillId, profile).includes(subskillId)) return null;
    const factor = part.factor;
    for (let tries = 0; tries < 120; tries++) {
      const view = { ...profile };
      if (skill.stage === 22) {
        const phase = CORE_DIVISORS.indexOf(factor);
        const maximum = !profile.divisionCoreSequence?.mixed && profile.currentStage === 22 && phase === profile.divisionCoreSequence.phase
          ? profile.divisionCoreSequence.item : 10;
        view.divisionCoreSequence = { phase, item: Math.floor(Math.random() * (maximum + 1)), mixed: false };
      }
      if (skill.stage === 23) {
        const phase = factor === 0 ? 0 : TABLE_PHASES.indexOf(factor);
        const maximum = !profile.multiplicationSequence?.mixed && profile.currentStage === 23 && phase === profile.multiplicationSequence.phase
          ? profile.multiplicationSequence.item : 10;
        view.multiplicationSequence = { phase, item: 1 + Math.floor(Math.random() * maximum), mixed: false };
      }
      if (skill.stage === 24 && part.operation === "divide" && DERIVED_DIVISORS.includes(factor)) {
        const phase = DERIVED_DIVISORS.indexOf(factor);
        const maximum = !profile.divisionDerivedSequence?.mixed && profile.currentStage === 24 && phase === profile.divisionDerivedSequence.phase
          ? profile.divisionDerivedSequence.item : 10;
        view.divisionDerivedSequence = { phase, item: Math.floor(Math.random() * (maximum + 1)), mixed: false };
      }
      const problem = catalog.makeProblemForSkill(skillId, generateStage, index, view);
      if (catalog.classifyProblem(problem).subskillId === subskillId && !recentKeys.includes(problem.key)) return problem;
    }
    return null;
  }

  window.KapiSubskills = Object.freeze({ WINDOW, WEAK_SHARE, migrate, status, recordEvidence,
    availableSubskills, selectSubskill, makeProblemForSubskill });
})();
