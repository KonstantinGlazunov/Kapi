# One-second stage intro — 2026-10-18

Approved sketch implemented with live localized text and existing offline Kapi/Braunfels assets. The home stage card is removed, leaving more room for Kapi and the castle. Start → stage/topic screen for 1000 ms → first question. The progress line animates normally and stays still with reduced motion. No extra tap is required.

Actual Chromium evidence inspected:

- [Home without the stage plaque, ru 390×844](390x844-ru-12-home.png).
- [Intro at 120 ms](390x844-ru-12-intro-120.png) and [800 ms](390x844-ru-12-intro-800.png): the progress line advances; title and Kapi remain stable.
- [Small phone 320×568](320x568-ru-12-intro-800.png).
- Long topics: [German 320×568](320x568-de-35-intro-800.png), [Russian 390×844](390x844-ru-35-intro-800.png), [landscape 844×390](844x390-de-35-intro-800.png).
- [First question after the intro](390x844-ru-12-game.png).

Scores after enlarging the title to match the approved hierarchy: fit **9/10** (gold badge, stage, large topic, Kapi, automatic one-second transition), visual quality **9/10** (consistent existing character, soft landscape, no clipped text or character), contemporary design **9/10** (responsive type and landscape layout, restrained motion, live accessible heading). Long topic titles use more lines and reduce the mascot area without clipping it. No new art is embedded or fetched remotely.

Local checks: 154 unit tests pass, including exact 999/1000 ms boundary, answer-time exclusion, cancellation, repeat-tap protection and agreement for all 41 stages. Real UI test passes five ru/de viewport/topic cases with a controlled browser clock, checks actual start-button behavior and visible first question, and captures these screenshots. General mobile E2E passes all four standard sizes after updating its previous immediate-start assumption, including the targeted-training entry. Required CI includes the new browser intro test. CI result and branch/commit details are recorded in PROJECT_STATE.md. Real phones and WebKit offline remain untested.

## Duration correction in PR №7

The published one-second screen was too brief to read; the unreleased 800 ms change made that worse. The corrected transition is 3000 ms, with the first question and answer timer starting afterward. Inspected actual Chromium frames at 1500 ms: [320×568 German long topic](320x568-de-35-intro-1500-v75.png), [390×844 Russian](390x844-ru-12-intro-1500-v75.png), [844×390 German landscape](844x390-de-35-intro-1500-v75.png). The copy and Kapi stay visible without clipping. The original fit/visual/contemporary scores remain 9/9/9; the longer duration fixes the reading time but a real child-device trial has not been performed. Five browser cases pass the exact 2999/3000 ms transition; 155 unit tests pass. Historical screenshots above show the earlier one-second version.
