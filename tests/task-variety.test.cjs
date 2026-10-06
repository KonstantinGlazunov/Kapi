const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment, root } = require('./helpers/environment.cjs');
const { validateStageProblem } = require('./helpers/curriculum-validators.cjs');

function context(seed = 0x12345678) {
  const env = environment({ app: true, seed });
  return { env, app: env.sandbox.__app, tasks: new env.sandbox.KapiTaskSystem(env.sandbox.Math.random) };
}
function configure(app, stage) {
  const profile = app.getProfile();
  profile.currentStage = stage;
  app.saveProfile(profile);
  app.state.stage = stage;
  return profile;
}

test('14,000 decorated problems retain the exact stage contracts and balanced format weights', () => {
  const { app, tasks } = context();
  let totalEquation = 0, totalAlt = 0;
  for (let stage = 1; stage <= 14; stage++) {
    const profile = configure(app, stage);
    const counts = new Map();
    let previous = null;
    for (let i = 0; i < 1000; i++) {
      const base = app.makeGeneratedProblem(stage, i, profile);
      const problem = tasks.decorate(base, previous);
      validateStageProblem(app, stage, problem, `stage ${stage} sample ${i}`);
      assert.ok(tasks.allowedTypes(stage).includes(problem.taskType));
      assert.ok(previous === 'equation' || previous !== problem.taskType, 'no repeated alternative format');
      assert.equal(problem.mode, problem.expressionChoices || problem.placeValue?.options ? 'choice' : base.mode);
      if (problem.taskType === 'tenFrame') {
        assert.equal(problem.visualData.cells.filter(cell => cell.filled).length, problem.operation === 'subtract' ? problem.a : problem.answer);
        assert.equal(problem.visualData.cells.filter(cell => cell.removed).length, problem.operation === 'subtract' ? problem.b : 0);
      }
      if (problem.taskType === 'numberLine') assert.equal(problem.visualData.start + problem.visualData.delta, problem.answer);
      if (problem.taskType === 'microStory') assert.equal(problem.story.answer, problem.answer);
      counts.set(problem.taskType, (counts.get(problem.taskType) || 0) + 1);
      const display = tasks.display(problem, 'de');
      assert.ok(display.text.length > 0);
      previous = problem.taskType;
    }
    if (stage !== 1) assert.ok((counts.get('equation') || 0) > 500, `stage ${stage} keeps equation as majority`);
    assert.ok(counts.size > 1, `stage ${stage} has alternatives`);
    totalEquation += counts.get('equation') || 0;
    totalAlt += 1000 - (counts.get('equation') || 0);
  }
  assert.ok(totalEquation > totalAlt);
  assert.ok(totalAlt / 14000 >= .15 && totalAlt / 14000 <= .25, `alternatives ${totalAlt / 14000}`);
});

test('missing operand response is separate from the curriculum answer', () => {
  const { env } = context();
  for (const [a, b, answer, operation, operator, expected, rng] of [[5, 4, 9, 'add', '+', 5, .1],
    [7, 5, 12, 'add', '+', 5, .9], [13, 5, 8, 'subtract', '−', 5, .1]]) {
    const tasks = new env.sandbox.KapiTaskSystem(() => rng);
    const base = { a, b, answer, operation, operator, text: `${a} ${operator} ${b} = ?`, curriculumStage: 14, mode: 'input' };
    const problem = tasks.decorate(base, null, 'missingOperand');
    assert.equal(problem.answer, answer);
    assert.equal(tasks.response(problem), expected);
    assert.ok(problem.displayText.includes('?'));
    assert.ok(tasks.response(problem) >= 0);
  }
});

test('expression choices are four unique plausible equations with one correct index', () => {
  const { app, tasks } = context();
  for (const stage of [4, 5, 7, 9, 10, 12, 13, 14]) {
    const profile = configure(app, stage);
    for (let i = 0; i < 200; i++) {
      const p = tasks.decorate(app.makeGeneratedProblem(stage, i, profile), null, 'chooseExpression');
      assert.equal(p.taskType, 'chooseExpression');
      assert.equal(p.mode, 'choice');
      assert.equal(p.expressionChoices.length, 4);
      assert.equal(new Set(p.expressionChoices.map(option => option.label)).size, 4);
      assert.equal(p.expressionChoices.filter(option => option.value === p.answer).length, 1);
      assert.equal(p.expressionChoices[p.correctExpressionIndex].value, p.answer);
      for (const option of p.expressionChoices) {
        assert.equal(option.value, p.operation === 'subtract' ? option.a - option.b : option.a + option.b);
        assert.ok(option.a >= 0 && option.b >= 0);
        assert.ok(option.value >= 0 && option.value <= (stage <= 8 ? 10 : 20));
      }
    }
  }
});

test('ten frames, number lines, place values and stories reflect their original math', () => {
  const { app, tasks } = context();
  for (const quantity of [0, 5, 10, 11, 19, 20]) {
    const frame = tasks.makeTenFrame(quantity);
    assert.equal(frame.cells.filter(cell => cell.filled).length, quantity);
    assert.equal(frame.frames, quantity > 10 ? 2 : 1);
    const html = tasks.renderFrame(frame);
    assert.equal((html.match(/class="task-cell filled"/g) || []).length, quantity);
    assert.ok(html.includes('task-frame'));
  }
  for (const stage of [6, 7, 10, 11, 12, 13]) {
    const profile = configure(app, stage);
    const base = app.makeGeneratedProblem(stage, 1, profile);
    if (tasks.allowedTypes(stage).includes('numberLine')) {
      const p = tasks.decorate(base, null, 'numberLine');
      assert.equal(p.visualData.start + p.visualData.delta, p.visualData.end);
      assert.equal(p.visualData.end, p.answer);
      assert.ok(tasks.display(p).html.includes('task-jump'));
    }
  }
  const profile = configure(app, 9);
  for (let i = 0; i < 60; i++) {
    const p = tasks.decorate(app.makeGeneratedProblem(9, i, profile), null, 'placeValue');
    assert.ok(p.answer >= 11 && p.answer <= 19);
    assert.equal(p.placeValue.tens, Math.floor(p.answer / 10));
    assert.equal(p.placeValue.ones, p.answer % 10);
    if (p.placeValue.options) {
      assert.equal(p.placeValue.options[p.placeValue.correctIndex], p.placeValue.ones);
      assert.equal(tasks.response(p), p.placeValue.correctIndex);
    }
  }
  const storyBase = { a: 13, b: 5, answer: 8, operation: 'subtract', operator: '−', text: '13 − 5 = ?', curriculumStage: 13 };
  const story = tasks.decorate(storyBase, null, 'microStory');
  assert.equal(story.story.answer, story.answer);
  assert.equal(story.story.operation, 'subtract');
  assert.ok(tasks.display(story, 'de').text.split(' ').length <= 14);
  assert.ok(tasks.display(story, 'ru').text.includes('Капи'));
  assert.ok(tasks.display(tasks.decorate({ a: 3, b: 8, answer: 11, operation: 'add', operator: '+', curriculumStage: 12 }, null, 'microStory'), 'ru').text.includes('3 яблока'));
  assert.equal(tasks.isPaceComparableTask(story), false);
  assert.equal(tasks.isPaceComparableTask(tasks.decorate(storyBase, null, 'missingOperand')), true);
});

test('visual counting and ten frames separate addition operands in distinct groups', () => {
  const { tasks } = context();
  for (const [a, b, stage] of [[0, 5, 2], [3, 2, 3], [5, 5, 5], [10, 9, 9]]) {
    const base = { a, b, answer: a + b, operation: 'add', operator: '+', text: `${a} + ${b} = ?`, curriculumStage: stage };
    for (const type of tasks.allowedTypes(stage).filter(value => ['visualCount', 'tenFrame'].includes(value))) {
      const problem = tasks.decorate(base, null, type);
      const html = tasks.display(problem).html;
      assert.ok(html.includes('task-operand-1') && html.includes('task-operand-2'), `${type} has separate operands`);
      assert.equal((html.match(/class="task-operator"/g) || []).length, 1);
      assert.ok(html.includes(`aria-label="${a}"`) && html.includes(`aria-label="${b}"`));
      assert.equal((html.match(/class="task-cell filled"/g) || []).length || (html.match(/aria-label="●"/g) || []).length, a + b);
    }
  }
  const count = tasks.decorate({ a: 5, b: 0, answer: 5, operation: 'count', operator: '', text: 'Wie viele?', curriculumStage: 1 }, null, 'visualCount');
  assert.ok(!tasks.display(count).html.includes('task-operands'));
});

test('each alternative repeats with the same form and preserves firstTry and mastery', () => {
  for (const [stage, type] of [[5, 'missingOperand'], [7, 'tenFrame'], [12, 'numberLine'], [14, 'chooseExpression']]) {
    const { env, app, tasks } = context(0x778800 + stage);
    app.appSettings.automatic = false;
    app.appSettings.manualStage = stage;
    app.appSettings.range = stage <= 8 ? '10' : '20';
    app.appSettings.operations = stage === 5 ? ['add'] : stage === 7 ? ['subtract'] : ['add', 'subtract'];
    app.startTraining();
    const base = app.makeGeneratedProblem(stage, 0, configure(app, stage));
    const original = tasks.decorate(base, null, type);
    app.state.problem = original;
    app.renderProblem(original);
    app.renderAnswer();
    app.submitAnswer(tasks.response(original) + 100);
    assert.equal(app.state.hintLevel, 1);
    assert.equal(app.getProfile().errorQueue[0].taskType, type);
    app.startTraining();
    const recoverySlot = app.state.sessionPlan.slots.findIndex(item => item.type === 'errorReview');
    const review = app.selectProblem(stage, recoverySlot);
    validateStageProblem(app, stage, review, `${type} review`);
    assert.equal(review.taskType, type);
    assert.equal(tasks.response(review), tasks.response(original));
    assert.equal(review.key, original.key);
    app.state.problem = review;
    app.state.attempt = 1;
    app.state.locked = false;
    app.submitAnswer(tasks.response(review));
    assert.equal(app.state.results.at(-1).firstTry, true);
    assert.equal(app.getProfile().errorQueue[0].correctStreak, 1);
    app.state.locked = false;
    app.state.attempt = 1;
    app.submitAnswer(tasks.response(review));
    assert.equal(app.getProfile().errorQueue.length, 0);
    assert.equal(app.getProfile().personalFastTime, null, 'review does not calibrate pace');
    env.advance(350);
  }
});

test('slow formats do not change personal pace; story mistakes cannot lower stage alone', () => {
  const { app, tasks } = context();
  const profile = configure(app, 13);
  profile.personalFastTime = 6;
  profile.bestPersonalFastTime = 6;
  profile.recordMilestoneTime = 6;
  profile.adaptiveRecentResults = [0, 0, 0, 0];
  app.saveProfile(profile);
  app.appSettings.automatic = true;
  const base = app.makeGeneratedProblem(13, 0, profile);
  const story = tasks.decorate(base, null, 'microStory');
  app.updateAdaptiveProgress(story, true, false, 12);
  assert.equal(app.getProfile().currentStage, 13);
  assert.equal(app.getProfile().adaptiveRecentResults.length, 4);
  app.updateAdaptiveProgress(story, true, true, .2);
  assert.equal(app.getProfile().personalFastTime, 6);
  const visual = tasks.decorate(base, null, 'numberLine');
  app.updateAdaptiveProgress(visual, true, true, .2);
  assert.equal(app.getProfile().personalFastTime, 6);
});

test('expression choice and missing operand use the shared answer and progressive hint flow', () => {
  const { app, env, tasks } = context(0x51ade);
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 12;
  app.appSettings.range = '20';
  app.appSettings.operations = ['add'];
  app.startTraining();
  const base = app.makeGeneratedProblem(12, 0, configure(app, 12));
  const expression = tasks.decorate(base, null, 'chooseExpression');
  app.state.problem = expression;
  app.renderProblem(expression);
  app.renderAnswer();
  const buttons = env.elements.get('answerArea').children.at(-1).children;
  assert.equal(buttons.length, 4);
  assert.equal(buttons[expression.correctExpressionIndex].textContent, expression.expressionChoices[expression.correctExpressionIndex].label);
  buttons[expression.correctExpressionIndex].listeners.click();
  assert.equal(app.state.results[0].firstTry, true);
  env.advance(350);

  const missing = tasks.decorate(app.makeGeneratedProblem(12, 1, app.getProfile()), null, 'missingOperand');
  app.state.problem = missing;
  app.renderProblem(missing);
  app.renderAnswer();
  app.submitAnswer(tasks.response(missing) + 50);
  assert.equal(app.state.hintLevel, 1);
  assert.ok(env.elements.get('hint').textContent.includes('Welche Zahl fehlt'));
  assert.ok(!env.elements.get('hint').innerHTML.includes('task-dots'));
  app.submitAnswer(tasks.response(missing) + 50);
  assert.equal(app.state.hintLevel, 2);
  assert.ok(env.elements.get('hint').innerHTML.includes('task-dots'));
  assert.ok(env.elements.get('feedback').textContent.includes(String(tasks.response(missing))));
  assert.equal(app.state.results[1].firstTry, false);
});

test('a fast story earns fixed XP without setting a speed record', () => {
  const { app, tasks } = context(0x5445);
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 13;
  app.appSettings.range = '20';
  app.appSettings.operations = ['subtract'];
  const profile = configure(app, 13);
  profile.personalFastTime = 6;
  profile.bestPersonalFastTime = 6;
  profile.recordMilestoneTime = 6;
  app.saveProfile(profile);
  app.startTraining();
  const story = tasks.decorate(app.makeGeneratedProblem(13, 0, app.getProfile()), null, 'microStory');
  app.state.problem = story;
  app.submitAnswer(tasks.response(story));
  assert.equal(app.state.results[0].firstTry, true);
  assert.equal(app.state.score, 2);
  assert.equal(app.getProfile().personalFastTime, 6);
  assert.equal(app.state.paceUpdate, null);
});

test('second error reveals an expression label rather than an internal choice index', () => {
  const { app, env, tasks } = context(0x9ee1);
  app.appSettings.automatic = false;
  app.appSettings.manualStage = 12;
  app.appSettings.range = '20';
  app.appSettings.operations = ['add'];
  app.startTraining();
  const expression = tasks.decorate(app.makeGeneratedProblem(12, 0, configure(app, 12)), null, 'chooseExpression');
  app.state.problem = expression;
  const wrongIndex = (expression.correctExpressionIndex + 1) % 4;
  app.submitAnswer(wrongIndex);
  assert.equal(app.state.hintLevel, 1);
  app.submitAnswer(wrongIndex);
  assert.equal(app.state.hintLevel, 2);
  assert.ok(env.elements.get('feedback').textContent.includes(expression.expressionChoices[expression.correctExpressionIndex].label));
  assert.ok(!env.elements.get('feedback').textContent.endsWith(`${expression.correctExpressionIndex}.`));
});

test('PWA cache contains the new modules; compact styles keep the visuals responsive', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const module of ['kapi-tasks.js', 'kapi-map.js']) assert.ok(sw.includes(module));
  assert.ok(css.includes('width: calc(100% - 26px)'));
  assert.ok(css.includes('grid-template-columns: repeat(5, 22px)'));
  assert.ok(css.includes('prefers-reduced-motion: reduce'));
});
