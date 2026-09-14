# Multiplication Quest v2

A kid-friendly multiplication battle adventure built with vanilla HTML, CSS, and JavaScript.

## Run with Docker Compose

From this directory:

```bash
docker compose up --build
```

Then open:

- http://localhost:8080

Stop the app with:

```bash
docker compose down
```

## v2 game features

- Four heroes with unique charged Power Moves
- Untimed special Power Questions to activate abilities
- Six multiplication worlds with distinct color schemes and battle atmosphere
- Progressive multiplication tables through ×1–×12
- Random 1–3 enemy encounters in later worlds
- Manual enemy targeting
- Visible d6 enemy-side roll after missed normal questions
- Unique d6 tables for every boss
- Boss minion summons with a hard 3-enemy cap
- Health, shields, streak attacks, XP, and levels
- Persistent 3-slot item bag
- Apples, Shield Potions, Math Bombs, Freeze Pops, and Hint Orbs
- Random post-battle item drops and guaranteed treasure chests
- Full-bag replacement choice instead of silent item deletion
- Replayable completed worlds
- Browser-saved progress using `localStorage`
- Keyboard answer shortcuts 1–4

## Power Moves

- 🐉 **Baby Dragon — Fire Burst:** 65 damage to one target
- 🦊 **Clever Fox — Rapid Strike:** two 30-damage hits to one target
- 🤖 **Little Robot — Target Lock:** 48 damage plus a Hint Orb effect
- 🐲 **Tiny Monster — Mega Stomp:** 30 damage to all living enemies

Five correct normal answers fully charge a Power Move. Activating it starts an untimed Power Question using multiplication tables learned through the current world. A correct answer fires the move; a wrong answer drops ability charge to 50% and does **not** trigger an enemy roll.

## Items

Items carry between battles and are saved in the browser. The bag holds 3 items.

- 🍎 Apple — heal 25 HP
- 🛡️ Shield Potion — grant a shield
- 💣 Math Bomb — 20 damage to all enemies
- ❄️ Freeze Pop — skip the next enemy-side roll
- 🔮 Hint Orb — remove two wrong answers from the next normal question

## Development checks

Node.js is only needed for development checks; it is not required to run the Docker container.

```bash
npm test
npm run check
```

## Files

- `index.html` — application markup
- `styles.css` — responsive styling, animations, and world themes
- `game-core.js` — tested battle rules and data shared by browser and tests
- `app.js` — UI rendering, progression, battle orchestration, and persistence
- `tests/game-core.test.js` — Node built-in tests for v2 battle rules
- `Dockerfile` — Nginx image for the static app
- `docker-compose.yml` — one-command local deployment
- `nginx.conf` — Nginx static-site configuration
- `docs/v2-design.md` — frozen v2 design
- `docs/v2-implementation-plan.md` — v2 implementation plan

## Port

The compose file maps container port 80 to host port 8080. To use another host port, change:

```yaml
ports:
  - "8080:80"
```
