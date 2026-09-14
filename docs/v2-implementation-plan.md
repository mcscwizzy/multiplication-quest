# Multiplication Quest v2 Implementation Plan

**Goal:** Add themed worlds, multi-enemy combat, d6 enemy turns, boss summons, persistent consumables, charged hero abilities, and untimed Power Questions while preserving the Docker deployment and v1 progression.

**Architecture:** Put deterministic battle rules and data in `game-core.js`, expose it to both Node tests and the browser, and keep DOM rendering/event orchestration in `app.js`. The existing static nginx/Docker structure remains intact.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node built-in test runner, nginx, Docker Compose.

**Spec:** `docs/v2-design.md`

## Tasks

1. Create failing unit tests for question pools, d6 action resolution, summon cap, ability charge, Power Question failure, item effects, and inventory persistence shape.
2. Implement `game-core.js` until all battle-rule tests pass.
3. Replace battle markup to support enemy cards, target selection, ability meter, item slots, dice panel, and chest/result messaging.
4. Rewrite browser orchestration in `app.js` around the tested core while preserving hero/world/XP persistence and replay behavior.
5. Add per-world CSS themes and responsive multi-enemy layouts.
6. Update Dockerfile/README for `game-core.js` and v2 features.
7. Verify Node tests, syntax checks, file references, nginx static paths, compose config syntax where tooling allows, and ZIP contents.
