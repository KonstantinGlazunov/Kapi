# Kapi: project context and handoff

## Shared project memory

Before starting a task:
1. Read this file, [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md), and [docs/DECISIONS.md](docs/DECISIONS.md).
2. Check the actual branch, commit, working tree, relevant code, and current CI. Memory is a dated summary, not a substitute for verification.
3. Read deeper AGENTS.md files when working in their directories. Consult only task-relevant documentation.

During and after work:
- Update PROJECT_STATE.md when the project state changes and before handing work to another session or model. Record the date, branch and base/implementation commit when known, completed work, relevant file paths, checks actually run and their results, blockers, and the next concrete step.
- Clearly distinguish implemented changes, verified facts, historical reports, hypotheses, and proposed work. A green past CI run does not mean checks were run in the current session.
- Add significant accepted architectural or product decisions to DECISIONS.md with context, reasons, consequences, and references. Do not record an unapproved proposal as an accepted decision. Mark superseded decisions instead of silently erasing their history.
- Keep memory concise and current; do not paste chat transcripts, logs, credentials, tokens, personal data, or browser profiles. Link to evidence instead.
- Keep README.md and specialist documentation aligned when their instructions or described behavior change.
- Include memory changes with the relevant implementation in the same branch/PR. Another session sees them only after it checks out that branch or a branch containing those commits. Do not claim an unmerged change is available in main.
- When work overlaps, inspect and preserve other changes before updating shared files. Different sessions do not automatically share chat history or a working tree.
- In the final handoff, report what changed, what was tested, remaining limitations, and the branch/PR. Do not invent a commit or PR identifier that is not yet available.

## Handling blockers

- Before escalating a blocker, state the problem, make a concrete plan, and attempt fixes within the authorized scope. If unresolved, search the web for analogous problems and try applicable solutions. Verify the result and continue the task when resolved.
- If user involvement is still required, report what was tried, the results, and the exact action needed from the user. Continue independent work where possible.
- When authorization is required, promptly provide a direct, verified authorization or account-settings link and the required steps. Do not invent links or request secrets in chat.

## Project boundaries

- Preserve independent Kapi publication: Kapi dist -> GitHub Pages -> the web_designer /kapi proxy. Changes to this architecture require an explicit task or accepted decision.
- dist/ contains editable source code as well as published files; it is not a disposable build output.
- Preserve local learning-data storage, Russian/German localization, and the proxy's cache isolation and visitor-data protections.
- Run checks appropriate to the change. Documentation-only changes require review of facts, paths, and links; visual checks below apply when appearance changes.
- Work within the user's authorized task. Creating a review branch/PR does not authorize merging or deploying it.

## Release and installed PWA updates

- Whenever a release changes a precached file (HTML, CSS, JavaScript, images, sounds or manifests), increment the cache version in `dist/sw.js` in the same branch/PR. Compare the release diff with the previously published version; never publish changed cached assets with unchanged worker bytes.
- Before merging, verify that the updated worker installs successfully and that an existing installation can discover and apply the update through the safe update flow, preserving learning data. A fresh browser visit or successful HTTP fetch alone does not validate an installed PWA update.
- After deployment, verify the served worker version and changed assets on both Pages and the primary `/kapi/` address. Record the version and actual verification results in PROJECT_STATE.md.
- If users still see an older release, first inspect the worker version, waiting worker and cache behavior. Do not recommend clearing site data as a routine update fix: this can erase local learning progress.

# Kapi: visual changes

When changing graphics, layout, animation, or visual design:

1. Run the application and capture screenshots of the affected screens at relevant mobile viewport sizes. For motion, capture several representative stages, including transitions and the resting state. Use real browser rendering when the change is in the web app.
2. Inspect the actual screenshots, not only test assertions. Compare them with the request, the existing Kapi visual style, and relevant current design conventions. Check composition, legibility, spacing, clipping, alignment, character anatomy, and continuity across animation frames.
3. Record a candid score from 1 to 10 for (a) fit to the request, (b) visual quality, and (c) contemporary design quality, with concrete reasons. Treat 9/10 in each dimension as the target. Fix visible defects and capture new screenshots until the target is met.
4. Do not claim a 9/10 result without inspecting the final screenshots. If the target cannot be met, report the actual score, remaining defects, and blocker. Keep functional, accessibility, and mobile layout checks in addition to the visual review.

This review is required before considering a visual change complete. Store or link representative final screenshots so the result can be reviewed.

## Beta preview for manual review

- Kapi-beta (https://github.com/KonstantinGlazunov/Kapi-beta) is the fast manual-preview repository authorized by the user on 2026-10-23. Its Pages site is a cloud preview, not a local server.
- Publish candidate application files to Kapi-beta/site/ for quick user review when requested. Its existing pages.yml deploys site/ from main without automated tests; do not add test gates there unless requested.
- Preserve the beta deployment workflow and explicitly track the source Kapi branch/commit used for each preview. Beta approval does not itself authorize merging or publishing the production Kapi release.
- Keep production checks and safe PWA update rules in Kapi. Kapi-beta does not replace them. When preview assets change, update the worker/cache version as needed so installed beta clients can receive the preview safely.
- Current task scope is Kapi and Kapi-beta only. Changes to web_designer require a separate user instruction.
