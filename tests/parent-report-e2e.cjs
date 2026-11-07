const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const fs = require('node:fs/promises');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname,'../dist');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/^\/kapi\//,'').replace(/^\//,''))||'index.html';
   if(name.includes('..'))throw Error('invalid');
   const bytes=await fs.readFile(path.join(ROOT,name));res.writeHead(200,{'Content-Type':MIME[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
async function preparePage(context,url) {
 const page=await context.newPage(), errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,'window.__parentTest={state,tasks,reportStore,storage,getProfile,appSettings,getHistory,saveProfile,saveSettings,startTraining,renderProblem,renderAnswer,submitAnswer,finishTraining,endResultShow};})();')})});
 await page.goto(url);await page.waitForFunction(()=>!!window.__parentTest);return {page,errors};
}
async function openReport(page) {
 await page.locator('#settingsButton').click();
 await page.locator('[data-settings-section="parents"]').click();
 await page.locator('.parent-report').waitFor({state:'visible'});
}
async function answer(page,wrongFirst=false) {
 const p=await page.evaluate(()=>({answer:__parentTest.tasks.response(__parentTest.state.problem),mode:__parentTest.state.problem.mode,
  labels:!!__parentTest.tasks.choiceLabels(__parentTest.state.problem,document.documentElement.lang),index:__parentTest.state.index}));
 if(p.mode==='choice'){
   const buttons=page.locator('.answer-button');
   const correct=p.labels?buttons.nth(p.answer):buttons.filter({hasText:new RegExp('^'+p.answer+'$')});
   if(wrongFirst){
     const before=await buttons.allTextContents();
     const choices=await buttons.count();let selected=-1;
     for(let i=0;i<choices;i++)if(!await buttons.nth(i).evaluate((el,a)=>el.textContent===String(a),p.answer)){selected=i;break}
     assert.ok(selected>=0);await buttons.nth(selected).click();assert.deepEqual(await buttons.allTextContents(),before);assert.equal(await buttons.nth(selected).isDisabled(),true);
   }
   await correct.click();
 }else{
   if(wrongFirst){await page.keyboard.type('99');await page.locator('[data-action=submit]').click();assert.ok(await page.locator('#hint').isVisible());}
   await page.keyboard.type(String(p.answer).replace('.',',')); // correct input submits automatically
 }
 await page.waitForFunction(index=>__parentTest.state.index>index||__parentTest.state.finished,p.index,{timeout:10000});
}
async function data(page){return page.evaluate(()=>__parentTest.reportStore.snapshot());}
async function seedReport(page) {
 await page.evaluate(async()=>{
  const m=KapiParentReport, rows=[],summaries={},states={};
  const specs=[
   {id:'count:to5',stage:1,n:20,success:17,days:true,bad:[2,7,12]},
   {id:'add:to5',stage:3,n:10,success:7},
   {id:'add:to10',stage:5,n:5,success:2},
   {id:'add:cross-ten',stage:12,n:3,success:2},
   {id:'mixed:large-four-operations',stage:29,n:3,success:2}
  ];
  for(const spec of specs){
   const group=[];
   for(let i=0;i<spec.n;i++){
    const success=spec.bad?!spec.bad.includes(i):i<spec.success,day=spec.days&&i>=Math.floor(spec.n/2)?'02':'01',session=spec.days&&i>=Math.floor(spec.n/2)?'two':'one';
    const r={id:'fixture-'+session+':'+spec.id+':'+i,sessionId:'fixture-'+session,date:`2026-11-${day}T12:${String(i).padStart(2,'0')}:00Z`,day:`2026-11-${day}`,
      skillId:spec.id,subskillId:null,stage:spec.stage,operation:spec.stage===1?'count':'add',fact:i,taskType:'equation',format:i%2?'input':'choice',
      firstCorrect:success,errors:success?0:1,hint:!success,solution:false,outcome:success?'independent':'supported',activeSeconds:success?2.2:null};
    group.push(r);rows.push(r);summaries[spec.id]=m.addToSummary(summaries[spec.id],r);states[spec.id]=m.advanceState(group,states[spec.id]);
   }
  }
  await __parentTest.reportStore.replace({version:1,records:rows,summaries,states});
 });
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/kapi/';
 const b=await chromium.launch({...process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{},args:['--no-sandbox']});
 try{
  // Normal interaction: a wrong first answer, help, then independent work before the round ends.
  const context=await b.newContext({viewport:{width:390,height:844},locale:'ru',serviceWorkers:'block',reducedMotion:'reduce'});
  const {page,errors}=await preparePage(context,url);await openReport(page);
  assert.match(await page.locator('#parentReportHost').innerText(),/После первых завершённых примеров/);
  assert.doesNotMatch(await page.locator('#parentReportHost').innerText(),/Уже есть первые самостоятельные решения/);
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement instanceof HTMLElement));
  await page.locator('#closeSettingsButton').click();await page.locator('#startButton').click();await page.locator('#gameScreen').waitFor({state:'visible'});
  await page.waitForTimeout(120);await page.locator('#settingsButton').click();await page.waitForTimeout(2000);await page.locator('#closeSettingsButton').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await answer(page,true);await openReport(page);
  assert.match(await page.locator('#parentReportHost').innerText(),/Знакомимся/);
  assert.doesNotMatch(await page.locator('#parentReportHost').innerText(),/первые самостоятельные решения/i);
  await page.locator('#closeSettingsButton').click();
  const secondStarted=await page.evaluate(()=>__parentTest.state.startedAt);
  await answer(page);const secondFinished=await page.evaluate(()=>performance.now());const first=await data(page);
  assert.equal(first.records.length,2);assert.equal(first.records[0].outcome,'supported');assert.equal(first.records[0].errors,1);assert.equal(first.records[0].hint,true);
  assert.equal(first.records[1].outcome,'independent');assert.notEqual(first.records[0].format,first.records[1].format);
  if(first.records[1].activeSeconds!==null)assert.ok(first.records[1].activeSeconds <= (secondFinished-secondStarted)/1000-.6,'auto-check delay must not count');
  if(first.records[0].activeSeconds!==null)assert.ok(first.records[0].activeSeconds<1.8,'settings and hidden-tab time must not count');
  await openReport(page);assert.match(await page.locator('#parentReportHost').innerText(),/Знакомимся/);
  assert.match(await page.locator('#parentReportHost').innerText(),/первые самостоятельные решения/i);
  assert.equal(await page.locator('.parent-topic').count(),1);
  await page.locator('.parent-topic summary').click();assert.match(await page.locator('.parent-topic').innerText(),/после подсказки/);
  await page.locator('#closeSettingsButton').click();await answer(page);
  await openReport(page);assert.match(await page.locator('#parentReportHost').innerText(),/Знакомимся/);
  await page.locator('#closeSettingsButton').click();await answer(page);assert.equal((await data(page)).records.length,4);
  await openReport(page);assert.match(await page.locator('#parentReportHost').innerText(),/Знакомимся/);await page.locator('.parent-topic summary').click();
  const topic=page.locator('.parent-topic');assert.equal(await topic.evaluate(e=>e.open),true);
  await topic.locator('summary').scrollIntoViewIfNeeded();await topic.locator('summary').focus();
  const priorScroll=await page.locator('#settingsDialog').evaluate(el=>el.scrollTop);

  // A second tab finishes a real task; the first report refreshes and retains its open card.
  const second=await preparePage(context,url);await second.page.locator('#startButton').click();await second.page.locator('#gameScreen').waitFor({state:'visible'});await answer(second.page);
  await page.waitForFunction(()=>document.querySelector('.parent-topic dd')?.textContent==='5',null,{timeout:10000});
  await page.waitForTimeout(350);assert.equal((await data(page)).records.length,5);assert.equal(await topic.evaluate(e=>e.open),true);
  assert.ok(Math.abs(await page.locator('#settingsDialog').evaluate(el=>el.scrollTop)-priorScroll)<=2,'report scroll is preserved');
  assert.match(await topic.innerText(),/Получается с поддержкой|Всё увереннее/);
  await page.locator('#closeSettingsButton').click();

  // Two tabs attempt the same id: the transaction commits exactly once.
  const duplicate=await second.page.evaluate(()=>({id:'dedup:0',sessionId:'dedup',date:new Date().toISOString(),day:KapiWeeklyProgress.getLocalDateKey(new Date()),
    skillId:'count:to5',subskillId:null,stage:1,operation:'count',fact:1,taskType:'equation',format:'input',firstCorrect:true,errors:0,hint:false,solution:false,outcome:'independent',activeSeconds:2}));
  await Promise.all([page.evaluate(r=>__parentTest.reportStore.append(r),duplicate),second.page.evaluate(r=>__parentTest.reportStore.append(r),duplicate)]);
  assert.equal((await data(page)).records.filter(r=>r.id==='dedup:0').length,1);

  // A new result in another tab between inspection and restore must not be
  // overwritten by the old backup; the parent gets a retryable conflict.
  const priorRevision=(await data(page)).revision;
  const concurrent={...duplicate,id:'dedup:1'};
  await second.page.evaluate(r=>__parentTest.reportStore.append(r),concurrent);
  const conflict=await page.evaluate(async revision=>{
    try {await __parentTest.reportStore.replace(KapiParentReport.emptySnapshot(),()=>true,revision);return '';}
    catch(error){return error.message;}
  },priorRevision);
  assert.equal(conflict,'REPORT_CHANGED');
  assert.ok((await data(page)).records.some(r=>r.id==='dedup:1'));

  // Invalid fraction leaves the attempt untouched. Auto-check and a manual tap still save one record.
  await second.page.evaluate(()=>{
    const a=__parentTest;a.startTraining();
    a.state.problem={a:'2/5',b:'2/5',answer:'0/1',answerType:'fraction',operation:'fraction',operator:'−',taskType:'equation',mode:'input',key:'zero-test',curriculumStage:32,text:'2/5 − 2/5 = ?'};
    a.state.locked=false;a.state.attempt=1;a.state.enteredAnswer='';a.renderProblem(a.state.problem);a.renderAnswer();
  });
  let total=(await data(second.page)).records.length;
  for(const key of '0/0')await second.page.locator(`[data-key="${key}"]`).click();
  await second.page.locator('[data-action=submit]').click();
  assert.match(await second.page.locator('#feedback').innerText(),/нул/);
  assert.equal(await second.page.evaluate(()=>__parentTest.state.attempt),1);assert.equal((await data(second.page)).records.length,total);
  await second.page.locator('[data-action=clear]').click();for(const key of '0/5')await second.page.locator(`[data-key="${key}"]`).click();
  await second.page.locator('[data-action=submit]').click();await second.page.keyboard.press('Enter');await second.page.waitForTimeout(1100);
  let after=await data(second.page);assert.equal(after.records.length,total+1);const zero=after.records.find(r=>r.stage===32);
  assert.equal(zero.firstCorrect,true);assert.equal(zero.errors,0);

  // Compaction keeps recent details and accurate long-term aggregates.
  const extras=await page.evaluate(()=>Array.from({length:65},(_,i)=>({id:'compact:'+i,sessionId:'compact',date:`2026-11-03T15:${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}Z`,day:'2026-11-03',
    skillId:'add:to5',subskillId:null,stage:3,operation:'add',fact:i,taskType:'equation',format:i%2?'input':'choice',firstCorrect:true,errors:0,hint:false,solution:false,outcome:'independent',activeSeconds:3})));
  for(const item of extras)await page.evaluate(r=>__parentTest.reportStore.append(r),item);
  const compacted=await data(page);assert.equal(compacted.records.filter(r=>r.skillId==='add:to5').length,60);assert.equal(compacted.summaries['add:to5'].total,65);
  assert.equal(await page.evaluate(()=>document.querySelector('#storageNotice').hidden),true);

  // A shown solution is recorded as supported, followed by a genuinely
  // independent similar exercise through the normal controls.
  await second.page.evaluate(()=>{
    const a=__parentTest;a.startTraining();a.state.problem={a:2,b:1,answer:3,operation:'add',operator:'+',taskType:'equation',mode:'choice',key:'solution-test',curriculumStage:3,text:'2 + 1 = ?'};
    a.state.locked=false;a.state.attempt=1;a.state.enteredAnswer='';a.renderProblem(a.state.problem);a.renderAnswer();
  });
  const candidates=second.page.locator('.answer-button');
  for(let count=0;count<2;count++){
    let selected=null;for(let i=0;i<await candidates.count();i++){const el=candidates.nth(i);if(await el.innerText()!=='3' && await el.isEnabled()){selected=el;break}}
    assert.ok(selected);await selected.click();
  }
  await second.page.locator('.solution-next').waitFor({state:'visible'});
  await second.page.waitForFunction(async()=> (await __parentTest.reportStore.snapshot()).summaries['add:to5'].solution===1);
  let solutionData=await data(second.page);const solution=solutionData.records.find(r=>r.skillId==='add:to5'&&r.solution);
  assert.equal(solution.errors,2);assert.equal(solution.firstCorrect,false);assert.equal(solution.outcome,'solution');
  for(let i=0;i<12;i++){const last=await second.page.locator('.solution-next').getAttribute('data-last-step');await second.page.locator('.solution-next').click();if(last==='true')break;}
  await second.page.evaluate(()=>{
    const a=__parentTest;a.state.problem={a:1,b:2,answer:3,operation:'add',operator:'+',taskType:'equation',mode:'choice',key:'similar-test',curriculumStage:3,text:'1 + 2 = ?'};
    a.state.locked=false;a.state.attempt=1;a.state.enteredAnswer='';a.renderProblem(a.state.problem);a.renderAnswer();
  });
  await second.page.locator('.answer-button').filter({hasText:/^3$/}).click();
  await second.page.waitForFunction(async()=> (await __parentTest.reportStore.snapshot()).summaries['add:to5'].total===67);
  await page.locator('#settingsButton').click();await page.locator('[data-settings-section=parents]').click();
  await page.waitForFunction(()=>document.querySelector('.parent-overview')?.textContent.includes('После помощи удалось самостоятельно'));
  await page.locator('#closeSettingsButton').click();

  // Export version 2, validate it, restore it through the actual settings UI.
  const backup=await page.evaluate(async()=>{
    const a=__parentTest;
    return a.storage.exportBackup({profile:a.getProfile(),settings:{...a.appSettings},history:a.getHistory(),report:await a.reportStore.snapshot()});
  });
  assert.equal(JSON.parse(backup).version,2);
  assert.equal(await page.evaluate(text=>__parentTest.storage.validateBackup(text).report.summaries['add:to5'].total,backup),67);
  const corrupt=JSON.parse(backup);corrupt.data.report.records[0].format='bad';
  assert.equal(await page.evaluate(text=>{try{__parentTest.storage.validateBackup(text);return false}catch{return true}},JSON.stringify(corrupt)),true);
  await page.evaluate(()=>__parentTest.reportStore.replace(KapiParentReport.emptySnapshot()));
  assert.equal((await data(page)).records.length,0);
  page.once('dialog',d=>d.accept());await page.locator('#homeButton').click();
  await page.locator('#settingsButton').click();await page.locator('[data-settings-section=general]').click();await page.locator('[data-fold=backup] > summary').click();
  page.once('dialog',d=>d.accept());await page.locator('[data-backup-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
  await page.waitForFunction(()=>document.querySelector('#backupStatus')?.textContent.includes('восстановлена'));
  assert.equal((await data(page)).summaries['add:to5'].total,67);
  await page.reload();await page.waitForFunction(()=>!!window.__parentTest);assert.equal((await data(page)).summaries['add:to5'].total,67);

  // A legacy backup without report data remains valid; no guesses are derived from it.
  const legacy=JSON.parse(backup);legacy.version=1;delete legacy.data.report;
  assert.equal(await page.evaluate(text=>!('report' in __parentTest.storage.validateBackup(text)),JSON.stringify(legacy)),true);
  legacy.data.history=[{date:'2026-11-01T12:00:00Z',correct:9,total:10,average:2,score:10,stage:1,trouble:['count:legacy']}];
  await page.locator('#settingsButton').click();await page.locator('[data-settings-section=general]').click();await page.locator('[data-fold=backup] > summary').click();
  page.once('dialog',d=>d.accept());await page.locator('[data-backup-import]').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await page.waitForFunction(()=>document.querySelector('#backupStatus')?.textContent.includes('восстановлена'));
  assert.equal((await data(page)).records.length,0);assert.equal(await page.evaluate(()=>__parentTest.getHistory().length),1);
  await page.locator('[data-settings-back]').click();await page.locator('[data-settings-section=parents]').click();
  await page.locator('.parent-report').waitFor({state:'visible'});
  assert.match(await page.locator('#parentReportHost').innerText(),/После первых завершённых примеров/);
  assert.equal(await page.locator('.parent-topic').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(second.errors,[]);
  console.log('PASS live progress, attempt semantics, settings time, two tabs/dedup, invalid fraction, compaction, backup, reload and legacy');
  await context.close();

  // If durable report storage is unavailable, new records remain exportable
  // in memory and the interface clearly marks the backup as incomplete.
  {
   const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ru',serviceWorkers:'block',reducedMotion:'reduce'});
   await ctx.addInitScript(()=>Object.defineProperty(window,'indexedDB',{configurable:true,value:undefined}));
   const {page:p}=await preparePage(ctx,url);await p.locator('#startButton').click();await p.locator('#gameScreen').waitFor({state:'visible'});await answer(p);
   const partial=await data(p);assert.equal(partial.partial,true);assert.equal(partial.records.length,1);
   assert.equal(await p.locator('#storageNotice').isVisible(),true);
   await openReport(p);assert.match(await p.locator('[role=alert]').innerText(),/неполной/);
   const saved=await p.evaluate(async()=>{const a=__parentTest;return a.storage.exportBackup({profile:a.getProfile(),settings:{...a.appSettings},history:a.getHistory(),report:await a.reportStore.snapshot()})});
   assert.equal(JSON.parse(saved).data.report.partial,true);
   assert.equal(await p.evaluate(text=>__parentTest.storage.validateBackup(text).report.records.length,saved),1);
   await ctx.close();console.log('PASS unavailable storage: explicit warning and partial backup with new observation');
  }

  // Table-specific retention, status and targeted practice stay separate.
  {
   const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ru',serviceWorkers:'block',reducedMotion:'reduce'});
   const {page:p,errors:pageErrors}=await preparePage(ctx,url);
   await p.evaluate(()=>{const profile=__parentTest.getProfile();profile.currentStage=23;profile.multiplicationSequence={...profile.multiplicationSequence,mixed:true};__parentTest.saveProfile(profile)});
   for(const factor of [7,9]) for(let i=0;i<65;i++) {
    const r=await p.evaluate(({factor,i})=>{
      const date=new Date(Date.UTC(2026,10,i<33?1:2,12,Math.floor(i/60),i%60)).toISOString();
      const good=factor===7 || i%3===0;
      const session=i<33?'mult1':'mult2';return {id:`${session}:${factor}:${i}`,sessionId:session,date,day:date.slice(0,10),skillId:'multiply:einmaleins-sequence',
       subskillId:`multiply:table:${factor}`,stage:23,operation:'multiply',fact:i,taskType:'equation',format:i%2?'input':'choice',
       firstCorrect:good,errors:good?0:1,hint:!good,solution:false,outcome:good?'independent':'supported',activeSeconds:2};
    },{factor,i});await p.evaluate(r=>__parentTest.reportStore.append(r),r);
   }
   const snap=await data(p), skill='multiply:einmaleins-sequence';
   assert.equal(snap.records.filter(r=>r.skillId===skill).length,120);
   assert.equal(snap.summaries[skill].total,130);
   assert.equal(snap.summaries[skill+'|multiply:table:7'].total,65);
   assert.equal(snap.summaries[skill+'|multiply:table:9'].total,65);
   assert.equal(snap.states[skill+'|multiply:table:7'].status,'independent');
   assert.equal(snap.states[skill+'|multiply:table:9'].status,'support');
   await p.evaluate(async snapshot=>{KapiParentReport.validateSnapshot(snapshot);await __parentTest.reportStore.replace(KapiParentReport.emptySnapshot());await __parentTest.reportStore.replace(snapshot)},snap);
   assert.equal((await data(p)).summaries[skill+'|multiply:table:7'].total,65);
   await openReport(p);await p.locator('[data-report-topic="multiply:einmaleins-sequence"] > summary').click();
   const part=p.locator('[data-report-topic="multiply:einmaleins-sequence|multiply:table:7"]');
   assert.match(await part.innerText(),/Таблица на 7/);assert.match(await part.innerText(),/Получается самостоятельно/);
   await part.locator('summary').click();await part.locator('[data-report-subskill="multiply:table:7"]').click();
   assert.equal(await p.evaluate(()=>__parentTest.state.targeted.subskillId),'multiply:table:7');
   assert.equal(await p.evaluate(()=>KapiSkills.classifyProblem(__parentTest.state.problem).subskillId),'multiply:table:7');
   for(let i=0;i<4;i++){
     const failure=await p.evaluate(i=>({id:'difficulties:'+i,sessionId:'difficulties',date:`2026-11-03T20:00:0${i}Z`,day:'2026-11-03',
       skillId:'multiply:einmaleins-sequence',subskillId:'multiply:table:7',stage:23,operation:'multiply',fact:i,taskType:'equation',
       format:'input',firstCorrect:false,errors:1,hint:true,solution:false,outcome:'supported',activeSeconds:4}),i);
     await p.evaluate(r=>__parentTest.reportStore.append(r),failure);
     const partState=(await data(p)).states[skill+'|multiply:table:7'];
     if(i===0) assert.equal(partState.status,'independent','one error must not downgrade');
     if(i===2) {assert.equal(partState.status,'growing');assert.equal(partState.refresh,true);}
     if(i===3) {assert.equal(partState.status,'growing');assert.equal(partState.refresh,true);}
   }
   assert.deepEqual(pageErrors,[]);await ctx.close();console.log('PASS independent subskill evidence, bounded retention and targeted table practice');
  }

  // Three deterministic datasets, both languages and phone widths.
  for(const language of ['ru','de']) for(const width of [320,390]){
   const ctx=await b.newContext({viewport:{width,height:width===320?568:844},locale:language,serviceWorkers:'block',reducedMotion:'reduce'});
   const {page:p,errors:pageErrors}=await preparePage(ctx,url);await openReport(p);
   const empty=await p.locator('.parent-overview').innerText();assert.match(empty,language==='ru'?/первых завершённых/:/ersten abgeschlossenen/);
   await p.locator('#closeSettingsButton').click();await seedReport(p);await openReport(p);
   await p.waitForFunction(()=>document.querySelectorAll('.parent-topic').length===5);
   const cards=await p.locator('.parent-topic').allTextContents(), txt=cards.join(' ');
   for(const part of language==='ru'?['Знакомимся','Получается с поддержкой','Всё увереннее','Получается самостоятельно']:['Wir lernen es kennen','Mit Unterstützung','Immer sicherer','Selbstständig'])assert.ok(txt.includes(part),part);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const summary=await p.locator('.parent-overview').innerText();assert.doesNotMatch(summary,/диагноз|intelligenz/i);
   if(process.env.KAPI_E2E_SCREENSHOTS){await fs.mkdir(process.env.KAPI_E2E_SCREENSHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.KAPI_E2E_SCREENSHOTS,`report-${language}-${width}.png`)});}
   const firstSummary=p.locator('.parent-topic summary').first();await firstSummary.focus();await p.keyboard.press('Enter');
   assert.equal(await p.locator('.parent-topic').first().evaluate(e=>e.open),true);
   assert.match(await p.locator('.parent-topic').first().innerText(),/17 \/ 20 \(85%\)/);
   const secondTopic=p.locator('.parent-topic').nth(1);await secondTopic.locator('summary').click();
   assert.match(await secondTopic.innerText(),/7 \/ 10 \(70%\)/);
   const cardOverflow=await p.locator('.parent-topic').evaluateAll(cards=>cards.some(el=>el.scrollWidth>el.clientWidth+1));
   assert.equal(cardOverflow,false,'long topic labels stay inside cards');
   const target=p.locator('[data-report-practice="count:to5"]');assert.ok(await target.isVisible());await target.click();
   assert.equal(await p.evaluate(()=>__parentTest.state.targeted.skillId),'count:to5');
   assert.deepEqual(pageErrors,[]);await ctx.close();console.log('PASS report',language,width,'four statuses, long labels and accessible controls');
  }
 }finally{await b.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
