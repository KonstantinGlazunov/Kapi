// Real browser: every exercise family gets a detailed hint and a persistent worked solution.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {chromium} = require('playwright');
const base = process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765/';
const shots = process.env.KAPI_E2E_SCREENSHOTS;
if(shots) fs.mkdirSync(shots,{recursive:true});
const cases = [
  {id:'count',stage:1,a:5,b:0,answer:5,operation:'count',operator:'',type:'visualCount'},
  {id:'add',stage:5,a:3,b:2,answer:5,operation:'add',operator:'+'},
  {id:'subtract',stage:7,a:5,b:2,answer:3,operation:'subtract',operator:'−'},
  {id:'frame-add',stage:12,a:8,b:5,answer:13,operation:'add',operator:'+',type:'tenFrame'},
  {id:'frame-subtract',stage:13,a:13,b:5,answer:8,operation:'subtract',operator:'−',type:'tenFrame'},
  {id:'missing',stage:5,a:3,b:4,answer:7,operation:'add',operator:'+',type:'missingOperand'},
  {id:'expression',stage:5,a:3,b:3,answer:6,operation:'add',operator:'+',type:'chooseExpression'},
  {id:'line',stage:7,a:4,b:2,answer:2,operation:'subtract',operator:'−',type:'numberLine'},
  ...['compose','decompose','blocks'].map(variant=>({id:'place-'+variant,stage:9,a:10,b:7,answer:17,operation:'add',operator:'+',type:'placeValue',variant})),
  {id:'story-add',stage:10,a:13,b:2,answer:15,operation:'add',operator:'+',type:'microStory'},
  {id:'story-subtract',stage:11,a:15,b:2,answer:13,operation:'subtract',operator:'−',type:'microStory'},
  {id:'large-add',stage:17,a:28,b:15,answer:43,operation:'add',operator:'+'},
  {id:'large-subtract',stage:17,a:42,b:17,answer:25,operation:'subtract',operator:'−'},
  {id:'equal-groups',stage:19,a:3,b:4,answer:12,operation:'multiply',operator:'+',conceptVisual:true,groupCount:3,groupSize:4},
  {id:'multiply',stage:29,a:23,b:4,answer:92,operation:'multiply',operator:'×'},
  {id:'share',stage:21,a:12,b:3,answer:4,operation:'divide',operator:':',conceptVisual:true,groupCount:3,groupSize:4},
  {id:'divide',stage:29,a:84,b:4,answer:21,operation:'divide',operator:':'},
  ...[['1/5','2/5','3/5','+'],['4/5','1/5','3/5','−'],['1/2','1/4','3/4','+'],['3/4','1/2','1/4','−'],['1/2','1/3','1/6','×'],['1/2','1/4','2/1','÷']].map(([a,b,answer,operator],i)=>({id:'fraction-'+i,stage:33,a,b,answer,operator,operation:'fraction',answerType:'fraction'})),
  ...[[1.2,.35,1.55,'+'],[2.4,.75,1.65,'−'],[1.2,.3,.36,'×'],[1.2,.3,4,'÷']].map(([a,b,answer,operator],i)=>({id:'decimal-'+i,stage:35,a,b,answer,operator,operation:'decimal',answerType:'decimal'})),
  ...[[-3,5,2,'+'],[3,5,-2,'−'],[-3,-2,6,'×'],[-12,3,-4,':']].map(([a,b,answer,operator],i)=>({id:'negative-'+i,stage:37,a,b,answer,operator,operation:'negative'})),
  {id:'power',stage:38,a:3,b:3,answer:27,operation:'power',operator:'^'},
  {id:'root-square',stage:39,a:36,b:2,answer:6,operation:'root',operator:'√'},
  {id:'root-cube',stage:40,a:27,b:3,answer:3,operation:'root',operator:'∛'}
];
cases.push(...[[10,3],[3,10],[6,5],[10,0]].map(([a,b])=>({id:`boundary-${a}-${b}`,stage:23,a,b,answer:a*b,operation:'multiply',operator:'×'})));
cases.push(...[[100,2,10],[400,2,20],[1000,3,10]].map(([a,b,answer])=>({id:`boundary-root-${a}`,stage:b===2?39:40,a,b,answer,operation:'root',operator:b===2?'√':'∛'})));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{}),args:['--no-sandbox']});
 try {
  for(const [width,height] of [[320,568],[390,844]]) {
   const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',async route=>{const res=await route.fetch();const source=await res.text();await route.fulfill({response:res,body:source.replace(/\}\)\(\);\s*$/,'window.__guidanceTest = {state,tasks,guidance,renderProblem,renderAnswer,submitAnswer,startTraining,setLanguage(value){language=value;applyLanguage();},showSolution};})();')});});
   await page.goto(base);await page.locator('#startButton').click();await page.locator('#gameScreen').waitFor({state:'visible'});
   for(const item of cases) {
    await page.evaluate(item=>{
     const api=window.__guidanceTest;api.startTraining();api.setLanguage('ru');
     const p={...item,curriculumStage:item.stage,mode:'input',text:`${item.a} ${item.operator} ${item.b} = ?`};
     let decorated;
     for(let i=0;i<100;i++){decorated=api.tasks.decorate(p,null,item.type||'equation');if(!item.variant||decorated.placeValue.variant===item.variant)break;}
     api.state.problem=decorated;api.state.locked=false;api.state.attempt=1;api.state.enteredAnswer='';api.renderProblem(decorated);api.renderAnswer();
    },item);
    const wrong=await page.evaluate(()=>{const {state,tasks}=window.__guidanceTest;return tasks.choiceLabels(state.problem)?(tasks.response(state.problem)+1)%4:state.problem.answerType==='fraction'?'999/1':999;});
    // The first and second submissions use the actual visible input controls.
    async function submitWrong(){const choice=await page.locator('#answerArea .answer-button').count();if(choice)await page.locator('#answerArea .answer-button').nth(wrong).click();else{for(const d of String(wrong))await page.locator(`#answerArea [data-key="${d}"]`).click();await page.locator('#answerArea [data-action="submit"]').click();}}
    await submitWrong();await page.waitForTimeout(60);
    assert.equal(await page.evaluate(()=>window.__guidanceTest.state.attempt),2,item.id);
    assert.equal(await page.locator('#hint').isVisible(),true);
    assert.ok(await page.locator('#hint').innerText(),item.id+' hint');
    const visual=await page.locator('#taskVisual').evaluate(e=>({height:e.clientHeight,scrollHeight:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}));
    assert.ok(visual.scrollHeight<=visual.height+1 && visual.scrollWidth<=visual.width+1,`${width} ${item.id}: illustration clipped ${JSON.stringify(visual)}`);
    const card=await page.locator('.play-card').boundingBox();const limit=Math.min(height-2,card.y+card.height-5);const first=await page.locator('#answerArea button').last().boundingBox();if(first.y+first.height>limit && shots)await page.screenshot({path:path.join(shots,`${width}-${item.id}-overflow.png`)});assert.ok(first.y+first.height<=limit,`${width} ${item.id}: first hint hides controls`);
    if(item.id==='frame-subtract'){assert.match(await page.locator('#hint').innerText(),/5 = 3 \+ 2/);assert.match(await page.locator('#taskVisual').innerText(),/13 − \(3 \+ 2\)/);}
    if(shots && ['frame-subtract','fraction-3','line','negative-1','root-cube'].includes(item.id))await page.screenshot({path:path.join(shots,`${width}-${item.id}-hint.png`)});
    await submitWrong();await page.waitForTimeout(60);
    assert.equal(await page.locator('.solution-next').isVisible(),true,item.id);
    assert.equal(await page.locator('#answerArea .number-key').count(),0);
    const next=await page.locator('.solution-next').boundingBox();assert.ok(next.y+next.height<=Math.min(height-2,(await page.locator('.play-card').boundingBox()).y+(await page.locator('.play-card').boundingBox()).height-5),`${width} ${item.id}: Next offscreen`);
    if(item.id==='frame-subtract' || item.id==='line') {
      const before=await page.evaluate(()=>window.__guidanceTest.state.index);
      await page.waitForTimeout(2800);
      assert.equal(await page.evaluate(()=>window.__guidanceTest.state.index),before,'does not advance after 2.3 seconds');
      if(shots)await page.screenshot({path:path.join(shots,`${width}-${item.id}-steps.png`)});
      if(item.id==='frame-subtract' && shots){await page.waitForTimeout(1400);await page.screenshot({path:path.join(shots,`${width}-${item.id}-final.png`)});}
      await page.locator('.solution-replay').click();assert.match(await page.locator('#hint').innerText(),/Шаг 1 из/);
    }
    if(shots && ['fraction-3','negative-1','root-cube'].includes(item.id))await page.screenshot({path:path.join(shots,`${width}-${item.id}-solution.png`)});
    const before=await page.evaluate(()=>window.__guidanceTest.state.index);await page.locator('.solution-next').click();assert.equal(await page.evaluate(()=>window.__guidanceTest.state.index),before+1);
   }
   assert.deepEqual(errors,[]);console.log(`PASS ${width}×${height}: 36 guidance families + 7 boundary cases, real inputs, hints, worked solutions, replay and Next`);await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);console.error(`::error title=Guidance E2E::${String(e.stack || e).replace(/\r?\n/g,' | ')}`);process.exitCode=1;});
