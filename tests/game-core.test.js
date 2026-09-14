const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../game-core.js');

test('learnedTables includes all tables through the current world', () => {
  assert.deepEqual(Core.learnedTables(3), [1,2,3,4,5,6,7,10]);
  assert.deepEqual(Core.learnedTables(6), [1,2,3,4,5,6,7,8,9,10,11,12]);
});

test('normal enemy roll resolves one action and supports chaos', () => {
  assert.equal(Core.normalEnemyAction(1).type, 'miss');
  assert.equal(Core.normalEnemyAction(2).type, 'attack');
  assert.equal(Core.normalEnemyAction(4).type, 'heavy');
  assert.equal(Core.normalEnemyAction(6).type, 'chaos');
});

test('boss summon resolves to backup attack when field already has three enemies', () => {
  const action = Core.bossEnemyAction(1, 4, 3);
  assert.equal(action.type, 'attack');
  assert.equal(action.summonBlocked, true);
});

test('boss summon creates a minion when there is room', () => {
  const action = Core.bossEnemyAction(1, 4, 2);
  assert.equal(action.type, 'summon');
  assert.equal(action.minion.name, 'Baby Slime');
});

test('five correct answers fully charges an ability', () => {
  assert.equal(Core.nextAbilityCharge(0, true), 20);
  assert.equal(Core.nextAbilityCharge(80, true), 100);
  assert.equal(Core.nextAbilityCharge(100, true), 100);
});

test('wrong Power Question leaves half charge and never requests an enemy turn', () => {
  assert.deepEqual(Core.resolvePowerQuestion(false), { charge: 50, fireAbility: false, enemyTurn: false });
  assert.deepEqual(Core.resolvePowerQuestion(true), { charge: 0, fireAbility: true, enemyTurn: false });
});

test('items apply their documented battle effects', () => {
  const apple = Core.applyItem('apple', { playerHp: 60, shield: false, frozen: false, hint: false, enemies: [{hp:50},{hp:20}] });
  assert.equal(apple.playerHp, 85);
  const shield = Core.applyItem('shield', { playerHp: 60, shield: false, frozen: false, hint: false, enemies: [] });
  assert.equal(shield.shield, true);
  const freeze = Core.applyItem('freeze', { playerHp: 60, shield: false, frozen: false, hint: false, enemies: [] });
  assert.equal(freeze.frozen, true);
  const hint = Core.applyItem('hint', { playerHp: 60, shield: false, frozen: false, hint: false, enemies: [] });
  assert.equal(hint.hint, true);
  const bomb = Core.applyItem('bomb', { playerHp: 60, shield: false, frozen: false, hint: false, enemies: [{hp:50},{hp:20}] });
  assert.deepEqual(bomb.enemies.map(e => e.hp), [30,0]);
});

test('inventory is capped at three carried items', () => {
  assert.deepEqual(Core.addInventoryItem(['apple','shield'], 'bomb'), { inventory:['apple','shield','bomb'], added:true });
  assert.deepEqual(Core.addInventoryItem(['apple','shield','bomb'], 'freeze'), { inventory:['apple','shield','bomb'], added:false });
});
