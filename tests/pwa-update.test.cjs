const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { MessageChannel } = require('node:worker_threads');

function worker(clients) {
  const listeners = {}, messages = [];
  let skipped = 0;
  vm.runInNewContext(fs.readFileSync('dist/sw.js', 'utf8'), {
    URL, MessageChannel, setTimeout: (fn) => setTimeout(fn, 100), clearTimeout,
    self: { registration: { scope: 'https://example.test/kapi/' },
      addEventListener: (name, fn) => listeners[name] = fn,
      clients: { matchAll: async () => clients }, skipWaiting: async () => { skipped++; } },
  });
  return { listeners, messages, get skipped() { return skipped; }, async request() {
    let pending;
    listeners.message({ data: { type: 'SKIP_WAITING' }, source: { id: 'initiator', postMessage: msg => messages.push(msg.type) }, waitUntil: promise => pending = promise });
    await pending;
  } };
}
const tab = (id, compatible) => ({ id, url: 'https://example.test/kapi/index.html',
  postMessage(_message, ports) { if (compatible) ports[0].postMessage({ protocol: 1 }); ports[0].close(); } });

test('a single legacy tab can explicitly update, but a second unresponsive old tab prevents activation', async () => {
  const single = worker([tab('initiator', false)]);
  await single.request(); assert.equal(single.skipped, 1);
  const legacy = worker([tab('initiator', false), tab('old-training', false)]);
  await legacy.request(); assert.equal(legacy.skipped, 0);
  assert.deepEqual(legacy.messages, ['KAPI_UPDATE_BLOCKED']);
});

test('new compatible tabs permit an explicit update; unrelated site tabs are ignored', async () => {
  const safe = worker([tab('initiator', true), tab('training', true), { id: 'main', url: 'https://example.test/' }]);
  await safe.request(); assert.equal(safe.skipped, 1);
});
