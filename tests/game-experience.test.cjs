const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function training(stage = 5, count = 10) {
  const env = environment({ app: true, seed: 0x52454344 });
  const app = env.sandbox.__app;
  app.appSettings.automatic = false;
  app.appSettings.manualStage = stage;
  app.appSettings.range = stage <= 8 ? '10' : '20';
  app.appSettings.operations = stage === 5 ? ['add'] : ['add', 'subtract'];
  app.appSettings.problemCount = count;
  env.advance(360);
  app.startTraining();
  return { env, app };
}

test('first error gives only a small hint; second error shows model and answer', () => {
  const { env, app } = training();
  const original = { ...app.state.problem };
  app.state.streak = 2;
  app.submitAnswer(original.answer + 1);
  assert.equal(app.state.attempt, 2);
  assert.equal(app.state.hintLevel, 1);
  assert.equal(app.state.streak, 0);
  assert.equal(env.elements.get('hint').textContent, 'Schau noch einmal genau hin.');
  assert.ok(!env.elements.get('hint').innerHTML.includes('counter'));
  assert.ok(!env.elements.get('feedback').textContent.includes(String(original.answer)));
  assert.equal(app.getProfile().errorQueue.find(item => item.key === original.key).correctStreak, 0);

  app.submitAnswer(original.answer + 1);
  assert.equal(app.state.hintLevel, 2);
  assert.ok(env.elements.get('hint').innerHTML.includes('addend-dots'));
  assert.ok(env.elements.get('feedback').textContent.includes(String(original.answer)));
  assert.equal(app.state.results[0].firstTry, false);
  assert.equal(app.state.score, 0);
  env.advance(2300);
  assert.equal(app.state.problem.isReview, false);
  app.submitAnswer(app.state.problem.answer);
  env.advance(350);
  assert.equal(app.state.problem.isReview, true, 'error returns in the actual queue');
  assert.equal(app.state.problem.key, original.key);
});

test('correct retry earns one XP and cannot produce a perfect session or speed record', () => {
  const { env, app } = training();
  const profile = app.getProfile();
  profile.personalFastTime = 6;
  profile.bestPersonalFastTime = 6;
  profile.fasterPaceSamples = [4.6, 4.5];
  app.saveProfile(profile);
  const original = app.state.problem;
  app.submitAnswer(original.answer + 1);
  app.submitAnswer(original.answer);
  assert.equal(app.state.score, 1);
  assert.equal(app.state.results[0].firstTry, false);
  assert.equal(app.state.results[0].success, true);
  assert.equal(app.getProfile().personalFastTime, 6);
  assert.equal(app.getProfile().errorQueue.find(item => item.key === original.key).correctStreak, 0);
  env.advance(350);
  app.submitAnswer(app.state.problem.answer);
  env.advance(350);
  assert.equal(app.state.problem.isReview, true);
  const paceBeforeReview = app.getProfile().personalFastTime;
  app.submitAnswer(app.state.problem.answer);
  assert.equal(app.getProfile().errorQueue.find(item => item.key === original.key).correctStreak, 1);
  assert.equal(app.getProfile().personalFastTime, paceBeforeReview, 'review does not update baseline');
  env.advance(350);
  for (let index = 3; index <= 5; index += 1) {
    if (index === 5) assert.equal(app.state.problem.isReview, true);
    app.submitAnswer(app.state.problem.answer);
    env.advance(350);
  }
  assert.equal(app.getProfile().errorQueue.some(item => item.key === original.key), false);
  assert.ok(app.state.results.some(result => result.firstTry === false));
});

test('subtraction gets a minimal prompt before a visual model', () => {
  const { env, app } = training(7);
  app.submitAnswer(app.state.problem.answer + 1);
  assert.equal(env.elements.get('hint').textContent, 'Was bleibt übrig?');
  assert.ok(!env.elements.get('hint').innerHTML.includes('counter'));
  app.submitAnswer(app.state.problem.answer + 1);
  assert.ok(env.elements.get('hint').innerHTML.includes('counter removed'));
});

test('keypad markup and input validation follow the current problem', () => {
  const { env, app } = training();
  const examples = [
    [{ operation: 'add', answer: 7 }, []],
    [{ operation: 'negative', answer: -3 }, ['-']],
    [{ operation: 'decimal', answerType: 'decimal', answer: 2.5 }, [',']],
    [{ operation: 'fraction', answerType: 'fraction', answer: '1/2' }, ['/']]
  ];
  for (const [problem, expected] of examples) {
    app.state.problem = { ...app.state.problem, ...problem, mode: 'input' };
    app.renderAnswer();
    const html = env.elements.get('answerArea').children.at(-1).innerHTML;
    for (const key of ['-', ',', '/']) {
      assert.equal(html.includes(`data-key="${key}"`), expected.includes(key), `${problem.operation}: button ${key}`);
      assert.equal(app.canAppendKey('', key, problem.answerType, app.state.problem), expected.includes(key) && key !== '/', `${problem.operation}: initial input ${key}`);
    }
    assert.equal(html.includes('keypad-specials'), expected.length > 0, `${problem.operation}: no empty specials row`);
    assert.equal(app.canAppendKey('1', '/', problem.answerType, app.state.problem), expected.includes('/'));
    assert.equal(app.canAppendKey('', '7', problem.answerType, app.state.problem), true);
  }
});

test('calibration, sustained improvement and historical record use the existing three sample pace algorithm', () => {
  const app = environment({ app: true }).sandbox.__app;
  const profile = app.getProfile();
  for (const elapsed of [6.1, 6.0]) {
    const result = app.updatePersonalPace(profile, elapsed);
    assert.equal(result.improved, false);
    assert.equal(profile.personalFastTime, null);
  }
  const calibration = app.updatePersonalPace(profile, 5.9);
  assert.equal(calibration.improved, false);
  assert.equal(profile.personalFastTime, 6);
  assert.equal(profile.bestPersonalFastTime, 6);
  assert.equal(app.updatePersonalPace(profile, 4.9).improved, false);
  assert.equal(app.updatePersonalPace(profile, 5).improved, false);
  const improvement = app.updatePersonalPace(profile, 5.1);
  assert.equal(improvement.improved, true);
  assert.equal(improvement.record, true);
  assert.equal(improvement.previousThreshold, 6);
  assert.equal(improvement.newThreshold, 5);
  assert.equal(profile.bestPersonalFastTime, 5);
  assert.equal(app.updatePersonalPace(profile, 5).record, false);
  assert.equal(profile.personalFastTime, 5);
});

test('legacy profile gains historical best without losing progress or its error queue', () => {
  const { app } = training();
  const profile = app.getProfile();
  profile.personalFastTime = 5.4;
  profile.totalXp = 47;
  profile.dayStreak = 4;
  profile.currentStage = 5;
  profile.errorQueue.push({ key: 'old', curriculumStage: 5, operation: 'add' });
  delete profile.bestPersonalFastTime;
  app.saveProfile(profile);
  const loaded = app.getProfile();
  assert.equal(loaded.bestPersonalFastTime, 5.4);
  assert.equal(loaded.totalXp, 47);
  assert.equal(loaded.dayStreak, 4);
  assert.equal(loaded.currentStage, 5);
  assert.equal(loaded.errorQueue[0].key, 'old');
});

test('only the third faster first attempt emits one record event; stage and XP rules stay intact', () => {
  const { env, app } = training(5, 20);
  const profile = app.getProfile();
  profile.personalFastTime = 6;
  profile.bestPersonalFastTime = 6;
  app.saveProfile(profile);
  const batches = [];
  const originalHandle = app.motivation.handle.bind(app.motivation);
  app.motivation.handle = (events, context) => { batches.push(events.map(event => event.type)); return originalHandle(events, context); };
  for (let index = 0; index < 3; index += 1) {
    env.advance(4500);
    app.submitAnswer(app.state.problem.answer);
    assert.equal(app.state.results[index].firstTry, true);
    env.advance(350);
  }
  assert.equal(app.state.stage, 5);
  assert.deepEqual(batches.slice(0, 2).map(events => events.includes('personalRecord')), [false, false]);
  assert.equal(batches[2].includes('speedImproved'), true);
  assert.equal(batches[2].includes('personalRecord'), true);
  assert.equal(app.getProfile().personalFastTime, 4.5);
  assert.equal(app.state.score, 9);
  assert.equal(batches.filter(events => events.includes('personalRecord')).length, 1);
});
