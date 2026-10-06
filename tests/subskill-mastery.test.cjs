const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');

function setup(seed = 0x4b415049) {
  const env = environment({ app: true, seed });
  return { env, app: env.sandbox.__app, catalog: env.sandbox.KapiSkills, model: env.sandbox.KapiSubskills };
}

test('declarative table subskills classify the curriculum row and the division divisor', () => {
  const { catalog } = setup();
  assert.equal(new Set(catalog.SUBSKILLS.map(item => item.id)).size, 21);
  for (const item of catalog.SUBSKILLS) assert.ok(item.de && item.ru);
  const examples = [
    [{ curriculumStage: 20, operation: 'multiply', a: 2, b: 7 }, 'multiply:table:2'],
    [{ curriculumStage: 23, operation: 'multiply', a: 7, b: 2 }, 'multiply:table:7'],
    [{ curriculumStage: 23, operation: 'multiply', a: 7, b: 8 }, 'multiply:table:7'],
    [{ curriculumStage: 23, operation: 'multiply', a: 8, b: 7 }, 'multiply:table:8'],
    [{ curriculumStage: 23, operation: 'multiply', a: 7, b: 0 }, 'multiply:table:0'],
    [{ curriculumStage: 24, operation: 'divide', a: 56, b: 7 }, 'divide:table:7'],
    [{ curriculumStage: 24, operation: 'divide', a: 63, b: 9 }, 'divide:table:9']
  ];
  for (const [problem, expected] of examples) assert.equal(catalog.classifyProblem(problem).subskillId, expected);
  assert.equal(catalog.classifyProblem({ curriculumStage: 12, operation: 'add', a: 7, b: 5 }).subskillId, null);
});

test('legacy migration adds bounded subskill storage without touching primary mastery', () => {
  const { app, model } = setup();
  const profile = app.getProfile();
  const oldMastery = JSON.stringify(profile.skillMastery);
  delete profile.subskillMastery;
  assert.equal(model.migrate(profile), true);
  assert.deepEqual(JSON.parse(JSON.stringify(profile.subskillMastery)), {});
  assert.equal(JSON.stringify(profile.skillMastery), oldMastery);
  for (let i = 0; i < 100; i++) model.recordEvidence(profile,
    { curriculumStage: 23, operation: 'multiply', a: 7, b: (i % 9) + 1, answer: 7 * ((i % 9) + 1) },
    { firstAttempt: true, correct: i % 3 !== 0, now: new Date('2026-10-06T12:00:00Z') });
  const record = profile.subskillMastery['multiply:table:7'];
  assert.equal(record.attempts, 100);
  assert.ok(record.recentResults.length <= model.WINDOW);
  assert.equal(model.migrate(profile), false);
});

test('wrong first attempt remains negative evidence after corrected retry and short-term recovery', () => {
  const { app, model } = setup();
  const profile = app.getProfile();
  const problem = { curriculumStage: 23, operation: 'multiply', a: 7, b: 8, answer: 56 };
  model.recordEvidence(profile, problem, { firstAttempt: true, correct: false, source: 'curriculum' });
  model.recordEvidence(profile, problem, { firstAttempt: false, correct: true, source: 'errorRecovery' });
  const record = profile.subskillMastery['multiply:table:7'];
  assert.equal(record.attempts, 1);
  assert.equal(record.firstTryCorrect, 0);
  assert.deepEqual(Array.from(record.recentResults), [0]);
  assert.equal(record.practiceRetries, 1);
  assert.equal(model.status(record), 'practice');
});

test('weak practiced table is selected more often, while other learned tables remain represented', () => {
  const { app, model } = setup();
  const profile = app.getProfile();
  profile.multiplicationSequence = { phase: 11, item: 10, mixed: true };
  for (let i = 0; i < 10; i++) {
    model.recordEvidence(profile, { curriculumStage: 23, operation: 'multiply', a: 7, b: 8 },
      { firstAttempt: true, correct: false });
    model.recordEvidence(profile, { curriculumStage: 23, operation: 'multiply', a: 2, b: 8 },
      { firstAttempt: true, correct: true });
  }
  let seed = 0x12345678;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
  const counts = {};
  for (let i = 0; i < 1000; i++) {
    const id = model.selectSubskill(profile, 'multiply:einmaleins-sequence', random);
    counts[id] = (counts[id] || 0) + 1;
  }
  assert.ok(counts['multiply:table:7'] > counts['multiply:table:2'] * 2, JSON.stringify(counts));
  assert.ok(counts['multiply:table:2'] > 0);
  assert.ok(counts['multiply:table:7'] < 900);
});

test('early sequence never selects an unopened table; focused examples vary without advancing the sequence', () => {
  const { app, catalog, model } = setup();
  const profile = app.getProfile();
  profile.currentStage = 23;
  profile.multiplicationSequence = { phase: 2, item: 3, mixed: false };
  assert.ok(!model.availableSubskills('multiply:einmaleins-sequence', profile).includes('multiply:table:2'));
  profile.multiplicationSequence = { phase: 2, item: 5, mixed: false };
  assert.deepEqual(Array.from(model.availableSubskills('multiply:einmaleins-sequence', profile)),
    ['multiply:table:0', 'multiply:table:1', 'multiply:table:2']);
  assert.equal(model.makeProblemForSubskill('multiply:einmaleins-sequence', 'multiply:table:7',
    app.makeCurriculumProblem, 0, profile), null);
  const before = JSON.stringify(profile.multiplicationSequence);
  const keys = new Set();
  for (let i = 0; i < 30; i++) {
    const p = model.makeProblemForSubskill('multiply:einmaleins-sequence', 'multiply:table:2',
      app.makeCurriculumProblem, i, profile, [...keys].slice(-4));
    assert.equal(catalog.classifyProblem(p).subskillId, 'multiply:table:2');
    assert.ok(p.b <= 5, 'targeted practice cannot open a later item in the current row');
    keys.add(p.key);
  }
  assert.ok(keys.size >= 5);
  assert.equal(JSON.stringify(profile.multiplicationSequence), before);
});

test('targeted session uses 10 problems and preserves current stage, adaptive evidence and personal pace', () => {
  const { app, env } = setup();
  const profile = app.getProfile();
  profile.currentStage = 24;
  profile.personalFastTime = 6;
  profile.adaptiveRecentResults = [1, 0];
  profile.multiplicationSequence = { phase: 11, item: 10, mixed: true };
  app.saveProfile(profile);
  app.startTraining({ targetSkillId: 'multiply:einmaleins-sequence', targetSubskillId: 'multiply:table:7' });
  assert.equal(app.state.targeted.subskillId, 'multiply:table:7');
  assert.equal(app.state.stage, 23);
  assert.equal(app.state.spacedPlan.size, 0);
  assert.equal(env.elements.get('problemTotal').textContent, '10');
  for (let index = 0; index < 10; index++) {
    assert.equal(env.sandbox.KapiSkills.classifyProblem(app.state.problem).subskillId, 'multiply:table:7');
    app.submitAnswer(app.state.problem.responseAnswer ?? app.state.problem.answer);
    env.advance(350);
  }
  assert.equal(app.state.finished, true);
  const updated = app.getProfile();
  assert.equal(updated.currentStage, 24);
  assert.equal(updated.personalFastTime, 6);
  assert.deepEqual(Array.from(updated.adaptiveRecentResults), [1, 0]);
  assert.equal(updated.weeklySessions.count, 1);
  assert.equal(updated.subskillMastery['multiply:table:7'].attempts, 10);
  assert.ok(updated.totalXp > 0);
  app.finishTraining();
  assert.equal(app.getProfile().weeklySessions.count, 1);
});

test('manual operation and range restrictions cannot be bypassed with a targeted request', () => {
  const { app } = setup();
  const profile = app.getProfile();
  profile.currentStage = 24;
  profile.multiplicationSequence = { phase: 11, item: 10, mixed: true };
  app.saveProfile(profile);
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 24;
  app.appSettings.operations = ['divide'];
  app.startTraining({ targetSkillId: 'multiply:einmaleins-sequence', targetSubskillId: 'multiply:table:7' });
  assert.equal(app.state.targeted, null);
  app.appSettings.operations = ['multiply'];
  app.appSettings.range = '10';
  app.startTraining({ targetSkillId: 'multiply:einmaleins-sequence', targetSubskillId: 'multiply:table:7' });
  assert.equal(app.state.targeted, null);
});

test('History presents a small localized targeted-practice choice and offline cache includes the module', () => {
  const { app, env, model } = setup();
  const profile = app.getProfile();
  profile.currentStage = 24;
  profile.multiplicationSequence = { phase: 11, item: 10, mixed: true };
  model.recordEvidence(profile, { curriculumStage: 23, operation: 'multiply', a: 7, b: 8 },
    { firstAttempt: true, correct: false });
  app.saveProfile(profile);
  env.storage.set('capy-count-history-v1', JSON.stringify([{ date: new Date().toISOString(), id: 'prior', total: 10, correct: 8, average: 5, stage: 23 }]));
  app.showStats();
  const html = env.elements.get('statsContent').innerHTML;
  assert.ok(html.includes('7er-Reihe'));
  assert.ok(html.includes('Gezielt üben'));
  assert.ok(html.includes('data-target-subskill="multiply:table:7"'));
  assert.ok(!html.includes('Schwach'));
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(sw.includes('"kapi-subskills.js"'));
  assert.ok(index.indexOf('kapi-mastery.js') < index.indexOf('kapi-subskills.js'));
  assert.ok(index.indexOf('kapi-subskills.js') < index.indexOf('app.js'));
});
