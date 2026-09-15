const test = require('node:test');
const assert = require('node:assert/strict');
const Advanced = require('../advanced-core.js');

test('247 × 36 builds the classic shifted partial products', () => {
  const problem = Advanced.createProblem(247, 36);
  assert.deepEqual(problem.partialProducts.map(p => p.shiftedValue), [1482, 7410]);
  assert.equal(problem.total, 8892);
  assert.equal(problem.partialProducts[1].shiftZeros, 1);
});

test('multiplication steps expose fact, carry, write, and row completion in order', () => {
  const problem = Advanced.createProblem(247, 6);
  const steps = problem.steps;
  const firstFact = steps.find(s => s.kind === 'fact');
  assert.deepEqual(
    { expected:firstFact.expected, multiplicandDigit:firstFact.multiplicandDigit, multiplierDigit:firstFact.multiplierDigit },
    { expected:42, multiplicandDigit:7, multiplierDigit:6 }
  );
  assert.ok(steps.some(s => s.kind === 'carry' && s.expected === 4));
  assert.ok(steps.some(s => s.kind === 'carryAdd' && s.carryIn === 4));
  assert.equal(steps.filter(s => s.kind === 'rowComplete').length, 1);
});

test('later multiplier rows explicitly teach the place-value shift', () => {
  const problem = Advanced.createProblem(247, 36);
  const shift = problem.steps.find(s => s.kind === 'shift' && s.rowIndex === 1);
  assert.ok(shift);
  assert.equal(shift.expected, 1);
  assert.equal(shift.skill, 'shift');
});

test('final addition is column-by-column and includes addition carries', () => {
  const problem = Advanced.createProblem(99, 99);
  assert.equal(problem.total, 9801);
  const additionSteps = problem.steps.filter(s => s.phase === 'addition');
  assert.ok(additionSteps.some(s => s.kind === 'additionSum'));
  assert.ok(additionSteps.some(s => s.kind === 'additionCarry'));
  assert.equal(additionSteps.at(-1).kind, 'problemComplete');
});

test('adaptive input mode moves from choices to hybrid to typed', () => {
  assert.equal(Advanced.chooseInputMode(10, 0), 'choice');
  assert.equal(Advanced.chooseInputMode(50, 0), 'choice');
  assert.equal(Advanced.chooseInputMode(50, 1), 'typed');
  assert.equal(Advanced.chooseInputMode(90, 0), 'typed');
});

test('mastery rises on success, drops on misses, and stays within 0–100', () => {
  assert.equal(Advanced.updateMastery(30, true), 35);
  assert.equal(Advanced.updateMastery(30, false), 22);
  assert.equal(Advanced.updateMastery(99, true), 100);
  assert.equal(Advanced.updateMastery(3, false), 0);
});

test('advanced world generators honor digit constraints', () => {
  const alwaysMid = () => 0.5;
  const w1 = Advanced.generateProblem(1, { rng:alwaysMid });
  const w6 = Advanced.generateProblem(6, { rng:alwaysMid });
  const w7 = Advanced.generateProblem(7, { rng:alwaysMid });
  const w8boss = Advanced.generateProblem(8, { rng:alwaysMid, boss:true });
  assert.equal(String(w1.a).length, 2); assert.equal(String(w1.b).length, 1);
  assert.equal(String(w6.a).length, 4); assert.equal(String(w6.b).length, 2);
  assert.ok([3,4].includes(String(w7.a).length)); assert.equal(String(w7.b).length, 3);
  assert.equal(String(w8boss.a).length, 4); assert.equal(String(w8boss.b).length, 4);
});

test('generated problems never have leading zeroes and fit 4×4 integer range', () => {
  for (let worldId = 1; worldId <= 8; worldId += 1) {
    for (let i = 0; i < 20; i += 1) {
      const p = Advanced.generateProblem(worldId);
      assert.ok(p.a >= 10);
      assert.ok(p.b >= 1);
      assert.ok(p.a <= 9999);
      assert.ok(p.b <= 9999);
      assert.equal(p.total, p.a * p.b);
    }
  }
});

test('replaying reveal steps reconstructs every partial product and the final answer', () => {
  const problem = Advanced.createProblem(247, 36);
  let reveal = Advanced.createRevealState(problem);
  for (const step of problem.steps) reveal = Advanced.applyReveal(reveal, step);
  const mapValue = map => Object.entries(map).reduce((sum, [column, digit]) => sum + (Number(digit) * (10 ** Number(column))), 0);
  assert.deepEqual(reveal.partialRows.map(mapValue), [1482, 7410]);
  assert.equal(mapValue(reveal.additionDigits), 8892);
});
