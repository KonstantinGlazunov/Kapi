// Real Chromium layout and interaction check. Run against a local server serving dist/.
// KAPI_BASE_URL=http://127.0.0.1:8765 node tests/mobile-e2e.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const playwright = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');

const baseUrl = process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/';
const chrome = process.env.KAPI_CHROME;
const screenshots = process.env.KAPI_E2E_SCREENSHOTS;
if (screenshots) fs.mkdirSync(screenshots, { recursive: true });

const cases = [
  { type: 'visualCount', stage: 3, a: 3, b: 2, answer: 5 },
  { type: 'tenFrame', stage: 5, a: 5, b: 5, answer: 10 },
  { type: 'tenFrame', stage: 9, a: 10, b: 9, answer: 19 },
  { type: 'numberLine', stage: 12, a: 8, b: 5, answer: 13 },
  { type: 'microStory', stage: 12, a: 8, b: 5, answer: 13 },
  { type: 'placeValue', stage: 9, a: 10, b: 7, answer: 17 }
];

async function run() {
  const launchOptions = { headless: true, args: ['--no-sandbox'] };
  if (chrome) launchOptions.executablePath = chrome;
  const browser = await playwright.chromium.launch(launchOptions);
  try {
    for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Expose the running app state only in the browser test response, never in dist/.
      await page.route('**/app.js', async route => {
        const response = await route.fetch();
        const source = await response.text();
        const marker = /\}\)\(\);\s*$/;
        assert.match(source, marker);
        const exposure = 'window.__e2e = {state, tasks, renderProblem, renderAnswer, getProfile, saveProfile, renderCurriculumMap};\n})();';
        await route.fulfill({ response, body: source.replace(marker, exposure) });
      });
      await page.goto(baseUrl, { waitUntil: 'load' });
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-start.png`) });
      await page.locator('#startButton').click();
      assert.equal(await page.locator('#gameScreen').isVisible(), true, 'tap starts training');
      // A real first answer must pass through the visible choice/keypad and advance the app.
      const first = await page.evaluate(() => ({ answer: window.__e2e.tasks.response(window.__e2e.state.problem), mode: window.__e2e.state.problem.mode }));
      if (first.mode === 'choice') await page.locator('#answerArea .answer-button').filter({ hasText: new RegExp(`^${first.answer}$`) }).click();
      else for (const digit of String(first.answer)) await page.locator(`#answerArea [data-key="${digit}"]`).click();
      await page.waitForFunction(() => window.__e2e.state.index === 1, null, { timeout: 5000 });
      assert.equal(await page.locator('#problemNumber').innerText(), '2');
      assert.equal((await page.evaluate(() => window.__e2e.state.results[0].firstTry)), true);
      for (const item of cases) {
        await page.evaluate(({ type, stage, a, b, answer }) => {
          const api = window.__e2e;
          const base = { a, b, answer, operation: 'add', operator: '+', text: `${a} + ${b} = ?`, curriculumStage: stage, mode: 'input' };
          const problem = api.tasks.decorate(base, null, type);
          api.state.problem = problem;
          api.state.enteredAnswer = '';
          api.state.locked = false;
          api.state.attempt = 1;
          document.querySelector('#hint').classList.add('hidden');
          document.querySelector('#hint').innerHTML = '';
          api.renderProblem(problem);
          api.renderAnswer();
        }, item);
        await page.waitForTimeout(120);
        const geometry = await page.evaluate(() => {
          const visual = document.querySelector('#taskVisual');
          const answer = document.querySelector('#answerArea');
          const controls = [...answer.querySelectorAll('button')];
          const last = controls.at(-1)?.getBoundingClientRect();
          return {
            bodyWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth,
            visibleVisual: visual.scrollHeight <= visual.clientHeight + 1, visualHeight: [visual.scrollHeight, visual.clientHeight],
            visibleWidth: visual.scrollWidth <= visual.clientWidth + 1, visualWidth: [visual.scrollWidth, visual.clientWidth],
            visualBottom: visual.getBoundingClientRect().bottom,
            answerTop: answer.getBoundingClientRect().top,
            controlBottom: last?.bottom, controlLeft: Math.min(...controls.map(button => button.getBoundingClientRect().left)),
            controlRight: Math.max(...controls.map(button => button.getBoundingClientRect().right)),
            groups: visual.querySelectorAll('.task-operand').length,
            frameCells: visual.querySelectorAll('.task-cell').length
          };
        });
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-${item.type}-${item.stage}.png`) });
        assert.equal(geometry.bodyWidth, geometry.viewportWidth, `${width} ${item.type}: horizontal overflow`);
        assert.ok(geometry.controlBottom <= height - 2, `${width} ${item.type}: answer control below viewport: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.controlLeft >= 0 && geometry.controlRight <= width, `${width} ${item.type}: answer controls offscreen`);
        assert.ok(geometry.visibleVisual, `${width} ${item.type}: visual clipped: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.visibleWidth, `${width} ${item.type}: visual cropped horizontally: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.visualBottom <= geometry.answerTop + 1, `${width} ${item.type}: visual overlaps answers`);
        if (['visualCount', 'tenFrame'].includes(item.type)) assert.equal(geometry.groups, 2, `${width} ${item.type}: operand groups`);
        if (item.type === 'tenFrame') assert.ok(geometry.frameCells >= 20, `${width} ${item.type}: frame cells`);
      }
      await page.evaluate(() => {
        const api = window.__e2e;
        api.state.problem = api.tasks.decorate({ a: 10, b: 9, answer: 19, operation: 'add', operator: '+', text: '10 + 9 = ?', curriculumStage: 9, mode: 'input' }, null, 'tenFrame');
        api.state.attempt = 1;
        api.state.locked = false;
        api.state.enteredAnswer = '';
        document.querySelector('#hint').classList.add('hidden');
        api.renderProblem(api.state.problem);
        api.renderAnswer();
      });
      await page.locator('#answerArea [data-key="8"]').click();
      await page.locator('#answerArea [data-action="submit"]').click();
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.__e2e.state.hintLevel), 1);
      const hintLayout = await page.evaluate(() => ({
        bottom: document.querySelector('#answerArea .submit-button').getBoundingClientRect().bottom,
        hintVisible: !document.querySelector('#hint').classList.contains('hidden')
      }));
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-first-hint.png`) });
      assert.ok(hintLayout.hintVisible && hintLayout.bottom <= height - 2, `${width}: first hint hides the controls: ${JSON.stringify(hintLayout)}`);
      // The completed curriculum is an actual dialog state, also in reduced motion.
      await page.evaluate(() => {
        const api = window.__e2e;
        const profile = api.getProfile();
        profile.currentStage = 41;
        profile.curriculumCompleted = true;
        api.saveProfile(profile);
      });
      page.once('dialog', dialog => dialog.accept());
      await page.locator('#homeButton').click();
      await page.locator('#mapButton').click();
      if (screenshots) {
        await page.locator('#mapChapters .map-chapter').last().scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(screenshots, `${width}x${height}-completed-map.png`) });
      }
      assert.equal(await page.locator('#mapChapters .completed').count(), 13);
      assert.equal(await page.locator('#mapChapters .current').count(), 0);
      assert.ok((await page.locator('#mapIntro').innerText()).includes('Alle Kapitel geschafft'), `${width}: completed curriculum text`);
      assert.deepEqual(errors, [], `browser errors at ${width}×${height}`);
      console.log(`PASS ${width}×${height}: 6 visual formats, controls, complete map`);
      await context.close();
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
