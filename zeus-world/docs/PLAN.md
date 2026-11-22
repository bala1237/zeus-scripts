# Zeus World: plan

Where the project stands and what happens next. Keep this short and current; detail belongs in the backlog and the knowledge files.

Last updated: 22 Nov 2026.

**Live preview:** https://zeus-world-preview-bala-0416.vercel.app/city.html (public link; see `knowledge/hosting.md`).

## Now

| Item | Backlog | State |
| --- | --- | --- |
| Documentation system (plan, backlog, knowledge, changelog, skills) | none | Done 22 Nov, merged to the default branch |
| The women walk in a weird way | ZW-012 | Fix shipped 22 Nov. Waiting for the owner to watch her on the preview |
| Houses should show a name | ZW-013 | Shipped 22 Nov as plates above the roofs. Waiting for the owner's view on size, style and which buildings |
| Chrome uses a lot of memory when the city runs | ZW-001 | Measured and fix shipped 22 Nov: memory roughly halved, picture unchanged. Waiting for the owner's figures from the preview |

## Next, in order

The owner sets the order. This is the current proposal; the numbers point to `BACKLOG.md`.

1. **ZW-004, frame rate.** Measured at 5.0 million triangles and 2,320 draw calls a frame. Start with drawing repeated models in one go and skipping citizens who are off screen. Further memory cuts under ZW-001 if the owner's figures are still too high.
2. **Owner feedback on batches 1, 2, 3 and 5** (see "Waiting on the owner"), fixed in one pass.
3. **ZW-005, finish the look.**
4. **ZW-007, construction loop**, and **ZW-008, cloth.**
5. **ZW-006, known model flaws.**
6. **ZW-003, animals**, once the spend is approved.
7. **ZW-009, wire the catalogue into the product.**
8. **ZW-010, models still to make.**

## Waiting on the owner

1. **Feedback on the liveliness batches.** Batches 1, 2, 3 and 5 are on the preview. No feedback yet. The checklists:
   - **People.** Natural walking, no sliding or walking through stalls, lamps or buildings; correct height over the bridge; is 44 the right number.
   - **Construction.** Does the council hall rise convincingly; do the Bolts labels stay on their buildings; is the lightning and flash too strong.
   - **Ambient.** Is the cloth ripple visible enough; tree sway; smoke amount; does the fountain spray read as water; the sailing boat.
   - **Day cycle and tour.** Is the change smooth; any stutter; cycle length; tour pace and stops; does any stop start inside a building.
   - **Frame rate** on a computer and a phone, day and dusk (counter is top right).
2. **ZW-001.** Memory figures from Chrome's task manager (Shift+Esc) with the preview open: the tab and "GPU Process", after one minute and after ten. And confirm the city looks the same as before.
3. **ZW-012.** Do the women walk naturally now, including when they stop, cheer and clap.
4. **ZW-013.** Name plates: size and style, and should apartment blocks, shops and public buildings carry names too.
5. **ZW-002.** Is the flicker on the tower tops gone.
6. **ZW-003.** Approval to spend roughly $1 to $2 per animal on fal.
7. **Rename the default branch to `main`** in the GitHub settings (see `knowledge/hosting.md`, "Branches").
8. The open questions in `DECISIONS.md`.

## What exists

| Area | State |
| --- | --- |
| Product rules | Constitution with Bolts, personal plots, community builds, account linking by chat code |
| Teaser | 32.5 s vertical teaser in `teaser-3d/` with Zeya voiceover |
| Catalogue | 124 files in `assets/models/` (about 115 distinct models plus kept alternates) |
| Scripted models | 87 built by Blender script, free, via `assets/build.sh` |
| Scenes | Single-model review, six-plot street, whole walled city with harbour |
| City scene | Lit, graded for streaming, alive: people, construction, ambient motion, day-to-dusk cycle, camera tour |
| Hosting | Vercel preview of the review scenes |

All motion in the city is a timed demo. Bolts counts, viewer names and build progress are made up. Nothing is connected to TikTok or a simulation yet.

## Verified, and not

- **Verified:** every model rendered beside a citizen and the villa; the city from several fixed views in day and dusk as still frames; the controls panel by driving it in a browser; no page or shader errors.
- **Not verified here:** anything in motion. This machine has no graphics card, so a still takes about four minutes and motion cannot be watched. Walking, the build loop, cloth, smoke, the day-to-dusk change, the camera tour and the frame rate have only been seen by the owner on the preview.
- **Owner has confirmed:** the page loads, the city "looks awesome", auto-rotation and controls work.

## Sheets worth opening first

`assets/sheets/city.jpg` (the whole city), `city_life.jpg`, `city_ambient.jpg`, `city_effects.jpg`, `street_milestone.jpg`, `temple_of_zeus.jpg`, `polyhaven_trial.jpg`, `city_grade_before_after.jpg`.
