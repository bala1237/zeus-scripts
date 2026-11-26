# Zeus World: plan

Where the project stands and what happens next. Keep this short and current; detail belongs in the backlog and the knowledge files.

Last updated: 26 Nov 2026.

**Live preview:** https://zeus-world-preview-bala-0416.vercel.app/city.html (public link; see `knowledge/hosting.md`).

## Now

| Item | Backlog | State |
| --- | --- | --- |
| Documentation system (plan, backlog, knowledge, changelog, skills) | none | Done 22 Nov, merged to the default branch |
| Battle rebuilt: real soldiers, proper arrows and lightning, fast-cut camera | ZW-026, 027, 028 | Approved by the owner 24 Nov and closed |
| Building labels showing during the battle | ZW-029 | Fix shipped 24 Nov. Waiting for the owner to confirm |
| Professional laser and lighting system | ZW-036 to ZW-039 | On `/laser.html`: the club rig with a Lighting Director and six themes (phase 3), a new beat tracker (ZW-038), a Flow mode (ZW-037) and the festival look, Olympus (ZW-039), all shipped 25 Nov. Waiting for the owner on each |
| Andie's Place: a branded backdrop for another host | ZW-042 | First version shipped 25 Nov at `/andie.html`. Waiting for the owner |
| The Zeus Stage for music | ZW-034, ZW-035 | Look approved by the owner 24 Nov. Follow-up shipped: still without music, visibly on the beat, neon glow. Waiting for the owner to try it with music |
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

0. **ZW-051, the open world in phases** (`WORLD-PLAN.md`). Published: phase 1 (people and the newcomer), phase 2 (a real ground surface), phase 4 (the remote for OBS), phase 5 (dusk, night, dawn, storm: the Light row). His check: people in motion; the ground close up; frame rate now; the remote in OBS. **Waiting for his approval of two picture sheets** (spend approved 26 Nov): phase 3, twelve countryside pictures (`assets/sheets/countryside_concepts.jpg`), then built in Blender; phase 6, six animals (`assets/sheets/animal_concepts.jpg`), then 3D models. His check for phase 5: each light in motion, the rain and lightning, frame rate at night. Next free work: phase 7 (new places), once the countryside models exist.
0. **ZW-049, the open world.** Look accepted. Jitter on the fast low flights traced to the camera's path and fixed (measured); published. His check on `/world.html?debug=1`: are the fast flights smooth now; frame rate. Known gaps after that: the ground's surface, cliffs and mountains, a fuller village, people.
0. **ZW-050, the hero film by link.** On `/hero.html` choose the film, type the name, press **Copy link for OBS**, and paste it as the URL of a browser source (1920 × 1080, "Control audio via OBS" ticked). Does it fill the source and play when the scene is shown. Hide the source and show it again: does the film now start from the beginning each time. For a window capture instead: is the gold line round the picture enough to crop by.
0. **ZW-047, two new hero films.** The Last Banner and The Well are made and on `/hero.html` (Film list). Watch both with sound: do the hooks hide the story; do the moving stills pass as film; is the music at the right level; does the name land. Next ideas: The Lighthouse, The Bell; the narrator saying any name; the team version.
0. **ZW-048, the pages in OBS.** Lasers listening inside OBS work on his Mac (OBS started with the switch). To try: the hero film's remote (OBS: Tools, WebSocket Server Settings, on; then `/hero.html` in Chrome, Connect to OBS, Play in OBS); the RODECaster as the input (`input=rode`); `city.html?ui=0`; whether the input still goes silent now that the page reconnects.
0. **ZW-047, the hero film.** Second cut of The Fire-Bringer at `/hero.html`, after his review. Watch with sound: does the new opening hide what the film is about and pay off; is the "Zeus-authorative" narrator right; is the music at the right level under the voice; does the name's reveal land; which of the four letterings (A to D on the sheet). Then: team version, more scripts.
0. **ZW-046, the largest gifts as realistic film clips.** On `/laser.html`, Gift test row: **Pegasus** (hoofbeats of light on the pillars, then the lasers open into wings and feathers fall), **Zeus** (his thunderbolt lands on the temple and lights all twelve flames) and 22,000 (the lion). How do they look in motion; do the stage's moments meet the clips'; which gift next.
0. **ZW-045, gift moments, redesigned.** On `/laser.html`: Small, Medium and Big gift, and "Light all 12". Does it make him say wow; lengths; is the flame-and-awakening idea right. TikFinity to be connected later.
0. **ZW-044.** `/laser.html` now has the picture in a resizable 16:9 box with the controls below. Confirm it is as wanted.
0. **ZW-043, Andie's Place in TikTok LIVE Studio.** Use the "Copy link for LIVE Studio" button and paste the link as a browser source. Does it move now. If not, add `&debug=1` and report the line across the top of the picture, or that there is none.
0. **ZW-042, Andie's Place.** "Looks good for now" (owner, 25 Nov). He will share her actual image; then the furniture, plants and logo are fixed. Still to confirm: that it works in TikTok LIVE Studio.
0. **ZW-041, the building cues, second version (after watching the video).** In Olympus: the oracle cue (the video's opening), chase, corners, colonnade, strobe, on a stage rebuilt as a temple with three pillars each side. Is this what he loved; how often should they come; which other moments of the video next (white-outs, white beams, red wash, temple as a screen).
0. **ZW-039, the festival look (Olympus).** It opens the show on `/laser.html`. Is it the look he loved in the Transmission video; what frame rate does the panel show with this many beams; Stage set on or off over his camera; what in the video's movement should be added.
0. **ZW-038, the new beat tracker.** On `/laser.html` press Listen with music playing. Does the status say "on the beat at ..." with the right tempo; do the lights land on the beat (slide Beat timing if they are early or late); does it go quiet in a breakdown and hit on the drop; which tracks still fool it. And **ZW-037**: press Show (or L) for the new Flow mode. Is this the "infinite move" he meant; ribbons or more smoke; and should the lasers move towards the dense, many-coloured look of his two concert references.
1. **ZW-036, phase 3 of the lasers (the gate).** Open `/laser.html`, press Demo or Listen, try the theme list, Next look, Blackout and the Camera button, and put it over your camera in LIVE Studio. Does it feel 3D; are the themes different enough; camera moves on or off; any pattern to change. Still open from phase 2: does it combine by Add or Screen blending or as a transparent source; what frame rate does the panel report.
2. **ZW-035, the stage.** With music playing, press Listen to the music and share its tab or screen with audio. Does the lamp flash with the beat and do the lights hit with it; does it stand still when the music stops; is the neon glow right.
3. **ZW-030, the stream as a journey.** Answer the five questions at the end of that section in `BRAINSTORM-GAME.md`.
4. **ZW-029.** Confirm the building labels and name plates no longer show during a battle.
5. **ZW-024, the cinematic city tour.** Shipped 23 Nov. Watch a full loop on the preview (about three and a half minutes): does it feel like a film; any shot that is dull, too close, blocked or too long; the pace; the titles; the shots that follow a citizen.
6. **ZW-025, after a battle is won.** Press the Battle button; the first battle is a win. After the rival is driven off: does the storm of gold feel like a big moment; is the darkening right; the triumph's pace and shots; the house tour; the wreath; the titles.
7. **ZW-017, the game brainstorm.** Read `BRAINSTORM-GAME.md`, answer its seven questions and pick the ideas to pursue. ZW-015 (battle damage) and ZW-016 (victory celebration) are logged and wait on the same conversation.
8. **Feedback on the liveliness batches.** Batches 1, 2, 3 and 5 are on the preview. No feedback yet. The checklists:
   - **People.** Natural walking, no sliding or walking through stalls, lamps or buildings; correct height over the bridge; is 44 the right number.
   - **Construction.** Does the council hall rise convincingly; do the Bolts labels stay on their buildings; is the lightning and flash too strong.
   - **Ambient.** Is the cloth ripple visible enough; tree sway; smoke amount; does the fountain spray read as water; the sailing boat.
   - **Day cycle and tour.** Is the change smooth; any stutter; cycle length; tour pace and stops; does any stop start inside a building.
   - **Frame rate** on a computer and a phone, day and dusk (counter is top right).
9. **ZW-001.** Memory figures from Chrome's task manager (Shift+Esc) with the preview open: the tab and "GPU Process", after one minute and after ten. And confirm the city looks the same as before.
10. **ZW-019.** Press the Battle button and watch the new camera. Does it feel cinematic; is any shot too close, too far or too long; are the cuts too frequent.
11. **ZW-004.** Frame rate on the preview (counter top right), on a computer and a phone, in the wide view and in the street view. Does any tree or citizen visibly change as the camera moves towards or away from it.
12. **ZW-012.** Do the women walk naturally now, including when they stop, cheer and clap.
13. **ZW-013.** Name plates: size and style, and should apartment blocks, shops and public buildings carry names too.
14. **ZW-014.** Do citizens look natural when they stand at the stalls and shops; is the movement too little or too much.
15. **ZW-002.** Is the flicker on the tower tops gone.
16. **ZW-003.** Approval to spend roughly $1 to $2 per animal on fal.
17. **Rename the default branch to `main`** in the GitHub settings (see `knowledge/hosting.md`, "Branches").
18. The open questions in `DECISIONS.md`.

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
