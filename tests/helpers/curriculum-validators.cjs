const assert = require('node:assert/strict');

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

module.exports = { OPERATIONS, OPERATOR, stageMatchers, validateProblemBasics, validateStageProblem };
