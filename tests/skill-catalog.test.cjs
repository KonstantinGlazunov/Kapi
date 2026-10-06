const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');
const { validateStageProblem } = require('./helpers/curriculum-validators.cjs');

function setup(seed = 0x12345678) {
  const env = environment({ app: true, seed });
  return { env, app: env.sandbox.__app, skills: env.sandbox.KapiSkills, mastery: env.sandbox.KapiMasterySystem };
}

test('catalog maps exactly stages 1–14 to distinct mathematical skill IDs with DE/RU names', () => {
  const { skills, mastery } = setup();
  const catalog = Array.from(skills.KAPI_SKILLS);
  assert.equal(catalog.length, 14);
  assert.equal(new Set(catalog.map(x => x.id)).size, 14);
  assert.deepEqual(catalog.map(x => x.stage), Array.from({ length: 14 }, (_, i) => i + 1));
  for (const descriptor of catalog) {
    assert.ok(descriptor.de && descriptor.ru);
    assert.ok(!descriptor.id.startsWith('stage:'));
    assert.equal(skills.stageForSkill(descriptor.id), descriptor.stage);
    assert.equal(skills.STAGE_SKILLS[descriptor.stage].primarySkillId, descriptor.id);
    assert.equal(mastery.skillIdForProblem({ curriculumStage: descriptor.stage }), descriptor.id);
    assert.equal(skills.canonicalId('stage:' + descriptor.stage), descriptor.id);
  }
  assert.equal(skills.stageForSkill('stage:41'), 41);
  assert.equal(mastery.skillIdForProblem({ curriculumStage: 41 }), 'stage:41');
});

test('500 fresh problems for each canonical skill obey the existing exact curriculum validator', () => {
  for (const seed of [0x4b415049, 0xdeadbeef]) {
    const { app, skills } = setup(seed);
    for (const skill of skills.KAPI_SKILLS) {
      const profile = app.getProfile();
      for (let index = 0; index < 500; index++) {
        const problem = skills.makeProblemForSkill(skill.id, app.makeCurriculumProblem, index, profile);
        validateStageProblem(app, skill.stage, problem, skill.id + ' seed ' + seed + ' sample ' + index);
        assert.ok(skill.operations.includes(problem.operation));
        assert.equal(skills.stageForSkill(skills.canonicalId('stage:' + skill.stage)), skill.stage);
      }
    }
  }
});

test('migration preserves an old stage record exactly and canonically links its error queue', () => {
  const { mastery } = setup();
  const old = { strength: 3, successfulReviews: 2, failedReviews: 1,
    lastPracticedAt: '2026-10-01T10:00:00Z', nextReviewAt: '2026-10-08T10:00:00Z',
    intervalDays: 7, lastResult: 'firstTry' };
  const profile = { totalXp: 163, weeklyGoal: 3, skillMastery: { 'stage:12': { ...old } },
    errorQueue: [{ key: 'old-example', curriculumStage: 12, fromSpacedReview: true, reviewSkillId: 'stage:12' }] };
  assert.equal(mastery.migrate(profile), true);
  assert.deepEqual(JSON.parse(JSON.stringify(profile.skillMastery['add:cross-ten'])), old);
  assert.equal('stage:12' in profile.skillMastery, false);
  assert.equal(profile.errorQueue[0].reviewSkillId, 'add:cross-ten');
  assert.equal(profile.totalXp, 163);
  assert.equal(mastery.migrate(profile), false);
  assert.deepEqual(Array.from(mastery.getDueSkills(profile, new Date('2026-10-09T10:00:00Z')), x => x.skillId), ['add:cross-ten']);
});

test('duplicate old and canonical entries merge without duplicate review, with the earlier due date', () => {
  const { mastery } = setup();
  const earlier = { strength: 2, successfulReviews: 2, failedReviews: 1, intervalDays: 3,
    nextReviewAt: '2026-10-04T10:00:00Z', lastPracticedAt: '2026-10-01T10:00:00Z', lastResult: 'firstTry' };
  const later = { strength: 3, successfulReviews: 3, failedReviews: 1, intervalDays: 7,
    nextReviewAt: '2026-10-08T10:00:00Z', lastPracticedAt: '2026-10-03T10:00:00Z', lastResult: 'firstTry' };
  const profile = { skillMastery: { 'stage:12': earlier, 'add:cross-ten': later } };
  assert.equal(mastery.migrate(profile), true);
  assert.deepEqual(Object.keys(profile.skillMastery), ['add:cross-ten']);
  assert.equal(profile.skillMastery['add:cross-ten'].nextReviewAt, earlier.nextReviewAt);
  assert.equal(profile.skillMastery['add:cross-ten'].intervalDays, 3);
  assert.equal(profile.skillMastery['add:cross-ten'].successfulReviews, 3);
});

test('app profile load persists canonical migration without changing XP, weekly goal or outfit', () => {
  const { app, env } = setup();
  const legacy = app.getProfile();
  legacy.totalXp = 163;
  legacy.weeklyGoal = 4;
  legacy.unlockedRewards = ['badge-star', 'hat-red', 'glasses', 'neck-scarf'];
  legacy.equippedOutfit.hat = 'hat-red';
  legacy.skillMastery = { 'stage:12': { strength: 2, successfulReviews: 1, failedReviews: 0,
    intervalDays: 3, nextReviewAt: '2026-10-07T12:00:00Z', lastPracticedAt: '2026-10-04T12:00:00Z', lastResult: 'firstTry' } };
  app.saveProfile(legacy);
  const migrated = app.getProfile();
  assert.equal(migrated.skillMastery['add:cross-ten'].intervalDays, 3);
  assert.equal(migrated.totalXp, 163);
  assert.equal(migrated.weeklyGoal, 4);
  assert.equal(migrated.equippedOutfit.hat, 'hat-red');
  assert.equal('stage:12' in JSON.parse(env.storage.get('capy-count-profile-v1')).skillMastery, false);
});

test('overdue priority holds across days; similarly overdue reviews prefer distinct chapters', () => {
  const { mastery } = setup();
  const profile = {};
  for (const stage of [4, 5, 7, 12]) mastery.markStageMastered(profile, stage, new Date('2026-10-01T12:00:00Z'));
  assert.deepEqual(Array.from(mastery.selectReviewSkills(profile, 3, new Date('2026-10-10T12:00:00Z'))),
    ['number:compose-to10', 'subtract:to10', 'add:cross-ten']);
  // A materially older review wins even when it belongs to a used chapter.
  profile.skillMastery['add:to10'].nextReviewAt = '2026-09-20T12:00:00Z';
  assert.equal(mastery.selectReviewSkills(profile, 1, new Date('2026-10-10T12:00:00Z'))[0], 'add:to10');
});

test('a short-term recovery retains its skill link but cannot advance spaced mastery', () => {
  const { app, mastery } = setup();
  const profile = app.getProfile();
  profile.currentStage = 13;
  mastery.markStageMastered(profile, 12, new Date('2020-01-01T12:00:00Z'));
  app.saveProfile(profile);
  app.startTraining();
  const slot = [...app.state.spacedPlan.keys()][0];
  app.state.index = slot;
  app.state.problem = app.selectProblem(13, slot);
  app.submitAnswer((app.state.problem.responseAnswer ?? app.state.problem.answer) + 1);
  const before = app.getProfile().skillMastery['add:cross-ten'].nextReviewAt;
  assert.equal(app.getProfile().errorQueue[0].reviewSkillId, 'add:cross-ten');
  const shortReview = app.selectProblem(13, 8);
  assert.equal(shortReview.isReview, true);
  assert.equal(shortReview.reviewSkillId, 'add:cross-ten');
  assert.equal(app.registerCorrectAnswer(shortReview), 'errorRecovered');
  assert.equal(app.getProfile().skillMastery['add:cross-ten'].nextReviewAt, before);
});

test('History names up to three due skills and map reinforcement remains secondary to chapter completion', () => {
  const { app, mastery, env } = setup();
  const profile = app.getProfile();
  profile.currentStage = 15;
  for (const stage of [10, 11, 12, 13]) mastery.markStageMastered(profile, stage, new Date('2020-01-01T12:00:00Z'));
  app.saveProfile(profile);
  env.storage.set('capy-count-history-v1', JSON.stringify([{ date: new Date().toISOString(), total: 10, correct: 9, average: 4, stage: 15 }]));
  app.showStats();
  const text = env.elements.get('statsContent').innerHTML;
  assert.ok(text.includes('Plus bis 20 ohne Übergang'));
  assert.ok(text.includes('Minus bis 20 ohne Übergang'));
  assert.ok(text.includes('Plus über den Zehner'));
  assert.ok(text.includes('+ 1 weitere'));
  app.renderCurriculumMap();
  assert.ok(env.elements.get('mapChapters').innerHTML.includes('completed'));
  assert.ok(!env.elements.get('mapChapters').innerHTML.includes('✓ Gefestigt'));
  mastery.markStageMastered(profile, 14, new Date('2020-01-01T12:00:00Z'));
  for (const skill of Object.values(profile.skillMastery)) { skill.intervalDays = 30; skill.lastResult = 'firstTry'; }
  app.saveProfile(profile);
  app.renderCurriculumMap();
  assert.ok(env.elements.get('mapChapters').innerHTML.includes('✓ Gefestigt'));
});

test('skill catalog loads before mastery in HTML and both are available offline', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(html.indexOf('src="kapi-skills.js"') < html.indexOf('src="kapi-mastery.js"'));
  assert.ok(sw.includes('"kapi-skills.js"'));
});
