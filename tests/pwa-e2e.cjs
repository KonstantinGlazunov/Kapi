// Real worker tests. No routing/blocking of service workers in the browser.
const assert = require('node:assert/strict');
const { readFile, mkdir } = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium, webkit } = require('playwright');
const { stripTypeScriptTypes } = require('node:module');
const ROOT = path.resolve(__dirname, '../dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wav': 'audio/wav' };

async function run() {
  let release = 1;
  const offlineSupported = process.env.KAPI_WEBKIT_ONLINE !== "1";
  if (!offlineSupported && process.env.KAPI_BROWSER !== "webkit") throw new Error("Online-only compatibility mode is WebKit-specific");
  let proxy;
  const originalFetch = global.fetch;
  async function resource(file) {
    let bytes = await readFile(path.join(ROOT, file));
    if (file === 'sw.js') bytes = Buffer.from(bytes.toString().replace(/^(const CACHE = )(.+);$/m, `$1($2) + "-test${release}";`));
    if (file === 'index.html') bytes = Buffer.from(bytes.toString().replace('<head>', `<head><meta name="test-release" content="${release}">`));
    return new Response(bytes, { headers: { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' } });
  }
  if (process.env.KAPI_PROXY_ROUTE) {
    const source = await readFile(process.env.KAPI_PROXY_ROUTE, 'utf8');
    proxy = (await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)).GET;
    global.fetch = async (url) => {
      const parsed = new URL(url);
      assert.equal(parsed.origin + '/Kapi/', 'https://konstantinglazunov.github.io/Kapi/');
      return resource(decodeURIComponent(parsed.pathname.slice('/Kapi/'.length)));
    };
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/main-site') { res.end('main-site-network'); return; }
      let response;
      if ((url.pathname === '/kapi' || url.pathname.startsWith('/kapi/')) && proxy) {
        const parts = url.pathname.slice('/kapi'.length).split('/').filter(Boolean);
        response = await proxy(new Request(url), { params: Promise.resolve({ path: parts }) });
      } else {
        if (url.pathname === '/kapi') { res.writeHead(307, { Location: '/kapi/index.html' }); res.end(); return; }
        const file = decodeURIComponent(url.pathname.replace(/^\/kapi\//, '/').replace(/^\//, '')) || 'index.html';
        if (file.includes('..')) throw new Error('Invalid path');
        response = await resource(file);
      }
      res.writeHead(response.status, { ...Object.fromEntries(response.headers), 'Cache-Control': 'no-store' });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { res.writeHead(404); res.end(String(error)); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const engine = process.env.KAPI_BROWSER === 'webkit' ? webkit : chromium;
  const executablePath = process.env.KAPI_BROWSER_EXECUTABLE || (engine === chromium ? process.env.KAPI_CHROME : undefined);
  let browser;
  try {
    browser = await engine.launch(executablePath ? { executablePath } : {});
    for (const prefix of ['/', '/kapi/']) {
      release = 1;
      const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on('response', res => { if (res.status() >= 400) console.error('HTTP', res.status(), res.url()); });
      page.on('console', msg => { if (msg.type() === 'error') console.error('BROWSER', msg.text()); });
      page.on('pageerror', error => errors.push(error.message));
      let navigations = 0;
      page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
      await page.goto(origin + prefix);
      await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 15000 });
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      assert.equal(navigations, 1, 'first claim must not reload');
      await page.evaluate(async () => {
        const cache = await caches.open('main-site-cache');
        await cache.put('/main-site', new Response('private-main-cache'));
      });
      const installed = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        const manifest = await (await fetch(document.querySelector('#manifestLink').href)).json();
        return { scope: registration.scope, manifest, base: document.baseURI };
      });
      assert.equal(installed.scope, origin + prefix);
      assert.equal(new URL(installed.manifest.scope, installed.base).href, origin + prefix);
      assert.equal(new URL(installed.manifest.start_url, installed.base).href, origin + prefix + 'index.html');
      await page.evaluate(() => {
        const key = 'capy-count-profile-v1';
        const profile = JSON.parse(localStorage.getItem(key));
        profile.totalXp = 246; profile.currentStage = 9;
        localStorage.setItem(key, JSON.stringify(profile));
      });
      await page.reload();
      // Cache has finished installation (ready/claim). Close and cold-start offline.
      if (offlineSupported) await context.setOffline(true);
      await page.close();
      const offline = await context.newPage();
      await offline.goto(origin + prefix + 'index.html');
      assert.equal(await offline.locator('#totalXpValue').innerText(), '246');
      await offline.locator('#startButton').click();
      await offline.locator('#gameScreen').waitFor({state:'visible'});
      assert.equal(await offline.locator('#gameScreen').isVisible(), true);
      await offline.locator('#homeButton').click();
      await context.setOffline(false);
      // Check all entry paths with the mounted worker and real proxy when supplied.
      for (const entry of prefix === '/' ? ['/'] : ['/kapi', '/kapi/', '/kapi/index.html']) {
        await offline.goto(origin + entry);
        assert.equal(await offline.locator('#startButton').isVisible(), true);
      }
      const training = await context.newPage();
      await training.goto(origin + prefix + 'index.html');
      await training.locator('#startButton').click();
      await training.locator('#gameScreen').waitFor({state:'visible'});
      const identity = await training.evaluate(() => {
        window.trainingIdentity = 'unfinished-training';
        return document.querySelector('#problemText').textContent;
      });
      const legacyTab = await context.newPage();
      // Model an already-open old client: it has no safe-update acknowledgement.
      await legacyTab.addInitScript(() => {
        const original = ServiceWorkerContainer.prototype.addEventListener;
        ServiceWorkerContainer.prototype.addEventListener = function (name, ...args) {
          if (name !== 'message') return original.call(this, name, ...args);
        };
      });
      await legacyTab.goto(origin + prefix + 'index.html');
      release = 2;
      await offline.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
      await offline.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
      assert.equal(await offline.locator('meta[name=test-release]').getAttribute('content'), '1');
      // A synthetic update click is also refused during a training.
      await training.evaluate(() => document.querySelector('#updateButton').click());
      assert.equal(await training.evaluate(() => window.trainingIdentity), 'unfinished-training');
      await training.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting, null, { timeout: 10000 });
      await offline.locator('#updateButton').click();
      await offline.waitForFunction(() => document.querySelector('#updateButton').textContent.includes('alte Kapi-Tabs'));
      assert.equal(await offline.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting), true, 'a legacy tab must block forced activation');
      await legacyTab.close();
      await offline.locator('#updateButton').click();
      await offline.waitForFunction(() => document.querySelector('meta[name=test-release]').content === '2');
      assert.equal(await offline.locator('#totalXpValue').innerText(), '246');
      assert.equal(await training.evaluate(() => window.trainingIdentity), 'unfinished-training', 'another tab must not reload');
      assert.equal(await training.locator('#problemText').innerText(), identity);
      assert.equal(await training.locator('#gameScreen').isVisible(), true);
      const mainCached = await offline.evaluate(async () => (await (await caches.open('main-site-cache')).match('/main-site')).text());
      assert.equal(mainCached, 'private-main-cache');
      if (prefix === '/kapi/') assert.equal(await offline.evaluate(async () => (await fetch('/main-site')).text()), 'main-site-network');
      await training.locator('#homeButton').click();
      await training.locator('#updateButton').click();
      await training.waitForFunction(() => !window.trainingIdentity);
      assert.equal(await training.locator('#totalXpValue').innerText(), '246');
      if (offlineSupported) await context.setOffline(true);
      await offline.reload();
      assert.equal(await offline.locator('meta[name=test-release]').getAttribute('content'), '2');
      assert.equal(await offline.locator('#totalXpValue').innerText(), '246');
      await context.setOffline(false);
      // Export/import UI: cancellation and malformed files cannot replace progress.
      await offline.locator('#settingsButton').click();
      await offline.locator('[data-settings-section=general]').click();
      const downloadPromise = offline.waitForEvent('download');
      await offline.locator('[data-backup-export]').click();
      const download = await downloadPromise;
      const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
      assert.equal(backup.data.profile.totalXp, 246);
      backup.data.profile.totalXp = 333;
      const upload = () => offline.locator('[data-backup-import]').setInputFiles({ name: 'kapi.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
      const cancelled = offline.waitForEvent('dialog').then(dialog => dialog.dismiss());
      await upload(); await cancelled;
      assert.equal(await offline.locator('#totalXpValue').innerText(), '246');
      const accepted = offline.waitForEvent('dialog').then(dialog => dialog.accept());
      await upload(); await accepted;
      await offline.waitForFunction(() => document.querySelector('#totalXpValue').textContent === '333');
      // Review regression: reject the executable queue before confirmation/write.
      const rawBefore = await offline.evaluate(() => ['capy-count-data-v1', 'capy-count-profile-v1', 'capy-count-settings-v1', 'capy-count-history-v1'].map(key => localStorage.getItem(key)));
      const malformed = JSON.parse(JSON.stringify(backup));
      malformed.data.profile.errorQueue = [{ key: '1 + 1 = ?', a: 1, b: 1, operator: '+', operation: 'add', curriculumStage: 2, correctStreak: 0, lastShown: 0, taskType: 'equation', mode: 'choice', text: '1 + 1 = ?' }];
      let unexpectedConfirm = 0;
      const onUnexpectedDialog = dialog => { unexpectedConfirm++; return dialog.dismiss(); };
      offline.on('dialog', onUnexpectedDialog);
      await offline.locator('[data-backup-import]').setInputFiles({ name: 'missing-answer.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(malformed)) });
      await offline.waitForFunction(() => document.querySelector('#backupStatus').textContent.includes('beschädigt'));
      offline.off('dialog', onUnexpectedDialog);
      assert.equal(unexpectedConfirm, 0, 'invalid task must be rejected before asking to replace data');
      assert.deepEqual(await offline.evaluate(() => ['capy-count-data-v1', 'capy-count-profile-v1', 'capy-count-settings-v1', 'capy-count-history-v1'].map(key => localStorage.getItem(key))), rawBefore);
      await offline.locator('#closeSettingsButton').click();
      await offline.locator('#startButton').click();
      await offline.locator('#gameScreen').waitFor({state:'visible'});
      assert.equal(await offline.locator('#gameScreen').isVisible(), true, 'training still starts after rejected import');
      await offline.locator('#homeButton').click();
      await offline.locator('#settingsButton').click();
      await offline.locator('[data-settings-section=general]').click();
      await offline.locator('[data-backup-import]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
      await offline.waitForFunction(() => document.querySelector('#backupStatus').textContent.includes('beschädigt'));
      assert.equal(await offline.locator('#totalXpValue').innerText(), '333');
      const screenshotDir = process.env.KAPI_E2E_SCREENSHOTS;
      if (screenshotDir) {
        await mkdir(screenshotDir, { recursive: true });
        await offline.locator('[data-settings-back]').click();
        await offline.locator('[data-settings-section=general]').click();
        for (const lang of ['de', 'ru']) {
          await offline.locator(`input[name=language][value=${lang}]`).check();
          for (const width of [320, 390]) {
            await offline.setViewportSize({ width, height: width === 320 ? 568 : 844 });
            await offline.screenshot({ path: path.join(screenshotDir, `backup-${prefix === '/' ? 'root' : 'kapi'}-${lang}-${width}.png`) });
          }
        }
        await offline.locator('#closeSettingsButton').click();
        await offline.locator('#settingsButton').click();
        await offline.locator('[data-settings-section=about]').click();
        await offline.screenshot({ path: path.join(screenshotDir, `parents-${prefix === '/' ? 'root' : 'kapi'}-ru.png`) });
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${prefix}: first launch, ${offlineSupported ? 'cold offline start' : 'online restart'}, manifest/scope, entries, explicit update, multi-tab training, main-site cache, backup UI`);
    }
    if (!offlineSupported) console.log('UNRUN WebKit offline simulation: minimal baseline also fails with a WebKit internal error; Chromium covers offline lifecycle.');
    const denied = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    await denied.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); }; });
    const page = await denied.newPage();
    await page.goto(origin + '/');
    assert.equal(await page.locator('#storageNotice').isVisible(), true);
    await page.locator('#startButton').click();
    await page.locator('#gameScreen').waitFor({state:'visible'});
    assert.equal(await page.locator('#gameScreen').isVisible(), true);
    const controlsBottom = await page.locator('#answerArea').evaluate(el => el.getBoundingClientRect().bottom);
    assert.ok(controlsBottom <= 568, `storage notice must not clip answer controls: ${controlsBottom}`);
    if (process.env.KAPI_E2E_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.KAPI_E2E_SCREENSHOTS, 'storage-quota-game-320.png') });
    await denied.close();
    console.log('PASS quota-denied browser: visible warning and usable mobile training');
  } finally {
    await browser?.close(); await new Promise(resolve => server.close(resolve)); global.fetch = originalFetch;
  }
}
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { run };
