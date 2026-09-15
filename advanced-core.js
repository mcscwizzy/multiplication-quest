(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MQAdvanced = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WORLD_CONFIGS = {
    1: { aDigits:[2,2], bDigits:[1,1] },
    2: { aDigits:[3,3], bDigits:[1,1] },
    3: { aDigits:[4,4], bDigits:[1,1] },
    4: { aDigits:[2,2], bDigits:[2,2] },
    5: { aDigits:[3,3], bDigits:[2,2] },
    6: { aDigits:[4,4], bDigits:[2,2] },
    7: { aDigits:[3,4], bDigits:[3,3] },
    8: { aDigits:[2,4], bDigits:[2,4] }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function digitsLE(value) {
    return String(Math.abs(Math.trunc(value))).split('').reverse().map(Number);
  }

  function digitAt(value, column) {
    return Math.floor(Math.abs(value) / (10 ** column)) % 10;
  }

  function integerBetweenDigits(minDigits, maxDigits, rng) {
    const span = maxDigits - minDigits + 1;
    const digitCount = minDigits + Math.min(span - 1, Math.floor(clamp(rng(), 0, 0.999999999) * span));
    const min = digitCount === 1 ? 1 : 10 ** (digitCount - 1);
    const max = (10 ** digitCount) - 1;
    return min + Math.floor(clamp(rng(), 0, 0.999999999) * (max - min + 1));
  }

  function hasMultiplicationCarry(a, b) {
    const aDigits = digitsLE(a);
    for (const multiplierDigit of digitsLE(b)) {
      let carry = 0;
      for (const multiplicandDigit of aDigits) {
        const combined = (multiplicandDigit * multiplierDigit) + carry;
        if (combined >= 10) return true;
        carry = Math.floor(combined / 10);
      }
    }
    return false;
  }

  function buildMultiplicationSteps(a, b, partialProducts) {
    const steps = [];
    const aDigits = digitsLE(a);
    const bDigits = digitsLE(b);

    bDigits.forEach((multiplierDigit, rowIndex) => {
      if (rowIndex > 0) {
        steps.push({
          phase:'multiply', kind:'shift', skill:'shift', rowIndex,
          expected:rowIndex,
          prompt:`This multiplier digit is in the ${rowIndex === 1 ? 'tens' : rowIndex === 2 ? 'hundreds' : 'thousands'} place. How many placeholder zeros start this row?`,
          helper:'Each row moves one place left. This is place value, not an extra multiplication fact.',
          reveal:{ type:'shift', rowIndex, zeros:rowIndex }
        });
      }

      let carry = 0;
      aDigits.forEach((multiplicandDigit, digitIndex) => {
        const product = multiplicandDigit * multiplierDigit;
        const column = digitIndex + rowIndex;
        steps.push({
          phase:'multiply', kind:'fact', skill:'fact', rowIndex, column,
          multiplicandDigit, multiplierDigit, carryIn:carry, expected:product,
          prompt:`${multiplierDigit} × ${multiplicandDigit} = ?`,
          helper:`Multiply the active digits first.`,
          reveal:{ type:'fact', rowIndex, digitIndex, product }
        });

        const combined = product + carry;
        if (carry > 0) {
          steps.push({
            phase:'multiply', kind:'carryAdd', skill:'carry', rowIndex, column,
            carryIn:carry, product, expected:combined,
            prompt:`${product} + carried ${carry} = ?`,
            helper:'Add the carried (regrouped) amount before writing this column.',
            reveal:{ type:'carryAdd', rowIndex, digitIndex, combined }
          });
        }

        const isLast = digitIndex === aDigits.length - 1;
        if (isLast) {
          steps.push({
            phase:'multiply', kind:'write', skill:'carry', rowIndex, column,
            expected:combined,
            prompt:`Write ${combined} in the remaining space. What number goes there?`,
            helper:'At the last digit, write the whole remaining value.',
            reveal:{ type:'writeFinal', rowIndex, startColumn:column, value:combined }
          });
          carry = 0;
        } else {
          const writeDigit = combined % 10;
          const nextCarry = Math.floor(combined / 10);
          steps.push({
            phase:'multiply', kind:'write', skill:'carry', rowIndex, column,
            expected:writeDigit,
            prompt:`Write the ones digit of ${combined}.`,
            helper:'Write the ones digit in this column; anything left is carried.',
            reveal:{ type:'writeDigit', rowIndex, column, digit:writeDigit }
          });
          if (nextCarry > 0) {
            steps.push({
              phase:'multiply', kind:'carry', skill:'carry', rowIndex, column:digitIndex + 1,
              expected:nextCarry, carryOut:nextCarry,
              prompt:`What do you carry to the next column?`,
              helper:'Carry (regroup) the tens part above the next multiplicand digit.',
              reveal:{ type:'carry', rowIndex, targetDigitIndex:digitIndex + 1, value:nextCarry }
            });
          }
          carry = nextCarry;
        }
      });

      steps.push({
        phase:'multiply', kind:'rowComplete', skill:null, rowIndex,
        expected:null,
        prompt:`Partial product complete: ${partialProducts[rowIndex].shiftedValue.toLocaleString()}`,
        helper:'Completing a partial-product row powers an attack.',
        reveal:{ type:'rowComplete', rowIndex, value:partialProducts[rowIndex].shiftedValue }
      });
    });

    return steps;
  }

  function buildAdditionSteps(partialProducts, total) {
    const steps = [];
    if (partialProducts.length === 1) {
      steps.push({
        phase:'addition', kind:'problemComplete', skill:null, expected:null,
        prompt:`The partial product is the final answer: ${total.toLocaleString()}.`,
        helper:'One multiplier digit means there is only one partial-product row.',
        reveal:{ type:'problemComplete', total }
      });
      return steps;
    }

    let carry = 0;
    const totalDigits = digitsLE(total);
    for (let column = 0; column < totalDigits.length; column += 1) {
      const addends = partialProducts.map(p => digitAt(p.shiftedValue, column));
      const baseSum = addends.reduce((sum, digit) => sum + digit, 0);
      steps.push({
        phase:'addition', kind:'additionSum', skill:'addition', column,
        addends, carryIn:carry, expected:baseSum,
        prompt:`Add this column: ${addends.join(' + ')} = ?`,
        helper:'Add only the digits in the highlighted column first.',
        reveal:{ type:'additionSum', column, baseSum }
      });

      const combined = baseSum + carry;
      if (carry > 0) {
        steps.push({
          phase:'addition', kind:'additionCarryAdd', skill:'addition', column,
          addends, carryIn:carry, baseSum, expected:combined,
          prompt:`${baseSum} + carried ${carry} = ?`,
          helper:'Add the carried (regrouped) amount from the previous addition column.',
          reveal:{ type:'additionCarryAdd', column, combined }
        });
      }

      const resultDigit = combined % 10;
      const nextCarry = Math.floor(combined / 10);
      steps.push({
        phase:'addition', kind:'additionWrite', skill:'addition', column,
        expected:resultDigit,
        prompt:`What digit do you write in this answer column?`,
        helper:'Write the ones digit of the column total.',
        reveal:{ type:'additionWrite', column, digit:resultDigit }
      });

      if (nextCarry > 0 && column < totalDigits.length - 1) {
        steps.push({
          phase:'addition', kind:'additionCarry', skill:'addition', column:column + 1,
          expected:nextCarry,
          prompt:'What do you carry to the next addition column?',
          helper:'Carry (regroup) the tens part into the next column.',
          reveal:{ type:'additionCarry', targetColumn:column + 1, value:nextCarry }
        });
      }
      carry = nextCarry;
    }

    steps.push({
      phase:'addition', kind:'problemComplete', skill:null, expected:null,
      prompt:`Finished! ${total.toLocaleString()} is the final product.`,
      helper:'The final addition powers the finishing move.',
      reveal:{ type:'problemComplete', total }
    });
    return steps;
  }

  function createProblem(a, b) {
    const multiplicand = Math.trunc(Number(a));
    const multiplier = Math.trunc(Number(b));
    if (!Number.isInteger(multiplicand) || !Number.isInteger(multiplier) || multiplicand < 10 || multiplicand > 9999 || multiplier < 1 || multiplier > 9999) {
      throw new RangeError('Advanced multiplication requires 10–9999 × 1–9999.');
    }

    const multiplierDigits = digitsLE(multiplier);
    const partialProducts = multiplierDigits.map((digit, rowIndex) => ({
      rowIndex,
      multiplierDigit:digit,
      shiftZeros:rowIndex,
      rawValue:multiplicand * digit,
      shiftedValue:(multiplicand * digit) * (10 ** rowIndex)
    }));
    const total = multiplicand * multiplier;
    const multiplySteps = buildMultiplicationSteps(multiplicand, multiplier, partialProducts);
    const additionSteps = buildAdditionSteps(partialProducts, total);

    return {
      a:multiplicand,
      b:multiplier,
      total,
      multiplicandDigits:digitsLE(multiplicand),
      multiplierDigits,
      partialProducts,
      steps:[...multiplySteps, ...additionSteps]
    };
  }

  function chooseInputMode(skillScore, stepIndex) {
    const score = clamp(Math.floor(Number(skillScore) || 0), 0, 100);
    const index = Math.max(0, Math.floor(Number(stepIndex) || 0));
    if (score < 35) return 'choice';
    if (score < 70) return index % 2 === 0 ? 'choice' : 'typed';
    return 'typed';
  }

  function updateMastery(score, correct) {
    const current = clamp(Math.floor(Number(score) || 0), 0, 100);
    return clamp(current + (correct ? 5 : -8), 0, 100);
  }


  function createRevealState(problem) {
    const rows = problem && Array.isArray(problem.partialProducts) ? problem.partialProducts.length : 0;
    return {
      partialRows:Array.from({length:rows}, () => ({})),
      multCarries:Array.from({length:rows}, () => ({})),
      additionDigits:{},
      additionCarries:{}
    };
  }

  function applyReveal(revealState, step) {
    const next = {
      partialRows:(revealState.partialRows || []).map(row => Object.assign({}, row)),
      multCarries:(revealState.multCarries || []).map(row => Object.assign({}, row)),
      additionDigits:Object.assign({}, revealState.additionDigits || {}),
      additionCarries:Object.assign({}, revealState.additionCarries || {})
    };
    const r = step && step.reveal;
    if (!r) return next;
    if (r.type === 'shift') {
      for (let c = 0; c < r.zeros; c += 1) next.partialRows[r.rowIndex][c] = 0;
    } else if (r.type === 'writeDigit') {
      next.partialRows[r.rowIndex][r.column] = r.digit;
    } else if (r.type === 'writeFinal') {
      digitsLE(r.value).forEach((digit, index) => { next.partialRows[r.rowIndex][r.startColumn + index] = digit; });
    } else if (r.type === 'carry') {
      next.multCarries[r.rowIndex][r.targetDigitIndex] = r.value;
    } else if (r.type === 'additionWrite') {
      next.additionDigits[r.column] = r.digit;
    } else if (r.type === 'additionCarry') {
      next.additionCarries[r.targetColumn] = r.value;
    }
    return next;
  }

  function generateProblem(worldId, options) {
    const opts = options || {};
    const id = clamp(Math.floor(Number(worldId) || 1), 1, 8);
    const rng = typeof opts.rng === 'function' ? opts.rng : Math.random;
    const boss = Boolean(opts.boss);
    const config = WORLD_CONFIGS[id];

    let a;
    let b;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const aRange = boss ? [config.aDigits[1], config.aDigits[1]] : config.aDigits;
      const bRange = boss ? [config.bDigits[1], config.bDigits[1]] : config.bDigits;
      a = integerBetweenDigits(aRange[0], aRange[1], rng);
      b = integerBetweenDigits(bRange[0], bRange[1], rng);
      if (hasMultiplicationCarry(a, b) || attempt === 13) break;
    }
    return createProblem(a, b);
  }

  return {
    WORLD_CONFIGS,
    digitsLE,
    digitAt,
    hasMultiplicationCarry,
    createProblem,
    chooseInputMode,
    updateMastery,
    createRevealState,
    applyReveal,
    generateProblem
  };
});
