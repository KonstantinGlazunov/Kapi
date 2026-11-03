const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');
function setup(answer='0/1', mode='input') {
  const env=environment({app:true}), app=env.sandbox.__app;
  app.startTraining();
  Object.assign(app.state,{locked:false,attempt:1,streak:3,enteredAnswer:'',results:[],problem:{a:answer==='1/2'?'1/4':answer==='1/1'?'3/5':'2/5',b:answer==='1/2'?'1/4':'2/5',operator:answer==='0/1'?'−':'+',answer,answerType:'fraction',operation:'fraction',mode,taskType:'equation',curriculumStage:32,key:'fraction-test',text:'2/5 − 2/5 = ?'}});
  app.renderAnswer();return {env,app};
}
test('fraction equality compares values, including whole numbers and unreduced fractions',()=>{
  const {app}=setup();
  const groups=[['0','0/1','0/5'],['1','1/1'],['2/4','1/2']];
  for(const group of groups)for(const value of group)for(const expected of group)assert.equal(app.answersEqual(value,expected,'fraction'),true,`${value} = ${expected}`);
  for(const value of ['0/0','1/0','1/','/5',''])assert.equal(app.answersEqual(value,'0/1','fraction'),false);
  assert.equal(app.answersEqual('1','1/2','fraction'),false);
});
test('all equivalent forms receive first-attempt credit',()=>{
  for(const [answer,values] of [['0/1',['0','0/1','0/5']],['1/1',['1','1/1']],['1/2',['2/4','1/2']]])for(const value of values){
    const {app}=setup(answer);app.submitAnswer(value);assert.equal(app.state.results[0].firstTry,true,value);assert.equal(app.state.correct,1,value);
  }
});
test('invalid fraction notation preserves input and learning evidence until corrected',()=>{
  const {env,app}=setup('1/1');const before=JSON.stringify(app.getProfile());
  for(const value of ['0/0','1/0','1/','/5']){
    app.state.enteredAnswer=value;app.submitAnswer(value);
    assert.equal(app.state.enteredAnswer,value);assert.equal(app.state.attempt,1);assert.equal(app.state.streak,3);assert.equal(app.state.results.length,0);assert.equal(app.state.locked,false);assert.equal(JSON.stringify(app.getProfile()),before);
    assert.match(env.elements.get('feedback').textContent,value.endsWith('/0')?/Nenner/:/Vervollständige/);
  }
  app.submitAnswer('1');assert.equal(app.state.results[0].firstTry,true);
});
test('fraction typing can finish a correct prefix before the automatic check',()=>{
  const {app}=setup('0/1');
  for(const key of ['0','/','5'])app.handleKeypadClick({target:{closest:()=>({dataset:{key}})}});
  assert.equal(app.state.enteredAnswer,'0/5');assert.equal(app.state.locked,false);assert.equal(app.state.results.length,0);
  app.handleKeypadClick({target:{closest:()=>({dataset:{action:'submit'}})}});assert.equal(app.state.results[0].firstTry,true);
});
test('count and fraction choices keep their order; a rejected choice cannot consume another attempt',()=>{
  for(const fraction of [false,true]){
    const {env,app}=setup('0/1','choice');
    if(!fraction)app.state.problem={a:1,b:0,answer:1,operation:'count',operator:'+',taskType:'visualCount',mode:'choice',key:'count-1',curriculumStage:1};
    app.renderAnswer();const buttons=()=>env.elements.get('answerArea').children.at(-1).children;
    const before=buttons().map(b=>b.textContent),wrong=before.find(v=>!app.answersEqual(v,app.state.problem.answer,app.state.problem.answerType));
    app.submitAnswer(wrong);assert.deepEqual(buttons().map(b=>b.textContent),before);assert.equal(buttons()[before.indexOf(wrong)].disabled,true);
    app.submitAnswer(wrong);assert.equal(app.state.attempt,2);assert.equal(app.state.results.length,0);
    app.submitAnswer(app.state.problem.answer);assert.equal(app.state.results[0].success,true);assert.equal(app.state.results[0].firstTry,false);
  }
});
