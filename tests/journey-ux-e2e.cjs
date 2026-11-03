// Real Chromium at /kapi/: actual first lesson, route viewer, thresholds and mobile layouts.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../dist');
const screenshots = process.env.KAPI_E2E_SCREENSHOTS;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.webmanifest':'application/manifest+json'};
const server = http.createServer(async (req,res) => {
  try {
    const name = new URL(req.url,'http://localhost').pathname.replace(/^\/kapi\//,'') || 'index.html';
    if (name.includes('..') || name.startsWith('/')) throw Error('Invalid path');
    res.setHeader('Content-Type', mime[path.extname(name)] || 'application/octet-stream');
    res.end(await fs.readFile(path.join(root,name)));
  } catch { res.statusCode=404; res.end(); }
});
async function shot(page,name) {
  if (!screenshots) return;
  await fs.mkdir(screenshots,{recursive:true});
  await page.screenshot({path:path.join(screenshots,name+'.png')});
}
async function fits(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box && box.x >= -1 && box.x+box.width <= viewport.width+1, selector+' horizontal fit');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'No horizontal overflow');
}
async function seed(page, xp, step=0) {
  await page.evaluate(({xp,step})=>{
    const a=window.__journeyTest, p=a.getProfile();
    p.totalXp=xp; p.journey={step,sessions:[]};
    p.unlockedRewards=window.KAPI_REWARDS.filter(r=>r.xp<=xp).map(r=>r.id);
    p.equippedOutfit={hat:null,glasses:null,neck:null,back:null,badge:null};
    a.saveProfile(p); a.showScreen(document.querySelector('#startScreen')); a.updateHomeStats();
  },{xp,step});
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({...(process.env.KAPI_CHROME?{executablePath:process.env.KAPI_CHROME}:{}),args:['--no-sandbox']});
  try {
    for (const lang of ['ru','de']) for (const [width,height] of [[320,568],[390,844],[740,1024],[740,390]]) {
      const page=await browser.newPage({viewport:{width,height},locale:lang,hasTouch:true,serviceWorkers:'block'});
      const errors=[]; page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/app.js',async route=>{
        const response=await route.fetch();
        await route.fulfill({response,body:(await response.text()).replace(/\}\)\(\);\s*$/,
          'window.__journeyTest={state,appSettings,tasks,getProfile,saveProfile,saveSettings,showScreen,updateHomeStats,startTraining,renderProblem,renderAnswer,makeCurriculumProblem,pointCount,endResultShow,finishTraining};})();')});
      });
      await page.goto('http://127.0.0.1:'+server.address().port+'/kapi/');
      await page.waitForFunction(()=>!!window.__journeyTest);
      await page.waitForTimeout(300);
      assert.match(await page.locator('#startButton').innerText(),lang==='ru'?/первое/:/Erste/);
      assert.match(await page.locator('#homeTaskCount').innerText(),/10/);
      assert.equal(await page.locator('#journeyTitle').innerText(),lang==='ru'?'Лесной мостик':'Waldbrücke');
      await fits(page,'#startButton');
      await shot(page,lang+'-'+width+'x'+height+'-first');
      if(width===390) {
        await page.locator('#startButton').click();
        assert.equal(await page.locator('dialog[open]').count(),0,'No mandatory tour');
        await page.locator('#gameScreen').waitFor({state:'visible'});
        for(let i=0;i<10;i++) {
          const answer=await page.evaluate(()=>__journeyTest.tasks.response(__journeyTest.state.problem));
          if(await page.locator('.answer-button').count())
            await page.locator('.answer-button').filter({hasText:new RegExp('^'+answer+'$')}).click();
          else {
            await page.keyboard.type(String(answer));
            await page.keyboard.press('Enter');
          }
          await page.waitForFunction(i=>__journeyTest.state.index>i||__journeyTest.state.finished,i);
        }
        await page.waitForFunction(()=>document.querySelector('#resultScreen').dataset.showPhase==='arrival');
        assert.equal(await page.evaluate(()=>__journeyTest.getProfile().journey.step),1);
        await shot(page,lang+'-arrival');
        await page.locator('#continueArrival').click();
        await page.waitForFunction(()=>document.querySelector('#resultScreen').dataset.showPhase==='summary');
        assert.equal(await page.locator('#resultProgressExplanation').isVisible(),true);
        await page.locator('#againButton').click();
        assert.match(await page.locator('#startButton').innerText(),lang==='ru'?/следующее/:/Nächste/);
        await page.locator('#journeyAlbumButton').click();
        await page.locator('[data-album-view="1"]').click();
        const image=page.locator('#journeyViewerImage');
        await image.dispatchEvent('touchstart',{touches:[{identifier:0,clientX:100,clientY:100}]});
        await image.dispatchEvent('touchend',{touches:[],changedTouches:[{identifier:0,clientX:200,clientY:105}]});
        assert.equal(await page.locator('#journeyViewerCount').innerText(),'1 / 2');
        await image.dispatchEvent('touchstart',{touches:[{identifier:0,clientX:200,clientY:100}]});
        await image.dispatchEvent('touchend',{touches:[],changedTouches:[{identifier:0,clientX:100,clientY:105}]});
        assert.equal(await page.locator('#journeyViewerCount').innerText(),'2 / 2');
        await page.locator('#closeJourneyViewer').click();
        await page.waitForTimeout(100);
        assert.equal(await page.locator('[data-album-view="1"]').evaluate(el=>el===document.activeElement),true);
        await page.locator('#closeJourneyAlbum').click(); await page.waitForTimeout(100);
      }
      for(const step of [0,3,6,23]) {
        await seed(page,0,step);
        assert.equal(await page.locator('#journeyTitle').innerText(),await page.evaluate(({step,lang})=>KapiJourney.copy[lang].places[Math.min(step+1,23)],{step,lang}));
        await page.locator('#journeyAlbumButton').click();
        assert.equal(await page.locator('[data-album-view]').count(),step+1);
        assert.equal(await page.locator('.album-next').count(),step===23?0:1);
        if(step<23) assert.match(await page.locator('.album-next').innerText(),lang==='ru'?/завершённого/:/abgeschlossenen/);
        await page.locator('#closeJourneyAlbum').click(); await page.waitForTimeout(100);
      }
      if(width===390) {
        // A completed-session fixture with one earned point hits the threshold exactly.
        await seed(page,19);
        await page.evaluate(()=>{
          const a=__journeyTest;
          Object.assign(a.appSettings,{automatic:false,manualStage:32,operations:['fraction'],range:'above100'});
          a.saveSettings(); a.startTraining();
          a.state.results=Array.from({length:10},(_,i)=>({firstTry:i===0,seconds:3,key:'fixture',taskType:'equation'}));
          a.state.correct=1; a.state.score=1;
          localStorage.removeItem('kapi-progress-explained-v2');
          a.finishTraining(); a.endResultShow(true);
        });
        assert.equal(await page.evaluate(()=>__journeyTest.getProfile().totalXp),20);
        assert.match(await page.locator('#resultProgressExplanation').innerText(),lang==='ru'?/не меняется автоматически/:/nicht automatisch/);
        await page.locator('[data-equip-now="badge-star"]').click();
        await page.reload(); await page.waitForFunction(()=>!!window.__journeyTest);
        assert.equal(await page.evaluate(()=>__journeyTest.getProfile().equippedOutfit.badge),'badge-star');
      }
      for(const xp of [0,19,20,21,500]) {
        await seed(page,xp);
        await page.locator('#wardrobeButton').click();
        await fits(page,'#wardrobeDialog');
        assert.equal(await page.locator('.wardrobe-next').count(),xp===500?0:1);
        if(xp===19) { assert.match(await page.locator('.wardrobe-next').innerText(),lang==='ru'?/1 очко/:/1 Punkt/); await shot(page,lang+'-'+width+'x'+height+'-reward'); }
        if(xp<20) assert.equal(await page.locator('.wardrobe-slot').count(),0);
        if(xp===20) {
          const star=page.locator('[data-equip="badge-star"]');
          assert.match(await star.innerText(),lang==='ru'?/Надеть/:/Anziehen/);
          await star.click();
          assert.match(await star.innerText(),lang==='ru'?/Снять/:/Ablegen/);
          await page.reload(); await page.waitForFunction(()=>!!window.__journeyTest);
          assert.equal(await page.evaluate(()=>__journeyTest.getProfile().equippedOutfit.badge),'badge-star');
          await page.locator('#wardrobeButton').click();
          await page.locator('[data-equip="badge-star"]').click();
          assert.equal(await page.evaluate(()=>__journeyTest.getProfile().equippedOutfit.badge),null);
        }
        await page.locator('#closeWardrobeButton').click();
      }
      await seed(page,21);
      await page.evaluate(()=>{
        const a=__journeyTest;
        Object.assign(a.appSettings,{automatic:false,manualStage:32,range:'above100',rangeLocked:false,operations:['fraction'],problemCount:20});
        a.saveSettings(); a.updateHomeStats();
      });
      await page.reload(); await page.waitForFunction(()=>!!window.__journeyTest);
      assert.match(await page.locator('#homeTaskCount').innerText(),/20/,'Explicit length survives');
      await page.locator('#mapButton').click();
      await page.locator('.map-chapter.selected [data-map-practice]').click();
      await page.locator('#gameScreen').waitFor({state:'visible'});
      assert.equal(await page.evaluate(()=>__journeyTest.state.stage),32);
      assert.equal(await page.locator('#problemTotal').innerText(),'20');
      await page.evaluate(()=>{
        const a=__journeyTest; let p;
        p=a.makeCurriculumProblem(32,1,a.getProfile());
        a.state.problem=a.tasks.decorate(p,null,'equation'); a.renderProblem(a.state.problem); a.renderAnswer();
      });
      await fits(page,'#answerArea');
      await page.locator('[data-action="submit"]').scrollIntoViewIfNeeded();
      if(height<500) {
        const question=await page.locator('#problemText').boundingBox();
        const submit=await page.locator('[data-action="submit"]').boundingBox();
        assert.ok(question.y>=0 && question.y+question.height<height,'Landscape question visible with keypad');
        assert.ok(submit.y>=0 && submit.y+submit.height<height,'Landscape submit visible');
      }
      await shot(page,lang+'-'+width+'x'+height+'-fraction');
      if(width<=390) {
        const beforeQuestion=await page.locator('#problemText').boundingBox();
        const beforeAnswer=await page.locator('#answerArea').boundingBox();
        await page.locator('#problemText').click();
        await page.keyboard.type('999/1'); await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        const afterQuestion=await page.locator('#problemText').boundingBox();
        const afterAnswer=await page.locator('#answerArea').boundingBox();
        assert.ok(Math.abs(beforeQuestion.y-afterQuestion.y)<1,'Question stays in place after hint');
        assert.ok(Math.abs(beforeAnswer.y-afterAnswer.y)<1,'Keypad stays in place after hint');
        await shot(page,lang+'-'+width+'-fraction-hint');
      }

      await page.evaluate(()=>{
        const a=__journeyTest; a.startTraining(); let p;
        do {p=a.makeCurriculumProblem(1,0,a.getProfile())} while(p.answer!==3);
        a.state.problem=a.tasks.decorate(p,null,'visualCount');a.renderProblem(a.state.problem);a.renderAnswer();
      });
      assert.ok(await page.locator('#taskVisual svg').first().evaluate(e=>e.getBoundingClientRect().width)>=44);
      await fits(page,'#answerArea');
      await shot(page,lang+'-'+width+'x'+height+'-count');
      assert.deepEqual(await page.evaluate(()=>[0,1,2,5,21].map(n=>__journeyTest.pointCount(n,'ru'))),['0 очков','1 очко','2 очка','5 очков','21 очко']);
      assert.deepEqual(await page.evaluate(()=>[0,1,2,5,21].map(n=>__journeyTest.pointCount(n,'de'))),['0 Punkte','1 Punkt','2 Punkte','5 Punkte','21 Punkte']);
      assert.deepEqual(errors,[]);
      console.log('PASS',lang,width+'x'+height,'/kapi/: first start, route states, reward thresholds/persistence, manual map, fractions/count, points');
      await page.close();
    }
  } finally {await browser.close(); server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
