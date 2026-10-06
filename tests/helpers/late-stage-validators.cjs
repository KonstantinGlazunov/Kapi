const assert = require('node:assert/strict');

const limits = { 25: 1000, 26: 1000, 27: 10000, 28: 10000 };
const operator = { add: '+', subtract: '−', multiply: '×', divide: ':', power: '^', root: '√' };
const core = [1, 2, 10, 5];
const derived = [4, 3, 9, 6, 8, 7];

function gcd(a, b) { return b ? gcd(b, a % b) : a || 1; }
function fraction(value) {
  assert.match(value, /^\d+\/\d+$/);
  const [a, b] = value.split('/').map(Number);
  assert.ok(b > 0 && a >= 0);
  return [a, b];
}
function validateLateStageProblem(app, skill, p, profile) {
  const stage = skill.stage;
  assert.equal(p.curriculumStage, stage);
  assert.ok(skill.operations.includes(p.operation), `${skill.id}: ${p.operation}`);
  assert.ok(p.answer !== undefined && p.answer !== null);
  if (stage === 15) {
    assert.ok([1, 2, 10].includes(p.b) && p.a >= 20 && p.a <= 100 && p.answer >= 0 && p.answer <= 100);
  } else if ([16, 17, 18, 25, 26, 27, 28].includes(stage)) {
    const max = limits[stage] || 100;
    assert.ok(p.a > 0 && p.b > 0 && p.answer >= 0 && p.a <= max && p.b <= max && p.answer <= max);
    if ([16, 17, 25, 26, 27, 28].includes(stage)) {
      const transition = [17, 26, 28].includes(stage);
      assert.equal(p.operation === 'add' ? app.hasCarry(p.a, p.b) : app.hasBorrow(p.a, p.b), transition,
        `${skill.id}: required ${transition ? 'transition' : 'no transition'} in ${p.text}`);
    }
  } else if (stage === 19) {
    assert.ok(p.conceptVisual && p.groupCount >= 2 && p.groupCount <= 5 && p.groupSize >= 1 && p.groupSize <= 5);
    assert.equal(p.answer, p.groupCount * p.groupSize);
  } else if (stage === 20) {
    assert.ok([1, 2, 5, 10].includes(p.a) && p.b >= 1 && p.b <= 10);
  } else if (stage === 21) {
    assert.ok(p.conceptVisual && [2, 5, 10].includes(p.b) && p.answer >= 1 && p.answer <= 10);
  } else if (stage === 22) {
    const seq = profile.divisionCoreSequence;
    assert.ok(core.includes(p.b) && p.answer >= 0 && p.answer <= 10);
    if (!seq.mixed) assert.deepEqual([p.b, p.answer], [core[seq.phase], seq.item]);
  } else if (stage === 23) {
    const seq = profile.multiplicationSequence;
    assert.ok(p.a >= 0 && p.a <= 10 && p.b >= 0 && p.b <= 10);
    if (!seq.mixed) {
      const phases = [{ type: 'zero' }, { type: 'factor', factor: 1 }, { type: 'factor', factor: 2 },
        { type: 'factor', factor: 10 }, { type: 'factor', factor: 5 }, { type: 'squares' },
        { type: 'factor', factor: 4 }, { type: 'factor', factor: 3 }, { type: 'factor', factor: 9 },
        { type: 'factor', factor: 6 }, { type: 'factor', factor: 8 }, { type: 'factor', factor: 7 }];
      const phase = phases[seq.phase];
      assert.ok(phase, `unknown multiplication phase ${seq.phase}`);
      assert.deepEqual([p.a, p.b], phase.type === 'zero' ? [seq.item, 0]
        : phase.type === 'squares' ? [seq.item, seq.item] : [phase.factor, seq.item]);
    }
  } else if (stage === 24) {
    const seq = profile.divisionDerivedSequence;
    if (!seq.mixed) assert.deepEqual([p.operation, p.b, p.answer], ['divide', derived[seq.phase], seq.item]);
    else assert.ok(p.a <= 100 && p.b <= 10 && p.answer <= 100);
  } else if (stage === 29) {
    assert.ok(p.a >= 0 && p.b >= 0 && p.answer >= 0 && p.answer <= 1000000);
    if (p.operation === 'multiply' || p.operation === 'divide') assert.ok(p.a <= 900 && p.b <= 30);
  } else if ([30, 38, 41].includes(stage) && p.operation === 'power') {
    assert.ok(p.a >= 2 && p.a <= 20 && p.b >= 2 && p.b <= (stage === 30 ? 2 : 5));
    assert.ok(p.answer <= (stage === 30 ? 1000 : 10000));
  } else if ([31, 32, 33].includes(stage)) {
    assert.equal(p.answerType, 'fraction');
    const [left, denominator] = fraction(p.a);
    const [right, denominatorRight] = fraction(p.b);
    const [numerator, answerDenominator] = fraction(p.answer);
    assert.equal(denominatorRight, denominator);
    assert.ok(denominator >= 3 && denominator <= 10 && left < denominator && right < denominator);
    assert.ok(stage === 33 ? ['×', '÷'].includes(p.operator) : ['+', '−'].includes(p.operator));
    const rawNumerator = p.operator === '+' ? left + right : p.operator === '−' ? left - right
      : p.operator === '×' ? left * right : left * denominator;
    const rawDenominator = p.operator === '×' ? denominator ** 2 : p.operator === '÷' ? denominator * right : denominator;
    assert.equal(numerator * rawDenominator, rawNumerator * answerDenominator);
    assert.equal(gcd(numerator, answerDenominator), 1);
    assert.ok(numerator >= 0);
  } else if ([34, 35].includes(stage)) {
    assert.equal(p.answerType, 'decimal');
    assert.ok(p.a > 0 && p.b > 0 && p.a <= 100 && p.b <= 100 && p.answer >= 0 && p.answer <= 100);
    assert.ok(stage === 34 ? ['+', '−'].includes(p.operator) : ['×', '÷'].includes(p.operator));
  } else if ([36, 37].includes(stage)) {
    assert.ok(p.answer >= -100 && p.answer <= 100);
    assert.ok(stage === 36 ? p.operator === '−' && p.a >= 0 && p.b > p.a : ['−', '×', ':'].includes(p.operator));
  } else if ([39, 40, 41].includes(stage)) {
    assert.ok([2, 3].includes(p.b) && p.answer >= 2 && p.answer <= 20);
    if (stage === 39) assert.equal(p.b, 2);
    if (stage === 40) assert.equal(p.b, 3);
    assert.ok(p.a <= (stage === 39 ? 400 : stage === 40 ? 1000 : 10000));
  }
  if (stage !== 19 && ['add', 'subtract', 'multiply', 'divide', 'negative', 'decimal'].includes(p.operation)) {
    const calculated = p.operator === '+' ? p.a + p.b : p.operator === '−' ? p.a - p.b
      : p.operator === '×' ? p.a * p.b : p.a / p.b;
    assert.ok(Math.abs(calculated - p.answer) < 1e-8, `${skill.id}: ${p.text} = ${p.answer}`);
  }
  if (p.operation === 'power') assert.equal(p.answer, p.a ** p.b);
  if (p.operation === 'root') assert.equal(p.a, p.answer ** p.b);
  if (p.operation === 'divide' && stage !== 21 && stage !== 22 && stage !== 24 && stage !== 29) assert.equal(p.operator, ':');
  if (stage !== 19 && operator[p.operation] && !['divide', 'root'].includes(p.operation)) assert.equal(p.operator, operator[p.operation]);
}
module.exports = { validateLateStageProblem };
