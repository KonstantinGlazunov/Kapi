// Real UI transition with a controlled browser clock: 799 ms intro, first task at 800 ms.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/';
const shots = process.env.KAPI_E2E_SCREENSHOTS;
if (shots) fs.mkdirSync(shots, { recursive: true });
(async () => {
 const browser = await chromium.launch({headless:true, args:['--no-sandbox'], ...(process.env.KAPI_CHROME ? {executablePath:process.env.KAPI_CHROME}: {})});
 try {
  for (const [width,height,language,stage] of [[390,844,'ru',12],[320,568,'ru',12],[320,568,'de',35],[390,844,'ru',35],[844,390,'de',35]]) {
   const context = await browser.newContext({viewport:{width,height}, serviceWorkers:'block', reducedMotion:width===390 && stage===12 ? 'no-preference' : 'reduce'});
   await context.addInitScript(language => localStorage.setItem('capy-count-settings-v1', JSON.stringify({language})), language);
   const page = await context.newPage(); const errors=[];
   page.on('pageerror', e => errors.push(e.message));
   await page.route('**/app.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({response, body:source.replace(/\}\)\(\);\s*$/, 'window.__introTest={getProfile,saveProfile,updateHomeStats,state};})();')});
   });
   await page.goto(base);
   await page.locator('#weeklyStat').waitFor();
   await page.evaluate(stage => {const api=window.__introTest; const profile=api.getProfile(); profile.currentStage=stage; api.saveProfile(profile); api.updateHomeStats();}, stage);
   assert.equal(await page.locator('.home-stage-card').count(), 0);
   const name=`${width}x${height}-${language}-${stage}`;
   if(shots) await page.screenshot({path:path.join(shots,`${name}-home.png`)});
   const before=await page.evaluate(()=>JSON.stringify(window.__introTest.getProfile()));
   await page.clock.install();
   await page.clock.pauseAt(new Date(Date.now()+1000));
   await page.locator('#startButton').click({force:true});
   assert.equal(await page.locator('#stageIntroScreen').isVisible(), true);
   assert.equal(await page.locator('#stageIntroLabel').innerText(), `${language==='ru'?'СТУПЕНЬ':'STUFE'} ${stage}`);
   assert.equal(await page.locator('#gameScreen').isVisible(), false);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__introTest.getProfile())), before);
   const title=await page.locator('#stageIntroTitle').innerText();
   assert.ok(title.length>0);
   if(stage===12) assert.equal(title, 'Сложение через 10');
   for(const id of ['stageIntroBrand','stageIntroLabel','stageIntroTitle']) {
    const box=await page.locator('#'+id).boundingBox();
    assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=width && box.y+box.height<=height, `${name}: ${id} out of bounds`);
   }
   const mascot=await page.locator('.stage-intro-kapi').boundingBox();
   assert.ok(mascot.height>=140 && mascot.y+mascot.height<=height, `${name}: mascot clipped or tiny`);
   await page.clock.runFor(120);
   if(shots) await page.screenshot({path:path.join(shots,`${name}-intro-120.png`)});
   await page.clock.runFor(480);
   if(shots) await page.screenshot({path:path.join(shots,`${name}-intro-600.png`)});
   await page.clock.runFor(199);
   assert.equal(await page.locator('#stageIntroScreen').isVisible(), true, 'still visible at 799 ms');
   await page.clock.runFor(1);
   assert.equal(await page.locator('#stageIntroScreen').isVisible(), false);
   assert.equal(await page.locator('#gameScreen').isVisible(), true, 'first question at 800 ms');
   assert.equal(await page.evaluate(()=>window.__introTest.state.stage), stage);
   assert.equal(await page.locator('#problemNumber').innerText(),'1');
   assert.equal(await page.evaluate(()=>window.__introTest.state.startedAt===performance.now()),true, 'answer timing begins after the intro');
   if(shots) await page.screenshot({path:path.join(shots,`${name}-game.png`)});
   assert.deepEqual(errors,[]);
   console.log(`PASS ${name}: no home plaque, intro 799/800ms, correct stage, no layout/runtime errors`);
   await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
