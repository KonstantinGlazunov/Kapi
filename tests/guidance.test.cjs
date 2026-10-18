const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

function fixture() {
  const env = environment({app:true,seed:0x1ab233});
  const tasks = new env.sandbox.KapiTaskSystem(env.sandbox.Math.random);
  return {env,app:env.sandbox.__app,tasks,guidance:new env.sandbox.KapiGuidance(tasks)};
}

test('guidance renders every presentation of all 41 stages in both languages, with bounded visuals', () => {
  const {app,tasks,guidance} = fixture();
  const seen = new Set();
  for(let stage=1;stage<=41;stage++) {
    const profile=app.getProfile(); profile.currentStage=stage;
    profile.multiplicationSequence.mixed=true;
    profile.divisionCoreSequence.mixed=true;
    profile.divisionDerivedSequence.mixed=true;
    for(let sample=0;sample<30;sample++) {
      const base=app.makeCurriculumProblem(stage,sample,profile);
      for(const type of tasks.allowedTypes(stage)) {
        const p=tasks.decorate(base,null,type);
        seen.add(p.taskType+(p.placeValue?':'+p.placeValue.variant:''));
        for(const language of ['ru','de']) {
          const plan=guidance.build(p,language);
          assert.equal(plan.answer,tasks.response(p));
          assert.ok(plan.hint.length>10, `${stage} ${type}`);
          assert.ok(plan.steps.length>=1 && plan.steps.length<=22, `${stage} steps`);
          assert.equal(plan.steps.at(-1).text,plan.final);
          assert.doesNotMatch(JSON.stringify(plan),/undefined|NaN|Infinity|<script/);
          assert.ok(plan.hintVisual.length<30000);
          assert.ok(plan.steps.every(step=>step.text.length>0 && step.visual.length<30000));
        }
      }
    }
  }
  for(const variant of ['equation','visualCount','tenFrame','numberLine','missingOperand','chooseExpression','microStory','placeValue:compose','placeValue:decompose','placeValue:blocks']) assert.ok(seen.has(variant),variant);
});

test('cross-ten subtraction keeps the full subtrahend and shows cumulative removals', () => {
  const {guidance,tasks}=fixture();
  const p={a:13,b:5,answer:8,operator:'−',operation:'subtract',curriculumStage:13,taskType:'equation'};
  for(const type of ['equation','tenFrame','microStory']) {
    const plan=guidance.build(type==='equation'?p:tasks.decorate(p,null,type),'ru');
    assert.match(plan.hint,/5 = 3 \+ 2/);
    assert.match(plan.hintVisual,/13 − \(3 \+ 2\)/);
    assert.deepEqual(Array.from(plan.steps.slice(0,3),s=>s.text),['5 = 3 + 2','13 − 3 = 10','10 − 2 = 8']);
    assert.equal((plan.steps[1].visual.match(/task-cell filled removed/g)||[]).length,3);
    assert.equal((plan.steps[2].visual.match(/task-cell filled removed/g)||[]).length,5);
    assert.equal(plan.final,'13 − 5 = 8');
  }
});

test('fraction and decimal worked examples preserve exact arithmetic and reduction', () => {
  const {guidance}=fixture();
  const cases=[
    [{a:'1/2',b:'1/4',answer:'3/4',operator:'+',operation:'fraction'},'2/4 + 1/4 = 3/4'],
    [{a:'3/4',b:'1/2',answer:'1/4',operator:'−',operation:'fraction'},'3/4 − 2/4 = 1/4'],
    [{a:'1/2',b:'1/3',answer:'1/6',operator:'×',operation:'fraction'},'(1 × 1) / (2 × 3) = 1/6'],
    [{a:'1/2',b:'1/4',answer:'2/1',operator:'÷',operation:'fraction'},'1/2 : 1/4 = 1/2 × 4/1'],
    [{a:1.2,b:.35,answer:1.55,operator:'+',operation:'decimal'},'120 + 35 = 155'],
    [{a:1.2,b:.3,answer:.36,operator:'×',operation:'decimal'},'36 : 100 = 0,36'],
    [{a:1.2,b:.3,answer:4,operator:'÷',operation:'decimal'},'1,2 : 0,3 = 12 : 3']
  ];
  for(const [p,expected] of cases) assert.ok(guidance.build(p,'ru').steps.some(step=>step.text===expected),expected);
});

test('conceptual repeated addition is explained as multiplication, not a false equation', () => {
  const {guidance}=fixture();
  const plan=guidance.build({a:3,b:4,answer:12,operator:'+',operation:'multiply',conceptVisual:true},'ru');
  assert.equal(plan.final,'3 × 4 = 12');
  assert.ok(plan.steps.some(s=>s.text==='4 + 4 + 4 = 12'));
  assert.doesNotMatch(plan.final,/3 \+ 4/);
});

test('number line demonstrates every hop and reveals the destination without changing the start', () => {
  const {guidance}=fixture();
  const p={a:4,b:2,answer:2,operator:'−',operation:'subtract',taskType:'numberLine',visualData:{start:4,delta:-2,end:2}};
  const plan=guidance.build(p,'ru');
  assert.deepEqual(Array.from(plan.steps.slice(0,2),s=>s.text),['4 → 3','3 → 2']);
  assert.ok(plan.steps[1].visual.includes('<text y="26">2</text>'));
  assert.ok(!plan.steps[1].visual.includes('<text y="26">?</text>'));
  assert.match(plan.steps[1].visual,/task-line-kapi/);
});

test('a second error records once, waits indefinitely for Next, and cancels replay on exit', () => {
  const {env,app,tasks}=fixture();
  app.startTraining();
  const p=app.state.problem;
  const wrong=Number(tasks.response(p))+100;
  app.submitAnswer(wrong);
  assert.equal(app.state.hintLevel,2);
  assert.equal(app.state.locked,false);
  assert.ok(env.elements.get('taskVisual').innerHTML);
  app.submitAnswer(wrong);
  assert.equal(app.state.solutionShown,true);
  assert.equal(app.state.results.length,1);
  app.submitAnswer(wrong);
  env.advance(60000);
  assert.equal(app.state.problem,p);
  assert.equal(app.state.results.length,1);
  app.continueAfterSolution();
  assert.equal(app.state.index,1);
  app.continueAfterSolution();
  assert.equal(app.state.index,1,'Next cannot skip another problem');
  assert.equal(app.state.solutionShown,false);
  assert.equal(app.state.score,0);
});
