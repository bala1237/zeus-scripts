# Zeus World: changelog

What changed, when and why. Newest first. One entry per piece of work, in plain language, with the backlog number where there is one. The commit history has the line-by-line detail.

## 22 Nov 2026

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
