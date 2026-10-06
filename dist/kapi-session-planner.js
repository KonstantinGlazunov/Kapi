(() => {
  "use strict";

  const LIMITS = Object.freeze({ 10: { error: 3, spaced: 2 }, 20: { error: 5, spaced: 3 }, 30: { error: 7, spaced: 4 } });

  function distribute(total, reviews) {
    if (!reviews) return [];
    const positions = [];
    const candidates = Array.from({ length: Math.max(0, Math.floor((total - 3) / 2) + 1) }, (_, i) => 2 + i * 2);
    for (let i = 0; i < reviews; i++) {
      const ideal = Math.round((i + 1) * (total - 1) / (reviews + 1));
      const available = candidates.filter((position) => !positions.includes(position));
      const choice = available.sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal) || a - b)[0];
      if (choice != null) positions.push(choice);
    }
    return positions.sort((a, b) => a - b);
  }

  function planSession({ profile, settings = {}, total, currentStage, now = new Date(), mode = "normal", targeted = null,
    eligibleError = () => true, eligibleSkill = () => true } = {}) {
    if (!Number.isInteger(total) || total < 1) throw new RangeError("Session length must be positive");
    if (mode === "targeted") {
      if (!targeted?.skillId || !targeted?.subskillId) throw new Error("Targeted session needs a skill and subskill");
      const slots = Array.from({ length: total }, () => Object.freeze({ type: "targeted", skillId: targeted.skillId, subskillId: targeted.subskillId }));
      return Object.freeze({ mode, slots: Object.freeze(slots), counts: Object.freeze({ current: 0, errorReview: 0, spacedReview: 0, targeted: total }) });
    }
    const limits = LIMITS[total] || { error: Math.floor(total * .25), spaced: Math.floor(total * .15) };
    const reviewBudget = Math.min(Math.floor(total * .35), Math.floor((total - 1) / 2));
    const errors = (profile?.errorQueue || []).filter(eligibleError)
      .sort((a, b) => (a.lastShown || 0) - (b.lastShown || 0) || String(a.key).localeCompare(String(b.key)))
      .slice(0, Math.min(limits.error, reviewBudget));
    const spaced = window.KapiMasterySystem.selectReviewSkills(profile, Math.min(limits.spaced, reviewBudget - errors.length), now, eligibleSkill);
    const reviews = [...errors.map(({ key }) => ({ type: "errorReview", key })),
      ...spaced.map((skillId) => ({ type: "spacedReview", skillId }))];
    const slots = Array.from({ length: total }, () => Object.freeze({ type: "current" }));
    distribute(total, reviews.length).forEach((position, i) => { slots[position] = Object.freeze(reviews[i]); });
    return Object.freeze({ mode, slots: Object.freeze(slots), counts: Object.freeze({
      current: total - reviews.length, errorReview: errors.length, spacedReview: spaced.length, targeted: 0
    }) });
  }

  window.KapiSessionPlanner = Object.freeze({ LIMITS, distribute, planSession });
})();
