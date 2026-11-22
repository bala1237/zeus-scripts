# Zeus World: backlog

Every bug and enhancement, numbered. The owner reports; the session logs it here before working on it.

## How to use this file

- **Adding.** Take the next number (`ZW-` plus three digits; numbers are never reused). Add a row to the open table and a detail section below it. Record the date, who reported it, and the owner's own words where they matter.
- **Type.** `Bug` (something is wrong), `Enhancement` (something new or better), or `Brainstorm` (ideas to work out and choose from before anything is built; the entry points to a document).
- **Priority.** `High`, `Medium` or `Low`. The owner decides; if they have not said, write the session's guess followed by `(proposed)`.
- **Status.** `Open`, `In progress`, `Fix shipped` (delivered, waiting for the owner to confirm), `Blocked` (say on what), `Done`.
- **Closing.** When the owner confirms, or for work that needs no confirmation, move the row to the closed table with the date and the commit, and keep the detail section.
- **Next number: ZW-019.**

## Open

| No. | Type | Title | Priority | Status | Reported |
| --- | --- | --- | --- | --- | --- |
| ZW-001 | Bug | Chrome uses a lot of memory when the city runs | High | Fix shipped | 22 Nov 2026, owner |
| ZW-002 | Bug | Flicker on the tower tops | Medium | Fix shipped | 22 Nov 2026, owner |
| ZW-003 | Enhancement | Animals: cats, dogs, donkey with cart, goats | Medium | Blocked on spend approval | 22 Nov 2026 |
| ZW-004 | Enhancement | Performance: frame rate, download size, a quality setting | High | First batch shipped; more to do | 22 Nov 2026 |
| ZW-005 | Enhancement | Finish the look: marble, grass, old scenes, fountain speckle | Medium | Open | 22 Nov 2026 |
| ZW-006 | Bug | Known model flaws | Low | Open | 22 Nov 2026 |
| ZW-007 | Enhancement | Construction loop looks abrupt and hollow | Medium | Open | 22 Nov 2026 |
| ZW-008 | Enhancement | Proper flag wave on banners | Low | Open | 22 Nov 2026 |
| ZW-009 | Enhancement | Wire the catalogue into the product | Medium | Open | 22 Nov 2026 |
| ZW-010 | Enhancement | Models still to make | Low | Open | 22 Nov 2026 |
| ZW-011 | Enhancement | Housekeeping: model storage, licence check, protect the preview | Low | Open | 22 Nov 2026 |
| ZW-012 | Bug | The women walk in a weird way | High | Fix shipped | 22 Nov 2026, owner |
| ZW-013 | Enhancement | Houses should show a name, visible from above | Medium | Fix shipped | 22 Nov 2026, owner |
| ZW-014 | Bug | The "idle" animation is a wide stride that turns round, not a standing pose | Medium | Fix shipped | 22 Nov 2026, found while fixing ZW-012; owner asked for the fix |
| ZW-015 | Enhancement | Losing a TikTok battle damages the city | Medium (proposed) | Open, not started | 22 Nov 2026, owner |
| ZW-016 | Enhancement | Winning a battle triggers a surprise celebration | Medium (proposed) | Open, not started | 22 Nov 2026, owner |
| ZW-017 | Brainstorm | Make the city feel like a game | High (proposed) | Brainstorm written; waiting for the owner's choices | 22 Nov 2026, owner |
| ZW-018 | Enhancement | Show a live battle between our city and the rival's during a TikTok battle | Medium (proposed) | Open, idea only | 22 Nov 2026, owner |

## Closed

| No. | Type | Title | Closed | Commit |
| --- | --- | --- | --- | --- |
| | | Nothing closed yet | | |

## Details

### ZW-001: Chrome uses a lot of memory when the city runs

- **Reported:** 22 Nov 2026, by the owner: "my chrome eats up lot of memory when i'm running zeus world".
- **Measured 22 Nov 2026** (method and full figures in `knowledge/performance.md`): about 1.4 GB for the tab and 2.1 GB for the graphics process, high from the start, not growing. No leak.
- **Causes found:**
  - The same textures were loaded many times: 1,065 textures in memory, only 144 of them different. 1.3 GB of graphics memory, and as much again in the tab.
  - The sun's shadow map took 512 MB.
- **Fix shipped 22 Nov 2026:** identical textures are now loaded once (340 MB), and the shadow map is stored more compactly (192 MB). Measured after: about 0.7 GB for the tab and 0.8 GB for the graphics process. The picture is unchanged, checked by comparing stills of four views.
- **Waiting on the owner:** the figures from Chrome's task manager (Shift+Esc) on the preview, for the tab and for "GPU Process", after one minute and after ten. Close when the owner is satisfied.
- **Further reductions possible** (listed in `knowledge/performance.md`, "What is left"): compressed textures, freeing decoded copies, a smaller shadow map as a quality setting. Not started; some affect the look and need the owner's decision.

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

- **Measured 22 Nov 2026:** every frame drew 5.0 million triangles in 2,330 draw calls. The citizens were 1.8 million of those (the man alone 1.0 million), trees and bushes 1.5 million, and most draw calls were copies of the same tiles, walls and quay pieces.
- **First batch shipped 22 Nov 2026** (the owner asked for this item to go ahead):
  - Repeated pieces are drawn in one go. Picture unchanged.
  - Citizens outside the view are not posed or drawn.
  - The man is now 20,000 triangles instead of 59,000.
  - Distant citizens and plants use lighter far-view models.
  - Result: wide view 2,330 to 1,154 draw calls and 5.0 to 2.2 million triangles; plaza 2.8 to 1.9 million; street 3.2 to 2.3 million.
- **Checked:** stills before and after, far models beside full ones, by day and dusk. Frame rate cannot be measured on the build machine.
- **Waiting on the owner:** the frame rate on the preview (counter top right) on a computer and a phone, and whether any tree or citizen visibly changes as the camera moves towards or away from it.
- **Still to do** (detail in `knowledge/performance.md`, "What is left"): a quality setting for phones; far-view versions of the largest buildings; lighter scaffolding; merging one-off building parts; loading the centre first. Download size is unchanged at about 58 MB.

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

### ZW-012: The women walk in a weird way

- **Reported:** 22 Nov 2026, by the owner, after watching the preview: "the women are walking in a weird way. we need to fix it."
- **Cause:** the woman citizen came from the generator's automatic rig with her whole upper body and head bound to her left forearm bone. Standing still this is invisible; as soon as she moved, her body folded forward and twisted round with the swing of that arm, and her skirt tore between her feet. The skeleton and the animations were correct; the man uses the same ones and walks normally.
- **Fix shipped 22 Nov 2026:** her binding was rebuilt from her shape with a new tool, `assets/reskin.mjs`. Torso on the hips, head on the head bone, arms and bare legs on their own bones, the skirt hanging from the hips and following the stride. No regeneration, no cost. Detail in `knowledge/characters.md`.
- **Checked:** frame sheets of her walk, idle, cheer and clap, from the side and the front, and a still of the street. Motion itself cannot be watched on the build machine.
- **Waiting on the owner:** watch her on the preview. Known compromises: in a long stride her feet show a little ahead of or behind the hem, with nothing drawn of the leg above the ankle.

### ZW-013: Houses should show a name

- **Reported:** 22 Nov 2026, by the owner: "the houses should have name in it. maybe on the roof so its visible?"
- **Shipped 22 Nov 2026:** a name plate stands just above the roof of each home: cream with a gold rim and a gold bolt, the owner's handle in dark blue. It always faces the camera and never gets smaller on screen than a readable size, so names can be read from the wide view. `assets/review/names.js`; detail in `knowledge/city-scene.md`.
- **Which homes:** the five finished villas, the four cottages and the grand villa. The two villas being built already show their owner on the Bolts label. Apartment blocks have no plate (many residents).
- **The names are made up** for the demo.
- **Design choice to confirm:** a plate standing above the roof was chosen over lettering painted on the roof itself, because painted lettering can only be read from one side and is squashed at a low angle. `?names=0` hides the plates.
- **Waiting on the owner:** size, style, and whether apartment blocks, shops and public buildings should carry names too.

### ZW-014: The "idle" animation is not a standing pose

- **Found:** 22 Nov 2026, in the frame sheets made for ZW-012. The owner asked for it to be fixed the same day.
- **Problem:** the clip named `Idle`, which citizens play when they stop at a stall or a shop, has the character in a wide stride, turning the upper body round. It is the same for all three citizens, so it comes from the rigging service's animation set.
- **Fix shipped 22 Nov 2026:** a standing pose made in code (`assets/review/stand.js`) replaces it for all three citizens: feet together, arms hanging, a slight breathing lean, arms drifting a little, a slow look from side to side over seven seconds. Free; no new animation was bought. Detail in `knowledge/characters.md`.
- **Checked:** frame sheets of the pose for all three citizens, and a still of the plaza. The movement within the pose is small and cannot be judged from stills.
- **Waiting on the owner:** does standing look natural on the preview, and is the movement too little or too much.
- **Left as it is:** the man's and the elder's bindings are coarse (the man's torso is rigid on his hips; the elder's cloak follows his arms). They look acceptable.

### ZW-015: Losing a TikTok battle damages the city

- **Reported:** 22 Nov 2026, by the owner. Logged only; the owner said not to start building yet.
- **Idea:** when we lose a battle, a community building takes visible damage, and the community then repairs it.
- **Open points from the owner:** which buildings can be hit; how bad the damage is; how repair is paid for (Bolts?).
- **What the constitution already says** (`CONSTITUTION.md`, "Battles"): a loss sets temporary conditions, and its size sets how severe. A close loss brings a storm and a damaged gate; a heavy loss cracks walls and opens a rebuilding quest. Damage is a visual layer on top of a building, never a change to it, because permanent achievements are never erased. It is capped, and it fades by itself over days so nobody is held hostage. Repair is a shared project needing at least two roles.
- **So the remaining decisions are:** the list of buildings that can be hit; what each level of damage looks like (cracks, scorch marks, scaffolding, a fallen column); whether repair costs Bolts, participation, or both; how long unrepaired damage takes to fade.
- **Depends on:** real battle events from TikTok (ZW-009), and damage overlays for the chosen buildings.
- Related: ZW-016, ZW-017.

### ZW-016: Winning a battle triggers a surprise celebration

- **Reported:** 22 Nov 2026, by the owner. Logged only; not to be built yet.
- **Idea:** a premium, awesome animation that nobody is expecting, so the community wants to take part and see it again.
- **Open points from the owner:** what the celebration is; whether it changes each time so it stays a surprise; how rare it is.
- **What the constitution already says:** a win adds a dated victory banner, a monument on the first major win of a season, and a prosperity condition for the rest of the stream. A surprise celebration is an addition to that, not a conflict.
- **First thoughts, not decided:** a pool of celebrations drawn at random, with rarer ones for bigger wins or winning streaks (Zeus appearing in the sky, fireworks over the harbour, the colossus lighting up, a golden rain, every citizen running to the plaza). The lightning strike and cheering that already exist for a finished building are a small version of this.
- **Depends on:** real battle events from TikTok (ZW-009).
- Related: ZW-015, ZW-017.

### ZW-017: Make the city feel like a game

- **Reported:** 22 Nov 2026, by the owner: "what we have is the bare minimum. It should keep people glued to see what happens next." "We need to bring in the gaming kind of approach. Different levels lock different things. That way people get motivated. It's just a community-driven game and not a single person playing." "Let's brainstorm on making this game interesting where people want to see and explore the world."
- **This is a brainstorm, not a build task.** The ideas are in `BRAINSTORM-GAME.md`.
- **Summary of the document:** one shared city level that the community raises together, with locked things visible in the city before they open; twenty ideas for exploring, for "what happens next", and for each person's place in the shared game; what the constitution rules in or out; seven questions for the owner; a possible first slice.
- **Next step:** the owner answers the questions and picks ideas. Each chosen idea then becomes its own backlog entry.

### ZW-018: Show a live battle between our city and the rival's

- **Asked:** 22 Nov 2026, by the owner: "during battles, can we simulate a battle between us and the rivals?" An idea under discussion; nothing to be built yet.
- **Answer given:** yes. The fight on screen would be driven by the live score of the TikTok battle, so the community sees itself winning or losing as it happens, and the result leads into ZW-015 (damage and repair) or ZW-016 (celebration).
- **What it needs:**
  - The live scores of both sides and the time left. Whether the capture path provides them is not confirmed; it is one of the constitution's open questions.
  - A way to show the fight. Options discussed: a siege at the south gate with a front line that moves with the score; a sea battle in the harbour; a duel of champions in the stadium; Zeus against the rival's god in the sky.
  - A rival to show. Their name would pass the same moderation as any display name.
- **Cheapest first version:** the siege at the gate, told with things that can be scripted for free: banners in formation, volleys of arrows, catapults and their shots, dust and fire, the front line moving. No new character animations. It can be built and tuned against made-up scores before real battle events are connected.
- **Fuller version, costs money:** soldiers who march and fight need new models and animations from the rigging service.
- **Constitution:** the rival starts as an off-screen cause and may later be a second city under the same rules; no permanent loss for either side; scores shown as strength, never as coins or gift values; taking part must count for everyone, not only for gifts.
- **Depends on:** real battle events (ZW-009). Related: ZW-015, ZW-016, ZW-017.
