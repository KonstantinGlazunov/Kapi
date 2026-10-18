# Home greeting starts training — 2026-10-18

The speech bubble is a native button using the same startTraining handler as the primary start button. Its accessible name follows the localized start action. Keyboard focus has a visible outline.

Verified in real Chromium: click at 320×568, Enter and Space at 390×844 each open the game screen. The screenshot fixture changes only the greeting text to «Поехали!»; the rest of the UI stays German.

Inspected [focused button at 320×568](320-focused.png): fit 9/10 (requested action works by pointer and keyboard), visual quality 9/10 (bubble stays aligned, text and focus ring are clear, controls fit), contemporary design 9/10 (existing visual style retained with standard accessible button behavior). Real devices and CI were not run for this change.
