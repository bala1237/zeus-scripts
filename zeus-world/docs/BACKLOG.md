# Zeus World: backlog

Every bug and enhancement, numbered. The owner reports; the session logs it here before working on it.

## How to use this file

- **Adding.** Take the next number (`ZW-` plus three digits; numbers are never reused). Add a row to the open table and a detail section below it. Record the date, who reported it, and the owner's own words where they matter.
- **Type.** `Bug` (something is wrong) or `Enhancement` (something new or better).
- **Priority.** `High`, `Medium` or `Low`. The owner decides; if they have not said, write the session's guess followed by `(proposed)`.
- **Status.** `Open`, `In progress`, `Fix shipped` (delivered, waiting for the owner to confirm), `Blocked` (say on what), `Done`.
- **Closing.** When the owner confirms, or for work that needs no confirmation, move the row to the closed table with the date and the commit, and keep the detail section.
- **Next number: ZW-012.**

## Open

| No. | Type | Title | Priority | Status | Reported |
| --- | --- | --- | --- | --- | --- |
| ZW-001 | Bug | Chrome uses a lot of memory when the city runs | High (proposed) | Open | 22 Nov 2026, owner |
| ZW-002 | Bug | Flicker on the tower tops | Medium | Fix shipped | 22 Nov 2026, owner |
| ZW-003 | Enhancement | Animals: cats, dogs, donkey with cart, goats | Medium | Blocked on spend approval | 22 Nov 2026 |
| ZW-004 | Enhancement | Performance: frame rate, download size, a quality setting | High (proposed) | Open | 22 Nov 2026 |
| ZW-005 | Enhancement | Finish the look: marble, grass, old scenes, fountain speckle | Medium | Open | 22 Nov 2026 |
| ZW-006 | Bug | Known model flaws | Low | Open | 22 Nov 2026 |
| ZW-007 | Enhancement | Construction loop looks abrupt and hollow | Medium | Open | 22 Nov 2026 |
| ZW-008 | Enhancement | Proper flag wave on banners | Low | Open | 22 Nov 2026 |
| ZW-009 | Enhancement | Wire the catalogue into the product | Medium | Open | 22 Nov 2026 |
| ZW-010 | Enhancement | Models still to make | Low | Open | 22 Nov 2026 |
| ZW-011 | Enhancement | Housekeeping: model storage, licence check, protect the preview | Low | Open | 22 Nov 2026 |

## Closed

| No. | Type | Title | Closed | Commit |
| --- | --- | --- | --- | --- |
| | | Nothing closed yet | | |

## Details

### ZW-001: Chrome uses a lot of memory when the city runs

- **Reported:** 22 Nov 2026, by the owner: "my chrome eats up lot of memory when i'm running zeus world".
- **Not yet known:** how much memory, on which machine, and whether it grows over time or is high from the start. Ask the owner for the figure from Chrome's task manager (Shift+Esc) after one minute and after ten.
- **Likely causes, from reading the code, not yet measured:**
  - Every model is downloaded and kept at once: about 80 MB of files, 91 models.
  - Textures are stored compressed on disk (WebP) but are unpacked in full in graphics memory. A 2048 texture takes about 21 MB there; the generated models (trees, bushes, trireme, citizens) carry the largest.
  - The sun's shadow map is 8192 × 8192, about 256 MB on its own.
  - Each of the roughly 58 citizens has its own copy of its materials.
  - Every placed copy of a model is a separate object: about 340 road and plaza tiles alone.
- **If it grows over time** it is a leak. Candidates: the lightning bolt builds new geometry on each strike and never frees it (`life.js`, `strike`).
- **Plan:** measure first (see `knowledge/performance.md`), then fix the largest item, then measure again. Related: ZW-004.

### ZW-002: Flicker on the tower tops

- **Reported:** by the owner, on the preview.
- **Cause:** the battlements shared a face with the wall top under them, so the two surfaces fought for the same pixels.
- **Fix:** shipped 22 Nov 2026; the battlements no longer share a face with the surface below.
- **Status:** the owner has not yet confirmed that it is gone.

### ZW-003: Animals

- Birds are in. Cats, dogs, a donkey with a cart and goats need generating and rigging.
- Cost: roughly $1 to $2 each on fal. Possibly free if Mesh2Motion works for four-legged rigs; that has not been evaluated.
- **Blocked:** the owner has not approved the spend.

### ZW-004: Performance

- Unmeasured. The city is about 80 MB and 110 models; 50 animated citizens are about a million triangles.
- Likely work: far-view models, loading distant buildings last, fewer real lights, a quality setting, drawing repeated models in one go, not animating citizens who are off screen.
- Needed before the scene is used in OBS or on a phone.
- Shares its measurements with ZW-001.

### ZW-005: Finish the look

- Marble reads slightly cool under the sky light.
- Grass is strong, especially at dusk.
- `street.js` and `main.js` are still on the old pale lighting; apply the stream grade.
- The fountain water at dusk still shows a faint speckle.

### ZW-006: Known model flaws

- Gymnasium roof has notches at the corners.
- The amphitheatre's stage building hides the stage from the front.
- Pergola vines are sparse.
- River bank stones are thin on one side.
- Boundary stones read a little like logs.
- One villa in the north-east row of the city was dropped because it sat on the wall.

### ZW-007: Construction loop

- A finished building vanishes and restarts abruptly.
- Walls are cut off flat, so the hollow inside shows.
- Only the temple has real stage models.
- Builders "hammer" with the clap animation.

### ZW-008: Flag wave

- Banner ripple is kept small because the gold bolts are separate meshes and sink into moving cloth.
- A proper wave needs the bolt made part of the cloth in `assets/blender/parts.py` (`banner`).

### ZW-009: Wire the catalogue into the product

- The phone plot builder (`style-test/`) still uses the old generated villa parts stretched to fit. The new parts are at real size with fixed origins (socket table in the asset bible).
- Then drive the city from real Bolts and viewers.

### ZW-010: Models still to make

- Scriptable, free: Corinthian porch, arched windows, rooftop statue and chimney extras, apartment block tier 4.
- Need generation or another route: more tree species (laurel, pomegranate, fig, plane, almond), vines, more citizens and outfits, statues, Zeya and Zeus figures.

### ZW-011: Housekeeping

- Decide whether `assets/models/` (about 85 MB in git) should move to file storage.
- Licence check on the fal generators before anything ships.
- The preview link is public and serves every model file. Protect it or take it down before sharing more widely.
