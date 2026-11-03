# Handoff — state as of this commit

## Status
- Milestones 1–2 of `KALEIDOSCOPE_BRIEF.md` §9 are done, with Chapter 1 rewritten to the story in `docs/STORY.md`.
- `npm test`: 50 Vitest tests pass (engine, every death, every ending, time budget).
  `npm run test:e2e`: 20 Playwright tests pass (the optimal-route walkthrough plus every death and ending through the real UI).
- Optimal route: 43 actions, 122 of 210 game minutes (58%), ending at 6:02 PM. The target is 55–60%; the unit test enforces 50–65%.
- Art is still placeholder (labelled boxes). Haight & Ashbury hotspots are laid out on Chris's anchor image (not yet in the repo).
- Not on GitHub yet. No deploy yet.

## Done in milestone 3 so far
- Draft art for 8 scenes in `art-source/ch1/`, turned into game images in `public/art/ch1/` by `npm run art` (scripts/palette-lock.ts + scripts/palette-lock.config.json). The drafts run with `"lock": false` (trim + letterbox only), because a full colour lock turned their soft light into speckle. For final art, remove `"lock": false` per scene and tune `extra` colours.
- Hotspots fitted to the drawings for those 8 scenes.
- Hotspot editor: `npm run hotspots`, which opens `/tools/hotspot-editor/` (dev only, not in the build). It has a before/after toggle that shows the source next to the processed image.
- Living effects + time-of-day grading in `src/ui/effects.ts` (dust, smoke, fog, flicker, oil wheel once the light show is on, drapes; off under reduced motion).

## Next work, in order
1. Art for the remaining scenes (lotus, parlor, lab; haight needs Chris's anchor file; alley again at a wider shape), then fit hotspots with the editor.
2. Milestone 4 polish (§9.4): interface pass from the approved mockup, title screen with oil-wheel background, iPad layout check, character portraits placed in scenes.
3. Milestone 5: optional audio, then the Vercel deploy after the pre-deploy checklist in SECURITY.md.

## Rules
- Keep `npm test`, `npm run test:e2e` and `npx tsc --noEmit` green. If you change the route,
  update `tests/unit/ch1.route.ts` (shared by both suites) and report the measured route time.
- Follow `SECURITY.md`: no runtime network calls, no `innerHTML` with data, Zod-validated saves,
  the strict CSP (the e2e suite fails on violations), and no new runtime dependencies without a reason.
- Story text must match `docs/STORY.md` and its voice. Don't change plot, puzzles or endings without Chris.
- Commit after each coherent step, with clear messages. Don't push, deploy or create repos without Chris.
