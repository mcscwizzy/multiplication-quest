# Multiplication Quest v2 Design

## Scope

v2 extends the existing vanilla-JavaScript multiplication battle game without changing its deployment model.

### World identity
Each world supplies a theme that changes page background, cards, battle arena, answer accents, dice panel, and decorative atmosphere.

### Multi-enemy battles
- Encounters may contain 1–3 living enemies.
- Normal attacks require manual target selection.
- A defeated target is cleared; the player must select another living target.
- Boss summons never exceed 3 enemies total.

### Enemy turn
A wrong normal multiplication answer triggers exactly one enemy-side d6 roll.
- Normal encounters use a shared d6 table.
- Bosses use world-specific d6 tables.
- A roll can miss, attack, heavy attack, summon, apply an effect, or cause a reduced-damage group attack.
- Missing a Power Question does not trigger an enemy roll.

### Items
Persistent inventory with 3 slots. Items carry between battles and are saved locally.
- Apple: heal 25 HP.
- Shield Potion: grant a shield.
- Math Bomb: damage all living enemies.
- Freeze Pop: skip the next enemy turn.
- Hint Orb: remove two wrong answers from the next normal question.

Victories can randomly drop items. Treasure chests between some encounters grant a guaranteed item. If inventory is full, the new item is discarded in v2 with a clear message rather than silently replacing an existing item.

### Hero abilities
Abilities charge from correct normal answers. Five correct answers fills the meter. Charge persists only within the current battle.

Activating an ability starts an untimed Power Question using multiplication tables learned up through the current world. A correct answer fires the ability and resets charge. A wrong answer reduces charge to 50% and does not trigger an enemy roll.

Hero abilities:
- Baby Dragon: Fire Burst — heavy single-target damage.
- Clever Fox: Rapid Strike — two medium hits on the selected target.
- Little Robot: Target Lock — heavy hit plus Hint Orb effect on the next normal question.
- Tiny Monster: Mega Stomp — area damage to all living enemies.

### Bosses
Each world boss has a themed d6 table and can summon a themed minion on its summon result, subject to the 3-enemy cap.

### Persistence
LocalStorage stores hero, XP, unlocked/completed worlds, and inventory.

### Deployment
Static HTML/CSS/JavaScript behind nginx. `docker compose up --build` remains the startup command.
