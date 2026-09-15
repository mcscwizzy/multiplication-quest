# Multiplication Quest v3 — Advanced Quest Design

## Goal

Add a second campaign that teaches the classic stacked multiplication algorithm for 2–4 digit multiplication while preserving the existing battle adventure, hero, XP, carried items, and browser save.

## Unlock and continuity

- Advanced Quest unlocks after Campaign 1 / World 6 is completed.
- The player keeps the same hero, XP, level, and 3-slot carried item bag.
- Advanced Quest progression and adaptive mastery are saved in the same browser progress record.
- Campaign 1 remains replayable and unchanged.

## Advanced Quest progression

1. Double-Digit Dunes — 2-digit × 1-digit
2. Triple Tower — 3-digit × 1-digit
3. Giant Number Grove — 4-digit × 1-digit
4. Partial Product Port — 2-digit × 2-digit
5. Carrying Canyon — 3-digit × 2-digit
6. Place Value Peaks — 4-digit × 2-digit
7. Algorithm Abyss — 3–4 digit × 3-digit
8. Colossal Calculations — up to 4-digit × 4-digit

Each world has two regular guided problems followed by one mastery/boss problem. Completing the mastery problem unlocks the next Advanced world. Completed Advanced worlds are replayable.

## Guided classic algorithm

The stacked-paper layout remains visible for the entire problem. The current column or row is highlighted rather than replacing the workspace.

For every multiplier digit, from right to left:

1. Multiply the active multiplicand digit by the active multiplier digit.
2. If a carry exists, add it to the multiplication result.
3. Enter the digit written in the current partial-product column.
4. Enter the new carry when one exists.
5. Continue right-to-left until the row is complete.
6. On later multiplier rows, explicitly teach the place-value shift / placeholder zero before multiplication begins.
7. Completing a partial-product row triggers an attack.

After all partial products are complete:

1. Add the partial products column-by-column from right to left.
2. Enter each result digit.
3. Enter addition carries/regrouping when required.
4. Completing the final addition triggers the finishing attack and completes the problem.

Kid-facing copy uses “carry” while helper text also mentions “regroup” where useful.

## Adaptive hybrid input

Mastery is tracked independently for:

- `fact` — multiplication facts used inside the algorithm
- `carry` — multiplication carries/regrouping
- `shift` — place-value shifts / placeholder zeros
- `addition` — final column addition and addition carries

Input mode by skill mastery:

- Below 35: multiple choice
- 35–69: hybrid; alternate between multiple choice and typed input
- 70+: typed input

A wrong typed response immediately increases scaffolding for that same step by converting it to multiple choice. A wrong answer does not reset the whole problem.

Correct answers increase the relevant skill mastery; wrong answers decrease it slightly. Mastery is clamped to 0–100 and persisted.

## Battle presentation

Advanced Quest remains a game, not a worksheet:

- The hero and a themed “giant number” enemy remain visible.
- A completed partial-product row triggers a normal hero attack.
- Completing the final addition triggers a larger finishing move.
- Boss/mastery problems use a visually stronger enemy.
- XP is awarded for completing problems, with a boss bonus.
- The current player bag remains visible as continuity. Hint Orb may be consumed to convert the current typed step into multiple choice; other battle items remain saved for Campaign 1.

Mistakes are instructional. The active step stays highlighted and the game gives a focused hint instead of resetting the problem.

## Generation constraints

- Operands contain no leading zeroes.
- World digit ranges are enforced exactly.
- Generated problems should require at least one carry often enough to teach regrouping; regular problem generation may retry to prefer a carry-producing example.
- The arithmetic engine must support all products up to 9999 × 9999 safely within JavaScript integer precision.

## v3 scope

Implement:

- Advanced Quest home/selection screen
- Unlock after Campaign 1 completion
- Eight progressive Advanced worlds
- Stacked multiplication renderer
- Carry display above columns
- Partial-product rows and placeholder shifts
- Guided final addition
- Adaptive multiple-choice / typed steps
- Separate mastery categories persisted in localStorage
- Row attack and final finisher feedback
- Advanced XP and progression
- Responsive layout suitable for tablet/desktop and narrow mobile
- Pure tested long-multiplication engine

Do not add in v3:

- Fractions or decimals
- Division
- Negative multiplication
- New currencies, shops, or crafting
- Timed Advanced steps
- Handwriting recognition
- Backend/accounts

## Success criteria

A player who has completed Campaign 1 can enter Advanced Quest, solve a generated problem such as `247 × 36` using the classic stacked process one step at a time, see carries and partial products appear in the correct columns, complete the final addition column-by-column, earn XP, progress through increasingly large operand sizes, and resume that progression after a refresh.
