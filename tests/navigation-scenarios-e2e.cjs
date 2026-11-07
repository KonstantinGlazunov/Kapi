const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{},args:['--no-sandbox']});const c=await b.newContext({locale:'ru',viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,'window.__navTest={state,appSettings,getProfile,saveProfile,saveSettings,storage,getHistory};})();')})});
 try{
 await p.goto(process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/');await p.waitForFunction(()=>!!window.__navTest);
 await p.evaluate(()=>{const a=__navTest;Object.assign(a.appSettings,{automatic:false,manualStage:12,range:'20',operations:['add'],problemCount:20});a.saveSettings();});
 await p.reload();await p.waitForFunction(()=>!!window.__navTest);assert.deepEqual(await p.evaluate(()=>{let a=__navTest.appSettings;return [a.automatic,a.manualStage,a.range,a.problemCount]}),[false,12,'20',20]);
 await p.locator('#settingsButton').click();await p.locator('[data-settings-section=counting]').click();assert.equal(await p.locator('[data-pick-stage="12"]').getAttribute('aria-pressed'),'true');
 await p.locator('#closeSettingsButton').click();await p.waitForTimeout(250);
 await p.evaluate(()=>{const a=__navTest;const profile=a.getProfile();profile.currentStage=23;profile.multiplicationSequence={...profile.multiplicationSequence,mixed:true};a.saveProfile(profile);Object.assign(a.appSettings,{automatic:false,manualStage:23,range:'100',operations:['multiply']});a.saveSettings()});
 await p.locator('#settingsButton').click();await p.locator('[data-settings-section=counting]').click();await p.locator('.topic-skill details summary').click();await p.locator('[data-pick-subskill="multiply:table:7"]').click();
 assert.equal(await p.locator('[data-pick-subskill="multiply:table:7"]').getAttribute('aria-pressed'),'true');await p.locator('[data-start-selected]').click();await p.locator('#gameScreen').waitFor({state:'visible',timeout:10000});
 assert.equal(await p.evaluate(()=>KapiSkills.classifyProblem(__navTest.state.problem).subskillId),'multiply:table:7');
 await p.locator('#settingsButton').click();await p.locator('[data-settings-section=parents]').click();await p.locator('#parentHistory').waitFor();await p.locator('#closeSettingsButton').click();await p.waitForTimeout(300);
 await p.evaluate(()=>{__navTest.storage.setItem('capy-count-history-v1',JSON.stringify([{date:new Date().toISOString(),correct:9,total:10,average:2,score:10,stage:1,mistakes:[]}]));document.querySelector('#resultStatsButton').click()});await p.locator('#parentHistory[open]').waitFor();assert.equal(await p.locator('#statsContent').isVisible(),true);
 assert.equal(await p.locator('.history-row').count(),1);p.once('dialog',d=>d.dismiss());await p.locator('#clearStatsButton').click();assert.equal(await p.locator('.history-row').count(),1);
 p.once('dialog',d=>d.accept());await p.locator('#clearStatsButton').click();assert.equal(await p.locator('.history-row').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS legacy manual selection, specific subskill launch, in-session parent report and result history link');
 }finally{await c.close();await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
