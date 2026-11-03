# Kaleidoscope — A Haight-Ashbury Noir

An original point-and-click noir adventure for the browser, set in Haight-Ashbury, August 1967.
Design brief: [`KALEIDOSCOPE_BRIEF.md`](KALEIDOSCOPE_BRIEF.md) · Art list: [`docs/ART_LIST.md`](docs/ART_LIST.md) · Security: [`SECURITY.md`](SECURITY.md)

## Run
```bash
npm install
npm run dev          # http://localhost:5173  (add ?chapter=test for the two-room test chapter)
npm test             # Vitest: engine + chapter 1 logic (every death, every ending, time budget)
npm run test:e2e     # Playwright: full walkthrough + every death/ending through the real UI
npm run build        # static build in dist/
```

## Layout
```
src/engine/      DOM-free engine: state, actions, verbs, clock, scheduler, saves (Zod), rewind, registry
src/ui/          DOM layer: scene + hotspots, verbs, pockets, narration, clock, overlays
src/chapters/    content as data — ch1/ (scenes, items, dialogue, deaths, endings, notebook), test/
src/art/         SVG item icons
tests/unit/      engine + ch1 tests (ch1.route.ts = the optimal route, shared with e2e)
tests/e2e/       Playwright specs (run against `vite preview` with the production CSP)
```

## Adding content
A scene is data: `{ id, name, art, onEnter, hotspots[], exits[] }`. Hotspots use a 0–1000 × 0–625 space
over the art. Verb handlers get a `ctx` with `give/remove/set/go/die/shard/win/advance/cost/note`.
To swap placeholder art for a final image, set `art.image: '/art/ch1/<scene>.webp'` — one line.

USE/GIVE precedence for target T and held item W: T's function → T[W] → W[T] → T.default → W.default;
with no held item: T.none. Anything unhandled gets a witty generic line, so no click is ever silent.

## Chapter 1 numbers
Optimal route: 38 actions, 117 of 210 minutes (56%), ending at 5:57 PM. 12 scenes, 13 deaths, 4 endings, 5 memory shards.
