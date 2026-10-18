# Detailed hints and worked solutions — 2026-10-18

The user approved a shared error flow for every exercise family: detailed help immediately after the first error; correct answer and demonstration after the second. The demonstration remains until Next, and can be replayed. Existing XP, retry, mastery and error-queue accounting stay intact.

The [36-pair interactive sketch gallery](index.html), [scenario descriptions](scenarios.json), and board-1.png through board-9.png cover presentations and mathematical families across all 41 stages. The gallery uses the real existing Kapi asset. The earlier generated cat and inaccurate object counts were discarded; no generated cat art was added to dist. `generate.py` rebuilds this separate HTML sketch gallery; it does not edit the app.

## Real application evidence

- [First error: 13 − 5, 320px](actual/320-frame-subtract-hint.png)
- [First error: 13 − 5, 390px](actual/390-frame-subtract-hint.png)
- [Intermediate subtraction step](actual/320-frame-subtract-steps.png)
- [Completed subtraction demonstration](actual/320-frame-subtract-final.png)
- [Number-line solution](actual/320-line-steps.png)
- [Fraction conversion](actual/320-fraction-3-solution.png)
- [Signed counters](actual/390-negative-1-solution.png)
- [Cube-root layers](actual/320-root-cube-solution.png)

The subtrahend is explicit throughout: original 13 − 5; decomposition 5 = 3 + 2; first remove 3 to reach 10, then 2 to reach 8. Two ten-frames show cumulative removals. The decomposition remains visible while the demonstration progresses. Step labels use words (“Шаг … из …”), avoiding confusion with fractions.

Inspected actual mobile screenshots at 320×568 and 390×844, including first hint, intermediate and final demonstration. Fit 9/10: requested error timing, full subtrahend and manual continuation. Visual quality 9/10: consistent Kapi asset, readable hints, complete answer controls within both viewport and card. Contemporary design 9/10: existing mint/teal system, native buttons, focus, reduced-motion support. Larger solutions use symbolic diagrams rather than drawing thousands of objects. Real phones and post-deploy browser rendering remain untested.

## Verification

150 unit tests passed. The new tests exercise all presentation variants of all 41 stages in ru/de; exact fractions/decimals, cross-ten removals, repeated-addition multiplication, each number-line hop, no auto-advance, and no duplicate accounting. Existing XP/retry/storage tests pass.

New Chromium `test:guidance`: 36 families at 320×568 and 390×844, actual keypad/choice submissions, immediate detailed hint, second-error answer, replay, Next and no timed skip. Geometry checks cover the enclosing card as well as viewport. This check is mandatory in CI. Full general mobile and PWA checks are recorded in PROJECT_STATE.md.

New layout failures were found and fixed before release: clipped inputs with long hints/special keys, and a home-layout regression caused by applying game-card bounds to the home-screen calculation. The latter is restricted back to the game. Old “minimal first hint” assertions were updated to the new requirement. No failures were dismissed as pre-existing.

## Separate castle request

The exact Braunfels view selected via Google Images is not available as a direct photo URL. Google/Wikipedia/official-site requests returned network 403; GitHub source search found town/restaurant photos but not the selected castle reference. A generated candidate is retained outside dist and is not claimed to match. A direct reference URL was requested. The home background is unchanged pending that reference.
