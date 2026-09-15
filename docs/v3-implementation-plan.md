# Multiplication Quest v3 Advanced Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an unlockable Advanced Quest campaign that teaches 2–4 digit classic stacked multiplication through adaptive guided steps.

**Architecture:** Preserve the existing v2 battle app and add a pure `advanced-core.js` module responsible for problem generation, long-multiplication step construction, adaptive scaffolding, and mastery updates. `app.js` owns progression/persistence and coordinates a separate Advanced Quest UI in `index.html`; `styles.css` renders the stable stacked-paper workspace and Advanced world themes.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Node built-in test runner, Nginx, Docker Compose.

**Spec:** `docs/v3-advanced-quest-design.md`

## Global Constraints

- No frontend framework or build step.
- Campaign 1 behavior remains available and replayable.
- Advanced Quest unlocks only after Campaign 1 World 6 completion.
- Same hero, XP, level, inventory, and browser save continue into Advanced Quest.
- No timer on Advanced Quest steps in v3.
- Support products through 9999 × 9999.

---

### Task 1: Long-multiplication engine

**Files:**
- Create: `advanced-core.js`
- Create: `tests/advanced-core.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `MQAdvanced.createProblem(a, b)`, `MQAdvanced.buildSteps(problem)`, `MQAdvanced.chooseInputMode(skillScore, stepIndex)`, `MQAdvanced.updateMastery(score, correct)`.

- [ ] Write failing tests proving partial products, multiplication carries, place-value shifts, final addition carries, and adaptive modes.
- [ ] Run the tests and verify RED.
- [ ] Implement the minimal pure engine.
- [ ] Run all tests and verify GREEN.

### Task 2: Advanced campaign progression and persistence

**Files:**
- Modify: `app.js`
- Test: `tests/advanced-core.test.js`

**Interfaces:**
- Persist: `advancedUnlockedWorld`, `advancedCompleted`, `advancedMastery`.
- Consume: Campaign 1 `state.completed` to gate Advanced Quest.

- [ ] Add tests for world operand constraints and mastery clamping.
- [ ] Verify RED.
- [ ] Add Advanced world metadata and saved-state defaults/load/save.
- [ ] Verify all tests.

### Task 3: Advanced Quest screens and stacked workspace

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`

**Interfaces:**
- Add `advancedHomeScreen` and `advancedBattleScreen`.
- Render one stable column-aligned multiplication workspace from `MQAdvanced.createProblem`.

- [ ] Add Advanced Quest entry card and locked/unlocked states.
- [ ] Add Advanced world selection screen.
- [ ] Add responsive stacked multiplication board with carries, partial rows, final addition, active-column highlight, typed field, and four-choice field.
- [ ] Wire screen transitions without altering Campaign 1 flow.

### Task 4: Adaptive step runner and game feedback

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Consume ordered `problem.steps`.
- Update the workspace after each correct answer.
- On row-complete step, trigger attack feedback; on problem-complete step, trigger finisher and reward XP.

- [ ] Implement choice and typed answer entry.
- [ ] Implement wrong typed-answer fallback to multiple choice for the same step.
- [ ] Persist per-skill mastery changes.
- [ ] Implement row attack, final finisher, boss/mastery problem, XP, and Advanced world unlocking.

### Task 5: Packaging and verification

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `Dockerfile` only if static file copy needs expansion.

- [ ] Update development scripts to check `advanced-core.js`.
- [ ] Update README with v3 Advanced Quest behavior.
- [ ] Run `npm test`.
- [ ] Run `npm run check`.
- [ ] Verify every script referenced by `index.html` exists.
- [ ] Serve locally and smoke-test all static assets return HTTP 200.
- [ ] Validate Docker Compose syntax if a Compose parser is available; if Docker CLI is unavailable, report that limitation.
- [ ] Build the final ZIP and run archive integrity verification.
