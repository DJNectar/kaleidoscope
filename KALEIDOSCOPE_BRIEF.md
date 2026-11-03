# KALEIDOSCOPE — A Haight-Ashbury Noir
### Game design brief + build instructions for Claude Code

---

## 0. Kickoff prompt (paste this into Claude Code)

> I'm building an original point-and-click noir adventure game for the browser called **Kaleidoscope**, set in Haight-Ashbury in the summer of 1967. The full design is in `KALEIDOSCOPE_BRIEF.md` at the repo root. Read the whole file before writing any code.
>
> Start by proposing the project structure and the engine's data model, and wait for my OK. Then build milestone by milestone, following section 9. After each milestone, run the game, take Playwright screenshots of what changed, and tell me what's playable. Follow my secure-build-protocol skill where it applies. This is a static game with no backend, so section 10 lists what matters here.
>
> The game is inspired by 1980s icon-and-verb adventures like the ones I loved as a kid. Everything in it must be original: story, characters, names, puzzles, text and art. Don't copy or imitate any existing game's content.

---

## 1. Vision

A brutal, atmospheric adventure in the spirit of the mid-'80s point-and-click classics, with modern presentation. You click verbs, click objects, solve puzzles, die suddenly and often, and race a ticking clock. Save and rewind keep the deaths fun instead of frustrating.

- **Tone:** hardboiled noir narration in a sunlit, psychedelic setting. The Summer of Love has a rotten core: peace and flowers on the posters, and something lethal behind the curtain.
- **Difficulty:** like the originals. Deaths come suddenly and are often funny, the clock is unforgiving, and some actions can't be undone. Every death is fair in hindsight, and each one gets its own darkly witty death text.
- **Scope:** Chapter 1 is a complete case of about 1–2 hours. The engine is built so new chapters, locations and cases can be added as data without touching engine code.

---

## 2. Tech & hosting

- **Stack:** Vite + TypeScript, no framework, fully static. Deploy on Vercel from a private GitHub repo, on a subdomain such as `noir.allard.ink`.
  - *This deliberately differs from my default stack.* The game has no accounts, no server and no database, so Next.js and Neon would add nothing. If cloud saves or accounts are ever added, revisit using the default stack (Next.js + Neon + Drizzle).
- **Rendering:** HTML/CSS UI. Each scene is a **two-colour screenprint-style image made in Midjourney and palette-locked** (see §11), at 1920×1200 (16:10), shipped as WebP. Hotspots are polygons defined in data, in a coordinate space normalized to the image (0–1000 × 0–625), and are never baked into the art. Living effects are layered on top in code: canvas/CSS particles, light overlays and colour grading (§11.5).
- **Until the art exists:** use labelled placeholder boxes so the game is fully playable without final art. Swapping in an image must be a one-line change in the scene data.
- **Art direction:** see §11.
- **Audio (milestone 5, optional):** Web Audio only, no external files at first. Ambient room tones, a subtle bass-and-brushes motif, typewriter ticks for narration, and a sting on death. Must be mutable and off until the first click.
- **Responsive:** playable on desktop first, and usable on iPad. Scene scales to fit; UI panels reflow below it on narrow screens.

---

## 3. Interface

The layout is my own modern take on the classic verb window. Don't copy any specific game's screen layout.

- **Scene window** (centre): the illustration. Hovering over a hotspot shows its name in a small label (modern convenience).
- **Verb bar:** LOOK · TAKE · OPEN · CLOSE · TALK · USE · GIVE · HIT · CONSUME · GO. Click a verb, then a target. USE and GIVE take two targets ("Use **knife** on **door**"). Show the sentence being built ("Use knife on…") in a status line. Default action on double-click: GO for exits, LOOK for everything else.
- **Inventory panel:** item icons (small SVGs). Items are valid targets for LOOK, CONSUME, OPEN, USE and GIVE. Players can also drag an item from the inventory onto a hotspot as a shortcut for USE.
- **Exits panel:** a small mini-map of the current scene's exits, also clickable.
- **Narration panel:** scrolling noir text, typed out quickly (skippable on click). Keep the last ~30 lines.
- **Clock:** a wristwatch in the corner, always visible, showing game time. It pulses red in the last 30 minutes.
- **Memory shards:** a row of five empty kaleidoscope shards that fill as memories return (see §6).
- **Menu:** New Game, Save (3 slots + autosave on every scene change), Load, Rewind (undo the last action, up to 20 steps), Text speed, Sound, Credits.
- **Death screen:** the scene drains to black and white and cracks like glass, the death text appears, then three buttons: **Rewind** / **Load** / **Restart**.
- **Keyboard:** number keys 1–0 for verbs, `I` for inventory, `Esc` to clear the current sentence.

---

## 4. Engine requirements (data-driven)

- `GameState`: `{ chapter, scene, minutes, inventory[], flags{}, shards[], visited[], deaths }`. It must be serializable to JSON, and saves include a `version` field so future chapters can migrate old saves.
- Content lives in `/src/chapters/ch1/`: `scenes.ts`, `items.ts`, `dialogue.ts`, `art/*.ts` (SVG builders), `deaths.ts`, `endings.ts`.
- A scene defines: `id`, `name`, `art`, `onEnter(state)`, `hotspots[]` (`id`, `name`, `shape` [rect or polygon], `visible(state)`, and verb handlers), and `exits[]`.
- Verb handlers return narration and can call helpers: `give(item)`, `remove(item)`, `set(flag)`, `go(scene)`, `die(deathId)`, `shard(n)`, `win(endingId)`, `advance(minutes)`.
- Every hotspot and item needs a sensible fallback for every verb, so no click ever produces nothing. Use witty generic lines that vary by verb ("You'd need a reason to hit a lamp. You don't have one.").
- **Timed events:** a scheduler that fires on minute thresholds (warnings, the deadline, scripted arrivals).
- Chapter registry so Chapter 2 can be dropped in later. The end of Chapter 1 sets flags that Chapter 2 can read.
- **Tests:** Vitest for engine logic, plus a Playwright **walkthrough test** that plays the full optimal route to the best ending and asserts the win. Add one test per death and per ending.

---

## 5. Clock rules

- The game starts at **4:00 PM, Saturday, August 19, 1967**. The hard deadline is **7:30 PM**, when Kell's people truck the crates to the Panhandle.
- Time costs: GO = 4 min, TALK = 2 min, everything else = 1 min. LOOK at inventory items is free.
- **Warnings:** 6:30 PM (narration: the light over the park is turning orange), 7:00 PM (you hear the soundcheck drifting across from the Panhandle), 7:15 PM (the watch pulses red).
- **At 7:30 PM**, if the batch hasn't been destroyed, a cutscene shows the crates leaving and a newspaper headline the next morning. Game over.
- **Tuning target:** the optimal route should use about 55–60% of the available time, which leaves room to explore, die and rewind. Report the measured optimal-route time after the walkthrough test.

---

## 6. Chapter 1 — "The Blue Lightning Batch"

### Premise
You're **Frank Tolliver**, a former SFPD inspector who quit the force rather than take envelopes and now works as a private eye out of a one-room office in the Tenderloin. Three days ago, a wealthy Pacific Heights widow, **Mrs. Eleanor Whitcombe**, hired you to find her runaway daughter, **Rosalind "Rain" Whitcombe** (19), last seen in the Haight.

You wake at 4:00 PM on a bare mattress in the attic of a Victorian on Ashbury Street, with sun pouring through a tie-dyed curtain and **no memory of the last three days**. Someone slipped you something. Your .38 is gone.

### Historical inspiration (loose, fictionalized)
The story is loosely inspired by the real 1960s scene: underground LSD chemists, a Laguna Beach smuggling brotherhood, the all-night acid-test parties, the house bands of the Haight, outlaw biker clubs, an ex-academic turned spiritual teacher, and the CIA's real-life covert drug experiments. **Every character, band and group in the game is a fictional, loose representation. No real person's or real group's name is used**, and no character is a direct portrait of a real person. Real places, the Summer of Love, California's 1966 LSD ban and the general history of government drug experiments can appear as backdrop.

### The truth (revealed gradually)
**Sterling "Sky" Calder** is a legendary underground chemist whose "Blue Lightning" acid is famous for its purity. **Subproject LOTUS**, a fictional covert CIA program run by the agent **Mr. Garrison**, has had its contract psychiatrist **Dr. Ambrose Kell** cook 5,000 *counterfeit* Blue Lightning tabs cut with a lethal compound. Kell runs the *Lotus Foundation*, a "free consciousness therapy" house on Masonic Avenue that's adored by the kids, and the counterfeit tabs will be handed out free at tonight's sundown gathering in the Panhandle, where the Morning Ghosts are playing. The plan is a mass casualty event blamed on Calder and the hippies, to justify sweeping the Haight clean.

**Lt. Ray Bruno** of SFPD Narcotics is on Garrison's payroll. **Tiny**, a member of the Iron Saints motorcycle club, moonlights as Kell's muscle. Rain found out while volunteering at the Foundation. You found her, and the two of you went to the Electric Jesters' all-night **"Kaleidoscope Test"** party at the Electric Owl to warn Calder. Kell's people dosed you both there. That's where your three days went. Rain has been taken back to the Foundation, sedated.

### Characters (all original)
| Name | Role | Notes |
|---|---|---|
| Frank Tolliver | You | Dry, tired, decent. Narration in his voice, second person ("You…"). |
| Rain Whitcombe | The missing girl | Sharp and brave. Sedated in Kell's parlor until revived. |
| Sterling "Sky" Calder | Underground chemist and sound wizard | Eccentric purist, obsessive about quality and about the band's speaker wall. Furious that his name is being counterfeited. Suspect, then ally. Found running sound at the Panhandle stage. |
| The Morning Ghosts | House band of the Haight | Long improvised sets, a devoted following. Playing the sundown gathering. No real songs, so all music is described in narration. |
| Lu Fontaine | Blues singer fronting a rival band, Satchel & the Strays | Raw voice, big laugh, Rain's friend. At the Electric Owl rehearsing, and she gives the "Kev hid the key" lead its emotional weight. |
| Hank Delacroix | Novelist and ringleader of the Electric Jesters | Fast-talking, half genius, half carnival barker. Their painted bus *Elsewhere* is parked at Haight & Ashbury. Hosted the Kaleidoscope Test. |
| Professor Lev Adler, "Brother Ananda" | Ex-professor turned gentle seeker | Fired for his experiments, now volunteers at the free clinic. Knows which researchers sold out to the government, and names Kell. |
| Moondog | Poster artist, 2nd-floor flat | Gentle, paranoid, paint-spattered. Rain trusted him with an envelope. |
| Dr. Nora Fields | Doctor at the free clinic on Clayton | Overworked, no-nonsense, immediately believes the evidence. |
| Sunny | Owner of the Third Eye head shop | Cheerful hustler. Sells you a disguise. |
| Kev "Kaleido" Malone | Light-show artist at the Electric Owl ballroom | Jumpy. Ran the lights at the Kaleidoscope Test. Knows about Bruno. Hid a key from Tiny. |
| Tiny | Iron Saints MC member and Kell's enforcer | Enormous. Kills you if he recognizes you. The rest of the Iron Saints are doing security at the gathering and don't know what Tiny's mixed up in. |
| Sister Dawn | Greeter at the Lotus Foundation | Serene and creepy. Offers tea. |
| Dr. Ambrose Kell | The villain | Silver-haired, velvet voice, your .38 in his hand at the climax. |
| Mr. Garrison | Subproject LOTUS handler | Gray suit, never raises his voice. Seen only in memory shards and the ledger in Chapter 1, and saved as a bigger presence for later chapters. |
| Lt. Ray Bruno | Crooked narc | Prowls the Panhandle in a gray Plymouth. |
| The Fellowship of the Endless Wave | Laguna Beach surf-mystic smuggling brotherhood | Mentioned in Chapter 1 (Calder's distribution network) and set up for Chapter 2. |

Don't use real musicians, bands, songs, real people or real groups' names. Real streets and parks are fine (Haight, Ashbury, Masonic, Clayton, the Panhandle, Golden Gate Park), and so is the CIA as an institution, but all of its people and programs in the game are invented. Every business is fictional.

### Locations (12 scenes)
1. **Attic crash pad** (start): mattress, tie-dye curtain and window, chair with your coat, hat hook with your fedora, a plate of stale toast with a butter knife, a door locked from outside.
2. **Second-floor landing:** stairway, radiator with a gathering flyer, Moondog's door with a painted eye.
3. **Moondog's studio:** silkscreen frames, drying posters, a darkroom curtain, a shelf of chemical bottles.
4. **Haight & Ashbury** (hub): street corner, the Electric Jesters' painted bus *Elsewhere* with Hank Delacroix holding court, a busker, Bruno's gray Plymouth parked half a block down. Exits to all street locations.
5. **The Third Eye:** a head shop with beads, sunglasses, fringe vests, incense smoke, a tray of suspicious brownies, a payphone.
6. **Free clinic:** a waiting room full of kids, Dr. Fields, Brother Ananda handing out soup, a cabinet, an eye chart.
7. **The Electric Owl:** a ballroom wrecked from last night's Kaleidoscope Test, a light-show rig with an overhead projector and oil wheel, Kev on a ladder, Lu Fontaine rehearsing on the stage.
8. **Alley behind the Owl:** dumpster, fire escape, Tiny smoking by the stage door.
9. **The Panhandle:** a stage going up, Calder at the sound desk in front of a towering speaker wall, Iron Saints doing security, the crowd gathering, a Lotus Foundation volunteer table, Bruno's men in bad sport coats.
10. **Lotus Foundation, exterior:** a Victorian painted with a lotus mandala, a front door, a side cellar door with a padlock.
11. **Lotus Foundation, parlor:** cushions, a sedated Rain on a daybed, Kell's writing desk, Sister Dawn with a teapot, a locked door to the basement.
12. **Basement lab:** crates of Blue Lightning, glassware, a gas line valve, an old coal furnace.

### Required puzzle chain (critical path)
1. **Attic:** LOOK at the fedora to find your PI licence in the hatband, which gives you your name back (**Shard 1**). TAKE the coat to get Rain's photo, a matchbook from the Electric Owl with "Kev knows" scrawled inside, and $7. LOOK under the mattress to find a torn notebook page in your own handwriting: *"BLUE LIGHTNING — 5000 — SUNDOWN — PANHANDLE — STOP IT — LOTUS."* This sets the stakes and starts the clock warnings. TAKE the butter knife, then USE knife on door to slip the latch.
2. **Moondog:** TALK, then show him the photo (GIVE or USE photo on Moondog). He gives you Rain's envelope, which holds a foil-wrapped blue tab and a note: *"If Frank forgets — the Owl. Kev hid the key."*
3. **Free clinic:** GIVE the tab to Dr. Fields. She runs a reagent test and confirms the tab is poisoned and lethal at scale. You get a **toxicology slip** and **smelling salts** ("for the ones who go too deep"). She mentions that Kell sends kids to her (**Shard 2**).
4. **The Third Eye:** buy **round sunglasses + love beads** from Sunny for $5, then USE disguise on yourself (or "wear" it via USE on the inventory). Sunny's lines change once you're disguised.
5. **Electric Owl:** TALK to Kev while holding Rain's note or the photo. He tells you about Bruno and says he dropped the Foundation's cellar key in the alley dumpster when Tiny chased him. USE the projector to start an oil-wheel light show. The swirl brings back a memory of Kell's face over you with a syringe (**Shard 3**).
6. **Alley:** disguised, Tiny ignores you, so you can OPEN the dumpster and get the **brass cellar key**.
7. **The Panhandle:** disguised, TALK to the Lotus volunteer to get a **Lotus "Seeker" card** (needed at the front door). LOOK at the stage scaffold to remember standing here with Rain, arguing (**Shard 5**).
8. **Lotus exterior:** show the Seeker card to Sister Dawn at the front door to be admitted to the parlor. (Alternative: USE the brass key on the side cellar door to go straight to the lab, which skips Rain. See endings.)
9. **Parlor:** USE smelling salts on Rain. She comes to groggy, tells you the batch is downstairs in the old furnace room, and warns you that Kell keeps your gun. TAKE the **ledger** from Kell's desk, which shows weekly payments to "R.B." (**Shard 4**). USE the brass key on the basement door.
10. **Basement lab:** OPEN the crates, OPEN the furnace, then USE crates on furnace. The batch burns. **Climax:** Kell comes down the stairs with your .38. If Rain is awake, TALK to Kell to stall him while Rain clubs him from behind with a fire iron. If she isn't, he shoots you.

### Sudden deaths (each with its own death text)
- **Attic:** go out the window. The fire escape is decorative and rusted through.
- **Consume the blue tab** (anywhere): the irony is lethal.
- **Moondog's studio:** consume the "ginger ale" from the darkroom shelf. It's fixer.
- **Haight & Ashbury:** USE or GO on "street" against the traffic. A painted VW bus, doing 30 with flowers on the bumper, ends your case.
- **The Third Eye:** consume a brownie. You wake up Tuesday. Clock game over.
- **The Panhandle without the disguise:** Bruno spots you. Game over (arrested, held overnight, and the batch goes out).
- **The alley without the disguise:** Tiny recognizes you, and the death is fast.
- **The alley:** HIT Tiny, disguised or not, and you're dead. GO up the fire escape and it collapses.
- **Parlor:** consume Sister Dawn's tea. You're dosed, and you go to sleep for good.
- **Lab:** USE or OPEN the gas valve near the furnace. The explosion is spectacular.
- **Lab:** HIT Kell, or reach the climax without Rain awake, and he shoots you.
- **The clock:** reach 7:30 PM without destroying the batch, and the crates leave.

### Optional memory shards (5)
Five fragments of the lost three days, each delivered as a short italic flashback with a kaleidoscope colour-burst transition. They reconstruct how you found Rain, how you were both dosed, and Bruno's role. Collecting all five upgrades the ending epilogue.

### Endings
- **Best (batch burned + Rain awake + ledger taken + all 5 shards):** front page of the fictional *S.F. Evening Clarion*: Kell indicted, Bruno arrested, Calder cleared, and the Morning Ghosts play a five-hour set to a crowd that will never know how close it came. Rain goes home on her own terms. A final line hooks Chapter 2: Mr. Garrison is gone, and an envelope arrives at your office, postmarked Laguna Beach, with a lotus on the seal and a single word inside: *Fellowship*.
- **Good (batch burned + Rain awake + ledger):** same, but Frank still can't remember everything, with a melancholy closing line.
- **Bittersweet (batch burned + Rain awake, no ledger):** Kell is arrested, but Bruno walks free and is still on the force.
- **Lonely (batch burned via the cellar route, Rain never revived):** you survive the climax only if you never wake Kell's suspicion. Design this route so Kell arrives at the lab and you can escape out the cellar door with the burn underway. Rain is moved before dawn. A bleak ending that implies Chapter 2 is a rescue.
- **Failure endings:** the clock running out and the arrests.

Each ending shows a newspaper-style card with a headline, a short paragraph, the time taken, the number of deaths and shards found.

---

## 7. Writing style

- Second-person, present-tense noir. Short, punchy sentences, with similes that land but don't overdo it ("The sun comes through the curtain like it's got a warrant.").
- Humour in the deaths. Melancholy at the edges.
- Period-appropriate slang used lightly, never as a costume.
- Every LOOK should reward the player with flavour, a clue or a joke.
- Write all text original. No quoting songs, poems or books.

---

## 8. Originality guardrails

- The game is inspired by the *genre* (1980s icon-driven adventures, hardboiled noir), not by any specific title. Don't reuse character names, plot points, puzzles, locations, interface layouts, text or art from any existing game.
- No real bands, songs, lyrics, real people or real groups' names. The scene's history inspires the story, but every character and group is a loose, fictional representation, and none is presented as a real person or group. Fictional businesses, newspapers and organizations only. The CIA may appear as an institution, but every agent and program is invented.

---

## 9. Milestones

1. **Engine skeleton:** state, verb/target system, scene loading, inventory, narration, clock, save/load/rewind. Includes a two-room test chapter.
2. **Chapter 1 content, rough:** all 12 scenes with placeholder art (labelled boxes), all hotspots, puzzles, deaths and endings working. The Playwright walkthrough passes.
3. **Art pass:** I generate the Midjourney scenes using §11. You add a **hotspot editor** (a dev-only page: load a scene image, click to draw polygons, export the coordinates to the scene data), then wire in every image. Also build the living-effects layers (§11.5), the time-of-day grading, item icons, the death-screen effect and the shard transitions. Screenshot every scene for my review.
4. **Polish:** hover labels, drag-to-use, typing effect, mobile/iPad layout, ending cards, title screen with an animated oil-wheel background.
5. **Audio** (optional) **+ deploy** to Vercel on my subdomain.
6. **Chapter 2 hooks:** confirm the chapter registry works by adding an empty Chapter 2 stub that reads Chapter 1's ending flags.

---

## 10. Security & privacy (from my secure-build-protocol, scoped to a static game)

- No secrets, API keys or env vars needed. If any appear later, they never go in client code.
- No network calls at runtime. All assets are bundled.
- Saves use `localStorage` wrapped in try/catch, and the game must work if storage is unavailable. Validate the save JSON structure (Zod) before loading it, and never `eval` save data.
- Never set narration via unsanitized `innerHTML` from save data. Render text with `textContent` or a tiny safe-markup formatter.
- Security headers via `vercel.json`: a strict Content-Security-Policy (`default-src 'self'`; no inline scripts in the production build), `frame-ancestors 'none'`, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`.
- No analytics or personal data collected (Quebec Law 25 friendly). If analytics is ever added, it must be anonymous and disclosed.
- Private GitHub repo, lockfile committed, Dependabot on, and `npm audit` clean of high/critical before deploying.
- Keep a `SECURITY.md` noting the above, and run my pre-deploy checklist before saying it's ready.

---

## 11. Art pipeline (Midjourney)

### 11.1 Look
**Two-colour screenprint comic.** Bold ink linework with flat areas of colour, printed in **two inks plus off-white** per scene, like a '60s screenprinted poster crossed with a comic panel. The anchor image is the Haight & Ashbury corner in coral red and teal (`/art-reference/anchor-haight.jpg`; Chris will add it to the repo). Black is used for the deepest shadows, and there's more of it as the day gets later.

**One ink pair per scene**, so each location has its own mood and the set still reads as one game. The mini-map uses the same colours.

| Scene | Ink 1 | Ink 2 |
|---|---|---|
| haight-ashbury (anchor) | coral red | teal |
| attic | mustard yellow | violet |
| landing | burnt orange | slate blue |
| studio | hot pink | acid green |
| third-eye | violet | lime green |
| clinic | pale blue | tomato red |
| electric-owl | magenta | electric blue |
| alley | deep purple | blood red |
| panhandle | grass green | sunflower yellow |
| lotus-exterior | gold | plum |
| lotus-parlor | plum | gold |
| basement-lab | acid green | black |

**Comic-panel layouts** for the title screen, ending cards and death-gallery cards: a central figure with panels radiating around it like kaleidoscope shards, each panel in a different scene's ink pair.

### 11.2 Consistency method
1. Use the anchor image (after fixes: the VW emblem replaced with a plain badge, the sedan pushed into shadow) as `--sref` on every other scene, with `--sw` around 300.
2. Use the same base suffix on every prompt, swapping in the scene's pair from the table:
   `two-colour screenprint comic illustration in [INK 1] and [INK 2] with off-white, bold ink outlines, flat colour areas, deep black shadows, 1960s poster art, first-person wide view, no people, no text, no logos --ar 16:10 --style raw --stylize 100 --no text, letters, words, logos, watermark, people, gradients, photorealism`
3. Prompt signs and posters blank. Claude Code adds lettering as overlays.
4. Use Vary (Region) to remove any brand marks, garbled shapes or stray figures before exporting.
5. Upscale your pick and save it to `/art-source/ch1/<scene-id>.png`.

### 11.2b Palette lock (Claude Code builds this)
Midjourney leaves muddy in-between shades and noisy edges. Add a build script (`scripts/palette-lock.ts`, using `sharp` or similar, and check that the package is well maintained before adding it) that, for each scene:
- quantizes the image to its exact pair from the table, plus off-white and black, by nearest colour with light edge-preserving smoothing first,
- removes isolated specks below a small pixel threshold,
- exports 1920×1200 WebP to `/public/art/ch1/<scene-id>.webp`.

Keep the originals in `/art-source/` and only the processed files in `/public/`. Make the script re-runnable, and show a before/after comparison page in the dev hotspot editor so Chris can tune the settings per scene.

### 11.3 Scene prompts (prepend each to the base suffix)
1. **attic:** *a cramped Victorian attic crash pad at late afternoon, sunlight blazing through a tie-dyed curtain over a small window, a bare mattress on the floor, a wooden chair with a rumpled trench coat, a fedora on a wall hook, a plate of stale toast with a butter knife, a closed paneled door, slanted ceiling, dust in the light beams*
2. **landing:** *a narrow second-floor landing in an old San Francisco Victorian, steep wooden stairs going down, an iron radiator with a blank paper flyer on it, a door with a large painted eye in psychedelic colours, peeling wallpaper, a single bare bulb, warm late sun from a stairwell window*
3. **studio:** *a cluttered poster artist's studio in a Victorian flat, wooden silkscreen frames, blank drying posters clipped on lines across the room, ink-stained tables, a black darkroom curtain in the corner with red light leaking out, a shelf of brown chemical bottles, bay windows glowing orange*
4. **haight-ashbury:** *a sunlit 1967 San Francisco street corner lined with painted Victorian houses, a hand-painted flowered VW bus at the curb, a blank green street sign on a pole, storefronts with blank colourful awnings, a gray 1960s sedan parked in deep shadow half a block away, long golden-hour shadows, hazy fog rolling in at the far end of the street*
5. **third-eye:** *the interior of a 1967 head shop, strings of beads hanging in doorways, racks of fringe vests, round sunglasses on a spinning display, incense smoke curling through coloured light, blacklight posters with abstract swirls and no text, a glass counter with a tray of brownies, an old payphone on the wall*
6. **clinic:** *a worn free-clinic waiting room in a converted Victorian, mismatched chairs, a blank eye chart, a steel medicine cabinet, a doctor's desk piled with files, a doorway to an exam room, flickering fluorescent light mixed with warm window light, compassionate but exhausted atmosphere*
7. **electric-owl:** *an empty 1960s psychedelic ballroom in the afternoon, a high balconied hall with an ornate ceiling, a wooden dance floor, an empty stage, a scaffold with an overhead projector and coloured glass oil wheels, faint liquid colour blobs projected on the far wall, a stepladder, dust in the air*
8. **alley:** *a narrow brick alley behind a ballroom at dusk, an overflowing metal dumpster, a rusted fire escape zigzagging up the wall, a steel stage door with a single caged bulb, puddles reflecting violet sky, cigarette smoke haze, menacing shadows*
9. **panhandle:** *a long grassy park strip under tall eucalyptus trees at golden hour, a wooden concert stage being built with scaffolding, speaker stacks, a folding table with a lotus-flower banner and no text, a crowd gathering far in the distance, a few men in sport coats lurking by the trees*
10. **lotus-exterior:** *a grand Victorian house painted with a huge mandala lotus motif in violet and gold, wide front steps to a carved door, a side cellar door with a heavy padlock, an overgrown garden with prayer flags, the sun low and red behind it, an unsettling, too-perfect calm*
11. **lotus-parlor:** *an opulent Victorian parlor turned meditation room, floor cushions, a velvet daybed, a carved writing desk with a ledger book, a brass teapot on a low table, heavy drapes, candlelight and stained-glass colour, a locked door at the back, beautiful and sinister*
12. **basement-lab:** *a clandestine chemistry lab in a stone basement, wooden crates stacked high, glass beakers and tubing on a workbench, a gas line with a red valve wheel, a huge old iron coal furnace with its door closed, a single hanging bulb, stairs coming down from above, sickly green light and deep shadow*

**Title screen:** *a weary detective in a fedora and trench coat at the centre, surrounded by radiating comic panels like kaleidoscope shards, each panel a different two-colour ink pair: a Victorian house, a painted VW bus, a lotus mandala, a smoking revolver, a cracked wristwatch, a crate of glowing tablets* (`--ar 16:9`, leave a blank banner area for the logo).

### 11.4 Characters and items
- **Characters** (Moondog, Dr. Fields, Sunny, Kev, Tiny, Sister Dawn, Rain, Kell, Bruno): one portrait each in the same two-colour screenprint style, *bust portrait, bold ink outlines, flat colour, exaggerated expressive features, shown from the chest up on a plain off-white background*, each in their own ink pair (Kell gold and plum, Bruno steel blue and black, Tiny blood red and black, Rain teal and coral, and so on). The style can be slightly grotesque for the villains and warmer for the allies. Claude Code places the portraits in scenes or shows them in a dialogue panel. Run them through a background remover to get transparent PNG/WebP.
- **Item icons:** generate one sheet per few items (*"set of painted objects on a black background: a fedora, a butter knife, a matchbook, a foil-wrapped tablet, a brass key"*), then crop. Or have Claude Code draw clean SVG icons, which look sharper at small sizes.

### 11.5 Living effects (in code, over the art)
- **Time-of-day grading:** on outdoor scenes the game clock shifts the scene's two inks via a palette-swap shader. They're at their brightest at 4:00 PM, deepen toward orange and red by 6:00, and by 7:15 turn violet and indigo, with black taking over the shadows and only the lamps and windows still glowing in the original warm ink. Interiors with windows get a subtler version.
- **Ambient motion:** incense smoke (Third Eye), dust in light beams (attic, ballroom), a flickering bulb (alley, lab), a swirling oil-wheel projection (Electric Owl, once activated), fog drifting at the end of Haight Street, and drapes stirring in the parlor.
- **Parallax:** optional subtle depth on mouse move, from 2–3 hand-cut layers on outdoor scenes.
- **Death effect:** the scene's two inks drain to stark black on off-white and the image cracks like glass. The death card is a comic panel in blood red.
- **Memory shards:** a kaleidoscope burst transition into an italic flashback, played over a blurred, colour-inverted version of the current scene.

---

## 12. Additional features

- **Case notebook:** Frank's notebook fills in clues, names and places automatically as you discover them. Each entry is a short noir note. It also gives you an inventory item to LOOK at.
- **Death gallery:** every unique death unlocks a card with its title and death text ("Decorative Fire Escape", "Ginger Ale"). The menu shows how many you've found (e.g. 7/13).
- **Payphone hints:** USE the payphone (Third Eye) to call your answering service. Each call gives the next nudge on the critical path, costs 10 game minutes and is counted on the ending card.
- **"1985 mode":** a toggle that renders everything in crunchy 1-bit black-and-white dithering with a chunky pixel font, done as a shader/canvas filter over the same art.
- **Ending cards:** a newspaper front page with the headline, time taken, deaths, hints used and shards found. Saved per ending so you can see which ones you've unlocked.
- **Accessibility:** a text size setting, a reduced-motion setting (turns off parallax and effects), a "highlight hotspots" toggle (hold Space) and full keyboard play.
