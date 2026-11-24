# Zeus World: plan

Where the project stands and what happens next. Keep this short and current; detail belongs in the backlog and the knowledge files.

Last updated: 22 Nov 2026.

**Live preview:** https://zeus-world-preview-bala-0416.vercel.app/city.html (public link; see `knowledge/hosting.md`).

## Now

| Item | Backlog | State |
| --- | --- | --- |
| Documentation system (plan, backlog, knowledge, changelog, skills) | none | Done 22 Nov, merged to the default branch |
| Battle rebuilt: real soldiers, proper arrows and lightning, fast-cut camera | ZW-026, 027, 028 | Approved by the owner 24 Nov and closed |
| Building labels showing during the battle | ZW-029 | Fix shipped 24 Nov. Waiting for the owner to confirm |
| After a battle is won | ZW-025 | Shipped 23 Nov: storm of gold, triumph, house tour. Waiting for the owner to watch it |
| Cinematic city tour | ZW-024 | Shipped 23 Nov. Waiting for the owner to watch it |
| Live battle against the rival | ZW-018 | Approved by the owner 22 Nov. Real TikTok battle events (five minutes, score-driven) still to connect |
| Cinematic battle camera | ZW-019 | Shipped 22 Nov. Waiting for the owner to watch it |
| Make the city feel like a game | ZW-017 | Brainstorm written 22 Nov (`BRAINSTORM-GAME.md`). Waiting for the owner's choices. Nothing to be built yet |
| Frame rate | ZW-004 | First batch shipped 22 Nov: draw calls and triangles roughly halved. Waiting for the owner's frame rate on the preview before deciding the next batch |
| The women walk in a weird way | ZW-012 | Fix shipped 22 Nov. Waiting for the owner to watch her on the preview |
| Idle animation is a turning stride | ZW-014 | Fix shipped 22 Nov: a standing pose made in code. Waiting for the owner to watch it |
| Houses should show a name | ZW-013 | Shipped 22 Nov as plates above the roofs. Waiting for the owner's view on size, style and which buildings |
| Chrome uses a lot of memory when the city runs | ZW-001 | Measured and fix shipped 22 Nov: memory roughly halved, picture unchanged. Waiting for the owner's figures from the preview |

## The bigger plan

`ROADMAP.md` (22 Nov 2026) lays the game out in six phases: a living day, the palace and queens, homes worth visiting, levels and unlocks, battles complete, a world to explore. It is waiting for the owner to choose the order and settle six questions. Until then the list below stands.

## Next, in order

The owner sets the order. This is the current proposal; the numbers point to `BACKLOG.md`.

1. **ZW-004, frame rate, second batch**, if the owner's frame rate is still too low: a quality setting for phones, far-view versions of the largest buildings, lighter scaffolding.
2. **Owner feedback on batches 1, 2, 3 and 5** (see "Waiting on the owner"), fixed in one pass.
3. **ZW-005, finish the look.**
4. **ZW-007, construction loop**, and **ZW-008, cloth.**
5. **ZW-006, known model flaws.**
6. **ZW-003, animals**, once the spend is approved.
7. **ZW-009, wire the catalogue into the product.**
8. **ZW-010, models still to make.**

## Waiting on the owner

1. **ZW-030, the stream as a journey.** Answer the five questions at the end of that section in `BRAINSTORM-GAME.md`.
2. **ZW-029.** Confirm the building labels and name plates no longer show during a battle.
3. **ZW-024, the cinematic city tour.** Shipped 23 Nov. Watch a full loop on the preview (about three and a half minutes): does it feel like a film; any shot that is dull, too close, blocked or too long; the pace; the titles; the shots that follow a citizen.
4. **ZW-025, after a battle is won.** Press the Battle button; the first battle is a win. After the rival is driven off: does the storm of gold feel like a big moment; is the darkening right; the triumph's pace and shots; the house tour; the wreath; the titles.
5. **ZW-017, the game brainstorm.** Read `BRAINSTORM-GAME.md`, answer its seven questions and pick the ideas to pursue. ZW-015 (battle damage) and ZW-016 (victory celebration) are logged and wait on the same conversation.
6. **Feedback on the liveliness batches.** Batches 1, 2, 3 and 5 are on the preview. No feedback yet. The checklists:
   - **People.** Natural walking, no sliding or walking through stalls, lamps or buildings; correct height over the bridge; is 44 the right number.
   - **Construction.** Does the council hall rise convincingly; do the Bolts labels stay on their buildings; is the lightning and flash too strong.
   - **Ambient.** Is the cloth ripple visible enough; tree sway; smoke amount; does the fountain spray read as water; the sailing boat.
   - **Day cycle and tour.** Is the change smooth; any stutter; cycle length; tour pace and stops; does any stop start inside a building.
   - **Frame rate** on a computer and a phone, day and dusk (counter is top right).
7. **ZW-001.** Memory figures from Chrome's task manager (Shift+Esc) with the preview open: the tab and "GPU Process", after one minute and after ten. And confirm the city looks the same as before.
8. **ZW-019.** Press the Battle button and watch the new camera. Does it feel cinematic; is any shot too close, too far or too long; are the cuts too frequent.
9. **ZW-004.** Frame rate on the preview (counter top right), on a computer and a phone, in the wide view and in the street view. Does any tree or citizen visibly change as the camera moves towards or away from it.
10. **ZW-012.** Do the women walk naturally now, including when they stop, cheer and clap.
11. **ZW-013.** Name plates: size and style, and should apartment blocks, shops and public buildings carry names too.
12. **ZW-014.** Do citizens look natural when they stand at the stalls and shops; is the movement too little or too much.
13. **ZW-002.** Is the flicker on the tower tops gone.
14. **ZW-003.** Approval to spend roughly $1 to $2 per animal on fal.
15. **Rename the default branch to `main`** in the GitHub settings (see `knowledge/hosting.md`, "Branches").
16. The open questions in `DECISIONS.md`.

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
