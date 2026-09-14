(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MQCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WORLD_TABLES = {
    1: [1, 2, 5, 10],
    2: [3, 4],
    3: [6, 7],
    4: [8, 9],
    5: [11, 12],
    6: [1,2,3,4,5,6,7,8,9,10,11,12]
  };

  const ITEMS = {
    apple: { id: 'apple', name: 'Apple', emoji: '🍎', description: 'Restore 25 HP.' },
    shield: { id: 'shield', name: 'Shield Potion', emoji: '🛡️', description: 'Gain a shield.' },
    bomb: { id: 'bomb', name: 'Math Bomb', emoji: '💣', description: 'Deal 20 damage to every enemy.' },
    freeze: { id: 'freeze', name: 'Freeze Pop', emoji: '❄️', description: 'Skip the next enemy turn.' },
    hint: { id: 'hint', name: 'Hint Orb', emoji: '🔮', description: 'Remove two wrong answers next question.' }
  };

  const BOSS_MINIONS = {
    1: { name: 'Baby Slime', emoji: '🟢', maxHp: 42, attack: 8 },
    2: { name: 'Sock Puppet', emoji: '🧦', maxHp: 46, attack: 9 },
    3: { name: 'Crystal Sprite', emoji: '🔹', maxHp: 50, attack: 10 },
    4: { name: 'Storm Puff', emoji: '🌧️', maxHp: 54, attack: 11 },
    5: { name: 'Pepperoni Gremlin', emoji: '🔴', maxHp: 58, attack: 12 },
    6: { name: 'Number Bot', emoji: '🔢', maxHp: 62, attack: 13 }
  };

  const BOSS_TABLES = {
    1: {
      1: { type:'miss', label:'SPLAT!', text:'Mega Slime misses spectacularly.' },
      2: { type:'attack', damage:16, label:'Slime Slap' },
      3: { type:'effect', effect:'sticky', damage:8, label:'Sticky Goo' },
      4: { type:'summon', label:'Split!' },
      5: { type:'heavy', damage:26, label:'Mega Bounce' },
      6: { type:'chaos', damage:9, label:'SLIME STORM' }
    },
    2: {
      1: { type:'miss', label:'Trip!', text:'Sockasaurus trips over a sock.' },
      2: { type:'attack', damage:17, label:'Sock Smack' },
      3: { type:'effect', effect:'jamItem', damage:7, label:'Laundry Toss' },
      4: { type:'summon', label:'Sock Puppet Army' },
      5: { type:'heavy', damage:27, label:'Stinky Sock' },
      6: { type:'chaos', damage:10, label:'LOST LAUNDRY CHAOS' }
    },
    3: {
      1: { type:'miss', label:'Shatter!', text:'Crystal Jelly loses its balance.' },
      2: { type:'attack', damage:18, label:'Crystal Bonk' },
      3: { type:'effect', effect:'crystalArmor', damage:7, label:'Crystal Shell' },
      4: { type:'summon', label:'Shard Spawn' },
      5: { type:'heavy', damage:28, label:'Prism Slam' },
      6: { type:'chaos', damage:10, label:'CRYSTAL CASCADE' }
    },
    4: {
      1: { type:'miss', label:'Static Pop!', text:'Thunder Puff shorts itself out.' },
      2: { type:'attack', damage:19, label:'Zap' },
      3: { type:'effect', effect:'static', damage:9, label:'Static Field' },
      4: { type:'summon', label:'Storm Split' },
      5: { type:'heavy', damage:29, label:'Thunder Clap' },
      6: { type:'chaos', damage:11, label:'LIGHTNING PARTY' }
    },
    5: {
      1: { type:'miss', label:'Cheese Slip!', text:'Pizza Titan slips on cheese.' },
      2: { type:'attack', damage:20, label:'Crust Smack' },
      3: { type:'effect', effect:'sauce', damage:10, label:'Sauce Splash' },
      4: { type:'summon', label:'Pepperoni Panic' },
      5: { type:'heavy', damage:30, label:'Deep Dish Drop' },
      6: { type:'chaos', damage:11, label:'PIZZA PARTY PANIC' }
    },
    6: {
      1: { type:'miss', label:'Calculation Error!', text:'Professor Pandemonium miscalculates.' },
      2: { type:'attack', damage:21, label:'Equation Blast' },
      3: { type:'effect', effect:'scramble', damage:10, label:'Number Scramble' },
      4: { type:'summon', label:'Deploy Number Bot' },
      5: { type:'heavy', damage:31, label:'Mega Equation' },
      6: { type:'chaos', damage:12, label:'TOTAL MATH CHAOS' }
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function learnedTables(worldId) {
    const max = clamp(Math.floor(Number(worldId) || 1), 1, 6);
    const set = new Set();
    for (let i = 1; i <= max; i += 1) WORLD_TABLES[i].forEach(v => set.add(v));
    return [...set].sort((a,b) => a-b);
  }

  function normalEnemyAction(roll) {
    const r = clamp(Math.floor(Number(roll) || 1), 1, 6);
    if (r === 1) return { type:'miss', label:'Whiff!', text:'The enemy completely misses.' };
    if (r <= 3) return { type:'attack', damage:16, label:'Attack' };
    if (r <= 5) return { type:'heavy', damage:24, label:'Heavy Attack' };
    return { type:'chaos', damage:8, label:'CHAOS ATTACK' };
  }

  function bossEnemyAction(worldId, roll, livingEnemyCount) {
    const id = clamp(Math.floor(Number(worldId) || 1), 1, 6);
    const r = clamp(Math.floor(Number(roll) || 1), 1, 6);
    const base = Object.assign({}, BOSS_TABLES[id][r]);
    if (base.type === 'summon') {
      if (livingEnemyCount >= 3) {
        return { type:'attack', damage:14 + id, label:'Summon Blocked', summonBlocked:true };
      }
      return Object.assign(base, { minion: Object.assign({}, BOSS_MINIONS[id]) });
    }
    return base;
  }

  function nextAbilityCharge(currentCharge, correct) {
    const current = clamp(Math.floor(Number(currentCharge) || 0), 0, 100);
    return correct ? clamp(current + 20, 0, 100) : current;
  }

  function resolvePowerQuestion(correct) {
    return correct
      ? { charge:0, fireAbility:true, enemyTurn:false }
      : { charge:50, fireAbility:false, enemyTurn:false };
  }

  function cloneBattleState(battle) {
    return {
      playerHp: clamp(Number(battle.playerHp) || 0, 0, 100),
      shield: Boolean(battle.shield),
      frozen: Boolean(battle.frozen),
      hint: Boolean(battle.hint),
      enemies: Array.isArray(battle.enemies) ? battle.enemies.map(e => Object.assign({}, e)) : []
    };
  }

  function applyItem(itemId, battle) {
    const next = cloneBattleState(battle);
    switch (itemId) {
      case 'apple': next.playerHp = clamp(next.playerHp + 25, 0, 100); break;
      case 'shield': next.shield = true; break;
      case 'bomb': next.enemies = next.enemies.map(e => Object.assign({}, e, { hp: Math.max(0, (Number(e.hp) || 0) - 20) })); break;
      case 'freeze': next.frozen = true; break;
      case 'hint': next.hint = true; break;
      default: break;
    }
    return next;
  }

  function addInventoryItem(inventory, itemId) {
    const items = Array.isArray(inventory) ? inventory.filter(id => ITEMS[id]).slice(0,3) : [];
    if (!ITEMS[itemId] || items.length >= 3) return { inventory:items, added:false };
    return { inventory:[...items,itemId], added:true };
  }

  return {
    WORLD_TABLES,
    ITEMS,
    BOSS_MINIONS,
    BOSS_TABLES,
    learnedTables,
    normalEnemyAction,
    bossEnemyAction,
    nextAbilityCharge,
    resolvePowerQuestion,
    applyItem,
    addInventoryItem
  };
});
