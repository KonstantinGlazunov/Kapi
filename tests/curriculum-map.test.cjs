const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

test('all 41 stages belong to exactly one ordered nonempty chapter', () => {
  const env = environment();
  const map = new env.sandbox.KapiCurriculumMap();
  const chapters = Array.from(map.getChapters());
  assert.ok(chapters.length >= 11 && chapters.length <= 15);
  const stages = chapters.flatMap(chapter => {
    assert.ok(chapter.first <= chapter.last);
    assert.ok(chapter.de && chapter.ru && chapter.detailDe && chapter.detailRu);
    return Array.from({ length: chapter.last - chapter.first + 1 }, (_, index) => chapter.first + index);
  });
  assert.deepEqual(stages, Array.from({ length: 41 }, (_, index) => index + 1));
  assert.equal(new Set(chapters.map(chapter => chapter.id)).size, chapters.length);
  for (let stage = 1; stage <= 41; stage++) assert.equal(map.chapterForStage(stage)?.id, chapters.find(chapter => stage >= chapter.first && stage <= chapter.last).id);
});

test('current, completed, locked and chapter step depend only on curriculum stage', () => {
  const env = environment();
  const map = new env.sandbox.KapiCurriculumMap();
  const at1 = map.chaptersAt(1);
  assert.equal(at1[0].status, 'current');
  assert.ok(at1.slice(1).every(chapter => chapter.status === 'locked'));
  const at12 = map.chaptersAt(12);
  assert.equal(at12.find(chapter => chapter.id === 'plus-minus-20').status, 'current');
  assert.equal(at12.find(chapter => chapter.id === 'plus-minus-20').step, 3);
  assert.equal(at12.find(chapter => chapter.id === 'plus-minus-20').total, 5);
  assert.ok(at12.filter(chapter => chapter.last < 12).every(chapter => chapter.status === 'completed'));
  assert.ok(at12.filter(chapter => chapter.first > 12).every(chapter => chapter.status === 'locked'));
  const at41 = map.chaptersAt(41);
  assert.equal(at41.at(-1).status, 'current');
  assert.ok(at41.slice(0, -1).every(chapter => chapter.status === 'completed'));
});

test('map dialog shows Kapi at the current chapter without XP gating', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const profile = app.getProfile();
  profile.currentStage = 12;
  profile.totalXp = 0;
  app.saveProfile(profile);
  app.showCurriculumMap();
  const html = env.elements.get('mapChapters').innerHTML;
  assert.ok(html.includes('Plus & Minus bis 20'));
  assert.ok(html.includes('3 von 5 Schritten'));
  assert.ok(html.includes('class="map-chapter current"'));
  assert.ok(html.includes('class="map-chapter completed"'));
  assert.ok(html.includes('class="map-chapter locked"'));
  assert.ok(html.includes('assets/kapi-rig-v2/head.png'));
  assert.ok(!html.includes('XP'));
});

test('result names the next chapter when adaptive progression crosses its boundary', () => {
  const env = environment({ app: true });
  const app = env.sandbox.__app;
  const profile = app.getProfile();
  profile.currentStage = 10;
  app.saveProfile(profile);
  app.state.trainingStartStage = 9;
  app.state.stage = 10;
  app.state.stageAdvancedDuringSession = true;
  app.finishTraining();
  assert.ok(env.elements.get('resultNote').textContent.includes('Kapitel geschafft!'));
  assert.ok(env.elements.get('resultNote').textContent.includes('Plus & Minus bis 20'));
});
