(() => {
  'use strict';

  const Core = window.MQCore;
  const Advanced = window.MQAdvanced;
  if (!Core) throw new Error('Multiplication Quest core failed to load.');
  if (!Advanced) throw new Error('Multiplication Quest advanced core failed to load.');

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const heroes = [
    { id:'dragon', name:'Baby Dragon', emoji:'🐉', attack:'Fire Pop', ability:'Fire Burst', abilityDesc:'A huge 65-damage hit on one target.', abilityType:'single' },
    { id:'fox', name:'Clever Fox', emoji:'🦊', attack:'Tail Tornado', ability:'Rapid Strike', abilityDesc:'Two fast 30-damage hits on one target.', abilityType:'single' },
    { id:'robot', name:'Little Robot', emoji:'🤖', attack:'Number Beam', ability:'Target Lock', abilityDesc:'A 48-damage hit plus a Hint Orb for the next question.', abilityType:'single' },
    { id:'monster', name:'Tiny Monster', emoji:'🐲', attack:'Bounce Blast', ability:'Mega Stomp', abilityDesc:'30 damage to every living enemy.', abilityType:'all' }
  ];

  const enemyPool = [
    { name:'Bouncy Slime', emoji:'🟢', mood:'suspiciously bouncy', attack:14 },
    { name:'Sock Monster', emoji:'🧦', mood:'stole exactly one sock', attack:14 },
    { name:'Pizza Goblin', emoji:'🍕', mood:'will not share the last slice', attack:15 },
    { name:'Grumpy Cloud', emoji:'☁️', mood:'is having a cloudy day', attack:14 },
    { name:'Jelly Beast', emoji:'🪼', mood:'wobbles menacingly', attack:15 },
    { name:'Trash Panda', emoji:'🦝', mood:'found forbidden treasure', attack:15 }
  ];

  const worlds = [
    { id:1, name:'Starter Plains', icon:'🌼', tables:[1,2,5,10], battles:3, chests:[2], boss:{name:'Mega Slime',emoji:'🟩',mood:'maximum wobble',maxHp:220} },
    { id:2, name:'Wacky Woods', icon:'🌲', tables:[3,4], battles:3, chests:[2], boss:{name:'Sockasaurus',emoji:'🧦',mood:'keeper of lost laundry',maxHp:230} },
    { id:3, name:'Crystal Caves', icon:'💎', tables:[6,7], battles:4, chests:[2,4], boss:{name:'Crystal Jelly',emoji:'💠',mood:'sparkles suspiciously',maxHp:245} },
    { id:4, name:'Thunder Peaks', icon:'⛈️', tables:[8,9], battles:4, chests:[2], boss:{name:'Thunder Puff',emoji:'🌩️',mood:'90% fluff, 10% thunder',maxHp:260} },
    { id:5, name:'Chaos Castle', icon:'🏰', tables:[11,12], battles:5, chests:[2,4], boss:{name:'Pizza Titan',emoji:'🍕',mood:'ordered extra chaos',maxHp:275} },
    { id:6, name:'Final Battle', icon:'🌟', tables:[1,2,3,4,5,6,7,8,9,10,11,12], battles:0, chests:[], boss:{name:'Professor Pandemonium',emoji:'🤓',mood:'calculating something ridiculous',maxHp:310} }
  ];


  const advancedWorlds = [
    { id:1, name:'Double-Digit Dunes', icon:'🏜️', skill:'2-digit × 1-digit', enemy:{name:'Dune Digit Bug',emoji:'🪲'}, boss:{name:'Sandstorm Scorpion',emoji:'🦂'} },
    { id:2, name:'Triple Tower', icon:'🗼', skill:'3-digit × 1-digit', enemy:{name:'Tower Bat',emoji:'🦇'}, boss:{name:'Carry Colossus',emoji:'🗿'} },
    { id:3, name:'Giant Number Grove', icon:'🌳', skill:'4-digit × 1-digit', enemy:{name:'Acorn Ogre',emoji:'🌰'}, boss:{name:'Grove Giant',emoji:'🌲'} },
    { id:4, name:'Partial Product Port', icon:'⚓', skill:'2-digit × 2-digit', enemy:{name:'Harbor Crab',emoji:'🦀'}, boss:{name:'Partial Product Pirate',emoji:'🏴‍☠️'} },
    { id:5, name:'Carrying Canyon', icon:'🧗', skill:'3-digit × 2-digit', enemy:{name:'Canyon Coyote',emoji:'🐺'}, boss:{name:'Regrouping Ram',emoji:'🐏'} },
    { id:6, name:'Place Value Peaks', icon:'🏔️', skill:'4-digit × 2-digit', enemy:{name:'Snow Digit',emoji:'🐧'}, boss:{name:'Place Value Yeti',emoji:'🐻‍❄️'} },
    { id:7, name:'Algorithm Abyss', icon:'🌌', skill:'3–4 digit × 3-digit', enemy:{name:'Abyss Angler',emoji:'🐟'}, boss:{name:'Algorithm Kraken',emoji:'🐙'} },
    { id:8, name:'Colossal Calculations', icon:'🧮', skill:'up to 4-digit × 4-digit', enemy:{name:'Number Golem',emoji:'🗿'}, boss:{name:'Colossal Calculator',emoji:'🤖'} }
  ];

  const defaultState = () => ({
    heroId:'dragon', xp:0, unlockedWorld:1, completed:new Set(), inventory:[],
    advancedUnlockedWorld:1, advancedCompleted:new Set(),
    advancedMastery:{fact:10,carry:10,shift:10,addition:10},
    advancedCurrentWorldId:1, advancedProblemIndex:0, advancedProblem:null, advancedStepIndex:0,
    advancedActive:false, advancedBoss:false, advancedFallbackChoice:false, advancedForceChoice:false,
    advancedRevealed:null, advancedAttempts:0, advancedCorrect:0, advancedBattleXp:0, advancedHits:0,
    currentWorldId:1, battleIndex:0, encounter:null, enemySerial:0,
    active:false, locked:false, targetId:null, playerHp:100, shield:false,
    streak:0, bestStreak:0, abilityCharge:0, battleXp:0, correct:0, attempts:0,
    question:null, choices:[], questionMode:'normal', questionStarted:0, lastQuestionKey:'',
    frozen:false, hintNext:false, itemsJammed:0, currentQuestionItemsJammed:false, damagePenaltyNext:0,
    resultKind:null, pendingReward:null, rewardSummary:null, awardedThisEncounter:false
  });

  let state = defaultState();

  function world() { return worlds.find(w => w.id === state.currentWorldId) || worlds[0]; }
  function hero() { return heroes.find(h => h.id === state.heroId) || heroes[0]; }
  function level() { return Math.floor(state.xp / 250) + 1; }
  function xpIntoLevel() { return state.xp % 250; }
  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function randomItem(items){ return items[Math.floor(Math.random()*items.length)]; }
  function rollD6(){ return Math.floor(Math.random()*6)+1; }
  function livingEnemies(){ return state.encounter ? state.encounter.enemies.filter(e => e.hp > 0) : []; }
  function bossEnemy(){ return livingEnemies().find(e => e.isBoss) || null; }
  function targetEnemy(){ return livingEnemies().find(e => e.id === state.targetId) || null; }

  function shuffle(items){
    const copy=[...items];
    for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }

  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem('multiplicationQuestProgress')||'null');
      if(!saved || typeof saved!=='object') return;
      state.heroId=heroes.some(h=>h.id===saved.heroId)?saved.heroId:'dragon';
      state.xp=Number.isFinite(saved.xp)?Math.max(0,Math.floor(saved.xp)):0;
      state.unlockedWorld=Number.isFinite(saved.unlockedWorld)?clamp(Math.floor(saved.unlockedWorld),1,6):1;
      state.completed=new Set(Array.isArray(saved.completed)?saved.completed.filter(id=>Number.isInteger(id)&&id>=1&&id<=6):[]);
      state.inventory=Array.isArray(saved.inventory)?saved.inventory.filter(id=>Core.ITEMS[id]).slice(0,3):[];
      state.advancedUnlockedWorld=Number.isFinite(saved.advancedUnlockedWorld)?clamp(Math.floor(saved.advancedUnlockedWorld),1,8):1;
      state.advancedCompleted=new Set(Array.isArray(saved.advancedCompleted)?saved.advancedCompleted.filter(id=>Number.isInteger(id)&&id>=1&&id<=8):[]);
      if(saved.advancedMastery && typeof saved.advancedMastery==='object'){
        for(const skill of ['fact','carry','shift','addition']) state.advancedMastery[skill]=clamp(Math.floor(Number(saved.advancedMastery[skill])||10),0,100);
      }
    }catch(error){ console.warn('Could not load saved progress:',error); }
  }

  function saveProgress(){
    try{
      localStorage.setItem('multiplicationQuestProgress',JSON.stringify({
        heroId:state.heroId,xp:state.xp,unlockedWorld:state.unlockedWorld,
        completed:[...state.completed],inventory:[...state.inventory],
        advancedUnlockedWorld:state.advancedUnlockedWorld,advancedCompleted:[...state.advancedCompleted],
        advancedMastery:Object.assign({},state.advancedMastery)
      }));
    }catch(error){ console.warn('Could not save progress:',error); }
  }

  function setTheme(worldId){ document.body.dataset.theme=worldId ? `world-${worldId}` : 'home'; }

  function showScreen(name){
    $('#homeScreen').classList.toggle('hidden',name!=='home');
    $('#advancedHomeScreen').classList.toggle('hidden',name!=='advancedHome');
    $('#advancedBattleScreen').classList.toggle('hidden',name!=='advancedBattle');
    $('#advancedResultScreen').classList.toggle('hidden',name!=='advancedResult');
    $('#battleScreen').classList.toggle('hidden',name!=='battle');
    $('#resultScreen').classList.toggle('hidden',name!=='result');
  }

  function toast(message){
    const old=$('.toast'); if(old) old.remove();
    const el=document.createElement('div'); el.className='toast'; el.textContent=message; document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }

  function updateProfile(){
    const h=hero();
    $('#profileHero').textContent=h.emoji; $('#profileName').textContent=h.name;
    $('#levelValue').textContent=level(); $('#xpValue').textContent=state.xp;
    $('#xpNext').textContent=`${level()*250} XP`; $('#xpBar').style.width=`${xpIntoLevel()/250*100}%`;
    $('#bagCount').textContent=state.inventory.length;
  }

  function renderInventory(container, battleMode=false){
    container.innerHTML='';
    for(let i=0;i<3;i+=1){
      const itemId=state.inventory[i];
      if(!itemId){
        const empty=document.createElement('div'); empty.className='item-card empty';
        empty.innerHTML='<span class="item-emoji">➕</span><span><span class="item-name">Empty slot</span><span class="item-desc">Find items in battles and chests.</span></span>';
        container.appendChild(empty); continue;
      }
      const item=Core.ITEMS[itemId];
      const el=document.createElement(battleMode?'button':'div');
      if(battleMode) el.type='button';
      el.className=`item-card${battleMode?' usable':''}`;
      el.innerHTML=`<span class="item-emoji">${item.emoji}</span><span><span class="item-name">${item.name}</span><span class="item-desc">${item.description}</span></span>`;
      if(battleMode){
        const unusable=!state.active||state.locked||state.itemsJammed>0||state.questionMode==='power'||
          state.currentQuestionItemsJammed||(itemId==='apple'&&state.playerHp>=100)||(itemId==='shield'&&state.shield)||(itemId==='freeze'&&state.frozen)||(itemId==='hint'&&state.hintNext);
        el.disabled=unusable;
        el.addEventListener('click',()=>useItem(i));
      }
      container.appendChild(el);
    }
  }

  function renderHomeInventory(){ renderInventory($('#homeInventory'),false); updateProfile(); }

  function renderHeroes(){
    const grid=$('#heroGrid'); grid.innerHTML='';
    heroes.forEach(h=>{
      const button=document.createElement('button'); button.type='button';
      button.className=`hero-card${state.heroId===h.id?' selected':''}`;
      button.setAttribute('aria-pressed',state.heroId===h.id?'true':'false');
      button.innerHTML=`<span class="hero-emoji">${h.emoji}</span><span class="hero-name">${h.name}</span><span class="hero-attack">${h.attack}</span><span class="hero-ability">⚡ ${h.ability}</span>`;
      button.addEventListener('click',()=>{state.heroId=h.id;saveProgress();renderHeroes();updateProfile();});
      grid.appendChild(button);
    });
  }

  function worldSubtitle(w){ return w.id===6?'Mixed ×1–×12 · Final Boss':`×${w.tables.join(', ×')} · ${w.battles} battles + boss`; }

  function pathPreview(w){
    if(w.id===6) return '<span class="path-node">👑</span>';
    const pieces=[];
    for(let i=1;i<=w.battles;i+=1){
      pieces.push('<span class="path-node">⚔️</span>');
      if(w.chests.includes(i)) pieces.push('<span class="path-node chest">🎁</span>');
    }
    pieces.push('<span class="path-node">👑</span>');
    return pieces.join('');
  }

  function renderWorlds(){
    const grid=$('#worldGrid'); grid.innerHTML='';
    worlds.forEach(w=>{
      const unlocked=w.id<=state.unlockedWorld; const completed=state.completed.has(w.id);
      const button=document.createElement('button'); button.type='button'; button.disabled=!unlocked;
      button.dataset.world=String(w.id); button.className=`world-card${!unlocked?' locked':''}${completed?' completed':''}`;
      button.innerHTML=`<div class="world-row"><div class="world-icon">${unlocked?w.icon:'🔒'}</div><div><div class="world-name">World ${w.id} · ${w.name}${completed?'<span class="complete-badge">✓ Complete</span>':''}</div><div class="world-sub">${worldSubtitle(w)}</div><div class="path-preview">${pathPreview(w)}</div><div class="world-status">${unlocked?(completed?'Replay anytime':'Ready to play'):'Beat the previous boss to unlock'}</div></div></div>`;
      if(unlocked) button.addEventListener('click',()=>enterWorld(w.id));
      grid.appendChild(button);
    });
  }

  function continueWorldId(){
    for(let i=1;i<=state.unlockedWorld;i+=1) if(!state.completed.has(i)) return i;
    return Math.min(state.unlockedWorld,6);
  }

  function enterWorld(id){ state.currentWorldId=id; state.battleIndex=0; setTheme(id); startEncounter(); }
  function isBossEncounter(){ const w=world(); return w.id===6||state.battleIndex>=w.battles; }

  function makeEnemy(template,{isBoss=false,maxHp=null,role='Enemy'}={}){
    state.enemySerial+=1;
    const hp=maxHp||template.maxHp||90;
    return { id:`enemy-${state.enemySerial}`, name:template.name, emoji:template.emoji, mood:template.mood||'', role, isBoss, maxHp:hp, hp, attack:template.attack||14 };
  }

  function normalEncounterSize(worldId){
    const r=Math.random();
    if(worldId<=1) return 1;
    if(worldId===2) return r<.28?2:1;
    if(worldId===3) return r<.45?2:1;
    if(worldId===4) return r<.18?3:(r<.66?2:1);
    return r<.28?3:(r<.78?2:1);
  }

  function createNormalEnemies(){
    const count=normalEncounterSize(world().id); const chosen=shuffle(enemyPool).slice(0,count);
    const hpByCount=count===1?[92,102,112]:count===2?[58,66,72]:[42,48,54];
    return chosen.map(t=>makeEnemy(t,{maxHp:randomItem(hpByCount),role:'Enemy'}));
  }

  function startEncounter(){
    const w=world(); const boss=isBossEncounter();
    const enemies=boss?[makeEnemy(w.boss,{isBoss:true,maxHp:w.boss.maxHp,role:'BOSS'})]:createNormalEnemies();
    state.encounter={boss,enemies}; state.playerHp=100; state.shield=false; state.streak=0; state.bestStreak=0;
    state.abilityCharge=0; state.battleXp=0; state.correct=0; state.attempts=0; state.active=true; state.locked=false;
    state.targetId=enemies.length===1?enemies[0].id:null; state.question=null; state.questionMode='normal'; state.frozen=false; state.hintNext=false;
    state.itemsJammed=0; state.currentQuestionItemsJammed=false; state.damagePenaltyNext=0; state.resultKind=null; state.pendingReward=null; state.rewardSummary=null; state.awardedThisEncounter=false;
    setTheme(w.id); showScreen('battle'); $('#bossDicePanel').classList.add('hidden'); renderBattleShell(); nextQuestion('normal');
  }

  function renderStageDots(){
    const w=world(); const wrap=$('#stageDots'); wrap.innerHTML='';
    if(w.id===6){wrap.innerHTML='<span class="stage-dot current">👑</span>';return;}
    for(let i=0;i<w.battles;i+=1){
      const dot=document.createElement('span'); dot.className=`stage-dot${i<state.battleIndex?' done':''}${i===state.battleIndex?' current':''}`; dot.textContent=i<state.battleIndex?'✓':String(i+1); wrap.appendChild(dot);
      if(w.chests.includes(i+1)){const chest=document.createElement('span');chest.className='stage-chest';chest.textContent='🎁';wrap.appendChild(chest);}
    }
    const boss=document.createElement('span'); boss.className=`stage-dot${state.battleIndex>=w.battles?' current':''}`; boss.textContent='👑'; wrap.appendChild(boss);
  }

  function renderBossDiceTable(){
    const table=$('#bossDiceTable'); table.innerHTML='';
    const rows=Core.BOSS_TABLES[world().id];
    Object.entries(rows).forEach(([roll,action])=>{
      const div=document.createElement('div'); div.className='dice-rule';
      const extra=action.type==='summon'?'Summon a minion':action.type==='chaos'?'All living enemies attack':action.type==='miss'?'Boss misses':action.type==='effect'?`Special effect: ${action.effect}`:`${action.damage||0} damage`;
      div.innerHTML=`<strong>🎲 ${roll} · ${action.label}</strong><span>${extra}</span>`; table.appendChild(div);
    });
  }

  function renderBattleShell(){
    const w=world(),h=hero();
    $('#battleWorld').textContent=`${w.icon} ${w.name}`;
    $('#battleStageLabel').textContent=state.encounter.boss?'👑 BOSS BATTLE':`Battle ${state.battleIndex+1} of ${w.battles}`;
    $('#heroBattleName').textContent=h.name; $('#heroAvatar').textContent=h.emoji; $('#heroAttackName').textContent=h.attack;
    $('#abilityName').textContent=h.ability; $('#abilityDescription').textContent=h.abilityDesc;
    $('#battleEffect').textContent=state.encounter.boss?'👑':'VS';
    $('#bossDiceBtn').classList.toggle('hidden',!state.encounter.boss);
    if(state.encounter.boss) renderBossDiceTable();
    renderStageDots(); renderEnemies(); updateBattleHud(); renderInventory($('#battleInventory'),true);
  }

  function renderEnemies(){
    const grid=$('#enemyGrid'); grid.innerHTML=''; const living=livingEnemies();
    if(living.length===1 && !state.targetId) state.targetId=living[0].id;
    if(!living.some(e=>e.id===state.targetId)) state.targetId=living.length===1?living[0].id:null;
    state.encounter.enemies.forEach(enemy=>{
      const button=document.createElement('button'); button.type='button';
      const defeated=enemy.hp<=0; button.disabled=defeated||state.locked;
      button.className=`enemy-card${enemy.id===state.targetId&&!defeated?' targeted':''}${defeated?' defeated':''}`;
      button.dataset.enemyId=enemy.id;
      const pct=clamp(enemy.hp/enemy.maxHp*100,0,100);
      button.innerHTML=`${enemy.id===state.targetId&&!defeated?'<span class="target-badge">🎯 TARGET</span>':''}<span class="enemy-emoji">${defeated?'💫':enemy.emoji}</span><strong>${enemy.name}</strong><span class="enemy-role">${defeated?'Defeated':enemy.role}</span><div class="meter enemy-mini-hp"><div class="meter-fill enemy-hp" style="width:${pct}%"></div></div><span class="enemy-hp-text">${Math.max(0,enemy.hp)} / ${enemy.maxHp} HP · ${enemy.mood}</span>`;
      if(!defeated) button.addEventListener('click',()=>selectTarget(enemy.id));
      grid.appendChild(button);
    });
    $('#livingCount').textContent=`${living.length} alive`;
    $('#targetHint').textContent=living.length>1?(state.targetId?'Target selected — tap another to switch.':'Tap an enemy to target it.'):'Target locked.';
    updateChoiceAvailability();
  }

  function selectTarget(id){
    if(state.locked||!state.active) return;
    const found=livingEnemies().find(e=>e.id===id); if(!found) return;
    state.targetId=id; renderEnemies();
  }

  function updateBattleHud(){
    $('#playerHpBar').style.width=`${clamp(state.playerHp,0,100)}%`; $('#playerHpText').textContent=`${clamp(state.playerHp,0,100)} / 100 HP`;
    $('#shieldStatus').textContent=state.shield?'🛡️ READY':'🛡️ —'; $('#streakValue').textContent=`🔥 ${state.streak}`;
    $('#battleXp').textContent=state.battleXp; $('#questionCount').textContent=state.attempts;
    $('#abilityPercent').textContent=`${state.abilityCharge}%`; $('#abilityBar').style.width=`${state.abilityCharge}%`; $('#abilityStat').textContent=`⚡ ${state.abilityCharge}%`;
    const ready=state.abilityCharge>=100; $('#abilityBtn').disabled=!ready||state.locked||!state.active||state.questionMode==='power';
    $('#abilityBtn').textContent=ready?`⚡ USE ${hero().ability.toUpperCase()}`:'⚡ Charge ability';
    $('#abilityBtn').classList.toggle('ready',ready&&!state.locked); $('.ability-card').classList.toggle('charged',ready&&!state.locked);
    $('#itemJamMessage').textContent=state.currentQuestionItemsJammed?'🧦 Items jammed for this question!':'';
    renderInventory($('#battleInventory'),true);
  }

  function randomQuestion(tables){
    let q,key,tries=0;
    do{const a=randomItem(tables),b=Math.floor(Math.random()*12)+1;q={a,b,answer:a*b};key=`${a}x${b}`;tries+=1;}while(key===state.lastQuestionKey&&tries<7);
    state.lastQuestionKey=key; return q;
  }

  function buildChoices(q){
    const wrong=new Set();
    const candidates=[q.a*Math.max(1,q.b-1),q.a*Math.min(12,q.b+1),Math.max(1,q.a-1)*q.b,Math.min(12,q.a+1)*q.b,q.answer-q.a,q.answer+q.a,q.answer-q.b,q.answer+q.b,q.answer-1,q.answer+1,q.answer-2,q.answer+2,q.answer-10,q.answer+10];
    shuffle(candidates).forEach(v=>{if(wrong.size<3&&Number.isInteger(v)&&v>=1&&v<=144&&v!==q.answer)wrong.add(v);});
    while(wrong.size<3){const v=Math.floor(Math.random()*144)+1;if(v!==q.answer)wrong.add(v);}
    return shuffle([q.answer,...wrong]);
  }

  function nextQuestion(mode='normal'){
    if(!state.active) return;
    state.locked=false; state.questionMode=mode;
    state.currentQuestionItemsJammed=mode==='normal'&&state.itemsJammed>0;
    if(state.currentQuestionItemsJammed) state.itemsJammed=Math.max(0,state.itemsJammed-1);
    const tables=mode==='power'?Core.learnedTables(world().id):world().tables;
    state.question=randomQuestion(tables); state.choices=buildChoices(state.question); state.questionStarted=performance.now();
    $('#problemText').textContent=`${state.question.a} × ${state.question.b}`;
    $('#powerBadge').classList.toggle('hidden',mode!=='power'); $('#questionCard').classList.toggle('power-mode',mode==='power');
    $('#battleMessage').textContent=mode==='power'?`Get it right to unleash ${hero().ability}!`:(state.targetId?'Choose the correct answer!':'Choose a target, then answer!');
    renderChoices(); renderEnemies(); updateBattleHud();
  }

  function renderChoices(){
    const grid=$('#choiceGrid'); grid.innerHTML='';
    let eliminated=[];
    if(state.questionMode==='normal'&&state.hintNext){
      const wrongIndexes=state.choices.map((v,i)=>v!==state.question.answer?i:null).filter(v=>v!==null);
      eliminated=shuffle(wrongIndexes).slice(0,2); state.hintNext=false; toast('🔮 Hint Orb removed two wrong answers!');
    }
    state.choices.forEach((value,index)=>{
      const button=document.createElement('button'); button.type='button'; button.dataset.value=String(value); button.dataset.index=String(index);
      button.className=`choice${eliminated.includes(index)?' eliminated':''}`;
      button.innerHTML=`<span class="choice-key">${index+1}</span>${value}`;
      button.disabled=eliminated.includes(index); button.addEventListener('click',()=>chooseAnswer(index)); grid.appendChild(button);
    });
    updateChoiceAvailability();
  }

  function updateChoiceAvailability(){
    if(!state.question) return;
    const needsTarget=state.questionMode==='normal'&&livingEnemies().length>1&&!targetEnemy();
    $$('.choice').forEach(button=>{if(!button.classList.contains('eliminated')) button.disabled=state.locked||needsTarget;});
  }

  function animateElement(el,cls,duration=460){ if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),duration); }
  function enemyCardEl(id){ return $(`[data-enemy-id="${id}"]`); }
  function floatText(text){const el=document.createElement('div');el.className='damage-float';el.textContent=text;$('#damageLayer').appendChild(el);setTimeout(()=>el.remove(),750);}

  function normalDamage(elapsed){
    let damage=17; if(elapsed<2)damage+=7; else if(elapsed<4)damage+=4;
    if(state.streak>0&&state.streak%10===0)damage+=22; else if(state.streak>0&&state.streak%5===0)damage+=12; else if(state.streak>0&&state.streak%3===0)damage+=6;
    if(state.damagePenaltyNext>0){damage=Math.max(8,damage-state.damagePenaltyNext);state.damagePenaltyNext=0;}
    return damage;
  }

  function damageEnemy(enemy,amount){ enemy.hp=Math.max(0,enemy.hp-amount); animateElement(enemyCardEl(enemy.id), 'enemy-hit'); }

  async function chooseAnswer(index){
    if(!state.active||state.locked||!state.question) return;
    const chosen=state.choices[index]; if(!Number.isInteger(chosen)) return;
    const chosenButton=$$('.choice')[index]; if(!chosenButton||chosenButton.disabled) return;
    if(state.questionMode==='normal'&&livingEnemies().length>1&&!targetEnemy()){toast('🎯 Pick a monster to target first!');return;}

    state.locked=true; state.attempts+=1; const elapsed=Math.max(.1,(performance.now()-state.questionStarted)/1000); const ok=chosen===state.question.answer;
    $$('.choice').forEach(b=>b.disabled=true);
    $$('.enemy-card').forEach(b=>b.disabled=true);

    if(ok){
      state.correct+=1;
      $$('.choice').forEach(b=>{const v=Number(b.dataset.value);if(v===state.question.answer)b.classList.add('correct');else b.classList.add('dim');});
      if(state.questionMode==='power') await resolvePowerAnswer(true);
      else await resolveNormalCorrect(elapsed);
    }else{
      $$('.choice').forEach(b=>{const v=Number(b.dataset.value);if(v===state.question.answer)b.classList.add('correct');else if(v===chosen)b.classList.add('wrong');else b.classList.add('dim');});
      if(state.questionMode==='power') await resolvePowerAnswer(false);
      else await resolveNormalWrong();
    }
  }

  async function resolveNormalCorrect(elapsed){
    state.streak+=1; state.bestStreak=Math.max(state.bestStreak,state.streak); state.abilityCharge=Core.nextAbilityCharge(state.abilityCharge,true);
    if(state.streak%5===0&&!state.shield){state.shield=true;animateElement($('#shieldStatus'),'shield-pop');}
    const target=targetEnemy()||livingEnemies()[0]; const damage=normalDamage(elapsed); damageEnemy(target,damage); animateElement($('#heroAvatar'),'hero-hit');
    const gain=8+(elapsed<3?4:0); state.battleXp+=gain; floatText(`💥 −${damage}`);
    let message=`${hero().attack}! ${target.name} takes ${damage}.`;
    if(target.hp<=0) message=`💥 ${target.name} defeated!`;
    else if(state.streak%10===0) message='🌟 SUPER MOVE! Huge hit!'; else if(state.streak%5===0) message='🛡️ Shield earned! Power hit!'; else if(state.streak%3===0) message='⚡ Power attack!';
    $('#battleMessage').textContent=message; renderEnemies(); updateBattleHud();
    if(checkVictory()) return;
    await sleep(760); nextQuestion('normal');
  }

  async function resolveNormalWrong(){
    state.streak=0; $('#battleMessage').textContent=`Not quite — ${state.question.a} × ${state.question.b} = ${state.question.answer}.`;
    updateBattleHud(); await sleep(600); await enemyTurn();
  }

  function activateAbility(){
    if(!state.active||state.locked||state.abilityCharge<100||state.questionMode==='power') return;
    if(hero().abilityType==='single'&&!targetEnemy()){toast('🎯 Choose the monster your Power Move should hit!');return;}
    nextQuestion('power');
  }

  async function resolvePowerAnswer(correct){
    const resolution=Core.resolvePowerQuestion(correct); state.abilityCharge=resolution.charge;
    if(!correct){
      $('#battleMessage').textContent=`💨 ${hero().ability} fizzled! Ability charge drops to 50%. No enemy roll.`;
      updateBattleHud(); await sleep(1000); nextQuestion('normal'); return;
    }
    $('#battleMessage').textContent=`⚡ ${hero().ability.toUpperCase()}!!!`; animateElement($('#heroAvatar'),'power-fire',620);
    fireHeroAbility(); renderEnemies(); updateBattleHud();
    if(checkVictory()) return;
    await sleep(1050); nextQuestion('normal');
  }

  function fireHeroAbility(){
    const h=hero();
    if(h.id==='dragon'){
      const target=targetEnemy()||livingEnemies()[0]; damageEnemy(target,65); floatText('🔥 −65');
    }else if(h.id==='fox'){
      const target=targetEnemy()||livingEnemies()[0]; damageEnemy(target,30); damageEnemy(target,30); floatText('🦊 −60');
    }else if(h.id==='robot'){
      const target=targetEnemy()||livingEnemies()[0]; damageEnemy(target,48); state.hintNext=true; floatText('🎯 −48 + HINT');
    }else{
      livingEnemies().forEach(enemy=>damageEnemy(enemy,30)); floatText('💥 ALL −30');
    }
    state.battleXp+=22;
  }

  async function animateDice(roll,action){
    $('#dicePanel').classList.remove('hidden'); $('#diceIcon').textContent='🎲'; $('#diceTitle').textContent='Enemy Roll...'; $('#diceText').textContent='The enemy side gets one d6 action.';
    animateElement($('#diceIcon'),'dice-rolling',500); await sleep(500);
    $('#diceIcon').textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][roll-1]; $('#diceTitle').textContent=`Rolled ${roll}: ${action.label}`;
  }

  function chooseAttacker(){
    const boss=bossEnemy(); return boss||randomItem(livingEnemies());
  }

  function hitPlayer(amount,source){
    if(state.shield){state.shield=false;animateElement($('#shieldStatus'),'shield-pop');return {blocked:true,damage:0,text:`🛡️ BLOCKED ${source}!`};}
    state.playerHp=Math.max(0,state.playerHp-amount);animateElement($('#heroAvatar'),'hero-hurt');return {blocked:false,damage:amount,text:`${source} hits for ${amount}!`};
  }

  function applyBossEffect(effect){
    const boss=bossEnemy();
    if(effect==='sticky'){state.damagePenaltyNext=6;return 'Your next normal attack is weakened by sticky goo.';}
    if(effect==='jamItem'){state.itemsJammed=1;return 'Your battle bag is jammed for the next question.';}
    if(effect==='crystalArmor'&&boss){boss.hp=Math.min(boss.maxHp,boss.hp+20);return 'Crystal Jelly restores 20 HP behind a crystal shell.';}
    if(effect==='static'){state.abilityCharge=Math.max(0,state.abilityCharge-20);return 'Static drains 20% ability charge.';}
    if(effect==='sauce'){state.damagePenaltyNext=4;return 'Sauce makes your next normal attack slippery.';}
    if(effect==='scramble'){state.abilityCharge=Math.max(0,state.abilityCharge-20);return 'Number Scramble drains 20% ability charge.';}
    return '';
  }

  function summonMinion(minion){
    if(livingEnemies().length>=3) return false;
    state.encounter.enemies.push(makeEnemy({name:minion.name,emoji:minion.emoji,mood:'summoned trouble',attack:minion.attack},{maxHp:minion.maxHp,role:'Minion'}));
    return true;
  }

  async function enemyTurn(){
    if(!state.active) return;
    if(state.frozen){
      state.frozen=false; $('#dicePanel').classList.remove('hidden'); $('#diceIcon').textContent='❄️'; $('#diceTitle').textContent='Enemy turn frozen!'; $('#diceText').textContent='Freeze Pop cancels the entire enemy-side roll.';
      updateBattleHud(); await sleep(900); $('#dicePanel').classList.add('hidden'); nextQuestion('normal'); return;
    }
    const roll=rollD6(); const boss=bossEnemy(); const action=boss?Core.bossEnemyAction(world().id,roll,livingEnemies().length):Core.normalEnemyAction(roll);
    await animateDice(roll,action);
    let text='';

    if(action.type==='miss') text=action.text||'The enemy misses!';
    else if(action.type==='summon'){
      const summoned=summonMinion(action.minion); text=summoned?`${action.label} ${action.minion.name} joins the fight!`:'The field is full, so the summon fizzles.';
    }else if(action.type==='attack'||action.type==='heavy'){
      const attacker=chooseAttacker(); animateElement(enemyCardEl(attacker.id),'enemy-attack'); const hit=hitPlayer(action.damage||attacker.attack,attacker.name); text=hit.text;
    }else if(action.type==='effect'){
      const attacker=chooseAttacker(); animateElement(enemyCardEl(attacker.id),'enemy-attack'); const hit=hitPlayer(action.damage||8,action.label); const extra=applyBossEffect(action.effect); text=`${hit.text} ${extra}`.trim();
    }else if(action.type==='chaos'){
      const attackers=[...livingEnemies()]; let total=0; let blocked=false;
      for(const attacker of attackers){animateElement(enemyCardEl(attacker.id),'enemy-attack');if(state.shield&&!blocked){state.shield=false;blocked=true;}else{state.playerHp=Math.max(0,state.playerHp-(action.damage||8));total+=action.damage||8;}}
      text=`${action.label}! ${blocked?'Your shield blocks the first hit. ':''}${total?`You take ${total} total damage.`:'No damage gets through.'}`;
      if(total>0) animateElement($('#heroAvatar'),'hero-hurt');
    }

    if(action.summonBlocked) text=`The summon is blocked by the 3-enemy cap. ${text}`;
    $('#diceText').textContent=text; $('#battleMessage').textContent=text; renderEnemies(); updateBattleHud();
    if(state.playerHp<=0){await sleep(900);finishEncounter(false);return;}
    await sleep(1100); $('#dicePanel').classList.add('hidden'); nextQuestion('normal');
  }

  function useItem(index){
    if(!state.active||state.locked||state.itemsJammed>0||state.questionMode==='power') return;
    const itemId=state.inventory[index]; const item=Core.ITEMS[itemId]; if(!item) return;
    if(itemId==='apple'&&state.playerHp>=100){toast('❤️ You already have full HP.');return;}
    if(itemId==='shield'&&state.shield){toast('🛡️ You already have a shield.');return;}
    if(itemId==='freeze'&&state.frozen){toast('❄️ The next enemy turn is already frozen.');return;}
    if(itemId==='hint'&&state.hintNext){toast('🔮 A hint is already queued.');return;}

    const result=Core.applyItem(itemId,{playerHp:state.playerHp,shield:state.shield,frozen:state.frozen,hint:state.hintNext,enemies:state.encounter.enemies});
    state.playerHp=result.playerHp; state.shield=result.shield; state.frozen=result.frozen; state.hintNext=result.hint; state.encounter.enemies=result.enemies;
    state.inventory.splice(index,1); saveProgress(); toast(`${item.emoji} ${item.name} used!`); renderEnemies(); updateBattleHud(); renderHomeInventory();
    if(itemId==='bomb'&&checkVictory()) return;
  }

  function checkVictory(){
    if(livingEnemies().length>0){
      if(!targetEnemy()){const living=livingEnemies();state.targetId=living.length===1?living[0].id:null;}
      renderEnemies(); return false;
    }
    state.locked=true; updateChoiceAvailability(); setTimeout(()=>finishEncounter(true),650); return true;
  }

  function accuracy(){ return state.attempts?Math.round(state.correct/state.attempts*100):0; }

  function randomItemId(){ return randomItem(Object.keys(Core.ITEMS)); }

  function determineReward(boss,completedBattleNumber){
    if(boss) return {itemId:randomItemId(),source:'Boss chest'};
    if(world().chests.includes(completedBattleNumber)) return {itemId:randomItemId(),source:'Treasure chest'};
    if(Math.random()<.32) return {itemId:randomItemId(),source:'Battle drop'};
    return null;
  }

  function offerReward(reward){
    state.pendingReward=null; state.rewardSummary=null; $('#rewardActions').innerHTML=''; $('#mapBtn').disabled=false;
    if(!reward){$('#rewardPanel').classList.add('hidden');return;}
    const item=Core.ITEMS[reward.itemId]; const added=Core.addInventoryItem(state.inventory,reward.itemId);
    $('#rewardPanel').classList.remove('hidden'); $('#rewardIcon').textContent=reward.source==='Treasure chest'||reward.source==='Boss chest'?'🎁':item.emoji;
    $('#rewardTitle').textContent=`${reward.source}: ${item.name}`;
    if(added.added){
      state.inventory=added.inventory; saveProgress(); $('#rewardText').textContent=`${item.emoji} ${item.description} Added to your adventure bag.`; state.rewardSummary=`Found ${item.name}`;
      renderHomeInventory(); return;
    }
    state.pendingReward=reward; $('#rewardText').textContent='Your 3-slot bag is full. Replace an item or leave the new item behind.'; $('#primaryResultBtn').disabled=true; $('#mapBtn').disabled=true;
    state.inventory.forEach((oldId,index)=>{
      const old=Core.ITEMS[oldId]; const b=document.createElement('button'); b.type='button'; b.className='button button-ghost button-small'; b.textContent=`Replace ${old.emoji} ${old.name}`; b.addEventListener('click',()=>resolveReward(index)); $('#rewardActions').appendChild(b);
    });
    const leave=document.createElement('button');leave.type='button';leave.className='button button-ghost button-small';leave.textContent='Leave it';leave.addEventListener('click',()=>resolveReward(null));$('#rewardActions').appendChild(leave);
  }

  function resolveReward(replaceIndex){
    if(!state.pendingReward) return; const item=Core.ITEMS[state.pendingReward.itemId];
    if(Number.isInteger(replaceIndex)){const old=Core.ITEMS[state.inventory[replaceIndex]];state.inventory[replaceIndex]=state.pendingReward.itemId;state.rewardSummary=`Replaced ${old.name} with ${item.name}`;$('#rewardText').textContent=`Swapped ${old.emoji} ${old.name} for ${item.emoji} ${item.name}.`;}
    else{state.rewardSummary=`Left ${item.name} behind`;$('#rewardText').textContent=`You leave ${item.emoji} ${item.name} behind.`;}
    state.pendingReward=null;$('#rewardActions').innerHTML='';$('#primaryResultBtn').disabled=false;$('#mapBtn').disabled=false;saveProgress();renderHomeInventory();
  }

  function finishEncounter(won){
    if(!state.active) return; state.active=false; state.resultKind=won?'win':'lose'; showScreen('result'); $('#retryBtn').classList.toggle('hidden',won); $('#primaryResultBtn').disabled=false; $('#mapBtn').disabled=false;
    $('#resultAccuracy').textContent=`${accuracy()}%`; $('#resultStreak').textContent=state.bestStreak;
    if(!won){
      $('#resultEmoji').textContent='💫';$('#resultTitle').textContent='So close!';$('#resultText').textContent='The monsters got this round. Your adventure progress and items are safe.';$('#resultXp').textContent='+0';$('#primaryResultBtn').classList.add('hidden');$('#rewardPanel').classList.add('hidden');return;
    }

    $('#primaryResultBtn').classList.remove('hidden'); const w=world(); const boss=state.encounter.boss;
    const rewardXp=state.battleXp+(boss?(120+w.id*20):(40+w.id*10));state.xp+=rewardXp;$('#resultXp').textContent=`+${rewardXp}`;saveProgress();updateProfile();
    let reward=null;
    if(boss){
      state.completed.add(w.id);if(w.id<6)state.unlockedWorld=Math.max(state.unlockedWorld,w.id+1);saveProgress();renderWorlds();
      $('#resultEmoji').textContent=w.id===6?'🌟':'👑';$('#resultTitle').textContent=w.id===6?'MULTIPLICATION MASTER!':'World Complete!';
      $('#resultText').textContent=w.id===6?'Professor Pandemonium has been mathematically defeated. You conquered ×1 through ×12!':`${w.boss.name} is defeated! ${worlds[w.id].name} is now unlocked.`;
      $('#primaryResultBtn').textContent=w.id===6?'Replay Final Battle':`Enter ${worlds[w.id].name} →`; reward=determineReward(true,0);
    }else{
      const completedBattleNumber=state.battleIndex+1; state.battleIndex+=1;
      $('#resultEmoji').textContent='🏆';$('#resultTitle').textContent='Victory!';$('#resultText').textContent=state.encounter.enemies.length>1?'The whole monster squad is down!':'That monster has been thoroughly defeated.';
      $('#primaryResultBtn').textContent=isBossEncounter()?'Boss battle →':'Next battle →'; reward=determineReward(false,completedBattleNumber);
    }
    offerReward(reward); renderHomeInventory();
  }

  function advancedUnlocked(){ return state.completed.has(6); }
  function advancedWorld(){ return advancedWorlds.find(w=>w.id===state.advancedCurrentWorldId)||advancedWorlds[0]; }
  function advancedAccuracy(){ return state.advancedAttempts?Math.round(state.advancedCorrect/state.advancedAttempts*100):100; }
  function setAdvancedTheme(worldId){ document.body.dataset.theme=worldId?`advanced-${worldId}`:'advanced-map'; }

  function renderMasteryInto(container){
    const labels={fact:'Facts',carry:'Carry / Regroup',shift:'Place Value',addition:'Final Addition'};
    container.innerHTML='';
    for(const skill of ['fact','carry','shift','addition']){
      const score=state.advancedMastery[skill];
      const mode=score<35?'Choices':score<70?'Hybrid':'Typed';
      const card=document.createElement('div');card.className='mastery-card';
      card.innerHTML=`<div class="mastery-head"><strong>${labels[skill]}</strong><span>${score}% · ${mode}</span></div><div class="meter"><div class="meter-fill mastery-fill" style="width:${score}%"></div></div>`;
      container.appendChild(card);
    }
  }

  function renderAdvancedEntry(){
    const unlocked=advancedUnlocked();
    $('#advancedQuestBtn').disabled=!unlocked;
    $('#advancedQuestBtn').textContent=unlocked?'🧮 Enter Advanced Quest':'🔒 Advanced Quest';
    $('#advancedQuestSummary').textContent=unlocked
      ?'The portal is open! Learn 2–4 digit multiplication with the classic stacked method.'
      :'Defeat Professor Pandemonium to unlock guided 2–4 digit multiplication.';
    const preview=$('#advancedMasteryPreview');preview.innerHTML='';
    if(unlocked){
      for(const [skill,label] of [['fact','Facts'],['carry','Carry'],['shift','Place value'],['addition','Addition']]){
        const span=document.createElement('span');span.textContent=`${label} ${state.advancedMastery[skill]}%`;preview.appendChild(span);
      }
    }
  }

  function renderAdvancedInventory(container,battleMode=false){
    container.innerHTML='';
    for(let i=0;i<3;i+=1){
      const itemId=state.inventory[i];
      if(!itemId){
        const empty=document.createElement('div');empty.className='item-card empty';empty.innerHTML='<span class="item-emoji">➕</span><span><span class="item-name">Empty slot</span><span class="item-desc">Items still carry between both campaigns.</span></span>';container.appendChild(empty);continue;
      }
      const item=Core.ITEMS[itemId];
      const el=document.createElement(battleMode?'button':'div');if(battleMode)el.type='button';el.className=`item-card${battleMode?' usable':''}`;
      const desc=battleMode&&itemId!=='hint'?'Saved for Battle Adventure.':item.description;
      el.innerHTML=`<span class="item-emoji">${item.emoji}</span><span><span class="item-name">${item.name}</span><span class="item-desc">${desc}</span></span>`;
      if(battleMode){
        const usable=itemId==='hint'&&state.advancedActive&&!state.locked&&currentAdvancedInputMode()==='typed';
        el.disabled=!usable;
        if(usable)el.addEventListener('click',()=>useAdvancedHintOrb(i));
      }
      container.appendChild(el);
    }
    $('#advancedBagCount').textContent=state.inventory.length;
  }

  function advancedWorldStatus(w){
    const unlocked=w.id<=state.advancedUnlockedWorld;const complete=state.advancedCompleted.has(w.id);
    if(!unlocked)return 'Complete the previous Advanced world to unlock.';
    return complete?'Replay anytime':'2 guided problems → mastery boss';
  }

  function renderAdvancedWorlds(){
    const grid=$('#advancedWorldGrid');grid.innerHTML='';
    advancedWorlds.forEach(w=>{
      const unlocked=w.id<=state.advancedUnlockedWorld;const complete=state.advancedCompleted.has(w.id);
      const button=document.createElement('button');button.type='button';button.disabled=!unlocked;button.dataset.advancedWorld=String(w.id);
      button.className=`world-card advanced-world-card${!unlocked?' locked':''}${complete?' completed':''}`;
      button.innerHTML=`<div class="world-row"><div class="world-icon">${unlocked?w.icon:'🔒'}</div><div><div class="world-name">Advanced ${w.id} · ${w.name}${complete?'<span class="complete-badge">✓ Complete</span>':''}</div><div class="world-sub">${w.skill}</div><div class="path-preview"><span class="path-node">⚔️</span><span class="path-node">⚔️</span><span class="path-node">👑</span></div><div class="world-status">${advancedWorldStatus(w)}</div></div></div>`;
      if(unlocked)button.addEventListener('click',()=>enterAdvancedWorld(w.id));grid.appendChild(button);
    });
  }

  function advancedContinueWorldId(){
    for(let i=1;i<=state.advancedUnlockedWorld;i+=1)if(!state.advancedCompleted.has(i))return i;
    return Math.min(state.advancedUnlockedWorld,8);
  }

  function showAdvancedHome(){
    if(!advancedUnlocked()){toast('🔒 Finish Campaign 1 first!');return;}
    state.active=false;state.advancedActive=false;setAdvancedTheme(null);showScreen('advancedHome');
    renderMasteryInto($('#advancedMasteryGrid'));renderAdvancedWorlds();renderAdvancedInventory($('#advancedHomeInventory'),false);updateProfile();
  }

  function enterAdvancedWorld(id){
    if(!advancedUnlocked()||id>state.advancedUnlockedWorld)return;
    state.advancedCurrentWorldId=id;state.advancedProblemIndex=0;startAdvancedProblem();
  }

  function newAdvancedReveal(problem){ return Advanced.createRevealState(problem); }

  function startAdvancedProblem(){
    const w=advancedWorld();state.active=false;state.advancedActive=true;state.locked=false;state.advancedBoss=state.advancedProblemIndex>=2;
    state.advancedProblem=Advanced.generateProblem(w.id,{boss:state.advancedBoss});state.advancedStepIndex=0;state.advancedFallbackChoice=false;state.advancedForceChoice=false;
    state.advancedRevealed=newAdvancedReveal(state.advancedProblem);state.advancedAttempts=0;state.advancedCorrect=0;state.advancedBattleXp=0;state.advancedHits=0;
    setAdvancedTheme(w.id);showScreen('advancedBattle');renderAdvancedBattleShell();processAdvancedInformationalSteps();
  }

  function advancedEnemy(){return state.advancedBoss?advancedWorld().boss:advancedWorld().enemy;}
  function advancedTotalHits(){return state.advancedProblem.partialProducts.length+1;}

  function renderAdvancedStageDots(){
    const wrap=$('#advancedStageDots');wrap.innerHTML='';
    for(let i=0;i<3;i+=1){const d=document.createElement('span');d.className=`stage-dot${i<state.advancedProblemIndex?' done':''}${i===state.advancedProblemIndex?' current':''}`;d.textContent=i===2?'👑':i+1;wrap.appendChild(d);}
  }

  function renderAdvancedBattleShell(){
    const w=advancedWorld(),h=hero(),enemy=advancedEnemy();
    $('#advancedBattleWorld').textContent=`${w.icon} ${w.name}`;
    $('#advancedProblemLabel').textContent=state.advancedBoss?'👑 MASTERY BOSS':'Guided battle '+(state.advancedProblemIndex+1)+' of 3';
    $('#advancedHeroAvatar').textContent=h.emoji;$('#advancedHeroName').textContent=h.name;$('#advancedEnemyAvatar').textContent=enemy.emoji;$('#advancedEnemyName').textContent=enemy.name;
    $('#advancedProblemChip').textContent=`${state.advancedProblem.a.toLocaleString()} × ${state.advancedProblem.b.toLocaleString()}`;
    renderAdvancedStageDots();renderAdvancedWorkspace();renderAdvancedStep();renderAdvancedInventory($('#advancedBattleInventory'),true);updateAdvancedStats();
  }

  function currentAdvancedStep(){return state.advancedProblem?state.advancedProblem.steps[state.advancedStepIndex]||null:null;}

  function currentAdvancedInputMode(){
    const step=currentAdvancedStep();if(!step||!step.skill)return 'choice';
    if(state.advancedFallbackChoice||state.advancedForceChoice)return 'choice';
    return Advanced.chooseInputMode(state.advancedMastery[step.skill],state.advancedStepIndex);
  }

  function activeAdvancedColumns(step){
    if(!step)return {board:null,multiplicand:null,multiplier:null};
    if(step.phase==='addition'){
      const board=Number.isInteger(step.column)?step.column:(step.reveal&&Number.isInteger(step.reveal.targetColumn)?step.reveal.targetColumn:null);
      return {board,multiplicand:null,multiplier:null};
    }
    const row=Number.isInteger(step.rowIndex)?step.rowIndex:null;
    let multiplicand=null;
    if(step.reveal&&Number.isInteger(step.reveal.digitIndex))multiplicand=step.reveal.digitIndex;
    else if(step.reveal&&Number.isInteger(step.reveal.targetDigitIndex))multiplicand=step.reveal.targetDigitIndex;
    else if(Number.isInteger(step.column)&&row!==null)multiplicand=Math.max(0,step.column-row);
    const board=Number.isInteger(step.column)?step.column:null;
    return {board,multiplicand,multiplier:row};
  }

  function paperCellsFromNumber(value,cols,activeRightIndex){
    const chars=String(value).padStart(cols,' ').split('');
    return chars.map((ch,index)=>{const right=cols-1-index;const active=right===activeRightIndex?' active-cell':'';return `<span class="paper-cell${active}">${ch===' '?'':ch}</span>`;}).join('');
  }

  function paperCellsFromMap(map,cols,activeRightIndex){
    let html='';for(let left=0;left<cols;left+=1){const right=cols-1-left;const val=Object.prototype.hasOwnProperty.call(map,right)?map[right]:'';html+=`<span class="paper-cell${right===activeRightIndex?' active-cell':''}">${val}</span>`;}return html;
  }

  function renderAdvancedWorkspace(){
    const p=state.advancedProblem;if(!p)return;const step=currentAdvancedStep();const active=activeAdvancedColumns(step);
    const maxPartial=Math.max(...p.partialProducts.map(x=>String(x.shiftedValue).length));const cols=Math.max(2,String(p.total).length,String(p.a).length,String(p.b).length,maxPartial);
    const currentRow=step&&step.phase==='multiply'&&Number.isInteger(step.rowIndex)?step.rowIndex:Math.min(p.partialProducts.length-1,Math.max(0,(step&&step.rowIndex)||0));
    const carryMap=step&&step.phase==='multiply'?(state.advancedRevealed.multCarries[currentRow]||{}):{};
    let html=`<div class="paper-row carry-row"><span class="paper-sign">carry</span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromMap(carryMap,cols,active.multiplicand)}</div></div>`;
    html+=`<div class="paper-row"><span class="paper-sign"></span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromNumber(p.a,cols,active.multiplicand)}</div></div>`;
    html+=`<div class="paper-row multiplier-row"><span class="paper-sign">×</span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromNumber(p.b,cols,active.multiplier)}</div></div><div class="paper-rule"></div>`;
    p.partialProducts.forEach((partial,rowIndex)=>{const sign=p.partialProducts.length>1&&rowIndex===p.partialProducts.length-1?'+':'';html+=`<div class="paper-row partial-row"><span class="paper-sign">${sign}</span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromMap(state.advancedRevealed.partialRows[rowIndex],cols,active.board)}</div></div>`;});
    if(p.partialProducts.length>1){
      html+=`<div class="paper-rule second-rule"></div>`;
      html+=`<div class="paper-row carry-row"><span class="paper-sign">carry</span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromMap(state.advancedRevealed.additionCarries,cols,active.board)}</div></div>`;
      html+=`<div class="paper-row answer-row"><span class="paper-sign"></span><div class="paper-digits" style="--paper-cols:${cols}">${paperCellsFromMap(state.advancedRevealed.additionDigits,cols,active.board)}</div></div>`;
    }
    $('#stackedWorkspace').innerHTML=html;
  }

  function advancedChoices(step){
    const correct=Number(step.expected);const values=new Set([correct]);
    if(step.kind==='shift'){[0,1,2,3].forEach(v=>values.add(v));}
    else{
      const digitLike=['write','additionWrite','carry','additionCarry'].includes(step.kind)&&correct<=9;
      const offsets=digitLike?[-2,-1,1,2,3]:[-10,-5,-2,-1,1,2,5,10];
      shuffle(offsets).forEach(offset=>{if(values.size<4){const v=correct+offset;if(v>=0)values.add(v);}});
      while(values.size<4){const spread=Math.max(4,Math.ceil(Math.abs(correct)*.35));const v=Math.max(0,correct+Math.floor(Math.random()*(spread*2+1))-spread);values.add(v);}
    }
    return shuffle([...values].slice(0,4));
  }

  function advancedPhaseLabel(step){
    if(!step)return 'FINISHED';
    if(step.kind==='shift')return 'PLACE VALUE';
    if(step.phase==='addition')return 'ADD PARTIAL PRODUCTS';
    return 'MULTIPLY & CARRY';
  }

  function renderAdvancedStep(){
    const step=currentAdvancedStep();if(!step)return;
    $('#advancedPhaseBadge').textContent=advancedPhaseLabel(step);$('#advancedPrompt').textContent=step.prompt;$('#advancedHelper').textContent=step.helper||'';
    $('#advancedFeedback').textContent='';
    const mode=currentAdvancedInputMode();$('#advancedModeStat').textContent=mode==='typed'?'Typed':'Choices';
    const choiceArea=$('#advancedChoiceArea'),typedForm=$('#advancedTypedForm');choiceArea.classList.toggle('hidden',mode!=='choice');typedForm.classList.toggle('hidden',mode!=='typed');
    if(mode==='choice'){
      const grid=$('#advancedChoiceGrid');grid.innerHTML='';advancedChoices(step).forEach((value,index)=>{const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.advancedChoice=String(index);b.dataset.value=String(value);b.innerHTML=`<span class="choice-key">${index+1}</span>${value}`;b.addEventListener('click',()=>submitAdvancedAnswer(value));grid.appendChild(b);});
    }else{
      $('#advancedTypedInput').value='';setTimeout(()=>$('#advancedTypedInput').focus(),0);
    }
    state.locked=false;renderAdvancedInventory($('#advancedBattleInventory'),true);updateAdvancedStats();renderAdvancedWorkspace();
  }

  function updateAdvancedStats(){
    const total=state.advancedProblem?state.advancedProblem.steps.filter(s=>s.expected!==null).length:1;
    const answered=Math.min(total,state.advancedProblem?state.advancedProblem.steps.slice(0,state.advancedStepIndex).filter(s=>s.expected!==null).length:0);
    $('#advancedStepStat').textContent=`${Math.min(total,answered+1)} / ${total}`;$('#advancedAccuracyStat').textContent=`${advancedAccuracy()}%`;$('#advancedXpStat').textContent=state.advancedBattleXp;
    const pct=Math.max(0,100-(state.advancedHits/advancedTotalHits()*100));$('#advancedEnemyHpBar').style.width=`${pct}%`;
  }

  function applyAdvancedReveal(step){ state.advancedRevealed=Advanced.applyReveal(state.advancedRevealed,step); }

  async function processAdvancedInformationalSteps(){
    if(!state.advancedActive)return;
    let step=currentAdvancedStep();
    while(step&&step.expected===null){
      state.locked=true;
      if(step.kind==='rowComplete'){
        state.advancedHits+=1;state.advancedBattleXp+=20;$('#advancedAttackMessage').textContent=`💥 Partial product ${step.reveal.value.toLocaleString()} complete — attack!`;
        animateElement($('#advancedHeroAvatar'),'hero-hit');animateElement($('#advancedEnemyWrap'),'enemy-hit');state.advancedStepIndex+=1;renderAdvancedWorkspace();updateAdvancedStats();await sleep(650);
      }else if(step.kind==='problemComplete'){
        state.advancedHits=advancedTotalHits();state.advancedBattleXp+=40;$('#advancedAttackMessage').textContent=`🔥 FINISHER! ${state.advancedProblem.total.toLocaleString()}!`;
        animateElement($('#advancedHeroAvatar'),'power-fire',650);animateElement($('#advancedEnemyWrap'),'enemy-hit',650);state.advancedStepIndex+=1;updateAdvancedStats();await sleep(750);finishAdvancedProblem();return;
      }else state.advancedStepIndex+=1;
      step=currentAdvancedStep();
    }
    if(step){state.locked=false;renderAdvancedStep();}
  }

  async function submitAdvancedAnswer(value){
    if(!state.advancedActive||state.locked)return;const step=currentAdvancedStep();if(!step||step.expected===null)return;
    const answer=Number(value);if(!Number.isInteger(answer))return;
    state.locked=true;state.advancedAttempts+=1;const correct=answer===Number(step.expected);
    if(correct){
      state.advancedCorrect+=1;state.advancedBattleXp+=5;if(step.skill)state.advancedMastery[step.skill]=Advanced.updateMastery(state.advancedMastery[step.skill],true);
      applyAdvancedReveal(step);state.advancedStepIndex+=1;state.advancedFallbackChoice=false;state.advancedForceChoice=false;$('#advancedFeedback').textContent='✓ Correct — lock that step in!';$('#advancedFeedback').className='advanced-feedback good-feedback';saveProgress();renderAdvancedWorkspace();updateAdvancedStats();await sleep(350);processAdvancedInformationalSteps();
    }else{
      if(step.skill)state.advancedMastery[step.skill]=Advanced.updateMastery(state.advancedMastery[step.skill],false);
      const wasTyped=currentAdvancedInputMode()==='typed';state.advancedFallbackChoice=true;$('#advancedFeedback').textContent=`Not quite. ${step.helper||'Try that step again.'}${wasTyped?' I brought the choices back for this step.':''}`;$('#advancedFeedback').className='advanced-feedback bad-feedback';saveProgress();state.locked=false;renderAdvancedStep();$('#advancedFeedback').textContent=`Not quite. ${step.helper||'Try that step again.'}${wasTyped?' I brought the choices back for this step.':''}`;$('#advancedFeedback').className='advanced-feedback bad-feedback';updateAdvancedStats();
    }
  }

  function useAdvancedHintOrb(index){
    const itemId=state.inventory[index];if(itemId!=='hint'||currentAdvancedInputMode()!=='typed')return;
    state.inventory.splice(index,1);state.advancedForceChoice=true;state.advancedFallbackChoice=true;saveProgress();toast('🔮 Hint Orb turned this step into multiple choice!');renderAdvancedStep();renderAdvancedInventory($('#advancedBattleInventory'),true);renderHomeInventory();
  }

  function finishAdvancedProblem(){
    if(!state.advancedActive)return;state.advancedActive=false;const w=advancedWorld();const boss=state.advancedBoss;const reward=state.advancedBattleXp+(boss?90+w.id*10:40+w.id*5);state.xp+=reward;
    if(boss){state.advancedCompleted.add(w.id);if(w.id<8)state.advancedUnlockedWorld=Math.max(state.advancedUnlockedWorld,w.id+1);}
    saveProgress();updateProfile();showScreen('advancedResult');
    $('#advancedResultEmoji').textContent=boss?'👑':'🧮';$('#advancedResultTitle').textContent=boss?(w.id===8?'ALGORITHM MASTER!':'Advanced World Complete!'):'Problem conquered!';
    $('#advancedResultText').textContent=boss?(w.id===8?'You conquered classic multiplication all the way through 4-digit × 4-digit problems!':`${w.boss.name} is defeated. ${advancedWorlds[w.id].name} is unlocked.`):'You built the partial product step-by-step and finished the problem.';
    $('#advancedResultAnswer').textContent=state.advancedProblem.total.toLocaleString();$('#advancedResultAccuracy').textContent=`${advancedAccuracy()}%`;$('#advancedResultXp').textContent=`+${reward}`;
    if(boss){$('#advancedNextBtn').textContent=w.id===8?'Replay Colossal Calculations':`Enter ${advancedWorlds[w.id].name} →`;}else $('#advancedNextBtn').textContent=state.advancedProblemIndex===1?'Mastery boss →':'Next guided battle →';
  }

  function resetProgress(){
    const confirmed=window.confirm('Reset hero, XP, both campaigns, mastery progress, completed worlds, and carried items?'); if(!confirmed) return;
    localStorage.removeItem('multiplicationQuestProgress'); state=defaultState(); renderAllHome(); toast('Progress reset. Fresh adventure!');
  }

  function renderAllHome(){ setTheme(null); showScreen('home'); renderHeroes(); renderWorlds(); renderHomeInventory(); renderAdvancedEntry(); updateProfile(); }

  $('#advancedQuestBtn').addEventListener('click',showAdvancedHome);
  $('#advancedHomeBackBtn').addEventListener('click',renderAllHome);
  $('#advancedContinueBtn').addEventListener('click',()=>enterAdvancedWorld(advancedContinueWorldId()));
  $('#advancedBattleBackBtn').addEventListener('click',showAdvancedHome);
  $('#advancedMapBtn').addEventListener('click',showAdvancedHome);
  $('#advancedNextBtn').addEventListener('click',()=>{
    const w=advancedWorld();
    if(state.advancedBoss){
      if(w.id===8){state.advancedProblemIndex=0;startAdvancedProblem();}
      else{state.advancedCurrentWorldId=w.id+1;state.advancedProblemIndex=0;startAdvancedProblem();}
    }else{state.advancedProblemIndex+=1;startAdvancedProblem();}
  });
  $('#advancedTypedForm').addEventListener('submit',event=>{event.preventDefault();const raw=$('#advancedTypedInput').value.trim();if(!raw){$('#advancedFeedback').textContent='Type an answer for this step.';return;}submitAdvancedAnswer(Number(raw));});

  $('#continueBtn').addEventListener('click',()=>enterWorld(continueWorldId()));
  $('#battleBackBtn').addEventListener('click',()=>{state.active=false;renderAllHome();});
  $('#mapBtn').addEventListener('click',renderAllHome);
  $('#retryBtn').addEventListener('click',()=>startEncounter());
  $('#resetProgressBtn').addEventListener('click',resetProgress);
  $('#abilityBtn').addEventListener('click',activateAbility);
  $('#bossDiceBtn').addEventListener('click',()=>$('#bossDicePanel').classList.toggle('hidden'));
  $('#closeBossDiceBtn').addEventListener('click',()=>$('#bossDicePanel').classList.add('hidden'));

  $('#primaryResultBtn').addEventListener('click',()=>{
    if(state.pendingReward) return;
    const w=world(); if(state.resultKind!=='win') return;
    if(state.encounter.boss){
      if(w.id===6){state.battleIndex=0;startEncounter();}
      else{state.currentWorldId=w.id+1;state.battleIndex=0;setTheme(state.currentWorldId);startEncounter();}
    }else startEncounter();
  });

  document.addEventListener('keydown',event=>{
    if(state.advancedActive&&!state.locked&&currentAdvancedInputMode()==='choice'){
      const index=Number(event.key)-1;const button=$(`[data-advanced-choice="${index}"]`);
      if(index>=0&&index<4&&button&&!button.disabled){event.preventDefault();submitAdvancedAnswer(Number(button.dataset.value));return;}
    }
    if(!state.active||state.locked) return;
    const index=Number(event.key)-1;
    if(index>=0&&index<4){event.preventDefault();chooseAnswer(index);}
  });

  loadProgress(); renderAllHome();
})();
