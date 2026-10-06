const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');

const now = new Date('2026-10-10T12:00:00Z');
function fixture(errorCount = 0, skillCount = 0) {
  const { sandbox } = environment();
  const profile = { errorQueue: Array.from({ length: errorCount }, (_, i) => ({ key: `error-${i}`, lastShown: i })), skillMastery: {} };
  const skills = sandbox.KapiSkills.KAPI_SKILLS.slice(0, skillCount);
  for (const skill of skills) profile.skillMastery[skill.id] = { nextReviewAt: '2020-01-01T12:00:00Z', intervalDays: 1 };
  return { profile, planner: sandbox.KapiSessionPlanner, skills };
}

test('10/20/30 plans cap each review source, retain a current majority and space reviews', () => {
  for (const [total, errorMax, spacedMax] of [[10, 3, 2], [20, 5, 3], [30, 7, 4]]) {
    const { profile, planner } = fixture(20, 20);
    const plan = planner.planSession({ profile, total, currentStage: 30, now });
    assert.equal(Object.isFrozen(plan), true);
    assert.equal(Object.isFrozen(plan.slots), true);
    assert.ok(plan.counts.errorReview <= errorMax);
    assert.ok(plan.counts.spacedReview <= spacedMax);
    assert.ok(plan.counts.current >= Math.ceil(total * .65));
    assert.equal(plan.slots.length, total);
    assert.equal(plan.slots[0].type, 'current');
    assert.equal(plan.slots.at(-1).type, 'current');
    for (let i = 1; i < total; i++) assert.ok(plan.slots[i].type === 'current' || plan.slots[i - 1].type === 'current', `adjacent reviews at ${i}`);
    assert.deepEqual(Array.from(plan.slots.filter(x => x.type === 'errorReview').map(x => x.key)),
      Array.from({ length: plan.counts.errorReview }, (_, i) => `error-${i}`));
  }
});

test('errors win constrained review capacity while overdue skills retain mastery ordering', () => {
  const { profile, planner, skills } = fixture(20, 20);
  let plan = planner.planSession({ profile, total: 10, currentStage: 30, now });
  assert.equal(plan.counts.errorReview, 3);
  assert.equal(plan.counts.spacedReview, 0);
  profile.errorQueue = [];
  profile.skillMastery[skills[4].id].nextReviewAt = '2019-01-01T12:00:00Z';
  plan = planner.planSession({ profile, total: 10, currentStage: 30, now });
  assert.equal(plan.counts.spacedReview, 2);
  assert.equal(plan.slots.find(x => x.type === 'spacedReview').skillId, skills[4].id);
});

test('snapshot is immutable; later errors and mastery changes do not reorder slots', () => {
  const { profile, planner } = fixture(1, 4);
  const plan = planner.planSession({ profile, total: 20, currentStage: 10, now });
  const initial = JSON.stringify(plan);
  profile.errorQueue.push({ key: 'new', lastShown: -1 });
  profile.skillMastery = {};
  assert.equal(JSON.stringify(plan), initial);
  assert.equal(plan.slots.some(x => x.key === 'new'), false);
  assert.equal(plan.slots.some(x => Object.hasOwn(x, 'problem')), false);
});

test('targeted practice is a pure ten-slot plan', () => {
  const { profile, planner } = fixture(20, 20);
  const plan = planner.planSession({ profile, total: 10, currentStage: 23, now,
    mode: 'targeted', targeted: { skillId: 'multiply:einmaleins-sequence', subskillId: 'multiply:table:7' } });
  assert.equal(plan.counts.targeted, 10);
  assert.equal(plan.counts.current + plan.counts.errorReview + plan.counts.spacedReview, 0);
  assert.ok(plan.slots.every(x => x.type === 'targeted' && x.subskillId === 'multiply:table:7'));
});

test('app fixes the slot map at start; new error returns next session without changing the firstTry retry', () => {
  const { sandbox } = environment({ app: true });
  const app = sandbox.__app;
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 5;
  app.appSettings.operations = ['add'];
  app.startTraining();
  const before = JSON.stringify(app.state.sessionPlan);
  const problem = app.state.problem;
  app.submitAnswer(problem.answer + 1);
  assert.equal(app.state.index, 0);
  assert.equal(app.state.attempt, 2);
  assert.equal(JSON.stringify(app.state.sessionPlan), before);
  assert.equal(app.state.sessionPlan.slots.some(x => x.type === 'errorReview'), false);
  app.startTraining();
  const slot = app.state.sessionPlan.slots.findIndex(x => x.type === 'errorReview');
  assert.ok(slot > 0);
  assert.equal(app.selectProblem(5, slot).key, problem.key);
});

test('planner loads before app and remains in the offline precache', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const cache = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(html.indexOf('kapi-session-planner.js') < html.indexOf('app.js'));
  assert.match(cache, /kapi-session-planner\.js/);
});
