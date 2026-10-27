const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function setup() {
  let enabled = true;
  const sources = [];
  const context = {
    currentTime: 0, state: 'running', destination: {},
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} }, connect() {}, disconnect() {} }; },
    createBufferSource() {
      const source = { connect(gain) { return gain; }, start() { this.started = true; }, stop() { this.stopped = true; }, disconnect() {} };
      sources.push(source); return source;
    }
  };
  const sound = new (environment().sandbox.KapiSoundManager)({ isEnabled: () => enabled, contextFactory: () => context });
  return { sound, sources, setEnabled(value) { enabled = value; sound.setEnabled(value); } };
}

test('stock music waits for a gesture, loops through the result, and obeys mute', async () => {
  const r = setup(); r.sound.samples.set('danceMusic', { duration: 6.667 });
  assert.equal(await r.sound.playPresentationMusic(), false);
  r.sound.unlock(); assert.equal(await r.sound.playPresentationMusic(), true);
  assert.equal(r.sources.length, 1); assert.equal(r.sources[0].loop, true);
  r.setEnabled(false); assert.equal(r.sources[0].stopped, true);
  assert.equal(r.sound.channels.get('music').size, 0);
  assert.equal(await r.sound.playPresentationMusic(), false);
});

test('leaving a scene while music decodes cancels the pending start', async () => {
  const r = setup(); let resolve;
  r.sound.unlock(); r.sound.sampleLoads.set('danceMusic', new Promise(done => { resolve = done; }));
  const pending = r.sound.playPresentationMusic(); r.sound.stopAll(); resolve({ duration: 6.667 });
  assert.equal(await pending, false); assert.equal(r.sources.length, 0);
});

test('restarting a dance stops the previous music source', async () => {
  const r = setup(); r.sound.unlock(); r.sound.samples.set('danceMusic', { duration: 6.667 });
  await r.sound.playPresentationMusic(); await r.sound.playPresentationMusic();
  assert.equal(r.sources[0].stopped, true); assert.equal(r.sound.channels.get('music').size, 1);
  r.sound.stopAll(); assert.equal(r.sources[1].stopped, true);
});


test('natural music completion notifies the show, cancelled playback does not', async () => {
  const r = setup(); r.sound.unlock(); r.sound.samples.set('danceMusic', { duration: 6.667 });
  let ended = 0;
  await r.sound.playPresentationMusic({ onEnded: () => ended++ });
  r.sources[0].onended(); assert.equal(ended, 1);
  await r.sound.playPresentationMusic({ onEnded: () => ended++ });
  r.sound.stopAll(); r.sources[1].onended(); assert.equal(ended, 1);
});
