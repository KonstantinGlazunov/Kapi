(() => {
  "use strict";

  const REVIEW_INTERVALS = Object.freeze([1, 3, 7, 14, 30]);
  const REVIEW_SLOTS = Object.freeze({ 10: [3, 7], 20: [3, 8, 14], 30: [4, 10, 17, 24] });

  // Calendar addition preserves the local clock across daylight saving changes.
  function addCalendarDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  function migrate(profile) {
    if (profile.skillMastery && typeof profile.skillMastery === "object" && !Array.isArray(profile.skillMastery)) return false;
    profile.skillMastery = {};
    return true;
  }

  function skillIdForProblem(problem) {
    const stage = Number(problem?.curriculumStage);
    return Number.isInteger(stage) && stage >= 1 && stage <= 41 ? `stage:${stage}` : null;
  }

  function ensureSkill(profile, skillId) {
    migrate(profile);
    if (!/^stage:(?:[1-9]|[1-3]\d|4[01])$/.test(skillId)) return null;
    return profile.skillMastery[skillId] || null;
  }

  function markStageMastered(profile, stage, now = new Date()) {
    const skillId = skillIdForProblem({ curriculumStage: stage });
    if (!skillId) return null;
    migrate(profile);
    if (profile.skillMastery[skillId]) return null;
    const timestamp = new Date(now).toISOString();
    const skill = {
      strength: 1, successfulReviews: 0, failedReviews: 0,
      lastPracticedAt: timestamp, nextReviewAt: addCalendarDays(now, 1),
      intervalDays: 1, lastResult: "mastered"
    };
    profile.skillMastery[skillId] = skill;
    return skill;
  }

  function getDueSkills(profile, now = new Date()) {
    migrate(profile);
    const current = new Date(now).getTime();
    return Object.entries(profile.skillMastery)
      .filter(([id, skill]) => ensureSkill(profile, id) && skill && Number.isFinite(Date.parse(skill.nextReviewAt)) && Date.parse(skill.nextReviewAt) <= current)
      .sort(([idA, a], [idB, b]) => Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt) || idA.localeCompare(idB))
      .map(([skillId, skill]) => ({ skillId, skill }));
  }

  function selectReviewSkills(profile, count, now = new Date(), eligible = () => true) {
    return getDueSkills(profile, now).filter(({ skillId }) => eligible(skillId)).slice(0, Math.max(0, count)).map(({ skillId }) => skillId);
  }

  function recordReviewResult(profile, skillId, firstTry, now = new Date()) {
    const skill = ensureSkill(profile, skillId);
    if (!skill) return null;
    const oldInterval = REVIEW_INTERVALS.includes(skill.intervalDays) ? skill.intervalDays : 1;
    const index = REVIEW_INTERVALS.indexOf(oldInterval);
    skill.intervalDays = firstTry ? REVIEW_INTERVALS[Math.min(index + 1, REVIEW_INTERVALS.length - 1)] : REVIEW_INTERVALS[Math.max(0, index - 1)];
    if (firstTry) skill.successfulReviews += 1;
    else skill.failedReviews += 1;
    skill.strength = Math.min(5, Math.max(0, (Number(skill.strength) || 0) + (firstTry ? 1 : -1)));
    skill.lastResult = firstTry ? "firstTry" : "needsPractice";
    skill.lastPracticedAt = new Date(now).toISOString();
    skill.nextReviewAt = addCalendarDays(now, firstTry ? skill.intervalDays : 1);
    return { intervalDays: skill.intervalDays, milestone: firstTry && (skill.intervalDays === 7 || skill.intervalDays === 30) };
  }

  function getMasteryStatus(skill) {
    if (!skill) return "inPractice";
    return skill.intervalDays >= 30 && skill.lastResult === "firstTry" ? "stable"
      : skill.strength >= 2 && skill.lastResult !== "needsPractice" ? "secure" : "inPractice";
  }

  window.KapiMasterySystem = Object.freeze({ REVIEW_INTERVALS, REVIEW_SLOTS, addCalendarDays, migrate,
    skillIdForProblem, ensureSkill, markStageMastered, getDueSkills, getDueReviews: getDueSkills,
    selectReviewSkills, recordReviewResult, getMasteryStatus });
})();
