const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{const browser=await chromium.launch({...process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{},args:['--no-sandbox']});try{
for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:width===320?568:844},locale:'ru',serviceWorkers:'block'});
 await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,'window.__historyTest={state,tasks,startTraining,makeCurriculumProblem,getProfile,getHistory,submitAnswer,renderProblem,renderAnswer,finishTraining,openParentReport,showSolution};})();')});});
 await page.goto(process.env.KAPI_BASE_URL||'http://127.0.0.1:8765');await page.waitForFunction(()=>!!window.__historyTest);
 const shots=process.env.KAPI_E2E_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});const shot=async name=>{if(shots){await page.waitForTimeout(350);await page.screenshot({path:path.join(shots,`${width}-${name}.png`)});}};
 await page.evaluate(()=>{const a=__historyTest;a.startTraining();let p;do{p=a.makeCurriculumProblem(1,0,a.getProfile())}while(p.answer!==1);a.state.problem=a.tasks.decorate(p,null,'visualCount');a.renderProblem(a.state.problem);a.renderAnswer();});
 const originalVisual=await page.locator('#taskVisual').innerHTML();
 await page.locator('.answer-button').filter({hasText:/^2$/}).click();await page.locator('.answer-button').filter({hasText:/^1$/}).click();
 await page.evaluate(()=>{__historyTest.finishTraining();__historyTest.openParentReport(true)});
 assert.match(await page.locator('.history-mistake').innerText(),/Сколько яблок/);assert.match(await page.locator('.history-mistake').innerText(),/2 → 1/);assert.match(await page.locator('.history-mistake').innerText(),/Правильный ответ: 1/);
 assert.equal(await page.locator('.history-task-visual').innerHTML(),originalVisual);assert.doesNotMatch(await page.locator('#statsContent').innerText(),/count:/);await shot('history');
 await page.reload();await page.waitForFunction(()=>!!window.__historyTest);await page.evaluate(()=>__historyTest.openParentReport(true));assert.match(await page.locator('.history-mistake').innerText(),/2 → 1/);
 await page.locator('[data-history-repeat]').click();await page.locator('#gameScreen').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>__historyTest.state.problem.operation),'count');assert.equal(await page.evaluate(()=>__historyTest.state.problem.taskType),'visualCount');
 await page.evaluate(()=>{const a=__historyTest;a.startTraining();a.state.problem={a:'8/10',b:'4/10',answer:'6/5',operation:'fraction',operator:'+',answerType:'fraction',mode:'input',taskType:'equation',key:'fraction-test',curriculumStage:32,text:'8/10 + 4/10 = ?'};a.renderProblem(a.state.problem);a.renderAnswer();});
 assert.equal(await page.locator('[data-action=submit]').isDisabled(),true);await shot('empty');
 for(const key of '2/4')await page.locator(`[data-key="${key}"]`).click();assert.equal(await page.evaluate(()=>__historyTest.state.results.length),0);await page.locator('[data-action=submit]').click();assert.match(await page.locator('#hint').innerText(),/Доли уже одинаковые/);await shot('fraction-hint');
 for(const key of '1/4')await page.locator(`[data-key="${key}"]`).click();await page.locator('[data-action=submit]').click();
 const first=await page.locator('#hint').innerText();await page.waitForTimeout(2800);assert.equal(await page.locator('#hint').innerText(),first);assert.equal(await page.locator('.solution-previous').isDisabled(),true);
 await page.locator('.solution-next').click();assert.match(await page.locator('#hint').innerText(),/12\/10/);await shot('fraction-step');await page.locator('.solution-previous').click();assert.equal(await page.locator('#hint').innerText(),first);
 await page.locator('.solution-next').click();await page.locator('.solution-next').click();assert.match(await page.locator('#hint').innerText(),/раздели числитель и знаменатель на 2/);await shot('reduction');
 while(await page.locator('.solution-next').getAttribute('data-last-step')!=='true')await page.locator('.solution-next').click();assert.equal(await page.locator('.solution-next').innerText(),'Следующий пример');const before=await page.evaluate(()=>__historyTest.state.index);await page.locator('.solution-next').click();assert.equal(await page.evaluate(()=>__historyTest.state.index),before+1);
 console.log('PASS',width,'history task/answers/visual/reload/repeat, explicit input, fraction hint and manual steps');await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
