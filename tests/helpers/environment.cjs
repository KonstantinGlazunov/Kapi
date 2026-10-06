const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..', 'dist');

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
      this.style = { setProperty() {}, removeProperty() {} }; this.dataset = {}; this.children = []; this.listeners = {}; this.queries = new Map(); this.attributes = {};
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
  for (const file of ['kapi.js', 'kapi-sound.js', 'kapi-motivation.js', 'kapi-rewards.js', 'kapi-tasks.js', 'kapi-map.js', 'kapi-weekly.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  if (app) {
    const expose = 'window.__app = {state, appSettings, startTraining, finishTraining, saveSession, submitAnswer, getProfile, saveProfile, getHistory, showStats, updateHomeStats, handleSettingsChange, registerProblemError, registerCorrectAnswer, showScreen, showWardrobe, showCurriculumMap, renderCurriculumMap, renderProblem, makeGeneratedProblem, makeCurriculumProblem, makeChoices, hasCarry, hasBorrow, selectProblem, reconcileOperationsForStage, maximumAllowedStage, canAppendKey, renderAnswer, updatePersonalPace, updateAdaptiveProgress, get machine(){return kapi}, get motivation(){return motivation}, get sound(){return soundManager}};';
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

module.exports = { environment, root };
