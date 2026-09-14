(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const heroes = [
    { id: 'dragon', name: 'Baby Dragon', emoji: '🐉', attack: 'Fire Pop' },
    { id: 'fox', name: 'Clever Fox', emoji: '🦊', attack: 'Tail Tornado' },
    { id: 'robot', name: 'Little Robot', emoji: '🤖', attack: 'Number Beam' },
    { id: 'monster', name: 'Tiny Monster', emoji: '🐲', attack: 'Bounce Blast' }
  ];

  const enemyPool = [
    { name: 'Bouncy Slime', emoji: '🟢', mood: 'looks suspiciously bouncy' },
    { name: 'Sock Monster', emoji: '🧦', mood: 'has stolen exactly one sock' },
    { name: 'Pizza Goblin', emoji: '🍕', mood: 'refuses to share the last slice' },
    { name: 'Grumpy Cloud', emoji: '☁️', mood: 'is having a very cloudy day' },
    { name: 'Jelly Beast', emoji: '🪼', mood: 'wobbles menacingly' },
    { name: 'Trash Panda', emoji: '🦝', mood: 'has found treasure in the trash' }
  ];

  const worlds = [
    { id: 1, name: 'Starter Plains', icon: '🌼', tables: [1, 2, 5, 10], battles: 3, boss: { name: 'Mega Slime', emoji: '🟩', mood: 'has achieved maximum wobble' } },
    { id: 2, name: 'Wacky Woods', icon: '🌲', tables: [3, 4], battles: 3, boss: { name: 'Sockasaurus', emoji: '🧦', mood: 'owns every missing sock in the kingdom' } },
    { id: 3, name: 'Crystal Caves', icon: '💎', tables: [6, 7], battles: 4, boss: { name: 'Crystal Jelly', emoji: '💠', mood: 'sparkles with questionable intentions' } },
    { id: 4, name: 'Thunder Peaks', icon: '⛈️', tables: [8, 9], battles: 4, boss: { name: 'Thunder Puff', emoji: '🌩️', mood: 'is 90% fluff and 10% thunder' } },
    { id: 5, name: 'Chaos Castle', icon: '🏰', tables: [11, 12], battles: 5, boss: { name: 'Pizza Titan', emoji: '🍕', mood: 'ordered extra chaos' } },
    { id: 6, name: 'Final Battle', icon: '🌟', tables: [1,2,3,4,5,6,7,8,9,10,11,12], battles: 0, boss: { name: 'Professor Pandemonium', emoji: '🤓', mood: 'knows every multiplication fact... allegedly' } }
  ];

  const defaultState = () => ({
    heroId: 'dragon',
    xp: 0,
    unlockedWorld: 1,
    completed: new Set(),
    currentWorldId: 1,
    battleIndex: 0,
    encounter: null,
    active: false,
    locked: false,
    playerHp: 100,
    enemyHp: 100,
    streak: 0,
    bestStreak: 0,
    shield: false,
    correct: 0,
    attempts: 0,
    battleXp: 0,
    question: null,
    choices: [],
    questionStarted: 0,
    lastQuestionKey: '',
    resultKind: null,
    awardedThisEncounter: false
  });

  let state = defaultState();

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem('multiplicationQuestProgress') || 'null');
      if (!saved || typeof saved !== 'object') return;
      state.heroId = heroes.some(h => h.id === saved.heroId) ? saved.heroId : 'dragon';
      state.xp = Number.isFinite(saved.xp) ? Math.max(0, Math.floor(saved.xp)) : 0;
      state.unlockedWorld = Number.isFinite(saved.unlockedWorld) ? Math.min(6, Math.max(1, Math.floor(saved.unlockedWorld))) : 1;
      state.completed = new Set(Array.isArray(saved.completed) ? saved.completed.filter(id => Number.isInteger(id) && id >= 1 && id <= 6) : []);
    } catch (error) {
      console.warn('Could not load saved progress:', error);
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem('multiplicationQuestProgress', JSON.stringify({
        heroId: state.heroId,
        xp: state.xp,
        unlockedWorld: state.unlockedWorld,
        completed: [...state.completed]
      }));
    } catch (error) {
      console.warn('Could not save progress:', error);
    }
  }

  function hero() { return heroes.find(h => h.id === state.heroId) || heroes[0]; }
  function world() { return worlds.find(w => w.id === state.currentWorldId) || worlds[0]; }
  function level() { return Math.floor(state.xp / 250) + 1; }
  function xpIntoLevel() { return state.xp % 250; }
  function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(name) {
    $('#homeScreen').classList.toggle('hidden', name !== 'home');
    $('#battleScreen').classList.toggle('hidden', name !== 'battle');
    $('#resultScreen').classList.toggle('hidden', name !== 'result');
  }

  function updateProfile() {
    const h = hero();
    $('#profileHero').textContent = h.emoji;
    $('#profileName').textContent = h.name;
    $('#levelValue').textContent = level();
    $('#xpValue').textContent = state.xp;
    $('#xpNext').textContent = `${level() * 250} XP`;
    $('#xpBar').style.width = `${(xpIntoLevel() / 250) * 100}%`;
  }

  function renderHeroes() {
    const grid = $('#heroGrid');
    grid.innerHTML = '';

    heroes.forEach((h) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `hero-card${state.heroId === h.id ? ' selected' : ''}`;
      button.setAttribute('aria-pressed', state.heroId === h.id ? 'true' : 'false');
      button.innerHTML = `
        <span class="hero-emoji" aria-hidden="true">${h.emoji}</span>
        <span class="hero-name">${h.name}</span>
        <span class="hero-attack">${h.attack}</span>
      `;
      button.addEventListener('click', () => {
        state.heroId = h.id;
        saveProgress();
        renderHeroes();
        updateProfile();
      });
      grid.appendChild(button);
    });
  }

  function worldSubtitle(w) {
    return w.id === 6 ? 'Mixed ×1–×12 · Final Boss' : `×${w.tables.join(', ×')} · ${w.battles} battles + boss`;
  }

  function renderWorlds() {
    const grid = $('#worldGrid');
    grid.innerHTML = '';

    worlds.forEach((w) => {
      const unlocked = w.id <= state.unlockedWorld;
      const completed = state.completed.has(w.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = !unlocked;
      button.className = `world-card${!unlocked ? ' locked' : ''}${completed ? ' completed' : ''}`;
      button.innerHTML = `
        <div class="world-row">
          <div class="world-icon" aria-hidden="true">${unlocked ? w.icon : '🔒'}</div>
          <div>
            <div class="world-name">World ${w.id} · ${w.name}${completed ? '<span class="complete-badge">✓ Complete</span>' : ''}</div>
            <div class="world-sub">${worldSubtitle(w)}</div>
            <div class="world-status">${unlocked ? (completed ? 'Replay anytime' : 'Ready to play') : 'Beat the previous boss to unlock'}</div>
          </div>
        </div>
      `;
      if (unlocked) button.addEventListener('click', () => enterWorld(w.id));
      grid.appendChild(button);
    });
  }

  function continueWorldId() {
    for (let i = 1; i <= state.unlockedWorld; i += 1) {
      if (!state.completed.has(i)) return i;
    }
    return Math.min(state.unlockedWorld, 6);
  }

  function enterWorld(id) {
    state.currentWorldId = id;
    state.battleIndex = 0;
    startEncounter();
  }

  function isBossEncounter() {
    const w = world();
    return w.id === 6 || state.battleIndex >= w.battles;
  }

  function startEncounter() {
    const w = world();
    const boss = isBossEncounter();
    const enemy = boss ? w.boss : randomItem(enemyPool);
    const normalMax = randomItem([90, 100, 110]);
    const maxHp = boss ? 210 + (w.id * 10) : normalMax;

    state.encounter = { boss, enemy, maxHp };
    state.playerHp = 100;
    state.enemyHp = maxHp;
    state.streak = 0;
    state.bestStreak = 0;
    state.shield = false;
    state.correct = 0;
    state.attempts = 0;
    state.battleXp = 0;
    state.active = true;
    state.locked = false;
    state.question = null;
    state.awardedThisEncounter = false;

    showScreen('battle');
    renderBattleShell();
    nextQuestion();
  }

  function renderStageDots() {
    const w = world();
    const wrap = $('#stageDots');
    wrap.innerHTML = '';

    if (w.id === 6) {
      wrap.textContent = '👑';
      return;
    }

    const total = w.battles + 1;
    for (let i = 0; i < total; i += 1) {
      const dot = document.createElement('span');
      dot.className = `stage-dot${i < state.battleIndex ? ' done' : ''}${i === state.battleIndex ? ' current' : ''}`;
      dot.title = i === w.battles ? 'Boss' : `Battle ${i + 1}`;
      wrap.appendChild(dot);
    }
  }

  function renderBattleShell() {
    const w = world();
    const h = hero();
    const e = state.encounter.enemy;

    $('#battleWorld').textContent = `${w.icon} ${w.name}`;
    $('#battleStageLabel').textContent = state.encounter.boss ? '👑 BOSS BATTLE' : `Battle ${state.battleIndex + 1} of ${w.battles}`;
    $('#heroBattleName').textContent = h.name;
    $('#heroAvatar').textContent = h.emoji;
    $('#heroAttackName').textContent = h.attack;
    $('#enemyName').textContent = e.name;
    $('#enemyAvatar').textContent = e.emoji;
    $('#enemyMood').textContent = e.mood;
    $('#enemyTag').textContent = state.encounter.boss ? 'BOSS' : 'Enemy';
    $('#battleEffect').textContent = state.encounter.boss ? '👑' : 'VS';

    renderStageDots();
    updateBattleHud();
  }

  function updateBattleHud() {
    $('#playerHpBar').style.width = `${clamp(state.playerHp, 0, 100)}%`;
    $('#playerHpText').textContent = `${clamp(state.playerHp, 0, 100)} / 100 HP`;
    $('#enemyHpBar').style.width = `${clamp((state.enemyHp / state.encounter.maxHp) * 100, 0, 100)}%`;
    $('#enemyHpText').textContent = `${Math.max(0, state.enemyHp)} / ${state.encounter.maxHp} HP`;
    $('#shieldStatus').textContent = state.shield ? '🛡️ READY' : '🛡️ —';
    $('#streakValue').textContent = `🔥 ${state.streak}`;
    $('#battleXp').textContent = state.battleXp;
    $('#questionCount').textContent = state.attempts;
  }

  function randomQuestion() {
    const tables = world().tables;
    let q;
    let key;
    let tries = 0;

    do {
      const a = randomItem(tables);
      const b = Math.floor(Math.random() * 12) + 1;
      q = { a, b, answer: a * b };
      key = `${a}x${b}`;
      tries += 1;
    } while (key === state.lastQuestionKey && tries < 6);

    state.lastQuestionKey = key;
    return q;
  }

  function buildChoices(q) {
    const wrong = new Set();
    const candidates = [
      q.a * Math.max(1, q.b - 1),
      q.a * Math.min(12, q.b + 1),
      Math.max(1, q.a - 1) * q.b,
      Math.min(12, q.a + 1) * q.b,
      q.answer - q.a,
      q.answer + q.a,
      q.answer - q.b,
      q.answer + q.b,
      q.answer - 1,
      q.answer + 1,
      q.answer - 2,
      q.answer + 2,
      q.answer - 10,
      q.answer + 10
    ];

    shuffle(candidates).forEach((value) => {
      if (wrong.size < 3 && Number.isInteger(value) && value >= 1 && value <= 144 && value !== q.answer) wrong.add(value);
    });

    while (wrong.size < 3) {
      const value = Math.floor(Math.random() * 144) + 1;
      if (value !== q.answer) wrong.add(value);
    }

    return shuffle([q.answer, ...wrong]);
  }

  function renderChoices() {
    const grid = $('#choiceGrid');
    grid.innerHTML = '';

    state.choices.forEach((value, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = String(value);
      button.className = 'choice';
      button.setAttribute('aria-label', `Choice ${index + 1}: ${value}`);
      button.innerHTML = `<span class="choice-key">${index + 1}</span>${value}`;
      button.addEventListener('click', () => choose(index));
      grid.appendChild(button);
    });
  }

  function nextQuestion() {
    if (!state.active) return;
    state.locked = false;
    state.question = randomQuestion();
    state.choices = buildChoices(state.question);
    state.questionStarted = performance.now();
    $('#problemText').textContent = `${state.question.a} × ${state.question.b}`;
    $('#battleMessage').textContent = state.encounter.boss ? 'Boss battle — choose carefully!' : 'Choose the correct answer!';
    renderChoices();
  }

  function floatDamage(text) {
    const el = document.createElement('div');
    el.className = 'damage-float';
    el.textContent = text;
    $('#damageLayer').appendChild(el);
    setTimeout(() => el.remove(), 750);
  }

  function animate(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), 460);
  }

  function heroDamage(elapsed) {
    let damage = 16;
    if (elapsed < 2) damage += 7;
    else if (elapsed < 4) damage += 4;

    if (state.streak > 0 && state.streak % 10 === 0) damage += 22;
    else if (state.streak > 0 && state.streak % 5 === 0) damage += 12;
    else if (state.streak > 0 && state.streak % 3 === 0) damage += 6;

    return damage;
  }

  function choose(index) {
    if (!state.active || state.locked) return;
    const chosen = state.choices[index];
    if (!Number.isInteger(chosen)) return;

    state.locked = true;
    state.attempts += 1;
    const elapsed = Math.max(0.1, (performance.now() - state.questionStarted) / 1000);
    const correct = chosen === state.question.answer;
    const buttons = $$('.choice');
    buttons.forEach(button => { button.disabled = true; });

    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);

      let shieldEarned = false;
      if (state.streak % 5 === 0 && !state.shield) {
        state.shield = true;
        shieldEarned = true;
        animate($('#shieldStatus'), 'shield-pop');
      }

      const damage = heroDamage(elapsed);
      state.enemyHp = Math.max(0, state.enemyHp - damage);
      state.battleXp += 8 + (elapsed < 3 ? 4 : 0);

      buttons.forEach((button) => {
        const value = Number(button.dataset.value);
        if (value === state.question.answer) button.classList.add('correct');
        else button.classList.add('dim');
      });

      animate($('#heroAvatar'), 'hero-hit');
      animate($('#enemyAvatar'), 'enemy-hit');
      floatDamage(`💥 −${damage}`);

      let message = 'Nice hit!';
      if (state.streak % 10 === 0) message = '🌟 SUPER MOVE! Huge hit!';
      else if (state.streak % 5 === 0) message = shieldEarned ? '🛡️ Shield earned! Power hit!' : '💥 Power hit!';
      else if (state.streak % 3 === 0) message = '⚡ Power attack!';
      $('#battleMessage').textContent = message;

      updateBattleHud();
      if (state.enemyHp <= 0) setTimeout(() => finishEncounter(true), 700);
      else setTimeout(nextQuestion, 760);
      return;
    }

    state.streak = 0;
    buttons.forEach((button) => {
      const value = Number(button.dataset.value);
      if (value === state.question.answer) button.classList.add('correct');
      else if (value === chosen) button.classList.add('wrong');
      else button.classList.add('dim');
    });

    animate($('#enemyAvatar'), 'enemy-attack');
    if (state.shield) {
      state.shield = false;
      animate($('#shieldStatus'), 'shield-pop');
      $('#battleMessage').textContent = '🛡️ BLOCKED! Your shield saved you!';
      floatDamage('🛡️ BLOCKED');
    } else {
      const hit = state.encounter.boss ? 25 : 20;
      state.playerHp = Math.max(0, state.playerHp - hit);
      animate($('#heroAvatar'), 'hero-hurt');
      $('#battleMessage').textContent = `${state.encounter.enemy.name} attacks! ${state.question.a} × ${state.question.b} = ${state.question.answer}`;
      floatDamage(`❤️ −${hit}`);
    }

    updateBattleHud();
    if (state.playerHp <= 0) setTimeout(() => finishEncounter(false), 850);
    else setTimeout(nextQuestion, 900);
  }

  function accuracy() {
    return state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
  }

  function finishEncounter(won) {
    state.active = false;
    state.resultKind = won ? 'win' : 'lose';
    const w = world();
    const boss = state.encounter.boss;

    showScreen('result');
    $('#retryBtn').classList.toggle('hidden', won);
    $('#resultAccuracy').textContent = `${accuracy()}%`;
    $('#resultStreak').textContent = state.bestStreak;

    if (!won) {
      $('#resultEmoji').textContent = '💫';
      $('#resultTitle').textContent = 'So close!';
      $('#resultText').textContent = `${state.encounter.enemy.name} got this round. Try again — your adventure progress is safe.`;
      $('#resultXp').textContent = '+0';
      $('#primaryResultBtn').classList.add('hidden');
      return;
    }

    $('#primaryResultBtn').classList.remove('hidden');

    if (!state.awardedThisEncounter) {
      const reward = state.battleXp + (boss ? (120 + w.id * 20) : (40 + w.id * 10));
      state.xp += reward;
      state.awardedThisEncounter = true;
      $('#resultXp').textContent = `+${reward}`;
    }

    if (boss) {
      state.completed.add(w.id);
      if (w.id < 6) state.unlockedWorld = Math.max(state.unlockedWorld, w.id + 1);
      saveProgress();
      updateProfile();
      renderWorlds();

      $('#resultEmoji').textContent = w.id === 6 ? '🌟' : '👑';
      $('#resultTitle').textContent = w.id === 6 ? 'MULTIPLICATION MASTER!' : 'World Complete!';
      $('#resultText').textContent = w.id === 6
        ? 'Professor Pandemonium has been mathematically defeated. You conquered ×1 through ×12!'
        : `${w.boss.name} is defeated! ${worlds[w.id].name} is now unlocked.`;
      $('#primaryResultBtn').textContent = w.id === 6 ? 'Replay Final Battle' : `Enter ${worlds[w.id].name} →`;
    } else {
      state.battleIndex += 1;
      saveProgress();
      updateProfile();
      $('#resultEmoji').textContent = '🏆';
      $('#resultTitle').textContent = 'Victory!';
      $('#resultText').textContent = `${state.encounter.enemy.name} has been thoroughly defeated.`;
      $('#primaryResultBtn').textContent = isBossEncounter() ? 'Boss battle →' : 'Next battle →';
    }
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  $('#continueBtn').addEventListener('click', () => enterWorld(continueWorldId()));
  $('#battleBackBtn').addEventListener('click', () => {
    state.active = false;
    showScreen('home');
    renderWorlds();
  });
  $('#mapBtn').addEventListener('click', () => {
    showScreen('home');
    renderWorlds();
  });
  $('#retryBtn').addEventListener('click', () => startEncounter());
  $('#primaryResultBtn').addEventListener('click', () => {
    const w = world();
    if (state.resultKind !== 'win') return;

    if (state.encounter.boss) {
      if (w.id === 6) {
        state.battleIndex = 0;
        startEncounter();
      } else {
        state.currentWorldId = w.id + 1;
        state.battleIndex = 0;
        startEncounter();
      }
    } else {
      startEncounter();
    }
  });

  $('#resetProgressBtn').addEventListener('click', () => {
    const confirmed = window.confirm('Reset all hero, XP, and world progress?');
    if (!confirmed) return;
    localStorage.removeItem('multiplicationQuestProgress');
    state = defaultState();
    renderHeroes();
    renderWorlds();
    updateProfile();
    showScreen('home');
    toast('Progress reset');
  });

  document.addEventListener('keydown', (event) => {
    if (!state.active || state.locked) return;
    const index = Number(event.key) - 1;
    if (index >= 0 && index < 4) {
      event.preventDefault();
      choose(index);
    }
  });

  loadProgress();
  renderHeroes();
  renderWorlds();
  updateProfile();
  showScreen('home');
})();
