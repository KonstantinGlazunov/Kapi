const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');

function rig() {
  const env = environment();
  const sounds = [], plays = [], reactions = [];
  const animator = { setSurface() {}, setLoop() {}, stop() {}, play: (...args) => plays.push(args) };
  const machine = new env.sandbox.KapiStateMachine(animator, { random: () => 0, soundPlayer: x => sounds.push(x) });
  const motivation = new env.sandbox.KapiMotivationController(machine, { random: () => 0, onReaction: r => reactions.push(r) });
  return { ...env, machine, motivation, sounds, plays, reactions, animator };
}

test('one answer selects one reaction, preserving every earned session reward', () => {
  const r = rig();
  const chosen = r.motivation.handle(['correct', 'streak6', 'streak10', 'levelUp'], { batchId: 'one' });
  assert.equal(chosen.type, 'levelUp');
  assert.deepEqual(r.sounds, ['levelUp']);
  assert.equal(r.motivation.getOutfit().medal, 'star');
  assert.equal(r.motivation.getOutfit().hat, 'party');
  assert.equal(r.motivation.handle(['levelUp'], { batchId: 'one' }), null);
  r.advance(1500); assert.equal(r.machine.state, 'dance');
  assert.equal(r.plays.at(-1)[1].headAsset, 'headLevel', 'level-up cap stays on during its dance continuation');
  assert.deepEqual(r.sounds, ['levelUp'], 'continuation must be silent');
  r.advance(2400); assert.equal(r.machine.state, 'idle');
  r.motivation.handle(['wrong']);
  assert.equal(r.motivation.getOutfit().medal, 'star');
  r.motivation.resetSession(); assert.equal(Object.keys(r.motivation.getOutfit()).length, 0);
});

test('perfect completion outranks final-answer milestones, looping silently', () => {
  const r = rig();
  r.motivation.handle(['correct', 'streak10', 'levelUp', { type: 'trainingComplete', total: 10 }, 'perfectTraining'], { surface: 'result' });
  assert.equal(r.machine.state, 'perfectTraining');
  r.advance(2400);
  assert.equal(r.machine.state, 'trainingFinished');
  assert.equal(r.plays.at(-1)[1].headAsset, 'headPerfect', 'perfect crown stays on for the continuous dance');
  r.advance(20000);
  assert.deepEqual(r.sounds, ['perfect']);
  assert.equal(r.machine.trigger('correct'), false);
  assert.equal(r.motivation.getOutfit().special, 'perfect');
});

test('speed and record events obey priority and select one scene per answer', () => {
  for (const [events, expected, sound] of [
    [['correct', 'speedImproved'], 'speedImproved', 'speedImproved'],
    [['correct', 'speedImproved', 'personalRecord'], 'personalRecord', 'personalRecord'],
    [['personalRecord', 'levelUp'], 'levelUp', 'levelUp'],
    [['personalRecord', { type: 'trainingComplete', total: 20 }, 'perfectTraining'], 'perfectTraining', 'perfect']
  ]) {
    const r = rig();
    const chosen = r.motivation.handle(events, { batchId: 'answer' });
    assert.equal(chosen.type, expected);
    assert.deepEqual(r.sounds, [sound]);
    assert.equal(r.reactions.length, 1);
    assert.equal(r.motivation.handle(events, { batchId: 'answer' }), null);
  }
});

test('speed sound obeys mute and reduced motion keeps readable static poses', () => {
  const { sandbox } = environment();
  const ctx = audioContext();
  let enabled = false;
  const sound = new sandbox.KapiSoundManager({ isEnabled: () => enabled, contextFactory: () => ctx });
  sound.unlock();
  assert.equal(sound.play('speedImproved'), false);
  assert.equal(sound.play('personalRecord'), false);
  assert.equal(ctx.nodes.length, 0);
  enabled = true;
  sound.unlock();
  assert.equal(sound.play('speedImproved'), true);
  assert.ok(ctx.nodes.length > 0);
  sound.setEnabled(false);
  enabled = false;
  assert.equal(sound.play('personalRecord'), false);

  const animator = Object.create(sandbox.CanvasKapiAnimator.prototype);
  animator.reducedMotion = true;
  for (const scene of ['speedImproved', 'personalRecord']) {
    assert.deepEqual(animator.pose(scene, 0), animator.pose(scene, 1000));
    assert.deepEqual(animator.limbPose(scene, 0), animator.limbPose(scene, 1000));
    assert.notEqual(animator.headAsset(scene), 'head');
  }
});

test('10, 20 and 30 task completions have separate duration and sound', () => {
  for (const [total, duration] of [[10, 1400], [20, 1900], [30, 2300]]) {
    const r = rig();
    r.motivation.handle([{ type: 'trainingComplete', total }]);
    r.advance(duration - 1); assert.equal(r.machine.state, 'completion');
    r.advance(1); assert.equal(r.machine.state, 'trainingFinished');
    assert.equal(r.plays.at(-1)[1].headAsset, 'headComplete', 'laurel stays on for the continuous dance');
    assert.deepEqual(r.sounds, [`complete${total}`]);
  }
});

test('rapid feedback replaces feedback and never queues behind a celebration', () => {
  const r = rig();
  const a = r.motivation.handle(['correct']);
  r.advance(100);
  const b = r.motivation.handle(['correct']);
  assert.notEqual(a.variant, b.variant);
  assert.ok(r.motivation.handle(['wrong']));
  assert.ok(r.motivation.handle(['correct']), 'a corrected retry replaces the error gesture');
  r.motivation.handle(['streak6']);
  assert.equal(r.motivation.handle(['correct']), null);
  assert.equal(r.motivation.handle(['wrong']), null);
  assert.equal(r.machine.queue.length, 0);
  r.advance(2100);
  assert.equal(r.machine.state, 'idle');
  assert.deepEqual(r.sounds, ['correct', 'correct', 'wrong', 'correct', 'party']);
});

test('demo can request each ordinary reaction explicitly', () => {
  const r = rig();
  for (const variant of ['nod', 'hop', 'cheer']) {
    assert.equal(r.motivation.handle([{ type: 'correct', variant }]).variant, variant);
  }
});

test('idle micro gestures alternate and reduced-motion skips them', () => {
  const r = rig();
  r.advance(3200); assert.equal(r.machine.state, 'idleHeadMove');
  r.advance(1200 + 3200); assert.equal(r.machine.state, 'idleLookLeft');
  r.animator.reducedMotion = true;
  r.machine.reset(); r.advance(10000); assert.equal(r.machine.state, 'idle');
});

test('continuous final transitions and interrupted poses have no jumps', () => {
  const { sandbox } = environment();
  const animator = Object.create(sandbox.CanvasKapiAnimator.prototype);
  animator.reducedMotion = false;
  for (const [state, boundary] of [['completion', 600], ['perfectTraining', 800]]) {
    for (const method of ['pose', 'limbPose']) {
      const a = animator[method](state, boundary - .001), b = animator[method](state, boundary);
      for (const key of Object.keys(a)) assert.ok(Math.abs(a[key] - b[key]) < .001, `${state} ${method}.${key}`);
    }
  }
  for (const state of Object.keys(sandbox.KAPI_STATE_CONFIG)) {
    for (let t = 0; t <= 3200; t += 16) {
      for (const method of ['pose', 'limbPose']) assert.ok(Object.values(animator[method](state, t)).every(Number.isFinite));
    }
  }
  const record = { state: 'correct', variant: 'cheer', stateStartedAt: 0, transitionDuration: 180 };
  const before = animator.snapshot(record, 250);
  Object.assign(record, { state: 'wrong', transitionFrom: before, transitionStartedAt: 250, stateStartedAt: 250 });
  assert.deepEqual(animator.snapshot(record, 250), before);
  animator.reducedMotion = true;
  assert.deepEqual(animator.pose('dance', 0), animator.pose('dance', 300));
  assert.deepEqual(animator.limbPose('dance', 0), animator.limbPose('dance', 300));
});

test('wrong reaction reaches behind the head, scratches three times, then returns', () => {
  const { sandbox } = environment();
  const animator = Object.create(sandbox.CanvasKapiAnimator.prototype);
  animator.reducedMotion = false;
  const raised = animator.limbPose('wrong', 360);
  const held = animator.limbPose('wrong', 1200);
  const returned = animator.limbPose('wrong', 1500);
  assert.ok(raised.rightShoulder < -.5 && held.rightShoulder < -.5, 'paw stays raised during scratching');
  assert.ok(Math.abs(returned.rightShoulder + .04) < .001, 'paw returns to idle');
  const elbows = [480, 600, 720, 840, 960, 1080].map(time => animator.limbPose('wrong', time).rightElbow);
  for (let index = 1; index < elbows.length - 1; index += 1) {
    const before = elbows[index] - elbows[index - 1];
    const after = elbows[index + 1] - elbows[index];
    assert.ok(before * after < 0, `scratch direction changes at phase ${index}`);
  }
});

test('ordinary reactions select distinct complete head layers', () => {
  const { sandbox } = environment();
  const animator = Object.create(sandbox.CanvasKapiAnimator.prototype);
  assert.equal(animator.headAsset('correct', 'nod'), 'headNod');
  assert.equal(animator.headAsset('correct', 'hop'), 'headHop');
  assert.equal(animator.headAsset('correct', 'cheer'), 'headCheer');
  assert.equal(animator.headAsset('wrong'), 'headWrong');
  assert.equal(animator.headAsset('errorRecovered'), 'headRecovered');
  assert.equal(animator.headAsset('errorMastered'), 'headMastered');
  assert.equal(animator.headAsset('flag'), 'headFlag');
  assert.equal(animator.headAsset('horn'), 'headHorn');
  assert.equal(animator.headAsset('dance'), 'headDance');
  assert.equal(animator.headAsset('levelUp'), 'headLevel');
  assert.equal(animator.headAsset('completion'), 'headComplete');
  assert.equal(animator.headAsset('perfectTraining'), 'headPerfect');
  assert.equal(animator.headAsset('idle'), 'head');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const name of ['head-nod.png', 'head-hop.png', 'head-cheer.png', 'head-wrong.png', 'head-recovered.png', 'head-mastered.png', 'head-flag.png', 'head-horn-v2.png', 'arm-right-flag.png', 'head-dance.png', 'head-level.png', 'head-complete.png', 'head-perfect.png']) {
    assert.ok(fs.existsSync(path.join(root, 'assets/kapi-rig-v2', name)), name);
    assert.ok(sw.includes(name), `${name} must work offline`);
  }
});

function audioContext() {
  const nodes = [];
  const sources = [];
  const ctx = { currentTime: 0, state: 'running', destination: {}, nodes, sources };
  ctx.createGain = () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, disconnect() {}, connect() {} });
  ctx.createOscillator = () => {
    const node = { frequency: {}, connect(gain) { return gain; }, start() {}, stop(at) { if (at == null) this.cancelled = true; }, disconnect() {} };
    nodes.push(node); return node;
  };
  ctx.createBufferSource = () => {
    const source = { playbackRate: { value: 1 }, connect(gain) { return gain; }, start() { this.started = true; }, stop() { this.cancelled = true; }, disconnect() {} };
    sources.push(source); return source;
  };
  return ctx;
}

test('audio respects user gesture, priority, mute and unavailable audio', () => {
  const { sandbox } = environment();
  let enabled = true;
  const ctx = audioContext();
  const sound = new sandbox.KapiSoundManager({ isEnabled: () => enabled, contextFactory: () => ctx });
  assert.equal(sound.play('correct'), false);
  sound.unlock(); assert.equal(sound.play('correct'), true);
  const feedbackNodes = [...ctx.nodes];
  assert.equal(sound.play('perfect'), true);
  assert.ok(feedbackNodes.every(n => n.cancelled));
  assert.equal(sound.play('correct'), false);
  assert.equal(sound.play('party'), false);
  enabled = false; sound.setEnabled(false);
  assert.ok(ctx.nodes.every(n => n.cancelled), 'mute also stops scheduled notes');
  assert.equal(sound.play('perfect'), false);
  assert.ok([...sound.channels.values()].every(set => set.size === 0));
  const unavailable = new sandbox.KapiSoundManager({ contextFactory: () => { throw Error('no audio'); } });
  unavailable.unlock(); assert.equal(unavailable.play('correct'), false);
});

test('audio variants alternate and completed nodes are released', () => {
  const { sandbox } = environment(), ctx = audioContext();
  const sound = new sandbox.KapiSoundManager({ random: () => 0, contextFactory: () => ctx });
  sound.unlock(); sound.play('correct');
  const first = ctx.nodes[0].frequency.value;
  ctx.nodes.forEach(n => n.onended());
  assert.equal(sound.channels.get('feedback').size, 0);
  sound.play('correct'); assert.notEqual(first, ctx.nodes[2].frequency.value);
});

test('loaded scene samples replace oscillator patterns and remain interruptible', () => {
  const { sandbox } = environment(), ctx = audioContext();
  const sound = new sandbox.KapiSoundManager({ contextFactory: () => ctx });
  sound.unlock();
  sound.samples.set('party', { duration: 1.18 });
  assert.equal(sound.play('party'), true);
  assert.equal(ctx.sources.length, 1);
  assert.equal(ctx.sources[0].started, true);
  sound.setEnabled(false);
  assert.equal(ctx.sources[0].cancelled, true);
});

test('application completes 10/20/30 answers once, with only one final cue', () => {
  for (const total of [10, 20, 30]) {
    const env = environment({ app: true }), app = env.sandbox.__app;
    env.advance(360);
    app.appSettings.problemCount = total;
    app.appSettings.automatic = false;
    app.appSettings.manualStage = 1;
    const sounds = []; app.sound.play = type => sounds.push(type);
    app.startTraining();
    for (let i = 0; i < total; i++) {
      const count = sounds.length;
      app.submitAnswer(app.state.problem.answer);
      app.submitAnswer(app.state.problem.answer); // Duplicate tap is ignored.
      if (i === total - 1) assert.equal(sounds.length, count, 'final answer waits for aggregated finale');
      env.advance(350);
      assert.equal(app.state.index, i + 1);
    }
    assert.equal(app.getHistory().length, 1);
    assert.equal(app.getHistory()[0].perfect, true);
    assert.equal(app.getHistory()[0].total, total);
    assert.equal(app.machine.state, 'perfectTraining');
    assert.equal(sounds.filter(x => x === 'perfect').length, 1);
    assert.equal(sounds.filter(x => x.startsWith('complete')).length, 0);
    env.advance(10000);
    assert.equal(app.getHistory().length, 1);
  }
});

test('error recovery comes from two actual first-try repeats; retry is not perfect', () => {
  const env = environment({ app: true }), app = env.sandbox.__app;
  app.appSettings.automatic = false; app.appSettings.problemCount = 10;
  app.startTraining();
  const problem = { ...app.state.problem };
  app.submitAnswer(problem.answer + 1);
  assert.equal(app.getProfile().errorQueue.find(x => x.key === problem.key).correctStreak, 0);
  app.submitAnswer(problem.answer);
  assert.equal(app.state.results[0].firstTry, false);
  assert.equal(app.getProfile().errorQueue.find(x => x.key === problem.key).correctStreak, 0);
  assert.equal(app.registerCorrectAnswer(problem), 'errorRecovered');
  assert.equal(app.registerCorrectAnswer(problem), 'errorMastered');
  assert.equal(app.getProfile().errorQueue.some(x => x.key === problem.key), false);
  assert.equal(app.registerCorrectAnswer(problem), '');
  env.advance(350);
  for (let i = 1; i < 10; i++) { app.submitAnswer(app.state.problem.answer); env.advance(350); }
  assert.equal(app.getHistory()[0].perfect, false);
  assert.equal(app.machine.state, 'completion');
});

test('leaving or restarting cancels delayed advancement', () => {
  const env = environment({ app: true }), app = env.sandbox.__app;
  app.startTraining(); app.submitAnswer(app.state.problem.answer);
  app.showScreen(env.elements.get('startScreen'));
  env.advance(1000); assert.equal(app.state.index, 0);
  app.startTraining(); app.submitAnswer(app.state.problem.answer);
  app.startTraining(); env.advance(1000);
  assert.equal(app.state.index, 0);
  assert.equal(app.state.results.length, 0);
});

test('demo mode is isolated from learning progress and history', () => {
  const env = environment({ app: true, query: '?kapiTest=1' });
  const before = JSON.stringify([...env.storage]);
  for (const scene of ['nod', 'hop', 'cheer', 'wrong', 'recovered', 'mastered', 'streak6', 'streak10', 'levelUp', 'complete10', 'complete20', 'complete30', 'perfect', 'combined']) {
    assert.ok(env.sandbox.__kapiDemo.play(scene)); env.advance(3000);
  }
  assert.equal(JSON.stringify([...env.storage]), before);
  assert.equal(env.sandbox.__app.state.index, 0);
});

test('offline cache includes all scripts loaded by HTML', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const [, name] of html.matchAll(/<script src="([^"]+)"/g)) assert.ok(sw.includes(`"${name}"`), name);
});

test('offline cache includes every rendered scene sound sample', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const name of ['start', 'correct', 'wrong', 'recovered', 'mastered', 'flag', 'party', 'dance', 'level-up', 'complete-10', 'complete-20', 'complete-30', 'perfect']) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'sounds', `${name}.wav`)), name);
    assert.ok(sw.includes(`assets/sounds/${name}.wav`), `${name} must work offline`);
  }
});
