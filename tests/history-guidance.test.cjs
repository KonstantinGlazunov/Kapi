const test=require('node:test');
const assert=require('node:assert/strict');
const {environment}=require('./helpers/environment.cjs');
function setup(){const env=environment({app:true});const app=env.sandbox.__app;app.startTraining();return {env,app};}
test('history retains the original visual task and submitted answers, including corrected first errors',()=>{
 const {env,app}=setup();const tasks=new env.sandbox.KapiTaskSystem();
 const p=tasks.decorate(app.makeCurriculumProblem(1,0,app.getProfile()),null,'visualCount');
 app.state.problem=p;app.renderAnswer();app.submitAnswer(p.answer+10);app.submitAnswer(p.answer);
 assert.deepEqual(JSON.parse(JSON.stringify(app.state.results[0].problem)),JSON.parse(JSON.stringify(p)));
 assert.deepEqual(Array.from(app.state.results[0].responses),[String(p.answer+10),String(p.answer)]);
 app.finishTraining();const session=app.getHistory()[0];assert.equal(session.mistakes.length,1);
 app.showStats();const html=env.elements.get('statsContent').innerHTML;
 assert.ok(html.includes(tasks.display(p,'de').text));assert.ok(html.includes(tasks.display(p,'de').html));assert.ok(html.includes('data-history-repeat="0:0"'));assert.ok(!html.includes(p.key));
 env.elements.get('statsContent').listeners.click({target:{closest:selector=>selector==='[data-history-repeat]'?{dataset:{historyRepeat:'0:0'}}:null}});
 assert.equal(app.state.targeted.historyPractice,true);assert.equal(app.state.problem.operation,'count');assert.equal(app.state.problem.taskType,'visualCount');
});
test('legacy history hides internal keys without inventing missing child answers',()=>{
 const {env,app}=setup();env.storage.set('capy-count-history-v1',JSON.stringify([{date:new Date().toISOString(),correct:9,total:10,average:2,score:10,stage:1,trouble:['count:1:0:1:Сколькокружков?']}]));
 app.showStats();const html=env.elements.get('statsContent').innerHTML;assert.ok(!html.includes('count:1'));assert.match(html,/frühere Version/);
});
test('equal denominators skip needless conversion and explain reduction separately',()=>{
 const {env}=setup();const guidance=new env.sandbox.KapiGuidance(new env.sandbox.KapiTaskSystem());
 for(const language of ['ru','de']){
 const plan=guidance.build({a:'8/10',b:'4/10',answer:'6/5',operator:'+',operation:'fraction'},language);
 assert.ok(!JSON.stringify(plan).includes('8/10 = 8/10'));assert.ok(plan.steps.some(s=>s.text.includes('12/10')));assert.ok(plan.steps.some(s=>s.text.includes('12/10 = 6/5')));
 assert.match(plan.hint,language==='ru'?/Доли уже одинаковые/:/schon gleich/);
 const unlike=guidance.build({a:'1/2',b:'1/3',answer:'5/6',operator:'+',operation:'fraction'},language);assert.ok(unlike.steps.some(s=>s.text.includes('1/2 = 3/6')));
 }
});
test('solution steps wait indefinitely and support previous/next before leaving the last step',()=>{
 const {env,app}=setup();app.state.problem={a:'8/10',b:'4/10',answer:'6/5',operator:'+',operation:'fraction',taskType:'equation',answerType:'fraction',mode:'input',curriculumStage:32,key:'test'};
 app.state.locked=true;app.showSolution();const buttons=env.elements.get('answerArea').children.slice(-2),[previous,next]=buttons;
 const first=env.elements.get('hint').textContent;env.advance(60000);assert.equal(env.elements.get('hint').textContent,first);assert.equal(previous.disabled,true);
 next.listeners.click();assert.notEqual(env.elements.get('hint').textContent,first);previous.listeners.click();assert.equal(env.elements.get('hint').textContent,first);
 for(let i=0;i<20&&next.dataset.lastStep!=='true';i++)next.listeners.click();assert.equal(next.dataset.lastStep,'true');assert.equal(next.textContent,'Nächste Aufgabe');
 const index=app.state.index;next.listeners.click();assert.equal(app.state.index,index+1);
});
test('empty entry disables Check and clearing cancels a pending correct answer',()=>{
 const {env,app}=setup();app.state.problem={...app.state.problem,mode:'input',operation:'add',a:1,b:1,answer:2,taskType:'equation'};app.renderAnswer();
 const submit=env.elements.get('answerArea').querySelector('[data-action="submit"]');assert.equal(submit.disabled,true);
 app.handleKeypadClick({target:{closest:()=>({dataset:{key:'2'}})}});assert.equal(submit.disabled,false);assert.equal(app.state.results.length,0);
 app.handleKeypadClick({target:{closest:()=>({dataset:{action:'clear'}})}});assert.equal(submit.disabled,true);
});
test('backup round-trip keeps task details and rejects malformed history snapshots',()=>{
 const {env,app}=setup();const p=app.state.problem;app.submitAnswer(p.answer+10);app.submitAnswer(p.answer);app.finishTraining();
 const profile=app.getProfile(),data={profile,settings:{...app.appSettings,sound:true},history:app.getHistory()};
 const backup=()=>JSON.stringify({format:'kapi-backup',version:1,data});
 const restored=env.sandbox.KapiStorage.validateBackup(backup(),profile);assert.equal(restored.history[0].mistakes[0].problem.key,p.key);assert.equal(restored.history[0].mistakes[0].responses.length,2);
 data.history[0].mistakes[0].problem.answer=999999;assert.throws(()=>env.sandbox.KapiStorage.validateBackup(backup(),profile),/history mistakes/);
});
