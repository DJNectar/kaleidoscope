# Handoff — state as of this commit

## Status
- Milestones 1–2 of `KALEIDOSCOPE_BRIEF.md` §9 are done, with Chapter 1 rewritten to the story in `docs/STORY.md`.
- `npm test`: 50 Vitest tests pass (engine, every death, every ending, time budget).
  `npm run test:e2e`: 20 Playwright tests pass (the optimal-route walkthrough plus every death and ending through the real UI).
- Optimal route: 43 actions, 122 of 210 game minutes (58%), ending at 6:02 PM. The target is 55–60%; the unit test enforces 50–65%.
- Art is still placeholder (labelled boxes). Haight & Ashbury hotspots are laid out on Chris's anchor image (not yet in the repo).
- Not on GitHub yet. No deploy yet.

## Next work, in order
1. **docs/ART_LIST.md**: update it for the new story. Attic: a small brass-and-cardboard kaleidoscope on the
   windowsill, plus a pigeon on the sill. Parlor: Rain stands at the low tea table (centre), not on a daybed.
   Pigeons also appear on the Haight lamppost top and on top of the Panhandle speaker wall.
2. **Milestone 3** (brief §9.3, §11.2b, §11.5):
   - a dev-only hotspot editor (`tools/hotspot-editor/`, excluded from the production build): load a scene
     image, click to draw polygons in the 0–1000 × 0–625 space, export to scene data;
   - `scripts/palette-lock.ts` with `sharp` as a dev dependency, plus a before/after view in the editor;
   - living effects (dust, smoke, flicker, fog, oil wheel, drapes), time-of-day grading on outdoor scenes,
     the death crack (exists, could be refined), and the shard kaleidoscope burst (exists);
   - drop-in art: set `art.image` on a scene in `src/chapters/ch1/scenes.ts`.
3. **Milestone 4 polish** (§9.4): title screen with an animated oil-wheel background, iPad layout check,
   reduced-motion check, "hold Space to highlight hotspots" (exists), full keyboard play.

## Rules
- Keep `npm test`, `npm run test:e2e` and `npx tsc --noEmit` green. If you change the route,
  update `tests/unit/ch1.route.ts` (shared by both suites) and report the measured route time.
- Follow `SECURITY.md`: no runtime network calls, no `innerHTML` with data, Zod-validated saves,
  the strict CSP (the e2e suite fails on violations), and no new runtime dependencies without a reason.
- Story text must match `docs/STORY.md` and its voice. Don't change plot, puzzles or endings without Chris.
- Commit after each coherent step, with clear messages. Don't push, deploy or create repos without Chris.
