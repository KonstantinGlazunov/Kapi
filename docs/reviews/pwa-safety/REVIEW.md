# PWA safety and backup review — 2026-10-17

Implementation is in review branches, not the published application. Base: Kapi main `207b0a3`; web_designer main `b58df87`.

## Mobile visual review

Real Chromium screenshots inspected at 320×568 and 390×844; existing mobile E2E additionally covers 360×640 and 430×932. Reduced motion is used for deterministic layout inspection; no animation artwork or motion was changed. Existing animation/sound unit and mobile interaction tests remain in the validation set.

| Dimension | Score | Evidence |
| --- | --- | --- |
| Fit to requested changes | 9/10 | Backup actions and local-storage explanation sit in existing parent settings; storage failures stay visible during training. |
| Visual quality | 9/10 | Existing cream/teal palette and typography retained. Result actions fit at 320×568; German settings heading remains a complete word; warning does not cover answers. |
| Contemporary design quality | 9/10 | Native accessible file selection behind a localized label, visible keyboard focus, clear confirmation/status text and touch controls at least 44 px. Settings scroll normally instead of shrinking body copy. |

Inspected final captures:

- [Compact result](result-320.png)
- [German backups at 320 px](backup-de-320.png)
- [Russian backups at 390 px](backup-ru-390.png)
- [Parent privacy explanation](parents-ru-390.png)
- [Storage warning with usable training controls](storage-warning-320.png)

## Validation evidence

- Kapi unit suite: **142 passed, 0 failed, 0 skipped** (including 10 storage/backup, 2 update-protocol and 2 bounded-choice tests).
- Mobile E2E passed all four documented sizes, including task controls, hints, weekly reveal and curriculum/review flows.
- Chromium PWA suite passed root and `/kapi/` (static server and actual Next handler), explicit activation, old-client block, preservation of another tab's in-progress exercise, offline cold restart and updated cache, progress, manifest and main-site cache isolation.
- Backup UI checks passed export/download, import cancellation, confirmed restore, corrupt-file rejection, persistence and quota failure warning. Unit checks include actual queued problems from all 41 stages (including fraction operands), migration and atomic-write failure.
- Proxy contract checks passed with both the current working source and real v69 source, not only the legacy fixture. Mounted offline browser tests passed with current changes and the published main source.
- WebKit online suite passed root and `/kapi/`: worker updates, multi-tab preservation, backups and quota warning.
- WebKit offline simulation failed with an internal error on both Kapi and a [minimal unrelated worker baseline](../../../tests/helpers/webkit-offline-baseline.cjs). It is explicitly UNRUN in the separate WebKit online mode, never labelled passed. Real iOS installation/offline behavior remains a device check.
- Live HTTP requests succeeded for primary, Pages and old addresses. Primary manifest and isolated v69 cache namespace confirmed. Chromium live browser inspection remained blocked by proxy CA trust; TLS verification was preserved.

No DNS, merge, production deployment, analytics, accounts or server learning-data storage changes.


## Independent review regression

Kapi `cb9c630` fixes the missing-answer import defect confirmed on `b336318` (VM timeout at 200 ms). Unit tests reject malformed maths/operations and all presentation-specific corruptions before any write. Valid tasks from all 41 stages, all presentation types and place-value variants roundtrip and execute. A browser test checks rejection before confirmation, byte-for-byte unchanged storage and a still-usable training screen. The pre-existing zero-fraction choice loop is also fixed. No visual design was changed for this regression.

Both PRs remain open; the latest instruction forbids merge/publication. Vercel Preview is blocked by unrecognized commit-author identity, separate from test results; no identity/deployment workaround was attempted.


GitHub Actions verification of the review fix:

- [Kapi cb9c630: 39061579780](https://github.com/KonstantinGlazunov/Kapi/actions/runs/39061579780) — Unit, mobile and PWA passed; deploy skipped.
- [web_designer fae8f22: 39061581352](https://github.com/KonstantinGlazunov/web_designer/actions/runs/39061581352) — both the full CI and real-publication compatibility jobs passed.

These are verified runs, not evidence of publication. PRs remain open; the Vercel identity check is a separate failing deployment status.
