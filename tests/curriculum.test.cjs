const test = require('node:test');
const assert = require('node:assert/strict');
const { environment } = require('./helpers/environment.cjs');

const SEEDS = [0x14002026, 0x4b415049, 0x12345678, 0xdeadbeef];
const SAMPLES_PER_SEED = 500;
const STAGES = Array.from({ length: 14 }, (_, index) => index + 1);
const OPERATIONS = {
  1: ['count'],
  2: ['add'], 3: ['add'], 4: ['add'], 5: ['add'],
  6: ['subtract'], 7: ['subtract'], 8: ['add', 'subtract'],
  9: ['add'], 10: ['add'], 11: ['subtract'], 12: ['add'], 13: ['subtract'],
  14: ['add', 'subtract']
};
const OPERATOR = { count: '', add: '+', subtract: '−' };

function isIntegerBetween(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

const stageMatchers = {
  1: (_app, p) => p.operation === 'count' && isIntegerBetween(p.answer, 0, 5) && p.a === p.answer && p.b === 0 && p.visualCount === p.answer,
  2: (_app, p) => p.operation === 'add' && isIntegerBetween(p.a, 0, 5) && isIntegerBetween(p.b, 0, 1) && p.answer <= 5,
  3: (_app, p) => p.operation === 'add' && isIntegerBetween(p.a, 1, 4) && isIntegerBetween(p.b, 1, 4) && p.answer <= 5,
  4: (_app, p) => p.operation === 'add' && isIntegerBetween(p.a, 1, 9) && isIntegerBetween(p.b, 1, 9) && p.answer <= 10 && (p.a === p.b || p.answer === 5 || p.answer === 10),
  5: (_app, p) => p.operation === 'add' && isIntegerBetween(p.a, 2, 8) && isIntegerBetween(p.b, 2, 8) && p.answer <= 10,
  6: (_app, p) => p.operation === 'subtract' && isIntegerBetween(p.a, p.b, 5) && isIntegerBetween(p.b, 1, 2),
  7: (_app, p) => p.operation === 'subtract' && isIntegerBetween(p.a, 4, 10) && isIntegerBetween(p.b, 2, p.a),
  8: (app, p) => stageMatchers[5](app, p) || stageMatchers[7](app, p),
  9: (_app, p) => p.operation === 'add' && p.a === 10 && isIntegerBetween(p.b, 1, 9) && isIntegerBetween(p.answer, 11, 19),
  10: (app, p) => p.operation === 'add' && isIntegerBetween(p.a, 11, 18) && isIntegerBetween(p.b, 1, 9) && p.answer <= 20 && !app.hasCarry(p.a, p.b),
  11: (app, p) => p.operation === 'subtract' && isIntegerBetween(p.a, 11, 20) && isIntegerBetween(p.b, 1, 9) && p.b < p.a && !app.hasBorrow(p.a, p.b),
  12: (app, p) => p.operation === 'add' && isIntegerBetween(p.a, 3, 9) && isIntegerBetween(p.b, 2, 9) && isIntegerBetween(p.answer, 11, 20) && app.hasCarry(p.a, p.b),
  13: (app, p) => p.operation === 'subtract' && isIntegerBetween(p.a, 11, 19) && isIntegerBetween(p.b, 2, 9) && app.hasBorrow(p.a, p.b),
  14: (app, p) => [10, 11, 12, 13].filter(stage => stageMatchers[stage](app, p)).length === 1
};

function validateProblemBasics(problem, stage, label = `stage ${stage}`) {
  assert.ok(problem && typeof problem === 'object', `${label}: problem exists`);
  assert.ok(OPERATIONS[stage].includes(problem.operation), `${label}: operation ${problem.operation} belongs to the stage`);
  assert.equal(problem.operator, OPERATOR[problem.operation], `${label}: operator matches operation`);
  assert.equal(problem.curriculumStage, stage, `${label}: curriculumStage is preserved`);
  for (const field of ['a', 'b', 'answer']) {
    assert.notEqual(problem[field], undefined, `${label}: ${field} is defined`);
    assert.ok(Number.isFinite(problem[field]), `${label}: ${field} is finite`);
    assert.ok(Number.isInteger(problem[field]), `${label}: ${field} is an integer`);
    assert.ok(problem[field] >= 0, `${label}: ${field} is non-negative`);
  }
  if (problem.operation === 'count') {
    assert.equal(problem.answer, problem.a, `${label}: count answer is exact`);
  } else if (problem.operation === 'add') {
    assert.equal(problem.answer, problem.a + problem.b, `${label}: addition answer is exact`);
  } else {
    assert.ok(problem.a >= problem.b, `${label}: subtraction cannot be negative`);
    assert.equal(problem.answer, problem.a - problem.b, `${label}: subtraction answer is exact`);
  }
  assert.ok(problem.answer <= (stage <= 8 ? 10 : 20), `${label}: answer is inside the pedagogical range`);
}

function validateStageProblem(app, stage, problem, label) {
  validateProblemBasics(problem, stage, label);
  assert.equal(stageMatchers[stage](app, problem), true, `${label}: matches the exact stage ${stage} contract`);
}

function validateChoices(app, stage, problem, label) {
  const choices = Array.from(app.makeChoices(problem));
  const maximum = stage <= 8 ? 10 : 20;
  assert.equal(choices.length, 4, `${label}: exactly four choices`);
  assert.equal(new Set(choices).size, 4, `${label}: choices are unique`);
  assert.equal(choices.filter(value => value === problem.answer).length, 1, `${label}: correct answer occurs exactly once`);
  for (const choice of choices) {
    assert.notEqual(choice, undefined, `${label}: choice is defined`);
    assert.ok(Number.isFinite(choice), `${label}: choice is finite`);
    assert.ok(Number.isInteger(choice), `${label}: choice is an integer`);
    assert.ok(choice >= 0, `${label}: choice is non-negative`);
    assert.ok(choice <= maximum, `${label}: choice is at most ${maximum}`);
  }
}

function configureStage(app, stage, automatic) {
  const profile = app.getProfile();
  profile.currentStage = stage;
  app.saveProfile(profile);
  app.state.stage = stage;
  app.appSettings.automatic = automatic;
  app.appSettings.manualStage = stage;
  app.appSettings.range = stage <= 8 ? '10' : '20';
  app.appSettings.operations = [...OPERATIONS[stage]];
  return profile;
}

function subtype(app, problem) {
  if (stageMatchers[10](app, problem)) return 10;
  if (stageMatchers[11](app, problem)) return 11;
  if (stageMatchers[12](app, problem)) return 12;
  if (stageMatchers[13](app, problem)) return 13;
  return 0;
}

test('carry and borrow helpers classify decimal transitions deterministically', () => {
  const app = environment({ app: true }).sandbox.__app;
  assert.equal(app.hasCarry(8, 5), true);
  assert.equal(app.hasCarry(12, 3), false);
  assert.equal(app.hasBorrow(13, 5), true);
  assert.equal(app.hasBorrow(18, 4), false);
});

test('Auto and Manual each generate 2,000 validated problems per stage across four seeds', async t => {
  for (const automatic of [true, false]) {
    const mode = automatic ? 'Auto' : 'Manual';
    await t.test(`${mode}: stages 1-14 use the shared contract`, () => {
      const coverage = new Map(STAGES.map(stage => [stage, new Set()]));
      for (const seed of SEEDS) {
        const app = environment({ app: true, seed }).sandbox.__app;
        for (const stage of STAGES) {
          const profile = configureStage(app, stage, automatic);
          for (let index = 0; index < SAMPLES_PER_SEED; index += 1) {
            const problem = automatic
              ? app.makeCurriculumProblem(stage, index, profile)
              : app.makeGeneratedProblem(stage, index, profile);
            const label = `${mode} stage ${stage}, seed ${seed.toString(16)}, sample ${index}`;
            validateStageProblem(app, stage, problem, label);
            assert.equal(problem.mode, index % 2 === 0 ? 'choice' : 'input', `${label}: answer mode alternates`);
            validateChoices(app, stage, problem, label);
            coverage.get(stage).add(problem.operation);
            if (stage === 14) coverage.get(stage).add(`subtype:${subtype(app, problem)}`);
          }
        }
      }
      assert.deepEqual([...coverage.get(8)].sort(), ['add', 'subtract']);
      assert.deepEqual([...coverage.get(14)].filter(value => value.startsWith('subtype:')).sort(), ['subtype:10', 'subtype:11', 'subtype:12', 'subtype:13']);
    });
  }
});

test('Auto and Manual samples pass the same validator for every stage', () => {
  const autoApp = environment({ app: true, seed: 0xa11a11 }).sandbox.__app;
  const manualApp = environment({ app: true, seed: 0xb22b22 }).sandbox.__app;
  for (const stage of STAGES) {
    const autoProfile = configureStage(autoApp, stage, true);
    const manualProfile = configureStage(manualApp, stage, false);
    for (let index = 0; index < 50; index += 1) {
      validateStageProblem(autoApp, stage, autoApp.makeCurriculumProblem(stage, index, autoProfile), `Auto parity stage ${stage}`);
      validateStageProblem(manualApp, stage, manualApp.makeGeneratedProblem(stage, index, manualProfile), `Manual parity stage ${stage}`);
    }
  }
});

test('stage 14 accepts exactly one stage 10-13 subtype per problem', () => {
  const app = environment({ app: true }).sandbox.__app;
  const valid = [
    { a: 12, b: 3, answer: 15, operation: 'add', operator: '+', curriculumStage: 14 },
    { a: 18, b: 4, answer: 14, operation: 'subtract', operator: '−', curriculumStage: 14 },
    { a: 8, b: 5, answer: 13, operation: 'add', operator: '+', curriculumStage: 14 },
    { a: 13, b: 5, answer: 8, operation: 'subtract', operator: '−', curriculumStage: 14 }
  ];
  valid.forEach((problem, index) => validateStageProblem(app, 14, problem, `valid stage 14 subtype ${index}`));
  const arbitrary = { a: 10, b: 10, answer: 20, operation: 'add', operator: '+', curriculumStage: 14 };
  assert.throws(() => validateStageProblem(app, 14, arbitrary, 'arbitrary <= 20 problem'));
});

test('explicit boundary and critical-form cases are classified by exact contracts', () => {
  const app = environment({ app: true }).sandbox.__app;
  const problem = (stage, operation, a, b, answer) => ({
    a, b, answer, operation, operator: OPERATOR[operation], curriculumStage: stage,
    visualCount: operation === 'count' ? answer : undefined
  });
  for (const [stage, value] of [[1, 0], [1, 5]]) validateStageProblem(app, stage, problem(stage, 'count', value, 0, value), `count boundary ${value}`);
  validateStageProblem(app, 4, problem(4, 'add', 5, 5, 10), 'boundary 10');
  validateStageProblem(app, 9, problem(9, 'add', 10, 1, 11), 'boundary 11');
  validateStageProblem(app, 9, problem(9, 'add', 10, 9, 19), 'boundary 19 and 10 + 9');
  validateStageProblem(app, 10, problem(10, 'add', 12, 3, 15), '12 + 3');
  validateStageProblem(app, 11, problem(11, 'subtract', 18, 4, 14), '18 − 4');
  validateStageProblem(app, 12, problem(12, 'add', 9, 9, 18), '9 + 9');
  validateStageProblem(app, 13, problem(13, 'subtract', 11, 2, 9), '11 − 2');
  validateStageProblem(app, 13, problem(13, 'subtract', 13, 5, 8), '13 − 5');
  assert.throws(() => validateStageProblem(app, 5, problem(5, 'add', 8, 7, 15), '8 + 7 must not be stage 5'));
  assert.throws(() => validateStageProblem(app, 12, problem(12, 'add', 11, 9, 20), '11 + 9 is outside stage 12 operand contract'));
  assert.throws(() => validateStageProblem(app, 13, problem(13, 'subtract', 20, 9, 11), '20 − 9 is outside stage 13 operand contract'));
});

test('review queue preserves stage, operation, difficulty and safe choices', async t => {
  for (const stage of [5, 7, 10, 12, 13, 14]) {
    await t.test(`stage ${stage} review`, () => {
      const app = environment({ app: true, seed: 0x90000000 + stage }).sandbox.__app;
      const profile = configureStage(app, stage, false);
      const original = app.makeGeneratedProblem(stage, 0, profile);
      app.state.stage = stage;
      app.registerProblemError(original);
      const review = app.selectProblem(stage, 2);
      assert.equal(review.isReview, true);
      for (const field of ['key', 'a', 'b', 'answer', 'operator', 'operation', 'curriculumStage']) {
        assert.equal(review[field], original[field], `stage ${stage}: review preserves ${field}`);
      }
      validateStageProblem(app, stage, review, `stage ${stage} review`);
      validateChoices(app, stage, review, `stage ${stage} review`);
    });
  }
});

test('Manual range clamps the effective stage instead of creating inconsistent math', () => {
  for (const [range, expectedStage] of [['10', 8], ['20', 14]]) {
    const env = environment({ app: true, seed: 0x70000000 + expectedStage });
    const app = env.sandbox.__app;
    env.advance(360);
    app.appSettings.automatic = false;
    app.appSettings.manualStage = 14;
    app.appSettings.range = range;
    app.appSettings.operations = ['add', 'subtract'];
    app.startTraining();
    assert.equal(app.state.stage, expectedStage, `${range} range selects stage ${expectedStage}`);
    validateStageProblem(app, expectedStage, app.state.problem, `${range} range generated problem`);
    validateChoices(app, expectedStage, app.state.problem, `${range} range choices`);
  }
});

test('Manual operation selector can narrow but never violate the stage contract', () => {
  const cases = [
    { stage: 5, requested: ['add'], expected: 'add', samples: 250 },
    { stage: 5, requested: ['divide'], expected: 'add', samples: 250 },
    { stage: 14, requested: ['add'], expected: 'add', samples: 500 },
    { stage: 14, requested: ['subtract'], expected: 'subtract', samples: 500 }
  ];
  for (const item of cases) {
    const app = environment({ app: true, seed: 0x60000000 + item.stage + item.expected.length }).sandbox.__app;
    const profile = configureStage(app, item.stage, false);
    app.appSettings.operations = [...item.requested];
    for (let index = 0; index < item.samples; index += 1) {
      const generated = app.makeGeneratedProblem(item.stage, index, profile);
      assert.equal(generated.operation, item.expected);
      validateStageProblem(app, item.stage, generated, `operation filter stage ${item.stage}`);
      if (item.stage === 14 && item.expected === 'add') assert.ok([10, 12].includes(subtype(app, generated)));
      if (item.stage === 14 && item.expected === 'subtract') assert.ok([11, 13].includes(subtype(app, generated)));
    }
    app.reconcileOperationsForStage(item.stage);
    assert.deepEqual(Array.from(app.appSettings.operations), [item.expected]);
  }
});
