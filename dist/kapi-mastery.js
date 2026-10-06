(() => {
  "use strict";

  const REVIEW_INTERVALS = Object.freeze([1, 3, 7, 14, 30]);
  const REVIEW_SLOTS = Object.freeze({ 10: [3, 7], 20: [3, 8, 14], 30: [4, 10, 17, 24] });
  const skills = window.KapiSkills;
  const DIVERSITY_WINDOW_MS = 24 * 60 * 60 * 1000;

  // Calendar addition preserves the local clock across daylight saving changes.
  function addCalendarDays(value, days) {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  function migrate(profile) {
    let changed = false;
    if (!profile.skillMastery || typeof profile.skillMastery !== "object" || Array.isArray(profile.skillMastery)) {
      profile.skillMastery = {};
      changed = true;
    }
    for (const [id, record] of Object.entries(profile.skillMastery)) {
      const canonical = skills.canonicalId(id);
      if (canonical === id) continue;
      const existing = profile.skillMastery[canonical];
      // A duplicate is the same skill, not another review. Preserve the more
      // cautious due date and interval; do not double-count review history.
      profile.skillMastery[canonical] = existing ? {
        ...record, ...existing,
        strength: Math.max(Number(record.strength) || 0, Number(existing.strength) || 0),
        successfulReviews: Math.max(Number(record.successfulReviews) || 0, Number(existing.successfulReviews) || 0),
        failedReviews: Math.max(Number(record.failedReviews) || 0, Number(existing.failedReviews) || 0),
        intervalDays: Math.min(Number(record.intervalDays) || 1, Number(existing.intervalDays) || 1),
        nextReviewAt: [record.nextReviewAt, existing.nextReviewAt].filter((value) => Number.isFinite(Date.parse(value))).sort()[0] || existing.nextReviewAt,
        lastPracticedAt: [record.lastPracticedAt, existing.lastPracticedAt].filter((value) => Number.isFinite(Date.parse(value))).sort().at(-1) || existing.lastPracticedAt,
        lastResult: Date.parse(record.lastPracticedAt) > Date.parse(existing.lastPracticedAt) ? record.lastResult : existing.lastResult
      } : record;
      delete profile.skillMastery[id];
      changed = true;
    }
    for (const item of Array.isArray(profile.errorQueue) ? profile.errorQueue : []) {
      if (!item?.fromSpacedReview) continue;
      const canonical = skills.canonicalId(item.reviewSkillId || `stage:${item.curriculumStage}`);
      if (skills.stageForSkill(canonical) && item.reviewSkillId !== canonical) {
        item.reviewSkillId = canonical;
        changed = true;
      }
    }
    return changed;
  }

  function skillIdForProblem(problem) {
    const stage = Number(problem?.curriculumStage);
    return Number.isInteger(stage) && stage >= 1 && stage <= 41 ? skills.skillForStage(stage)?.id || `stage:${stage}` : null;
  }

  function ensureSkill(profile, skillId) {
    migrate(profile);
    if (!skills.stageForSkill(skillId)) return null;
    return profile.skillMastery[skills.canonicalId(skillId)] || null;
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
      .sort(([idA, a], [idB, b]) => Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt) || skills.stageForSkill(idA) - skills.stageForSkill(idB))
      .map(([skillId, skill]) => ({ skillId, skill }));
  }

  function selectReviewSkills(profile, count, now = new Date(), eligible = () => true) {
    const remaining = getDueSkills(profile, now).filter(({ skillId }) => eligible(skillId));
    const selected = [];
    const chapters = new Set();
    while (remaining.length && selected.length < Math.max(0, count)) {
      const earliest = Date.parse(remaining[0].skill.nextReviewAt);
      const diverse = remaining.findIndex(({ skillId, skill }) =>
        Date.parse(skill.nextReviewAt) - earliest <= DIVERSITY_WINDOW_MS && !chapters.has(skills.chapterIdForSkill(skillId)));
      const [next] = remaining.splice(diverse < 0 ? 0 : diverse, 1);
      selected.push(next.skillId);
      chapters.add(skills.chapterIdForSkill(next.skillId));
    }
    return selected;
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
