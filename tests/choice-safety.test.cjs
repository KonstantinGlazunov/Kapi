const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { environment } = require('./helpers/environment.cjs');

test('invalid choices fail promptly instead of looping, including missing answer and invalid fractions', () => {
  const env = environment({ app: true });
  const bad = [undefined, null, {}, { answer: undefined }, { answer: null }, { answer: NaN }, { answer: Infinity },
    { answer: '2' }, { answer: Number.MAX_VALUE }, { answer: 7, operation: 'count' },
    ...['1/0', 'NaN/1', '1/NaN', '0/0', '2/4', '99999999999999999/1'].map(answer => ({ answer, answerType: 'fraction' }))];
  for (const problem of bad) {
    env.sandbox.bad = problem;
    assert.throws(() => vm.runInContext('__app.makeChoices(bad)', env.sandbox, { timeout: 200 }),
      error => error.name === 'TypeError' && /Invalid/.test(error.message));
  }
});

test('zero fractions and a constant random source still produce four distinct finite choices', () => {
  const env = environment({ app: true });
  env.sandbox.Math.random = () => 0;
  for (const problem of [{ answer: '0/1', answerType: 'fraction' }, { answer: '1/2', answerType: 'fraction' },
    { answer: 0, operation: 'count' }, { answer: 0, operation: 'add' }, { answer: .1, answerType: 'decimal' }, { answer: 1000000 }]) {
    env.sandbox.problem = problem;
    const choices = vm.runInContext('__app.makeChoices(problem)', env.sandbox, { timeout: 200 });
    assert.equal(choices.length, 4); assert.equal(new Set(choices).size, 4); assert.ok(choices.includes(problem.answer));
    for (const choice of choices) assert.ok(problem.answerType === 'fraction' ? /^\d+\/[1-9]\d*$/.test(choice) : Number.isFinite(choice));
  }
});
