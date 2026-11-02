const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ ...(process.env.KAPI_CHROME ? { executablePath: process.env.KAPI_CHROME } : {}), args: ['--no-sandbox'] });
  try {
    for (const width of [320, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 320 ? 568 : 844 }, locale: 'ru', serviceWorkers: 'block' });
      await page.route('**/app.js', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace(/\}\)\(\);\s*$/, 'window.__answers={state,startTraining,renderProblem,renderAnswer,submitAnswer,getProfile};})();') });
      });
      await page.goto(process.env.KAPI_BASE_URL || 'http://127.0.0.1:8765');
      await page.waitForFunction(() => !!window.__answers);
      async function prepare(answer, mode = 'input', count = false) {
        await page.evaluate(({answer,mode,count}) => {
          const a = window.__answers; a.startTraining();
          Object.assign(a.state, { locked:false, attempt:1, enteredAnswer:'', results:[], problem: count
            ? {a:1,b:0,answer:1,operation:'count',operator:'+',taskType:'visualCount',mode,key:'count-1',curriculumStage:1,visualCount:1,text:'Сколько яблок?'}
            : {a:answer==='1/2'?'1/4':answer==='1/1'?'3/5':'2/5',b:answer==='1/2'?'1/4':'2/5',answer,answerType:'fraction',operation:'fraction',operator:answer==='0/1'?'−':'+',taskType:'equation',mode,key:'fraction-test',curriculumStage:32,text:answer==='0/1'?'2/5 − 2/5 = ?':answer==='1/1'?'3/5 + 2/5 = ?':'1/4 + 1/4 = ?'} });
          a.renderProblem(a.state.problem); a.renderAnswer();
        },{answer,mode,count});
      }
      for (const [answer,values] of [['0/1',['0','0/1','0/5']],['1/1',['1','1/1']],['1/2',['2/4','1/2']]]) {
        for (const value of values) {
          await prepare(answer);
          for (const key of value) await page.locator(`[data-key="${key}"]`).click();
          assert.equal(await page.evaluate(() => __answers.state.results.length), 0);
          await page.locator('[data-action="submit"]').click();
          assert.equal(await page.evaluate(() => __answers.state.results[0].firstTry), true);
        }
      }
      await prepare('1/1');
      const before = await page.evaluate(() => JSON.stringify(__answers.getProfile()));
      for (const value of ['0/0','1/']) {
        await page.locator('[data-action="clear"]').click();
        for (const key of value) await page.locator(`[data-key="${key}"]`).click();
        await page.locator('[data-action="submit"]').click();
        assert.equal(await page.locator('#numberAnswer').innerText(),value);
        assert.equal(await page.evaluate(() => __answers.state.attempt),1);
        assert.equal(await page.evaluate(() => JSON.stringify(__answers.getProfile())),before);
        assert.match(await page.locator('#feedback').innerText(), value === '0/0' ? /Знаменатель не может быть нулём/ : /Заверши запись/);
      }
      const shots = process.env.KAPI_E2E_SCREENSHOTS;
      if (shots) { fs.mkdirSync(shots,{recursive:true}); await page.screenshot({path:path.join(shots,`${width}-invalid.png`)}); }
      for (const count of [true,false]) {
        await prepare('0/1','choice',count);
        const buttons = page.locator('#answerArea .answer-button');
        const original = await buttons.allTextContents();
        const wrongIndex = original.findIndex(v => v !== (count ? '1' : '0/1'));
        await buttons.nth(wrongIndex).click();
        assert.deepEqual(await buttons.allTextContents(),original);
        assert.equal(await buttons.nth(wrongIndex).isDisabled(),true);
        await buttons.nth(wrongIndex).dispatchEvent('click');
        assert.equal(await page.evaluate(() => __answers.state.results.length),0);
        if (shots) await page.screenshot({path:path.join(shots,`${width}-${count?'count':'fraction'}-retry.png`)});
        await buttons.nth(original.indexOf(count?'1':'0/1')).click();
        assert.equal(await page.evaluate(() => __answers.state.results[0].success),true);
      }
      console.log(`PASS ${width}: equivalent values, invalid notation, stable choices and rejected repeat`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
