const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment } = require('./helpers/environment.cjs');

const fixed = (value) => new Date(`${value}T12:00:00`);
const weekly = () => environment().sandbox.KapiWeeklyProgress;

test('local ISO weeks run Monday through Sunday across New Year and DST', () => {
  const w = weekly();
  assert.equal(w.getWeekKey(fixed('2020-12-28')), '2020-W53');
  assert.equal(w.getWeekKey(fixed('2021-01-03')), '2020-W53');
  assert.equal(w.getWeekKey(fixed('2021-01-04')), '2021-W01');
  assert.equal(w.getWeekKey(fixed('2026-12-31')), '2026-W53');
  assert.equal(w.getWeekKey(fixed('2027-01-01')), '2026-W53');
  assert.equal(w.getWeekKey(fixed('2027-01-04')), '2027-W01');
  assert.equal(w.getWeekKey(fixed('2026-03-29')), w.getWeekKey(fixed('2026-03-23')));
  assert.equal(w.getWeekKey(fixed('2026-03-30')), '2026-W14');
  const nearMidnight = new Date('2026-10-05T00:04:00+02:00');
  assert.equal(w.getWeekKey(nearMidnight), nearMidnight.getDay() === 1 ? '2026-W41' : '2026-W40');
});

test('Berlin midnight and DST boundaries follow the local completion date', () => {
  const priorTimezone = process.env.TZ;
  try {
    process.env.TZ = 'Europe/Berlin';
    const w = weekly();
    assert.deepEqual(['2026-10-04T23:58:00+02:00', '2026-10-05T00:04:00+02:00', '2026-03-29T03:05:00+02:00']
      .map(x => w.getWeekKey(new Date(x))), ['2026-W40', '2026-W41', '2026-W13']);
  } finally {
    if (priorTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = priorTimezone;
  }
});

test('sessions count once; only the threshold crossing raises the meta event', () => {
  const w = weekly();
  const profile = {};
  w.migrate(profile, [], fixed('2026-10-05'));
  assert.equal(profile.weeklyGoal, 3);
  for (const [id, completed] of [['A', false], ['A', false], ['B', false], ['C', true], ['D', false]]) {
    const result = w.recordCompletedSession(profile, id, fixed('2026-10-05'));
    assert.equal(result.weeklyGoalComplete, completed);
    assert.equal(result.event?.type || null, completed ? 'weeklyGoalComplete' : null);
  }
  assert.equal(w.getWeeklyProgress(profile, fixed('2026-10-05')).count, 4);
  assert.deepEqual([...profile.weeklySessions.days], ['2026-10-05']);
  const next = w.getWeeklyProgress(profile, fixed('2026-10-12'));
  assert.equal(next.count, 0);
  w.closePreviousWeek(profile, fixed('2026-10-12'));
  assert.equal(profile.weeklyHistory[0].sessions, 4);
  assert.equal(profile.weeklyHistory[0].completed, true);
  assert.deepEqual([...profile.weeklyHistory[0].sessionIds], ['A', 'B', 'C', 'D']);
  assert.equal(profile.weeklySessions.count, 0);
});

test('setting a lower goal never emits a celebration; new goals preserve the count', () => {
  const w = weekly();
  const profile = { weeklyGoal: 4 };
  w.migrate(profile, [], fixed('2026-10-05'));
  ['A', 'B', 'C'].forEach(id => w.recordCompletedSession(profile, id, fixed('2026-10-05')));
  profile.weeklyGoal = 3;
  assert.equal(w.getWeeklyProgress(profile, fixed('2026-10-05')).completed, true);
  assert.equal(w.recordCompletedSession(profile, 'D', fixed('2026-10-05')).weeklyGoalComplete, false);
  profile.weeklyGoal = 5;
  assert.equal(w.recordCompletedSession(profile, 'E', fixed('2026-10-05')).weeklyGoalComplete, true);
});

test('weekly history remains bounded and does not reset past achievements', () => {
  const w = weekly();
  const profile = {};
  let date = fixed('2026-01-05');
  w.migrate(profile, [], date);
  for (let index = 0; index < 14; index++) {
    for (let session = 0; session < 3; session++) w.recordCompletedSession(profile, `${index}:${session}`, date);
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 12);
    w.closePreviousWeek(profile, date);
  }
  assert.equal(profile.weeklyHistory.length, 12);
  assert.ok(profile.weeklyHistory.every(entry => entry.completed && entry.goal === 3));
  assert.equal(profile.weeklySessions.count, 0);
});

test('legacy profile migration restores only known current-week sessions', () => {
  const w = weekly();
  const profile = { totalXp: 163, currentStage: 12, dayStreak: 4, errorQueue: [{ key: 'x' }],
    equippedOutfit: { hat: 'hat-red' }, personalFastTime: 5.2 };
  const before = JSON.stringify(profile);
  const sessions = [
    { date: '2026-10-05T10:00:00', total: 20 },
    { date: '2026-10-06T10:00:00', total: 10 },
    { date: '2026-09-28T10:00:00', total: 20 }
  ];
  assert.equal(w.migrate(profile, sessions, fixed('2026-10-06')), true);
  assert.equal(profile.weeklySessions.count, 2);
  assert.equal(profile.weeklyHistory.length, 0);
  for (const [key, value] of Object.entries(JSON.parse(before))) assert.deepEqual(profile[key], value);
  assert.equal(w.migrate(profile, sessions, fixed('2026-10-06')), false);
});

test('history summarizes four calendar weeks and stage growth', () => {
  const w = weekly();
  const profile = { weeklyGoal: 3, weeklySessions: { weekKey: '2026-W41', count: 2, days: [], sessionIds: [] },
    weeklyHistory: [{ weekKey: '2026-W40', sessions: 3, goal: 3, completed: true }] };
  const history = [
    { date: '2026-10-06T10:00:00', total: 20, stageStart: 12, stageEnd: 13 },
    { date: '2026-09-29T10:00:00', total: 20, stageStart: 10, stageEnd: 12 }
  ];
  const summary = w.getHistorySummary(profile, history, fixed('2026-10-06'));
  assert.deepEqual({ thisWeek: summary.thisWeek, lastFourWeeks: summary.lastFourWeeks,
    stageStart: summary.stageStart, stageEnd: summary.stageEnd },
  { thisWeek: 2, lastFourWeeks: 5, stageStart: 10, stageEnd: 13 });
});

test('app counts only a finished session, persists goal, and never duplicates XP or completion', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const start = app.getProfile();
  const initial = start.weeklySessions.count;
  app.startTraining();
  assert.equal(app.getProfile().weeklySessions.count, initial);
  // A forced partial finish in older integration tests remains harmless for weekly progress.
  app.state.score = 2;
  app.finishTraining();
  assert.equal(app.getProfile().weeklySessions.count, initial);
  const xp = app.getProfile().totalXp;
  app.finishTraining();
  assert.equal(app.getProfile().totalXp, xp);
  app.handleSettingsChange({ target: { name: 'weeklyGoal', value: '4' } });
  assert.equal(app.getProfile().weeklyGoal, 4);
  const reload = environment({ app: true });
  for (const [key, value] of env.storage) reload.storage.set(key, value);
  assert.equal(reload.sandbox.__app.getProfile().weeklyGoal, 4);
  app.startTraining();
  app.state.results = Array.from({ length: 20 }, () => ({ firstTry: true, seconds: 3 }));
  app.state.correct = 20;
  app.finishTraining();
  assert.equal(app.getProfile().weeklySessions.count, initial + 1);
  const recorded = app.getHistory()[0];
  assert.equal(recorded.completed, true);
  assert.equal(recorded.stageStart, recorded.stageEnd);
  assert.equal(app.saveSession(recorded).weeklyGoalComplete, false);
  const endXp = app.getProfile().totalXp;
  app.finishTraining();
  assert.equal(app.getProfile().totalXp, endXp);
  assert.equal(app.getProfile().weeklySessions.count, initial + 1);
});

test('a completed third session reveals the weekly goal once after the final animation', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const profile = app.getProfile();
  profile.weeklySessions.count = 2;
  profile.weeklySessions.sessionIds = ['A', 'B'];
  app.saveProfile(profile);
  app.startTraining();
  app.state.results = Array.from({ length: 20 }, () => ({ firstTry: false, seconds: 5 }));
  app.finishTraining();
  assert.equal(app.getProfile().weeklySessions.count, 3);
  assert.equal(env.elements.get('weeklyResult').classList.contains('hidden'), true);
  env.advance(2100);
  assert.ok(env.elements.get('rewardReveal').innerHTML.includes('Wochenziel geschafft'));
  assert.equal(app.machine.state, 'rewardReveal');
  env.advance(1600);
  assert.equal(env.elements.get('weeklyResult').textContent, 'Wochenziel geschafft!');
  app.finishTraining();
  assert.equal(app.getProfile().weeklySessions.count, 3);
});

test('reward and weekly goal share one reveal and one sound before the next target', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const profile = app.getProfile();
  profile.totalXp = 19;
  profile.weeklySessions.count = 2;
  profile.weeklySessions.sessionIds = ['A', 'B'];
  app.saveProfile(profile);
  const sounds = [];
  app.sound.play = type => sounds.push(type);
  app.startTraining();
  app.state.results = Array.from({ length: 20 }, () => ({ firstTry: false, seconds: 5 }));
  app.state.score = 1;
  app.finishTraining();
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), true);
  env.advance(2100);
  const reveal = env.elements.get('rewardReveal').innerHTML;
  assert.ok(reveal.includes('Großer Fortschritt'));
  assert.ok(reveal.includes('Wochenziel geschafft'));
  assert.ok(reveal.includes('Stern-Abzeichen'));
  assert.equal(sounds.filter(type => type === 'rewardUnlock').length, 1);
  env.advance(1600);
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), false);
});

test('legacy app migration retains progress and restores current-week sessions from history', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const legacy = app.getProfile();
  delete legacy.weeklyGoal;
  delete legacy.weeklySessions;
  delete legacy.weeklyHistory;
  Object.assign(legacy, { totalXp: 163, dayStreak: 4, currentStage: 12, personalFastTime: 5.2,
    errorQueue: [{ key: 'x' }], unlockedRewards: ['badge-star', 'hat-red', 'glasses', 'neck-scarf'],
    equippedOutfit: { ...legacy.equippedOutfit, hat: 'hat-red' } });
  const today = new Date().toISOString();
  env.storage.set('capy-count-profile-v1', JSON.stringify(legacy));
  env.storage.set('capy-count-history-v1', JSON.stringify([{ id: 'old', date: today, total: 20, correct: 18, stage: 11 }]));
  const loaded = app.getProfile();
  assert.equal(loaded.weeklyGoal, 3);
  assert.equal(loaded.weeklySessions.count, 1);
  for (const key of ['totalXp', 'dayStreak', 'currentStage', 'personalFastTime']) assert.equal(loaded[key], legacy[key]);
  assert.equal(loaded.equippedOutfit.hat, 'hat-red');
  assert.equal(loaded.errorQueue[0].key, 'x');
});

test('home copy and offline cache include weekly goal in both languages', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const profile = app.getProfile();
  const count = profile.weeklySessions.count;
  assert.ok(env.elements.get('weeklyDetail').textContent.includes('Erstes Training'));
  for (const target of [1, 3, 4]) {
    profile.weeklySessions.count = target;
    app.saveProfile(profile);
    app.updateHomeStats();
    assert.ok(env.elements.get('weeklyDetail').textContent.includes(target === 3 ? 'geschafft' : `${target}`));
  }
  profile.weeklySessions.count = count;
  app.saveProfile(profile);
  app.handleSettingsChange({ target: { name: 'language', value: 'ru' } });
  assert.equal(env.elements.get('weeklyLabel').textContent, 'На этой неделе');
  assert.ok(env.elements.get('weeklyDetail').textContent.includes('Первое занятие'));
  const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'dist', 'sw.js'), 'utf8');
  assert.ok(html.includes('src="kapi-weekly.js"'));
  assert.ok(sw.includes('"kapi-weekly.js"'));
});
