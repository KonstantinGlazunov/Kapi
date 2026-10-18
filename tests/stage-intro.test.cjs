const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function setup() {
  const env = environment({ app: true });
  env.advance(360);
  return { env, app: env.sandbox.__app, active: id => env.elements.get(id).classList.contains('active') };
}

test('stage intro lasts one second and the question timer excludes it', () => {
  const { env, app, active } = setup();
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 12;
  app.appSettings.range = '20';
  app.appSettings.operations = ['add', 'subtract'];
  const before = JSON.stringify(app.getProfile());
  app.startTrainingWithIntro();
  assert.equal(active('stageIntroScreen'), true);
  assert.equal(active('gameScreen'), false);
  assert.equal(app.trainingInProgress(), true, 'intro blocks imports and PWA reloads too');
  assert.equal(env.elements.get('stageIntroLabel').textContent, 'Stufe 12');
  assert.equal(env.elements.get('stageIntroTitle').textContent, 'Addition über den Zehner');
  assert.equal(JSON.stringify(app.getProfile()), before, 'intro awards no XP or progression');
  env.advance(999);
  assert.equal(active('stageIntroScreen'), true);
  env.advance(1);
  assert.equal(active('gameScreen'), true);
  assert.equal(active('stageIntroScreen'), false);
  assert.equal(app.state.stage, 12);
  assert.equal(app.state.startedAt, env.now());
  env.advance(2000);
  app.submitAnswer(app.state.problem.responseAnswer ?? app.state.problem.answer);
  assert.equal(app.state.results[0].seconds, 2);
});

test('leaving the intro cancels its pending start and repeated taps do not restart the second', () => {
  const { env, app, active } = setup();
  app.startTrainingWithIntro();
  env.advance(400);
  app.showScreen(env.elements.get('startScreen'));
  env.advance(1200);
  assert.equal(active('startScreen'), true);
  assert.equal(active('gameScreen'), false);
  assert.equal(app.trainingInProgress(), false);
  assert.equal(app.state.problem, null);
  app.startTrainingWithIntro();
  env.advance(400);
  app.startTrainingWithIntro();
  env.advance(600);
  assert.equal(active('gameScreen'), true);
  const sessionId = app.state.sessionId;
  env.advance(1000);
  assert.equal(app.state.sessionId, sessionId, 'only one session was started');
});

test('all 41 stage intros name the stage actually used by the session', () => {
  for (let stage = 1; stage <= 41; stage++) {
    const { env, app } = setup();
    const profile = app.getProfile();
    profile.currentStage = stage;
    app.saveProfile(profile);
    app.startTrainingWithIntro();
    assert.equal(env.elements.get('stageIntroLabel').textContent, `Stufe ${stage}`);
    assert.ok(env.elements.get('stageIntroTitle').textContent.length > 0);
    env.advance(1000);
    assert.equal(app.state.stage, stage);
  }
});
