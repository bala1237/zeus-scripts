# Zeus World: backlog

Every bug and enhancement, numbered. The owner reports; the session logs it here before working on it.

## How to use this file

- **Adding.** Take the next number (`ZW-` plus three digits; numbers are never reused). Add a row to the open table and a detail section below it. Record the date, who reported it, and the owner's own words where they matter.
- **Type.** `Bug` (something is wrong), `Enhancement` (something new or better), or `Brainstorm` (ideas to work out and choose from before anything is built; the entry points to a document).
- **Priority.** `High`, `Medium` or `Low`. The owner decides; if they have not said, write the session's guess followed by `(proposed)`.
- **Status.** `Open`, `In progress`, `Fix shipped` (delivered, waiting for the owner to confirm), `Blocked` (say on what), `Done`.
- **Closing.** When the owner confirms, or for work that needs no confirmation, move the row to the closed table with the date and the commit, and keep the detail section.
- **Next number: ZW-025.**

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
| ZW-018 | Enhancement | Show a live battle between our city and the rival's during a TikTok battle | Medium | First version accepted by the owner; real battle events still to connect | 22 Nov 2026, owner |
| ZW-019 | Enhancement | Cinematic camera during the battle: closer, moving between points of interest | High | Fix shipped | 22 Nov 2026, owner |
| ZW-020 | Enhancement | A palace, with queens living in it | Medium (proposed) | Open, not started. Roadmap phase 2 | 22 Nov 2026, owner |
| ZW-021 | Enhancement | A living day: people working, markets, celebrations, dancing, enough for long streams | High (proposed) | Open, not started. Roadmap phase 1 | 22 Nov 2026, owner |
| ZW-022 | Enhancement | Walk through the battle MVP's property, in and out, to showcase it | Medium (proposed) | Open, not started. Roadmap phase 3 | 22 Nov 2026, owner |
| ZW-023 | Brainstorm | The bigger plan: build it like an actual game, in phases | High | Roadmap written; waiting for the owner's choices | 22 Nov 2026, owner |
| ZW-024 | Enhancement | Cinematic city tour in place of the 360 rotation | High | Fix shipped | 23 Nov 2026, owner |

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

- **Asked:** 22 Nov 2026, by the owner: "during battles, can we simulate a battle between us and the rivals?" Then: "go ahead with the siege at the gate."
- **First version shipped 22 Nov 2026:** a siege at the south gate. Two armies of hoplites face each other outside the wall, and the line between them moves with our share of the score. Arrows, catapult stones, dust, a rival camp, guards on the wall, and a strength bar with the time left. A win ends with the rival driven off, lightning and cheering; a loss with our army falling back through the gate. Detail in `knowledge/battle.md`.
- **It runs on a made-up score.** The Battle button in the controls starts one; `?battle` loops them. Real battle events are not connected (ZW-009), and whether the capture path provides both scores and the time left is still unconfirmed.
- **Built free**, entirely in code. The soldiers are simple stylised figures that read at the battle camera's distance, not close-up characters.
- **Checked:** stills at three scores, by day and dusk, and a whole demo battle stepped through without errors. Not seen in motion.
- **Owner's verdict, 22 Nov 2026:** "yes the battle was good and loved it." Pace and length are good for now. The look is good. The wording on the bar is right. The one request, a closer and more cinematic camera, is ZW-019.
- **For the real wiring (owner, 22 Nov 2026):** a real TikTok battle runs for five minutes, and the action should be dictated by the score. Not to be worried about for now.
- **Possible next steps:** proper marching and fighting soldiers (costs money); scripted models for tents and catapults; sound; damage after a loss (ZW-015) and the surprise celebration after a win (ZW-016), which hook into the battle's result; the other settings discussed (sea battle, duel in the stadium, Zeus against the rival's god).
- **Constitution:** no permanent loss for either side; strength shown, never coins or gift values; taking part must count for everyone.

### ZW-019: Cinematic camera during the battle

- **Reported:** 22 Nov 2026, by the owner, after watching the siege: "need little more zoom and focus like a cinematic view camera focusing on different so it feels real and close."
- **Meaning:** during a battle the camera should come in close and move between points of interest (the clash, the ranks, the catapults, the wall), like a film, instead of holding one wide view.
- **Shipped 22 Nov 2026:** five seconds into a battle a film-style camera takes over. Nine kinds of shot, each held six to eight seconds with a slow move, then a cut: down the corridor between the two lines, across the clash from the flank, over our ranks, from behind the rival towards the city, past a catapult, down from the wall, high over the field, the gate under pressure, and the rival's retreat. The shots follow the fighting line as it moves, and favour the gate when we are losing and their camp when we are winning. Detail in `knowledge/battle.md`.
- The soldiers gained legs, helmets and smaller crests so they hold up closer in.
- Touching the view hands the camera back to the viewer. `?cine=0` turns it off.
- **Checked:** a still of every shot, and a whole battle stepped through to confirm the sequence. The cuts and camera moves have not been seen in motion.
- **Waiting on the owner:** does it feel cinematic; is any shot too close, too far or too long; are the cuts too frequent; any shot to add or drop.

### ZW-020: A palace, with queens living in it

- **Reported:** 22 Nov 2026, by the owner: "we need a palace and have the queens in there. I will get to choose who they are. For now we can have random."
- **Plan:** `ROADMAP.md`, phase 2. A scripted palace with a courtyard, a balcony and a throne hall; crowned queens who appear on the balcony, walk the gardens and take part in events; guards and a herald.
- **First version can be free:** the palace built by Blender script, the queens as the existing woman citizen with a crown and a royal colour, names picked at random.
- **To settle:** how many queens; what makes someone a queen; what they get and do; where the palace stands; how the owner chooses them (a director's console does not exist yet).
- Not started.

### ZW-021: A living day

- **Reported:** 22 Nov 2026, by the owner: "since it's going to be during my stream which runs for long hours, we need to ensure we have a lot more things people can explore and we showcase. People working, markets, community celebrations, dancing and so on."
- **Plan:** `ROADMAP.md`, phase 1. People at work at the forge, bakery, pottery, quay and building sites; market day; a ring dance, a procession to the temple, a play in the amphitheatre, athletes at the gymnasium, a wedding, a feast; a programme of events through the stream announced a little ahead; the battle's film-style camera generalised to showcase each event.
- **Cost:** movements made in code where possible, as the standing pose was. Paid animations only if those are not good enough, and only with the owner's approval.
- Related: ZW-014 (the standing pose), ZW-019 (the cinematic camera), ZW-003 (animals).
- Not started.

### ZW-022: Walk through the battle MVP's property

- **Reported:** 22 Nov 2026, by the owner: "after battle, I should be able to walk through the property of the MVP, in and out, and showcase what they have built for themselves."
- **Plan:** `ROADMAP.md`, phase 3. First a showcase walk outside: through the garden gate, round the garden, up to the porch, with the owner's name on screen. Then inside.
- **Settled 23 Nov 2026:** the MVPs are the battle's top three, and the owner has amended the constitution to allow naming them (addendum of 23 Nov 2026). Ideas for the showcase (a triumph, a house tour, a feast, a wreath, a postcard) are in `BRAINSTORM-GAME.md`.
- **Two things that were open when this was logged** (the second is now settled as above):
  - **Interiors.** The standing decision is exteriors only (`DECISIONS.md`). "In and out" reverses it, and interiors need rooms, furniture and a way for people to arrange them.
  - **Naming the MVP.** The constitution forbids any ranking by spend on stream. An MVP is the top supporter of a battle. It is the owner's rule to change; the options are in `ROADMAP.md`, "Things to settle".
- **Depends on:** real homes built by real people (ZW-009), real battles (ZW-018), and a way for the owner to steer the walk.
- Not started.

### ZW-023: The bigger plan

- **Reported:** 22 Nov 2026, by the owner: "I need help with ideas and expanding on it to build like an actual game. We don't have to do everything now, but have the bigger plan and build in phases and improvise."
- **Written:** `ROADMAP.md`. Three loops (the moment, the stream, the city), six phases each ending in something to show on stream, the foundations they lean on, a suggested order, and six things to settle.
- Continues ZW-017, whose ideas are in `BRAINSTORM-GAME.md`.
- **Research, 22 Nov 2026:** the owner asked to research first and then discuss ("I have a big vision on making this game the next GTA of games"). Report: `reports/Zeus World game design research.md` at the repository root, with the notes behind it in `research_notes/`. Its main conclusion is that Zeus World succeeds as a hosted show: the simulation supplies events, a present human host gives them meaning, and people stay for characters and a stake that is theirs. It ranks fourteen ideas by strength of evidence and flags where the owner's requests need care (naming a battle MVP, gifts and TikTok's rules, damage after a loss, how queens are chosen).
- **Things the research says to settle before building on real TikTok events:** read TikTok's current LIVE and monetisation rules on the official pages (the research could only see extracts); measure the real delay between a viewer's tap and what they see; decide whether to rest on an unofficial data feed, since no official one was found.
- **Discussion, 23 Nov 2026:** the owner set four directions: build from Bolts and grow slowly, with comments and taps counting and Bolts won in games played on stream; engaging ideas wanted for showcasing the battle's MVP; a structure that builds over time and opens levels; elevated moments tied to momentum (a ranking, a big win) that people must wait to see again. Proposals in reply are recorded in `BRAINSTORM-GAME.md`, "Discussion, 23 Nov 2026".
- **The owner's answers, 23 Nov 2026:** the games are Family Feud, Bible quiz, number guessing and the like, open to anyone; a battle's MVPs are its top three; the backbone and the first spectacle are left to recommendation. Recorded in `DECISIONS.md`, a constitution addendum, and `BRAINSTORM-GAME.md`. `ROADMAP.md` now opens with what changed.
- **Recommended next build, waiting for the owner's go-ahead:** the after-battle sequence (storm of gold, triumph of the top three, house tour, lasting marks), on made-up names.

### ZW-024: Cinematic city tour in place of the 360 rotation

- **Reported:** 23 Nov 2026, by the owner: "For now we are doing a 360 rotation. But I want it like a cinematic shot. Can we discuss the options on it so people get an immersive feeling like a movie and the tour is more realistic."
- **Today:** the tour glides between seven fixed viewpoints and turns slowly round each one.
- **Options put to the owner:**
  1. A film crew's shot list for each place: push in, rise and reveal, track along a street, a low hero angle. This is what the battle camera does.
  2. Follow a citizen: the camera walks behind or beside one person through the streets.
  3. A visitor's walk at eye level: in through the gate, up the main street, through the market, to the temple, glancing at things on the way.
  4. Flights: sweeping from district to district, over roofs, through the gate, along the river, round the lighthouse.
  5. A director that goes where something is happening and builds each visit as wide, then medium, then close.
  6. A film look: lens changes, slight hand-held sway, soft-focus backgrounds, place names on screen, music.
- **Recommended:** a director that treats each place as a three-shot visit (a flight in, a move through at street level, a close detail), follows a citizen between places, and breaks off for events. Lens changes, gentle sway and place titles first; soft-focus backgrounds later, since they cost frame rate. The 360 turn stays as a manual option.
- **Settled by the owner, 23 Nov 2026:** the stream is wide; place names appear on screen. Pace: the owner asked what "livelier" meant; calm (shots of eight to ten seconds) is the default for the everyday tour, with quicker cutting kept for battles and big moments, and a setting to switch.
- **Shipped 23 Nov 2026:** the tour is now a film of the city. Seven places, each a visit of three shots (a flight in, a move through at street level, a close detail) under a title; between places the camera follows a citizen through the streets. One loop takes about three and a half minutes. Lens changes and a slight hand-held sway at street level. Detail in `knowledge/city-scene.md`, "The cinematic tour".
- **Not included yet:** soft-focus backgrounds (they cost frame rate), music, and a director that breaks off for events other than battles.
- **The old tour** is still available as `?tour=classic`, and the Rotate button still turns the view by hand when the tour is off.
- **Checked:** every shot rendered at its midpoint and looked at (eight of nineteen were reframed), and the whole loop stepped through to confirm the sequence. The moves, cuts and following shots have not been seen in motion.
- **Waiting on the owner:** does it feel like a film; any shot that is dull, too close, blocked or too long; the pace; the look of the titles; whether following a citizen works.
- Builds on ZW-019 (the battle's cinematic camera). Related: ZW-021 (a living day), ZW-022 (the house tour).

