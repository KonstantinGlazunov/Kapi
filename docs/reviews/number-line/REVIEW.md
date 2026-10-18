# Number line with Kapi — 2026-10-18

Implemented the user-approved sketch: localized “Куда попадёт Капи?” / “Wo landet Kapi?”, Kapi centered on the starting tick, a gold directional arrow labeled only with the number of steps, and a question mark instead of the destination numeral. Every integer tick is labeled. Ranges above 10 use alternating label rows to keep two-digit numbers separate. Existing answer entry and task/backup contracts remain unchanged. The existing precached capybara asset is reused; no external requests or new assets are required.

Inspected real Chromium screenshots:
- [4 − 2, 320×568](4--2-320.png)
- [5 + 4, 390×844](5-4-390.png)
- [19 − 8, 320×568](19--8-320.png)
- [0 + 5, 320×568](0-5-320.png)
- [10 − 10, 390×844](10--10-390.png)

Fit: 9/10 — approved question and arrow, exact start placement, no left/right wording. Visual quality: 9/10 — separate thin ticks, visible destination, no clipped content or controls, labels remain distinct at 20. Contemporary design: 9/10 — existing mascot, palette and rounded layout preserved. The 0–20 diagram is denser than 0–10, especially at 320px; real-device readability has not been checked. Screenshots select a Russian problem through test-only injection while the surrounding UI remains German.

Verification: 144 unit tests passed, including numeric tick count, start placement, arrow endpoint/direction and hidden destination regression. Full mobile Chromium E2E passed at 320×568, 360×640, 390×844 and 430×932. After the final label-row adjustment, the five browser cases above passed visual/viewport assertions and accepted the correct answer through the real keypad and submit button. Initial new failures (compact clipping and an obsolete CSS-string assertion) were fixed. No CI run, merge or publication for these local changes.
