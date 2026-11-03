const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');
function setup(answer=2, answerType) {
  const env=environment({app:true}), app=env.sandbox.__app;
  app.startTraining();
  app.state.problem={a:1,b:1,answer,answerType,operation:answerType||'add',operator:'+',mode:'input',taskType:'equation',curriculumStage:answerType==='fraction'?32:2,key:'auto',text:'Example'};
  app.state.enteredAnswer=''; app.state.locked=false; app.state.attempt=1; app.state.results=[];
  app.renderAnswer();
  const key=key=>app.handleKeypadClick({target:{closest:()=>({dataset:{key}})}});
  const action=action=>app.handleKeypadClick({target:{closest:()=>({dataset:{action}})}});
  return {env,app,key,action};
}
test('correct keypad input is accepted after 800ms without a confirmation and without charging delay to pace',()=>{
  const {env,app,key}=setup();
  env.advance(2000); key('2'); env.advance(799);
  assert.equal(app.state.results.length,0);
  env.advance(1); assert.equal(app.state.results.length,1);
  assert.equal(app.state.results[0].seconds,2);
  assert.equal(app.state.results[0].firstTry,true);
});
test('typing after a correct prefix resets pending acceptance and wrong input costs no attempt',()=>{
  const {env,app,key,action}=setup();
  key('2'); env.advance(400); key('3'); env.advance(2000);
  assert.equal(app.state.results.length,0); assert.equal(app.state.attempt,1);
  action('backspace'); env.advance(800); assert.equal(app.state.results.length,1);
});
test('equivalent fractions and whole-number forms are auto-accepted',()=>{
  for(const [answer,values] of [['0/1',['0','0/1','0/5']],['1/1',['1','1/1']],['1/2',['2/4','1/2']]]) {
    for(const value of values) {
      const {env,app,key}=setup(answer,'fraction');
      for(const digit of value) {key(digit);env.advance(100);}
      assert.equal(app.state.results.length,0); env.advance(800);
      assert.equal(app.state.results.length,1,value);
    }
  }
});
test('unfinished fractions, zero denominators and unfinished decimals never auto-submit',()=>{
  for(const [value,type,answer] of [['0/','fraction','0/1'],['0/0','fraction','0/1'],['1,','decimal',1],['-','negative',-2]]) {
    const {env,app,key}=setup(answer,type);
    for(const digit of value) key(digit);
    env.advance(5000); assert.equal(app.state.results.length,0,value); assert.equal(app.state.attempt,1);
  }
  const {env,app,key}=setup(1,'decimal');
  for(const digit of '1,0') key(digit);
  env.advance(800); assert.equal(app.state.results.length,1);
});
test('clear, next render and leaving the exercise cancel queued acceptance',()=>{
  for(const cancel of ['clear','render','leave']) {
    const {env,app,key,action}=setup();
    key('2'); env.advance(400);
    if(cancel==='clear') action('clear');
    if(cancel==='render') app.renderAnswer();
    if(cancel==='leave') app.showScreen(env.elements.get('startScreen'));
    env.advance(2000); assert.equal(app.state.results.length,0,cancel);
  }
});
test('manual Check before the delay records the answer once',()=>{
  const {env,app,key,action}=setup(); key('2'); action('submit'); env.advance(800);
  assert.equal(app.state.results.length,1);
});
