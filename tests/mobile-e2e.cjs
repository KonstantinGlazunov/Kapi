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

async function answerCurrent(page) {
  const problem = await page.evaluate(() => ({
    answer: window.__e2e.tasks.response(window.__e2e.state.problem),
    mode: window.__e2e.state.problem.mode,
    labeled: !!window.__e2e.tasks.choiceLabels(window.__e2e.state.problem, 'de')
  }));
  if (problem.mode === 'choice') {
    if (problem.labeled) await page.locator('#answerArea .answer-button').nth(problem.answer).click();
    else await page.locator('#answerArea .answer-button').filter({ hasText: new RegExp(`^${problem.answer}$`) }).click();
  } else for (const digit of String(problem.answer)) await page.locator(`#answerArea [data-key="${digit}"]`).click();
}

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
        const exposure = 'window.__e2e = {state, tasks, renderProblem, renderAnswer, getProfile, saveProfile, updateHomeStats, finishTraining, renderCurriculumMap, makeCurriculumProblem};\n})();';
        await route.fulfill({ response, body: source.replace(marker, exposure) });
      });
      await page.goto(baseUrl, { waitUntil: 'load' });
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-home.png`) });
      assert.equal(await page.locator('#weeklyStat').isVisible(), true, `${width}: weekly progress missing`);
      assert.equal(await page.locator('#weeklyLabel').innerText(), 'Diese Woche');
      assert.equal(await page.locator('#startButton').isVisible(), true);
      assert.equal(await page.locator('#speechBubble').isVisible(), true);
      assert.equal(await page.locator('#homeMascot').isVisible(), true);
      assert.match(await page.locator('#startEyebrow').innerText(), /Stufe/i,
        `${width}: stage label = ${JSON.stringify(await page.locator('#startEyebrow').innerText())}; page errors = ${JSON.stringify(errors)}`);
      assert.equal(await page.locator('.home-nav .text-button').count(), 3);
      const homeLayout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth, bottom: document.querySelector('#startButton').getBoundingClientRect().bottom,
        historyTop: document.querySelector('#statsButton').getBoundingClientRect().top,
        mapBottom: document.querySelector('#mapButton').getBoundingClientRect().bottom,
        wardrobeBottom: document.querySelector('#wardrobeButton').getBoundingClientRect().bottom,
        settingsBottom: document.querySelector('#settingsButton').getBoundingClientRect().bottom,
        heroHeight: document.querySelector('#homeMascot').getBoundingClientRect().height,
        startHeight: document.querySelector('#startButton').getBoundingClientRect().height,
        navHeight: document.querySelector('#mapButton').getBoundingClientRect().height }));
      assert.equal(homeLayout.width, homeLayout.viewport, `${width}: home horizontal overflow`);
      assert.ok(homeLayout.bottom <= height, `${width}: start button below viewport: ${JSON.stringify(homeLayout)}`);
      assert.ok(homeLayout.heroHeight >= 200 && homeLayout.startHeight >= 44 && homeLayout.navHeight >= 44,
        `${width}: mascot or controls too small: ${JSON.stringify(homeLayout)}`);
      assert.ok(homeLayout.settingsBottom <= height && homeLayout.historyTop >= homeLayout.bottom + 8 &&
        homeLayout.mapBottom <= height - 2 && homeLayout.wardrobeBottom <= height - 2,
        `${width}: home actions overlap or leave viewport: ${JSON.stringify(homeLayout)}`);
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
      await page.locator('#closeMapButton').click();
      await page.locator('#settingsButton').click();
      await page.locator('[data-settings-section="general"]').click();
      await page.locator('input[name="weeklyGoal"][value="4"]').check();
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-weekly-settings.png`) });
      assert.equal(await page.locator('input[name="weeklyGoal"]:checked').inputValue(), '4');
      await page.locator('#closeSettingsButton').click();
      await page.locator('#settingsButton').click();
      await page.locator('[data-settings-section="general"]').click();
      assert.equal(await page.locator('input[name="weeklyGoal"]:checked').inputValue(), '4', `${width}: weekly setting not persistent`);
      await page.locator('input[name="weeklyGoal"][value="3"]').check();
      await page.locator('#closeSettingsButton').click();
      await page.evaluate(() => {
        const api = window.__e2e;
        const profile = api.getProfile();
        profile.weeklySessions.count = 2;
        profile.weeklySessions.sessionIds = ['before-a', 'before-b'];
        api.saveProfile(profile);
        api.updateHomeStats();
      });
      await page.waitForTimeout(350);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-weekly-2-of-3.png`) });
      assert.ok((await page.locator('#weeklyDetail').innerText()).includes('2 von 3'));
      const updatedHomeLayout = await page.evaluate(() => ({ mapBottom: document.querySelector('#mapButton').getBoundingClientRect().bottom,
        mapHeight: document.querySelector('#mapButton').getBoundingClientRect().height,
        mascotHeight: document.querySelector('#homeMascot').getBoundingClientRect().height,
        mascotVisible: getComputedStyle(document.querySelector('#homeMascot')).visibility }));
      assert.ok(updatedHomeLayout.mapHeight > 0 && updatedHomeLayout.mapBottom <= height - 2,
        `${width}: completed curriculum home clips map entry: ${JSON.stringify(updatedHomeLayout)}`);
      await page.locator('#startButton').click();
      await page.evaluate(() => {
        const api = window.__e2e;
        api.state.results = Array.from({ length: 20 }, () => ({ firstTry: false, seconds: 5, taskType: 'equation', key: '8 + 5 = ?' }));
        api.state.correct = 18;
        api.state.score = 0;
        api.finishTraining();
      });
      await page.waitForTimeout(2200);
      assert.ok((await page.locator('#rewardReveal').innerText()).includes('Wochenziel geschafft'));
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-weekly-reveal.png`) });
      const resultLayout = await page.evaluate(() => ({ nextBottom: document.querySelector('#againButton').getBoundingClientRect().bottom,
        historyBottom: document.querySelector('#resultStatsButton').getBoundingClientRect().bottom,
        screenHeight: document.querySelector('#resultScreen').clientHeight,
        contentHeight: document.querySelector('#resultScreen').scrollHeight }));
      assert.ok(resultLayout.nextBottom <= height - 2, `${width}: result CTA not visible: ${JSON.stringify(resultLayout)}`);
      assert.ok(resultLayout.historyBottom <= height - 2, `${width}: result actions not visible: ${JSON.stringify(resultLayout)}`);
      await page.locator('#resultStatsButton').click();
      const historyText = await page.locator('#statsContent').innerText();
      assert.ok(historyText.includes('Diese Woche'), `${width}: weekly history summary missing: ${historyText}; errors=${JSON.stringify(errors)}`);
      assert.ok(historyText.includes('letzten 4 Wochen'), `${width}: four-week history summary missing: ${historyText}`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-weekly-history.png`) });
      const dialogLayout = await page.evaluate(() => { const dialog = document.querySelector('#statsDialog');
        return { scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth, scrollLeft: dialog.scrollLeft }; });
      assert.ok(dialogLayout.scrollWidth <= dialogLayout.clientWidth + 1, `${width}: history dialog horizontal clipping: ${JSON.stringify(dialogLayout)}`);
      if (width === 390) {
        await page.locator('#closeStatsButton').click();
        await page.locator('#homeButton').click();
        await page.evaluate(() => {
          const api = window.__e2e;
          const profile = api.getProfile();
          profile.currentStage = 13;
          profile.curriculumCompleted = false;
          profile.errorQueue = [];
          window.KapiMasterySystem.markStageMastered(profile, 12, new Date('2020-01-01T12:00:00Z'));
          api.saveProfile(profile);
        });
        await page.locator('#statsButton').click();
        assert.ok((await page.locator('#statsContent').innerText()).includes('Plus über den Zehner'), 'History names due canonical skill');
        const titleHeight = await page.locator('#historyTitle').evaluate(element => element.getBoundingClientRect().height);
        assert.ok(titleHeight <= 35, `History title wraps on ${width}px: ${titleHeight}`);
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-due-skill-history.png`) });
        await page.locator('#closeStatsButton').click();
        await page.locator('#startButton').click();
        const firstReviewSlot = await page.evaluate(() => window.__e2e.state.sessionPlan.slots.findIndex(slot => slot.type === 'spacedReview'));
        assert.ok(firstReviewSlot > 0, 'due skill must have a planned slot');
        for (let index = 0; index < firstReviewSlot; index++) {
          await answerCurrent(page);
          await page.waitForFunction(expected => window.__e2e.state.index === expected, index + 1, { timeout: 5000 });
        }
        const review = await page.evaluate(() => ({
          stage: window.__e2e.state.problem.curriculumStage,
          currentStage: window.__e2e.state.stage,
          isSpacedReview: window.__e2e.state.problem.isSpacedReview,
          skillId: window.__e2e.state.problem.reviewSkillId,
          before: window.__e2e.getProfile().skillMastery['add:cross-ten'].nextReviewAt,
          answer: window.__e2e.tasks.response(window.__e2e.state.problem),
          mode: window.__e2e.state.problem.mode
        }));
        assert.equal(review.isSpacedReview, true, 'real training must select the due skill');
        assert.equal(review.skillId, 'add:cross-ten');
        assert.equal(review.stage, 12);
        assert.ok(review.currentStage >= 13, 'current curriculum may advance during the longer lead-in');
        await page.waitForFunction(() => document.querySelector('#motivationPop').classList.contains('hidden'), null, { timeout: 5000 });
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-spaced-review.png`) });
        await answerCurrent(page);
        const outcome = await page.evaluate(() => ({
          after: window.__e2e.getProfile().skillMastery['add:cross-ten'].nextReviewAt,
          interval: window.__e2e.getProfile().skillMastery['add:cross-ten'].intervalDays,
          firstTry: window.__e2e.state.results.at(-1).firstTry,
          stage: window.__e2e.getProfile().currentStage,
          width: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
          bottom: document.querySelector('#answerArea').getBoundingClientRect().bottom
        }));
        assert.ok(Date.parse(outcome.after) > Date.parse(review.before), `review date did not advance: ${JSON.stringify(outcome)}`);
        assert.equal(outcome.interval, 3);
        assert.equal(outcome.firstTry, true);
        assert.equal(outcome.stage, review.currentStage, 'spaced review itself cannot advance the current stage');
        assert.equal(outcome.width, outcome.viewport);
        assert.ok(outcome.bottom <= height, `review controls offscreen: ${JSON.stringify(outcome)}`);

        await page.waitForFunction(expected => window.__e2e.state.index === expected, firstReviewSlot + 1, { timeout: 5000 });
        page.once('dialog', dialog => dialog.accept());
        await page.locator('#homeButton').click();
        await page.evaluate(() => {
          const api = window.__e2e;
          const profile = api.getProfile();
          profile.currentStage = 24;
          profile.errorQueue = [];
          profile.skillMastery = {};
          profile.multiplicationSequence = { phase: 11, item: 10, mixed: true };
          window.KapiMasterySystem.markStageMastered(profile, 23, new Date('2020-01-01T12:00:00Z'));
          api.saveProfile(profile);
        });
        await page.locator('#statsButton').click();
        assert.ok((await page.locator('#statsContent').innerText()).includes('Einmaleins-Reihen'), 'late skill needs a human History label');
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-late-skill-history.png`) });
        await page.locator('#closeStatsButton').click();
        await page.locator('#startButton').click();
        const lateReviewSlot = await page.evaluate(() => window.__e2e.state.sessionPlan.slots.findIndex(slot => slot.type === 'spacedReview'));
        assert.ok(lateReviewSlot > 0, 'late due skill must have a planned slot');
        for (let index = 0; index < lateReviewSlot; index++) {
          await answerCurrent(page);
          await page.waitForFunction(expected => window.__e2e.state.index === expected, index + 1, { timeout: 5000 });
        }
        const late = await page.evaluate(() => ({ problem: window.__e2e.state.problem,
          before: window.__e2e.getProfile().skillMastery['multiply:einmaleins-sequence'].nextReviewAt,
          sequence: JSON.stringify(window.__e2e.getProfile().multiplicationSequence),
          stageBefore: window.__e2e.getProfile().currentStage,
          answer: window.__e2e.tasks.response(window.__e2e.state.problem) }));
        assert.equal(late.problem.isSpacedReview, true);
        assert.equal(late.problem.reviewSkillId, 'multiply:einmaleins-sequence');
        assert.equal(late.problem.curriculumStage, 23);
        assert.equal(late.problem.operation, 'multiply');
        await page.waitForFunction(() => document.querySelector('#motivationPop').classList.contains('hidden'), null, { timeout: 5000 });
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-late-spaced-review.png`) });
        await answerCurrent(page);
        const lateResult = await page.evaluate(() => ({ mastery: window.__e2e.getProfile().skillMastery['multiply:einmaleins-sequence'],
          sequence: JSON.stringify(window.__e2e.getProfile().multiplicationSequence),
          stage: window.__e2e.getProfile().currentStage, firstTry: window.__e2e.state.results.at(-1).firstTry,
          viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
        assert.equal(lateResult.mastery.intervalDays, 3);
        assert.ok(Date.parse(lateResult.mastery.nextReviewAt) > Date.parse(late.before));
        assert.equal(lateResult.sequence, late.sequence, 'late review must not mutate the multiplication sequence');
        assert.equal(lateResult.stage, late.stageBefore, 'late review itself cannot advance the current stage');
        assert.equal(lateResult.firstTry, true);
        assert.equal(lateResult.scrollWidth, lateResult.viewport);
        await page.waitForFunction(expected => window.__e2e.state.index === expected, lateReviewSlot + 1, { timeout: 5000 });
        page.once('dialog', dialog => dialog.accept());
        await page.locator('#homeButton').click();
        await page.evaluate(() => {
          const api = window.__e2e;
          const profile = api.getProfile();
          for (let i = 0; i < 6; i++) window.KapiSubskills.recordEvidence(profile,
            { curriculumStage: 23, operation: 'multiply', a: 7, b: 8, answer: 56 },
            { firstAttempt: true, correct: false, source: 'curriculum' });
          api.saveProfile(profile);
        });
        await page.locator('#statsButton').click();
        const targetButton = page.locator('[data-target-subskill="multiply:table:7"]');
        assert.equal(await targetButton.isVisible(), true, 'History should offer the 7er-Reihe as targeted practice');
        await targetButton.scrollIntoViewIfNeeded();
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-subskill-history.png`) });
        await targetButton.click();
        const targetStart = await page.evaluate(() => ({ target: window.__e2e.state.targeted,
          stage: window.__e2e.state.stage, total: document.querySelector('#problemTotal').textContent,
          part: window.KapiSkills.classifyProblem(window.__e2e.state.problem).subskillId,
          pace: window.__e2e.getProfile().personalFastTime,
          adaptive: JSON.stringify(window.__e2e.getProfile().adaptiveRecentResults) }));
        assert.equal(targetStart.target.subskillId, 'multiply:table:7');
        assert.equal(targetStart.stage, 23);
        assert.equal(targetStart.total, '10');
        assert.equal(targetStart.part, 'multiply:table:7');
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${width}x${height}-targeted-practice.png`) });
        const targetedAnswer = await page.evaluate(() => ({ answer: window.__e2e.tasks.response(window.__e2e.state.problem),
          mode: window.__e2e.state.problem.mode }));
        await answerCurrent(page);
        const targetOutcome = await page.evaluate(() => ({ target: window.__e2e.state.targeted,
          stage: window.__e2e.getProfile().currentStage, pace: window.__e2e.getProfile().personalFastTime,
          adaptive: JSON.stringify(window.__e2e.getProfile().adaptiveRecentResults),
          firstTry: window.__e2e.state.results.at(-1).firstTry,
          width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth,
          controlsBottom: document.querySelector('#answerArea').getBoundingClientRect().bottom }));
        assert.equal(targetOutcome.target.subskillId, 'multiply:table:7');
        assert.equal(targetOutcome.stage, 24);
        assert.equal(targetOutcome.pace, targetStart.pace);
        assert.equal(targetOutcome.adaptive, targetStart.adaptive);
        assert.equal(targetOutcome.firstTry, true);
        assert.equal(targetOutcome.width, targetOutcome.viewport);
        assert.ok(targetOutcome.controlsBottom <= height, `targeted controls below viewport: ${JSON.stringify(targetOutcome)}`);
        await page.waitForFunction(() => window.__e2e.state.index === 1, null, { timeout: 5000 });
        page.once('dialog', dialog => dialog.accept());
        await page.locator('#homeButton').click();
        await page.evaluate(() => {
          const api = window.__e2e;
          const profile = api.getProfile();
          profile.currentStage = 13;
          profile.errorQueue = [{ ...api.makeCurriculumProblem(13, 0, profile), correctStreak: 0, lastShown: 1 }];
          profile.skillMastery = {};
          window.KapiMasterySystem.markStageMastered(profile, 12, new Date('2020-01-01T12:00:00Z'));
          api.saveProfile(profile);
        });
        await page.locator('#startButton').click();
        const planned = await page.evaluate(() => ({ mode: window.__e2e.state.sessionMode,
          slots: window.__e2e.state.sessionPlan.slots.map(slot => slot.type),
          counts: window.__e2e.state.sessionPlan.counts }));
        assert.equal(planned.mode, 'normal');
        assert.equal(planned.slots[0], 'current');
        assert.equal(planned.counts.errorReview, 1);
        assert.equal(planned.counts.spacedReview, 1);
        const lastPlanned = Math.max(planned.slots.indexOf('errorReview'), planned.slots.indexOf('spacedReview'));
        const encountered = new Set();
        for (let index = 0; index <= lastPlanned; index++) {
          const current = await page.evaluate(() => ({ index: window.__e2e.state.index,
            isReview: !!window.__e2e.state.problem.isReview,
            isSpacedReview: !!window.__e2e.state.problem.isSpacedReview,
            answer: window.__e2e.tasks.response(window.__e2e.state.problem), mode: window.__e2e.state.problem.mode }));
          assert.equal(current.index, index);
          const actual = current.isReview ? 'errorReview' : current.isSpacedReview ? 'spacedReview' : 'current';
          assert.equal(actual, planned.slots[index], `planner slot ${index}: ${JSON.stringify(current)}`);
          encountered.add(actual);
          await answerCurrent(page);
          await page.waitForFunction(expected => window.__e2e.state.index === expected, index + 1, { timeout: 5000 });
        }
        assert.deepEqual([...encountered].sort(), ['current', 'errorReview', 'spacedReview']);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true);
      }
      assert.deepEqual(errors, [], `browser errors at ${width}×${height}`);
      console.log(`PASS ${width}×${height}: 6 visual formats, controls, complete map, weekly goal`);
      await context.close();
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
