const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');

function setup(app = false) {
  const env = environment({ app });
  const system = new env.sandbox.KapiRewardSystem();
  return { env, system, app: env.sandbox.__app };
}

test('eight ordered cumulative XP rewards and next reachable goal', () => {
  const { system } = setup();
  assert.deepEqual(Array.from(system.getRewards(), ({ xp, slot }) => [xp, slot]), [
    [20, 'badge'], [50, 'hat'], [90, 'glasses'], [140, 'neck'], [200, 'back'],
    [280, 'hat'], [380, 'badge'], [500, 'hat']
  ]);
  for (const [xp, target, remaining] of [[0, 20, 20], [19, 20, 1], [20, 50, 30],
    [49, 50, 1], [50, 90, 40], [499, 500, 1]]) {
    const next = system.getNextReward(xp);
    assert.equal(next.targetXp, target);
    assert.equal(next.remainingXp, remaining);
    assert.equal(next.progress, xp / target);
  }
  assert.equal(system.getNextReward(500).allUnlocked, true);
  assert.equal(system.getNextReward(700).allUnlocked, true);
});

test('every XP boundary opens once and XP is never spent', () => {
  const { system } = setup();
  const profile = { totalXp: 0 };
  system.migrate(profile);
  for (const reward of system.getRewards()) {
    const before = reward.xp - 1;
    profile.totalXp = before;
    assert.equal(system.unlock(profile, before - 1, before).length, 0);
    profile.totalXp = reward.xp;
    const events = system.unlock(profile, before, reward.xp);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'rewardUnlocked');
    assert.equal(events[0].rewardId, reward.id);
    assert.equal(system.unlock(profile, before, reward.xp).length, 0);
    assert.equal(profile.totalXp, reward.xp);
  }
  assert.equal(profile.unlockedRewards.length, 8);
});

test('one large XP gain opens three items as one batch without duplication', () => {
  const { system } = setup();
  const profile = { totalXp: 10 };
  system.migrate(profile);
  assert.deepEqual(Array.from(system.unlock(profile, 10, 100), event => event.rewardId), ['badge-star', 'hat-red', 'glasses']);
  assert.equal(system.unlock(profile, 10, 100).length, 0);
});

test('legacy profile migration preserves all learning and pace fields without banners', () => {
  const { env, app } = setup(true);
  const profile = app.getProfile();
  Object.assign(profile, { totalXp: 163, currentStage: 12, errorQueue: [{ key: 'test' }],
    personalFastTime: 5.2, bestPersonalFastTime: 5, dayStreak: 4 });
  delete profile.unlockedRewards;
  delete profile.equippedOutfit;
  app.saveProfile(profile);
  env.storage.set('capy-count-history-v1', '[{"score":12}]');
  const loaded = app.getProfile();
  assert.deepEqual(Array.from(loaded.unlockedRewards), ['badge-star', 'hat-red', 'glasses', 'neck-scarf']);
  assert.deepEqual(Array.from(loaded.equippedOutfit ? Object.values(loaded.equippedOutfit) : []), [null, null, null, null, null]);
  assert.equal(loaded.currentStage, 12);
  assert.equal(loaded.errorQueue[0].key, 'test');
  assert.equal(loaded.personalFastTime, 5.2);
  assert.equal(loaded.bestPersonalFastTime, 5);
  assert.equal(loaded.dayStreak, 4);
  assert.equal(app.getHistory()[0].score, 12);
  assert.equal(env.sandbox.document.getElementById('rewardReveal').innerHTML, '');
  assert.ok(!loaded.unlockedRewards.includes('backpack'));
});

test('equip persists, replaces same slot, unequips and rejects locked item', () => {
  const { system, app } = setup(true);
  const profile = app.getProfile();
  profile.totalXp = 300;
  system.unlock(profile, 0, 300);
  assert.equal(system.equip(profile, 'crown'), false);
  assert.equal(system.equip(profile, 'hat-red'), true);
  app.saveProfile(profile);
  assert.equal(app.getProfile().equippedOutfit.hat, 'hat-red');
  assert.equal(system.equip(profile, 'hat-blue'), true);
  app.saveProfile(profile);
  assert.equal(app.getProfile().equippedOutfit.hat, 'hat-blue');
  assert.equal(system.unequip(profile, 'hat'), true);
  app.saveProfile(profile);
  assert.equal(app.getProfile().equippedOutfit.hat, null);
});

test('session party hat only overrides during its scene; permanent cap returns', () => {
  const { system, env, app } = setup(true);
  const profile = app.getProfile();
  system.unlock(profile, 0, 50);
  system.equip(profile, 'hat-red');
  const party = { hat: 'party' };
  assert.equal(system.getEffectiveOutfit(profile, party, 'horn').hat, 'party');
  assert.equal(system.getEffectiveOutfit(profile, party, 'idle').hat, 'hat-red');
  assert.equal(profile.equippedOutfit.hat, 'hat-red');
  const animator = app.machine.animator;
  animator.setOutfit(profile.equippedOutfit, party);
  assert.equal(animator.effectiveOutfit('horn').hat, 'party');
  assert.equal(animator.effectiveOutfit('correct').hat, 'hat-red');
  for (const scene of ['idle', 'correct', 'wrong', 'dance']) {
    const pose = animator.pose(scene, 350, 'hop');
    const limbs = animator.limbPose(scene, 350, 'hop');
    for (const slot of ['hat', 'glasses', 'neck', 'back', 'badge']) {
      assert.ok(Object.values(animator.getAttachmentTransform(slot, pose, limbs)).every(Number.isFinite), `${scene}/${slot}`);
    }
  }
  assert.equal(env.sandbox.KAPI_REWARDS.length, 8);
});

test('completion groups all unlocks after final scene and emits one sound', () => {
  const { env, app } = setup(true);
  const profile = app.getProfile();
  profile.totalXp = 10;
  app.saveProfile(profile);
  const sounds = [];
  app.sound.play = (type) => sounds.push(type);
  app.state.score = 90;
  app.state.correct = 0;
  app.state.results = [];
  app.state.stage = 1;
  app.finishTraining();
  assert.equal(app.getProfile().totalXp, 100);
  assert.equal(env.elements.get('rewardReveal').classList.contains('hidden'), true);
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), true, 'next goal waits for the reveal');
  assert.equal(env.elements.get('resultRewardText').textContent, '100 / 140 XP');
  env.advance(2100);
  assert.equal(env.elements.get('rewardReveal').classList.contains('hidden'), false);
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), true);
  assert.equal(app.machine.state, 'rewardReveal');
  assert.ok(env.elements.get('rewardReveal').innerHTML.includes('3 neue Sachen'));
  assert.equal(sounds.filter((type) => type === 'rewardUnlock').length, 1);
  assert.equal(app.getProfile().unlockedRewards.length, 3);
  assert.equal(app.getProfile().equippedOutfit.hat, 'hat-red');
  assert.equal(app.getProfile().equippedOutfit.glasses, 'glasses');
  env.advance(1500);
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), false);
  assert.equal(app.machine.state, 'trainingFinished');
  assert.ok(env.elements.get('resultRewardNext').textContent.includes('Noch 40 XP'));
});

test('no new item shows the next goal immediately and does not play reward scene', () => {
  const { env, app } = setup(true);
  app.state.score = 1;
  app.state.results = [];
  app.finishTraining();
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), false);
  env.advance(4000);
  assert.equal(env.elements.get('rewardReveal').classList.contains('hidden'), true);
  assert.equal(app.machine.state, 'trainingFinished');
});

test('reward reaction shows item with finite motion and reduced-motion static pose', () => {
  const { app } = setup(true);
  const animator = app.machine.animator;
  const normal = animator.pose('rewardReveal', 800, 'hop');
  assert.ok(Object.values(normal).every(Number.isFinite));
  assert.notEqual(normal.y, 0);
  assert.equal(animator.headAsset('rewardReveal', 'hop'), 'headCheer');
  animator.reducedMotion = true;
  const staticPose = animator.pose('rewardReveal', 800, 'hop');
  assert.equal(staticPose.y, 0);
  assert.ok(Object.values(animator.limbPose('rewardReveal', 800, 'hop')).every(Number.isFinite));
  const entry = animator.loadImage('assets/cosmetics/star-badge.svg');
  entry.ready = true;
  let drawn = 0;
  const context = { save() {}, restore() {}, translate() {}, beginPath() {}, arc() {}, fill() {}, drawImage() { drawn++; } };
  animator.drawEffects({ context, canvas: { width: 150, height: 150 }, rewardAsset: 'star-badge' }, 'rewardReveal', 800, 'hop');
  assert.equal(drawn, 1);
});

test('perfect final scene finishes before reward reveal; leaving result cancels the later goal', () => {
  const { env, app } = setup(true);
  const profile = app.getProfile();
  profile.totalXp = 19;
  app.saveProfile(profile);
  app.state.score = 20;
  app.state.correct = 20;
  app.state.results = Array.from({ length: 20 }, () => ({ firstTry: true, seconds: 3 }));
  app.finishTraining();
  assert.equal(app.machine.state, 'perfectTraining');
  env.advance(2400);
  assert.equal(app.machine.state, 'trainingFinished');
  assert.equal(env.elements.get('rewardReveal').classList.contains('hidden'), true);
  env.advance(100);
  assert.equal(app.machine.state, 'rewardReveal');
  app.showScreen(env.elements.get('startScreen'));
  env.advance(1700);
  assert.equal(env.elements.get('resultRewardProgress').classList.contains('hidden'), true);
});

test('muted unlock tone is suppressed by the existing sound manager', () => {
  const { app } = setup(true);
  app.state.sound = false;
  assert.equal(app.sound.play('rewardUnlock'), false);
});

test('cosmetic render pass uses cached images for idle, correct, wrong and dance', () => {
  const { app } = setup(true);
  const animator = app.machine.animator;
  const imageCount = animator.images.size;
  const drawn = [];
  const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage(image, ...bounds) { drawn.push(bounds); } };
  for (const scene of ['idle', 'correct', 'wrong', 'dance']) {
    const pose = animator.pose(scene, 200, 'hop');
    const limbs = animator.limbPose(scene, 200, 'hop');
    const item = app.machine.animator.loadImage('assets/cosmetics/red-cap.svg');
    item.ready = true;
    animator.drawCosmetic(context, 'hat', 'hat-red', pose, limbs);
  }
  assert.equal(drawn.length, 4);
  assert.ok(drawn.flat().every(Number.isFinite));
  assert.equal(animator.images.size, imageCount);
});

test('home state and wardrobe distinguish locked, unlocked, equipped with localized labels', () => {
  const { env, app } = setup(true);
  assert.equal(env.elements.get('homeRewardText').textContent, '0 / 20 XP');
  assert.equal(env.elements.get('homeRewardNext').textContent, 'Erstes Abzeichen wartet!');
  app.showWardrobe();
  const html = env.elements.get('wardrobeItems').innerHTML;
  assert.ok(html.includes('Mein Kapi') === false);
  assert.ok(html.includes('🔒 20 XP'));
  assert.ok(html.includes('disabled'));
  assert.ok(html.includes('aria-pressed'));
  assert.ok(html.includes('assets/cosmetics/'));
});

test('assets are preloaded once and all eight cosmetics cached for offline use', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.ok(sw.includes('kapi-rewards.js'));
  assert.ok(html.includes('src="kapi-rewards.js"'));
  assert.ok(css.includes('prefers-reduced-motion: reduce'));
  for (const reward of setup().system.getRewards()) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'cosmetics', `${reward.asset}.svg`)));
    assert.ok(sw.includes(reward.asset));
  }
});
