# Zeus World: changelog

What changed, when and why. Newest first. One entry per piece of work, in plain language, with the backlog number where there is one. The commit history has the line-by-line detail.

## 23 Nov 2026

- **Game direction discussed.** The owner set four directions after the research (slow growth from Bolts with games that pay Bolts, the MVP showcase, a structure of levels, elevated moments tied to momentum). Proposals in reply recorded in `BRAINSTORM-GAME.md`. Nothing built.

## 22 Nov 2026

- **Research for the game direction (ZW-023).** Five strands: what makes open worlds hold people, earlier audience-driven games, retention and its pitfalls, AI-driven living worlds, TikTok LIVE's mechanics and rules. Report in `reports/` at the repository root; notes in `research_notes/`. Nothing built.
- **The bigger plan written.** `ROADMAP.md` sets out the game in six phases, from the owner's direction: a palace with queens (ZW-020), a living day for long streams (ZW-021), walking through the battle MVP's property (ZW-022), and building it like an actual game in phases (ZW-023). Nothing built.
- **Cinematic camera for the battle (ZW-019).** The owner approved the siege and asked for a closer, film-like camera. Nine kinds of shot now cut between the clash, the ranks, the catapults, the wall and the gate, following the fighting line. Soldiers gained legs and helmets for the closer views.
- **Siege at the south gate (ZW-018, first version).** During a battle two armies face each other outside the wall and the line between them moves with the score, with arrows, catapults, a rival camp and a strength bar. Runs on a made-up score from the Battle button or `?battle`. `assets/review/battle.js`.
- **Game direction logged and brainstormed.** ZW-015 (losing a battle damages a building, the community repairs it), ZW-016 (winning triggers a surprise celebration) and ZW-017 (make the city feel like a game: levels that unlock things, a world to explore). Ideas written up in `BRAINSTORM-GAME.md`. Nothing built.
- **Each frame now costs about half as much to draw (ZW-004, first batch).** Repeated pieces (tiles, walls, river and quay sections) are drawn in one go; citizens outside the view are skipped; the man model was three times heavier than the others and is now the same; distant citizens, trees and bushes use lighter far-view models. Wide view: 2,330 to 1,154 draw calls, 5.0 to 2.2 million triangles. Frame rate itself is for the owner to read on the preview.
- **Tools added:** `assets/lod.mjs` and `far.sh` make the far-view models; `measure.mjs` now lists what each model costs in the scene.
- **Citizens stand still properly (ZW-014).** The supplied idle animation was a wide, turning stride. A standing pose made in code replaces it for all three citizens: feet together, arms hanging, breathing, a slow look from side to side. `assets/review/stand.js`.
- **The woman citizen walks properly (ZW-012).** Her rig from the generator had her upper body and head bound to her left forearm, so she folded and twisted as she walked. Her binding was rebuilt from her shape with a new tool, `assets/reskin.mjs`, at no cost. Checked with frame sheets of all four of her animations.
- **Homes show their owner's name (ZW-013).** A plate above each finished home's roof, readable from the wide view. `assets/review/names.js`. Names are made up for the demo.
- **Frame sheets for checking animation:** `assets/review/poses.html` draws a character at evenly spaced moments of a clip, since motion cannot be watched on the build machine.
- **Memory use of the city roughly halved (ZW-001).** Measured first: 1.4 GB in the tab and 2.1 GB in the graphics process, with no leak. Two causes: the same textures loaded many times over (1,065 in memory, 144 different), and a 512 MB shadow map. Identical textures are now loaded once, and the shadow map is stored in 192 MB. After: 0.7 GB and 0.8 GB. The picture is unchanged, checked against stills of four views. Detail in `knowledge/performance.md`.
- **Measuring tool added:** `assets/measure.mjs` reports what the city holds in memory, what a frame costs to draw, and whether anything grows over time. New skill `measure-memory`.
- **Frame cost measured (ZW-004):** 5.0 million triangles and 2,320 draw calls a frame. Not yet worked on.
- **Documentation system set up.** Added `CLAUDE.md` (read by every session), `PLAN.md`, `BACKLOG.md`, `DECISIONS.md`, this changelog, the `knowledge/` folder and five skills in `.claude/skills/`. `STATUS.md` was split into these and removed. Why: so any new session has everything it needs without being told where to look, and so reports from the owner are tracked.
- **Backlog seeded** with ZW-001 to ZW-011: the owner's Chrome memory report and the outstanding items from the old status file.
- **Merged into the default branch.** The work from `claude/dazzling-mendel-y9qquo` and `claude/eager-faraday-svkb22` had never been merged, so new sessions could not see it.
- **City scene: day-to-dusk cycle and camera tour** (batch 5). Two photo skies cross-fade, lamps come on, the sea calms in the evening; the camera glides between seven stops.
- **City life batch 3, ambient motion.** Rippling cloth, swaying trees, chimney smoke, fountain spray, a sailing boat, drifting sky.
- **City life batches 1 and 2.** Walking citizens on a route graph; buildings rising behind scaffolding with Bolts labels; lightning and cheering on completion; birds.
- **Stream grade.** Deeper sky and grass, harder sun, saturation and contrast boost, because the first look was too pale for OBS.
- **Water and extras** added to the catalogue (pond, river, stepping stones, quay, pier, well, reflecting pool), all scripted.

## Before 22 Nov 2026

Summarised from the old status file; see the commit history for dates.

- Whole walled city with harbour assembled from the catalogue (`assets/review/city.js`).
- 87 models built by Blender script; generated models from Trellis 2 on fal; three rock sets, a bust and a lion head from Poly Haven.
- Asset pipeline: normaliser, review scene, still renderer, side-by-side quality check.
- Vercel preview of the review scenes.
- Asset bible (16 Nov) and constitution with the Bolts addendum (15 Nov).
- 32.5 s vertical teaser with Zeya voiceover (`teaser-3d/`).
