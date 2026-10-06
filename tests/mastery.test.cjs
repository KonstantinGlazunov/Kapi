const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');

const at = text => new Date(text);
function setup() {
  const env = environment({ app: true });
  return { env, app: env.sandbox.__app, mastery: env.sandbox.KapiMasterySystem };
}
function due(app, mastery, stage = 5) {
  const profile = app.getProfile();
  profile.currentStage = stage + 1;
  mastery.markStageMastered(profile, stage, at('2020-01-01T12:00:00Z'));
  app.saveProfile(profile);
  return profile;
}

test('stage skill is independent of the example; legacy data survives migration', () => {
  const { app, mastery, env } = setup();
  assert.equal(mastery.skillIdForProblem({ curriculumStage: 12, a: 8, b: 5 }), 'add:cross-ten');
  assert.equal(mastery.skillIdForProblem({ curriculumStage: 12, a: 9, b: 4 }), 'add:cross-ten');
  const legacy = { totalXp: 163, currentStage: 12, dayStreak: 4, errorQueue: [{ key: 'x' }],
    weeklySessions: { count: 2 }, equippedOutfit: { hat: 'hat-red' }, personalFastTime: 5.2 };
  const before = JSON.parse(JSON.stringify(legacy));
  assert.equal(mastery.migrate(legacy), true);
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.skillMastery)), {});
  for (const [key, value] of Object.entries(before)) assert.deepEqual(legacy[key], value);
  const stored = app.getProfile();
  delete stored.skillMastery;
  env.storage.set('capy-count-profile-v1', JSON.stringify(stored));
  app.getProfile();
  assert.ok(Object.hasOwn(JSON.parse(env.storage.get('capy-count-profile-v1')), 'skillMastery'));
});

test('existing 9/10 promotion creates initial mastery with a next-day review', () => {
  const { app } = setup();
  const profile = app.getProfile();
  profile.currentStage = 5;
  profile.curriculumStats['5'] = Array(9).fill(1);
  app.saveProfile(profile);
  app.state.stage = 5;
  app.updateAdaptiveProgress(app.makeCurriculumProblem(5, 0, profile), true, true, 5);
  const updated = app.getProfile();
  assert.equal(updated.currentStage, 6);
  assert.equal(updated.skillMastery['add:to10'].intervalDays, 1);
  assert.ok(Date.parse(updated.skillMastery['add:to10'].nextReviewAt) > Date.now());
});

test('success advances 1/3/7/14/30; a failure returns sooner without a stage downgrade', () => {
  const { mastery } = setup();
  const profile = { currentStage: 13 };
  const now = at('2026-10-06T12:00:00Z');
  mastery.markStageMastered(profile, 12, now);
  assert.equal(profile.skillMastery['add:cross-ten'].nextReviewAt, '2026-10-07T12:00:00.000Z');
  for (const [index, interval] of [3, 7, 14, 30, 30].entries()) {
    assert.equal(mastery.recordReviewResult(profile, 'add:cross-ten', true, at('2026-10-' + String(7 + index).padStart(2, '0') + 'T12:00:00Z')).intervalDays, interval);
  }
  assert.equal(mastery.recordReviewResult(profile, 'add:cross-ten', false, now).intervalDays, 14);
  assert.equal(profile.skillMastery['add:cross-ten'].nextReviewAt, '2026-10-07T12:00:00.000Z');
  assert.equal(profile.currentStage, 13);
  assert.equal(profile.skillMastery['add:cross-ten'].failedReviews, 1);
  assert.equal(mastery.getMasteryStatus(profile.skillMastery['add:cross-ten']), 'inPractice');
});

test('due selection excludes future skills, sorts overdue skills, and caps spaced slots', () => {
  const { mastery } = setup();
  const profile = {};
  for (const [stage, day] of [[5, '01'], [6, '02'], [7, '03'], [8, '10']]) {
    mastery.markStageMastered(profile, stage, at('2026-10-' + day + 'T12:00:00Z'));
  }
  const now = at('2026-10-09T12:00:00Z');
  assert.deepEqual(Array.from(mastery.selectReviewSkills(profile, 2, now)), ['add:to10', 'subtract:small']);
  assert.deepEqual(Array.from(mastery.getDueSkills(profile, now), x => x.skillId), ['add:to10', 'subtract:small', 'subtract:to10']);
  assert.deepEqual(Array.from(mastery.REVIEW_SLOTS[10]), [3, 7]);
  assert.deepEqual(Array.from(mastery.REVIEW_SLOTS[20]), [3, 8, 14]);
  assert.deepEqual(Array.from(mastery.REVIEW_SLOTS[30]), [4, 10, 17, 24]);
  for (const slots of Object.values(mastery.REVIEW_SLOTS)) assert.ok(slots.every((slot, index) => index === 0 || slot - slots[index - 1] > 1));
});

test('local calendar addition keeps the clock across daylight saving changes', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'Europe/Berlin';
    const { mastery } = setup();
    assert.equal(mastery.addCalendarDays(at('2026-03-28T11:00:00Z'), 1), '2026-03-29T10:00:00.000Z');
    assert.equal(mastery.addCalendarDays(at('2026-10-24T10:00:00Z'), 1), '2026-10-25T11:00:00.000Z');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('spaced slots generate fresh examples, while errorQueue wins the same slot', () => {
  const { app, mastery } = setup();
  due(app, mastery);
  app.appSettings.problemCount = 20;
  app.startTraining();
  assert.equal(app.state.spacedPlan.size, 1);
  const slot = [...app.state.spacedPlan.keys()][0];
  const first = app.selectProblem(app.state.stage, slot);
  assert.equal(first.isSpacedReview, true);
  assert.equal(first.reviewSkillId, 'add:to10');
  assert.equal(first.curriculumStage, 5);
  assert.ok(['equation', 'missingOperand'].includes(first.taskType));
  assert.ok(!('problem' in app.getProfile().skillMastery['add:to10']));
  const fresh = Array.from({ length: 30 }, () => app.selectProblem(app.state.stage, slot));
  assert.ok(fresh.some(item => item.a !== first.a || item.b !== first.b));
  const profile = app.getProfile();
  profile.errorQueue.push({ ...app.makeCurriculumProblem(6, 0, profile), lastShown: 0, correctStreak: 0 });
  app.saveProfile(profile);
  const priority = app.selectProblem(app.state.stage, slot);
  assert.equal(priority.isReview, true);
  assert.equal(priority.isSpacedReview, false);
});

test('real session plans never exceed 2/3/4 spaced reviews for 10/20/30 tasks', () => {
  for (const [count, maximum] of [[10, 2], [20, 3], [30, 4]]) {
    const { app, mastery } = setup();
    const profile = app.getProfile();
    profile.currentStage = 14;
    for (let stage = 1; stage <= 10; stage++) mastery.markStageMastered(profile, stage, at('2020-01-01T12:00:00Z'));
    app.saveProfile(profile);
    app.appSettings.problemCount = count;
    app.startTraining();
    const slots = [...app.state.spacedPlan.keys()];
    assert.equal(slots.length, maximum);
    assert.ok(slots.every((slot, index) => index === 0 || slot - slots[index - 1] > 1));
    assert.equal(new Set(app.state.spacedPlan.values()).size, maximum);
  }
});

test('wrong first review schedules reinforcement and queue; corrected retry remains a failure', () => {
  const { app, mastery } = setup();
  const profile = due(app, mastery);
  profile.personalFastTime = 6;
  profile.curriculumStats['6'] = [1, 1, 1];
  app.saveProfile(profile);
  app.startTraining();
  const slot = [...app.state.spacedPlan.keys()][0];
  app.state.index = slot;
  app.state.problem = app.selectProblem(app.state.stage, slot);
  app.state.startedAt = 0;
  const answer = app.state.problem.responseAnswer ?? app.state.problem.answer;
  app.submitAnswer(answer + 1);
  const wrong = app.getProfile();
  assert.equal(app.state.attempt, 2);
  assert.equal(wrong.skillMastery['add:to10'].failedReviews, 1);
  assert.equal(wrong.personalFastTime, 6);
  assert.deepEqual(Array.from(wrong.curriculumStats['6']), [1, 1, 1]);
  assert.equal(wrong.errorQueue[0].curriculumStage, 5);
  assert.equal(wrong.errorQueue[0].fromSpacedReview, true);
  app.submitAnswer(answer);
  const corrected = app.getProfile();
  assert.equal(corrected.skillMastery['add:to10'].successfulReviews, 0);
  assert.equal(corrected.skillMastery['add:to10'].failedReviews, 1);
  assert.equal(corrected.currentStage, 6);
  assert.equal(corrected.errorQueue.length, 1);
  assert.equal(app.selectProblem(6, 8).isReview, true);
});

test('first-try review advances mastery without changing current pace or adaptive stats', () => {
  const { app, mastery } = setup();
  const profile = due(app, mastery);
  profile.personalFastTime = 6;
  app.saveProfile(profile);
  app.startTraining();
  const slot = [...app.state.spacedPlan.keys()][0];
  app.state.index = slot;
  app.state.problem = app.selectProblem(app.state.stage, slot);
  app.submitAnswer(app.state.problem.responseAnswer ?? app.state.problem.answer);
  const updated = app.getProfile();
  assert.equal(updated.skillMastery['add:to10'].intervalDays, 3);
  assert.equal(updated.personalFastTime, 6);
  assert.equal(updated.currentStage, 6);
  assert.deepEqual(Array.from(updated.adaptiveRecentResults), []);
});

test('mastery script is loaded in HTML, precached, and available in test runtime', () => {
  assert.ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('src="kapi-mastery.js"'));
  assert.ok(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').includes('"kapi-mastery.js"'));
  assert.ok(environment().sandbox.KapiMasterySystem);
});

test('parent history shows due areas without a punitive warning or empty zero-state block', () => {
  const { app, mastery, env } = setup();
  env.storage.set('capy-count-history-v1', JSON.stringify([{ date: new Date().toISOString(), total: 10, correct: 9, average: 4, stage: 6 }]));
  app.showStats();
  assert.ok(!env.elements.get('statsContent').innerHTML.includes('Zum Wiederholen: 0'));
  const profile = due(app, mastery);
  app.showStats();
  assert.ok(env.elements.get('statsContent').innerHTML.includes('Zum Wiederholen: 1 Bereich'));
  assert.equal(profile.currentStage, 6);
});
