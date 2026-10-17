const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function fixture() {
  const env = environment({ app: true });
  const store = env.sandbox.KapiStorage.create(() => env.sandbox.localStorage);
  const app = env.sandbox.__app;
  return { env, store, app, data: { profile: app.getProfile(), settings: { ...app.appSettings }, history: [] } };
}

test('quota and denied reads keep the current session usable and show a warning', () => {
  const { env, app } = fixture();
  env.sandbox.localStorage.setItem = () => { throw new Error('quota'); };
  const profile = app.getProfile(); profile.totalXp = 321;
  app.saveProfile(profile);
  assert.equal(app.getProfile().totalXp, 321);
  assert.equal(env.elements.get('storageNotice').hidden, false);
  env.sandbox.localStorage.getItem = () => { throw new Error('denied'); };
  app.startTraining();
  assert.ok(app.state.problem);
  app.finishTraining();
  assert.equal(app.getHistory().length, 1);
});

test('corrupt stored JSON is preserved instead of overwritten by migration', () => {
  const { env, app } = fixture();
  const key = 'capy-count-profile-v1';
  env.storage.set(key, '{broken');
  const profile = app.getProfile(); profile.totalXp = 7; app.saveProfile(profile);
  assert.equal(env.storage.get(key), '{broken');
  assert.equal(app.getProfile().totalXp, 7);
});

test('curriculum migration preserves the stage, XP, review queue and learning data', () => {
  const { env, app, data } = fixture();
  const profile = data.profile;
  Object.assign(profile, { curriculumVersion: 1, currentStage: 12, totalXp: 99, errorQueue: [{ key: '8 + 5 = ?', a: 8, b: 5 }] });
  env.storage.set('capy-count-profile-v1', JSON.stringify(profile));
  const migrated = app.getProfile();
  assert.equal(migrated.currentStage, 12);
  assert.equal(migrated.totalXp, 99);
  assert.equal(migrated.errorQueue[0].key, '8 + 5 = ?');
  assert.equal(migrated.curriculumVersion, 2);
});

test('backup roundtrip retains settings, progress and history across a new storage instance', () => {
  const { env, store, data } = fixture();
  data.profile.totalXp = 246;
  data.profile.currentStage = 12;
  data.settings.language = 'ru';
  const parsed = store.validateBackup(store.exportBackup(data), data.profile);
  assert.equal(store.importBackup(parsed), true);
  const fresh = env.sandbox.KapiStorage.create(() => env.sandbox.localStorage);
  assert.equal(fresh.readJSON('capy-count-profile-v1').totalXp, 246);
  assert.equal(fresh.readJSON('capy-count-settings-v1').language, 'ru');
  fresh.setItem('capy-count-profile-v1', JSON.stringify({ ...data.profile, totalXp: 247 }));
  assert.equal(store.readJSON('capy-count-profile-v1').totalXp, 247);
});

test('failed import changes neither durable data nor the current in-memory profile', () => {
  const { env, store, data } = fixture();
  const before = store.getItem('capy-count-profile-v1');
  const diskBefore = [...env.storage];
  data.profile.totalXp = 999;
  env.sandbox.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(store.importBackup(data), false);
  assert.equal(store.getItem('capy-count-profile-v1'), before);
  assert.deepEqual([...env.storage], diskBefore);
});

test('invalid, oversized, future, dangerous and structurally corrupt backups are rejected', () => {
  const { store, data } = fixture();
  for (const mutate of [
    b => b.version = 2,
    b => b.data.profile.currentStage = '12',
    b => b.data.profile.skillMastery = { bad: 'not-a-record' },
    b => b.data.profile.errorQueue = [null],
    b => b.data.settings.operations = ['unknown'],
    b => b.data.history = [{ date: 'broken' }],
    b => b.data.profile.totalXp = -1,
    b => b.data.profile.personalFastTime = {},
    b => b.data.profile.weeklySessions.days = null,
    b => b.data.profile.operationStats = { add: ['bad'] },
    b => b.data.history = [{ date: new Date().toISOString(), correct: '<img>', total: 20, average: 1, score: 0 }],
  ]) {
    const backup = JSON.parse(store.exportBackup(data)); mutate(backup);
    assert.throws(() => store.validateBackup(JSON.stringify(backup), data.profile));
  }
  assert.throws(() => store.validateBackup('{', data.profile));
  assert.throws(() => store.validateBackup(' '.repeat(2 * 1024 * 1024 + 1), data.profile));
  assert.throws(() => store.validateBackup('{"__proto__":{},"format":"kapi-backup"}', data.profile));
});


test('backups retain actual review problems from all 41 stages, including fraction operands', () => {
  const { store, data, app } = fixture();
  for (let stage = 1; stage <= 41; stage++) {
    const profile = app.getProfile(); profile.currentStage = stage;
    app.saveProfile(profile); app.state.stage = stage;
    const problem = app.makeCurriculumProblem(stage, 0, profile);
    app.registerProblemError(problem);
  }
  data.profile = app.getProfile();
  assert.equal(store.validateBackup(store.exportBackup(data), data.profile).profile.errorQueue.length, data.profile.errorQueue.length);
});
