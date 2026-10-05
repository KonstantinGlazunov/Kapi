const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'dist');

function environment({ app = false, query = '', seed = 0x4b415049 } = {}) {
  let now = 0, sequence = 0;
  let randomState = seed >>> 0;
  const seededMath = Object.create(Math);
  seededMath.random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const timers = new Map(), elements = new Map(), storage = new Map();
  class Element {
    constructor() {
      const names = new Set();
      this.classList = { add: (...xs) => xs.forEach(x => names.add(x)), remove: (...xs) => xs.forEach(x => names.delete(x)), contains: x => names.has(x), toggle: (x, on = !names.has(x)) => on ? names.add(x) : names.delete(x), [Symbol.iterator]: () => names.values() };
      this.style = { setProperty() {} }; this.dataset = {}; this.children = []; this.listeners = {}; this.queries = new Map(); this.attributes = {};
      this.textContent = ''; this.innerHTML = ''; this.offsetWidth = 100; this.clientHeight = 800;
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k]; }
    addEventListener(k, fn) { this.listeners[k] = fn; }
    querySelector(k) { if (!this.queries.has(k)) this.queries.set(k, new Element()); return this.queries.get(k); }
    querySelectorAll() { return []; }
    appendChild(e) { this.children.push(e); }
    append(...es) { this.children.push(...es); }
    getBoundingClientRect() { return { top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100 }; }
    closest() { return null; }
    showModal() {} close() {} focus() {}
  }
  const document = new Element();
  document.body = new Element(); document.documentElement = new Element();
  document.getElementById = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  document.createElement = () => new Element();
  document.getElementById('startScreen').classList.add('active');
  document.getElementById('motivationPop').classList.add('hidden');
  const sandbox = {
    console, document, URL, URLSearchParams, Intl, Math: seededMath,
    performance: { now: () => now },
    navigator: { userAgent: 'test', language: 'ru-RU' },
    location: { search: query, origin: 'https://example.test', href: 'https://example.test/' },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {}, innerHeight: 900, innerWidth: 1200,
    Image: class {}, HTMLCanvasElement: class {},
    requestAnimationFrame: () => ++sequence, cancelAnimationFrame() {},
    setTimeout: (fn, delay = 0) => { const id = ++sequence; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['kapi.js', 'kapi-sound.js', 'kapi-motivation.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  if (app) {
    const expose = 'window.__app = {state, appSettings, startTraining, submitAnswer, getProfile, saveProfile, getHistory, registerProblemError, registerCorrectAnswer, showScreen, makeCurriculumProblem, makeChoices, hasCarry, hasBorrow, get machine(){return kapi}, get motivation(){return motivation}, get sound(){return soundManager}};';
    vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/\}\)\(\);\s*$/, expose + '\n})();'), sandbox, { filename: 'app.js' });
  }
  return { sandbox, storage, elements, now: () => now, advance(ms) {
    const end = now + ms;
    let steps = 0;
    for (;;) {
      const next = [...timers].filter(([, x]) => x.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      assert.ok(++steps < 1000, 'timers must terminate');
      now = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  } };
}

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

test('curriculum stages 1-14 keep their mathematical contracts across 28,000 generated problems', async t => {
  const env = environment({ app: true, seed: 0x14002026 });
  const app = env.sandbox.__app;
  const allowedOperations = {
    1: ['count'],
    2: ['add'], 3: ['add'], 4: ['add'], 5: ['add'],
    6: ['subtract'], 7: ['subtract'], 8: ['add', 'subtract'],
    9: ['add'], 10: ['add'], 11: ['subtract'], 12: ['add'], 13: ['subtract'],
    14: ['add', 'subtract']
  };
  const expectedOperator = { count: '', add: '+', subtract: '−' };

  for (let stage = 1; stage <= 14; stage += 1) {
    await t.test(`stage ${stage}: 2,000 valid problems and answer sets`, () => {
      const profile = app.getProfile();
      profile.currentStage = stage;
      app.state.stage = stage;
      const seen = new Set();

      for (let index = 0; index < 2000; index += 1) {
        const problem = app.makeCurriculumProblem(stage, index, profile);
        const label = `stage ${stage}, sample ${index}: ${problem.text}`;

        assert.ok(allowedOperations[stage].includes(problem.operation), `${label} has allowed operation`);
        assert.equal(problem.operator, expectedOperator[problem.operation], `${label} has matching operator`);
        assert.equal(problem.curriculumStage, stage, `${label} keeps its curriculum stage`);
        assert.equal(problem.mode, index % 2 === 0 ? 'choice' : 'input', `${label} alternates answer mode`);
        assert.ok(Number.isInteger(problem.a), `${label} has integer first operand`);
        assert.ok(Number.isInteger(problem.b), `${label} has integer second operand`);
        assert.ok(Number.isInteger(problem.answer), `${label} has integer answer`);
        assert.ok(problem.a >= 0 && problem.b >= 0 && problem.answer >= 0, `${label} never uses a negative value`);
        assert.ok(problem.answer <= (stage <= 8 ? 10 : 20), `${label} stays inside its answer range`);

        const choices = app.makeChoices(problem);
        assert.equal(choices.length, 4, `${label} has four choices`);
        assert.equal(new Set(choices.map(String)).size, 4, `${label} has four unique choices`);
        assert.ok(choices.some(value => value === problem.answer), `${label} includes the correct choice`);
        assert.ok(choices.every(value => Number.isInteger(value) && value >= 0), `${label} choices are non-negative integers`);

        if (problem.operation === 'add') {
          assert.equal(problem.answer, problem.a + problem.b, `${label} addition is correct`);
          seen.add(`add:${app.hasCarry(problem.a, problem.b) ? 'carry' : 'plain'}`);
        } else if (problem.operation === 'subtract') {
          assert.equal(problem.answer, problem.a - problem.b, `${label} subtraction is correct`);
          assert.ok(problem.a >= problem.b, `${label} subtraction cannot become negative`);
          seen.add(`subtract:${app.hasBorrow(problem.a, problem.b) ? 'borrow' : 'plain'}`);
        } else {
          assert.equal(problem.answer, problem.a, `${label} count answer matches the shown amount`);
          assert.equal(problem.visualCount, problem.answer, `${label} visual count matches the answer`);
        }

        switch (stage) {
          case 1:
            assert.ok(problem.answer >= 0 && problem.answer <= 5, label);
            break;
          case 2:
            assert.ok(problem.a >= 0 && problem.b >= 0 && problem.b <= 1 && problem.answer <= 5, label);
            break;
          case 3:
            assert.ok(problem.a >= 1 && problem.a <= 4 && problem.b >= 1 && problem.b <= 4 && problem.answer <= 5, label);
            break;
          case 4:
            assert.ok(problem.a >= 1 && problem.b >= 1 && problem.answer <= 10, label);
            break;
          case 5:
            assert.ok(problem.a >= 2 && problem.b >= 2 && problem.answer <= 10, label);
            break;
          case 6:
            assert.ok(problem.a >= problem.b && problem.a <= 5 && problem.b >= 1 && problem.b <= 2, label);
            break;
          case 7:
            assert.ok(problem.a >= 4 && problem.a <= 10 && problem.b >= 2 && problem.b <= problem.a, label);
            break;
          case 8:
            if (problem.operation === 'add') assert.ok(problem.a >= 2 && problem.b >= 2 && problem.answer <= 10, label);
            else assert.ok(problem.a >= 4 && problem.a <= 10 && problem.b >= 2 && problem.b <= problem.a, label);
            break;
          case 9:
            assert.ok(problem.a === 10 && problem.b >= 1 && problem.b <= 9 && problem.answer >= 11 && problem.answer <= 19, label);
            break;
          case 10:
            assert.ok(problem.a >= 11 && problem.a <= 18 && problem.b >= 1 && problem.b <= 9 && problem.answer <= 20, label);
            assert.equal(app.hasCarry(problem.a, problem.b), false, `${label} must not carry`);
            break;
          case 11:
            assert.ok(problem.a >= 11 && problem.a <= 20 && problem.b >= 1 && problem.b <= 9 && problem.b < problem.a, label);
            assert.equal(app.hasBorrow(problem.a, problem.b), false, `${label} must not borrow`);
            break;
          case 12:
            assert.ok(problem.a >= 3 && problem.a <= 9 && problem.b >= 2 && problem.b <= 9 && problem.answer > 10 && problem.answer <= 20, label);
            assert.equal(app.hasCarry(problem.a, problem.b), true, `${label} must carry across ten`);
            break;
          case 13:
            assert.ok(problem.a >= 11 && problem.a <= 19 && problem.b >= 2 && problem.b <= 9, label);
            assert.equal(app.hasBorrow(problem.a, problem.b), true, `${label} must borrow across ten`);
            break;
          case 14:
            assert.ok(problem.a <= 20 && problem.b <= 9 && problem.answer <= 20, label);
            break;
        }
      }

      if (stage === 8) {
        assert.ok([...seen].some(value => value.startsWith('add:')), 'stage 8 generates addition');
        assert.ok([...seen].some(value => value.startsWith('subtract:')), 'stage 8 generates subtraction');
      }
      if (stage === 14) assert.deepEqual([...seen].sort(), ['add:carry', 'add:plain', 'subtract:borrow', 'subtract:plain']);
    });
  }
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
