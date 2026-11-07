const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({...process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{},args:['--no-sandbox']});
 try { for(const lang of ['ru','de']) for(const [width,height] of [[320,568],[390,844],[740,844],[740,390]]) {
  const context=await browser.newContext({locale:lang,viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForTimeout(300);
  const shot=async name=>{if(process.env.KAPI_E2E_SCREENSHOTS){await fs.mkdir(process.env.KAPI_E2E_SCREENSHOTS,{recursive:true});await page.screenshot({path:`${process.env.KAPI_E2E_SCREENSHOTS}/${name}-${lang}-${width}x${height}.png`});}};
  assert.equal(await page.locator('#homeWardrobeLabel').isVisible(),true);
  assert.equal(await page.locator('#mapButton, #wardrobeButton').count(),0);
  assert.equal(await page.locator('#journeyAlbumButton').isVisible(),true);await shot('home');
  await page.locator('#homeMascot').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#wardrobeDialog').isVisible(),true);await page.goBack();await page.locator('#wardrobeDialog').waitFor({state:'hidden'});
  await page.locator('#journeyAlbumButton').click();await page.locator('#journeyAlbum').waitFor({state:'visible'});
  assert.equal(await page.locator('.next-stop-help').count(),1);assert.equal(await page.locator('.album-next').count(),0);
  await page.locator('[data-album-view="0"]').click();assert.equal(await page.locator('#journeyViewer').isVisible(),true);
  await page.goBack();await page.locator('#journeyViewer').waitFor({state:'hidden'});await page.goBack();await page.locator('#journeyAlbum').waitFor({state:'hidden'});
  await page.locator('#settingsButton').click();assert.equal(await page.locator('.settings-menu button').count(),3);await shot('menu');
  await page.locator('[data-settings-section=parents]').click();await page.locator('.parent-overview').waitFor();await shot('parents');
  assert.equal(await page.locator('#parentHistory').count(),1);await page.locator('#parentHistory summary').click();assert.equal(await page.locator('#statsContent').isVisible(),true);
  await page.locator('.parent-week details summary').click();await page.locator('[name=weeklyGoal][value="5"]').check();await page.waitForFunction(()=>document.querySelector('.parent-week')?.textContent.includes('/ 5'));
  await page.goBack();await page.locator('.settings-menu').waitFor();
  await page.locator('[data-settings-section=counting]').click();await page.locator('[name=automatic][value=manual]').check();
  assert.equal(await page.locator('[data-pick-stage]').count(),41);assert.equal(await page.locator('select[name=manualStage]').count(),0);await shot('topics');
  await page.locator('[data-pick-stage="3"]').click();assert.match(await page.locator('.topic-example').innerText(),/2 \+ 3/);
  await page.locator('[data-settings-back]').click();await page.locator('[data-settings-section=general]').click();
  await page.locator('[data-fold=backup] summary').click();assert.equal(await page.locator('[data-backup-export]').isVisible(),true);
  await page.locator('[data-fold=licenses] summary').click();assert.equal(await page.locator('.music-credit').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS unified navigation ${lang} ${width}x${height}`);
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
