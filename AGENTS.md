# Kapi: visual changes

When changing graphics, layout, animation, or visual design:

1. Run the application and capture screenshots of the affected screens at relevant mobile viewport sizes. For motion, capture several representative stages, including transitions and the resting state. Use real browser rendering when the change is in the web app.
2. Inspect the actual screenshots, not only test assertions. Compare them with the request, the existing Kapi visual style, and relevant current design conventions. Check composition, legibility, spacing, clipping, alignment, character anatomy, and continuity across animation frames.
3. Record a candid score from 1 to 10 for (a) fit to the request, (b) visual quality, and (c) contemporary design quality, with concrete reasons. Treat 9/10 in each dimension as the target. Fix visible defects and capture new screenshots until the target is met.
4. Do not claim a 9/10 result without inspecting the final screenshots. If the target cannot be met, report the actual score, remaining defects, and blocker. Keep functional, accessibility, and mobile layout checks in addition to the visual review.

This review is required before considering a visual change complete. Store or link representative final screenshots so the result can be reviewed.
