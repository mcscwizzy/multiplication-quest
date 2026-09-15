# Multiplication Quest v3

A kid-friendly multiplication battle adventure built with vanilla HTML, CSS, and JavaScript. v3 adds **Advanced Quest**, an unlockable second campaign that teaches the classic stacked multiplication algorithm for 2–4 digit problems.

## Run with Docker Compose

```bash
docker compose up --build
```

Then open:

- http://localhost:8080

Stop with:

```bash
docker compose down
```

## Campaign 1 — Battle Adventure

- Progressive ×1–×12 worlds
- Four heroes with charged Power Moves
- Multiple-choice battles
- Randomized 1–3 enemy encounters
- Manual targeting
- Enemy-side d6 rolls and unique boss tables
- Boss summons
- Health, shields, streaks, XP, items, drops, and treasure chests
- Replayable completed worlds

## Campaign 2 — Advanced Quest

Advanced Quest unlocks after defeating Professor Pandemonium in Campaign 1. The same hero, XP, level, and carried items continue into Campaign 2.

Progression:

1. **Double-Digit Dunes** — 2-digit × 1-digit
2. **Triple Tower** — 3-digit × 1-digit
3. **Giant Number Grove** — 4-digit × 1-digit
4. **Partial Product Port** — 2-digit × 2-digit
5. **Carrying Canyon** — 3-digit × 2-digit
6. **Place Value Peaks** — 4-digit × 2-digit
7. **Algorithm Abyss** — 3–4 digit × 3-digit
8. **Colossal Calculations** — up to 4-digit × 4-digit

Each Advanced world contains two guided problems and one mastery boss.

### Guided classic algorithm

The stacked multiplication layout stays visible for the whole problem. The game guides the player through:

- multiplication facts inside each column
- carrying / regrouping
- writing each partial-product digit
- placeholder-zero / place-value shifts
- each partial-product row
- final addition column by column
- addition carries / regrouping

Completing a partial-product row triggers an attack. Completing the final addition fires the finishing move.

### Adaptive scaffolding

Advanced Quest separately tracks mastery for:

- multiplication facts
- carry / regrouping
- place value
- final addition

Low mastery uses multiple choice. Medium mastery alternates choices and typed answers. High mastery uses typed answers. A missed typed step automatically brings multiple choice back for that same step instead of resetting the problem.

There are **no timers** in Advanced Quest v3.

## Saved progress

Progress is stored in the browser using `localStorage`, including:

- selected hero
- XP / level
- Campaign 1 progress
- carried items
- Advanced Quest unlocked/completed worlds
- Advanced mastery scores

## Development checks

Node.js is only required for development checks, not for the Nginx runtime.

```bash
npm test
npm run check
```

## Files

- `index.html` — application screens and markup
- `styles.css` — responsive battle, world, and stacked-algorithm styling
- `game-core.js` — tested Campaign 1 battle rules
- `advanced-core.js` — tested long-multiplication / adaptive-scaffolding engine
- `app.js` — UI, progression, orchestration, and persistence
- `tests/game-core.test.js` — Campaign 1 core tests
- `tests/advanced-core.test.js` — Advanced Quest arithmetic tests
- `Dockerfile` — Nginx image
- `docker-compose.yml` — one-command deployment
- `nginx.conf` — static-site Nginx config
- `docs/v2-design.md` — frozen v2 design
- `docs/v3-advanced-quest-design.md` — frozen v3 design
- `docs/v3-implementation-plan.md` — v3 implementation plan
