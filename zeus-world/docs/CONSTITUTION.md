# Zeus World — Product Constitution and Simulation Architecture

Oct 16, 2026 · @Bala

## Purpose

Zeus World is a miniature civilization that the audience collectively governs and develops, not a 3D background that reacts to a TikTok stream. This document locks what a citizen is, what the civilization can do, how events change it, what must persist, and what must never happen, before any renderer, asset tool, or AI component is chosen.

It supersedes the first design draft on every point where they differ, and absorbs the critical design review's seven challenges. Tooling choices (Unity vs Three.js, Meshy vs Tripo) are deliberately downstream of this document.

## Constitution: ten inviolable principles

Every feature, mechanic, and line of narration is tested against these. A proposal that breaks one is rejected, however good it looks on stream.

1. **Belonging is free; prestige is earned.** Anyone who participates can be a citizen. Spending never gates membership.
2. **Collective over individual.** The world advances through coordinated contribution across roles. No single viewer can build, win, or break the world alone.
3. **Permanent achievements are never erased.** Anything the community earned stays in the world's history and on its map. Only temporary conditions change.
4. **Absence is never punished.** Characters rest, travel, or take off-screen assignments. Nothing a viewer owns decays into loss.
5. **Nothing on screen or in narration references coins, gift values, or money.** All progress is framed in-world.
6. **The world lives without input.** Citizens have schedules and routines, so the civilization is visibly alive when the chat is quiet.
7. **Events never touch 3D objects directly.** Every TikTok event becomes a validated change in the simulation; the renderer only observes.
8. **The simulation is deterministic and replayable.** The same event log produces the same world, which makes testing, recovery, and recaps possible.
9. **Zeya never invents history, exposes private interaction detail, or assigns relationships without consent.**
10. **Bala can override anything.** A director console controls narration intensity, camera priority, event suppression, and story beats, and can drop to a safe fallback scene at any time.

## What a citizen is

A citizen is a persistent identity bound to a TikTok account, with a home, an occupation, a history, and standing on four separate dimensions. There is no single opaque score and no TikTok-level floor.

**Three layers of citizenship**

| Layer | How it is reached | What the person gets |
| --- | --- | --- |
| Visitor | First appearance in the stream | A temporary named villager who walks into frame; nothing persists unless they return |
| Citizen | Returns and participates (comments, stays, interacts); reached within a few visits | Persistent identity, a home, an occupation, a place in the history, a nurtured tree |
| Distinguished citizen | Sustained contribution over weeks on any dimension | Advanced responsibilities, visual prestige (banners, a larger home, a title), named in recaps and monuments |

**Four standing dimensions, tracked separately and never summed**

| Dimension | What feeds it | What it unlocks |
| --- | --- | --- |
| Participation | Comments, taps, shares | Crier and messenger roles, a louder voice in the square |
| Consistency | Visit frequency, watch time, streaks (optional, never required) | Builder and steward roles, tree growth |
| Community | Distinct people interacted with, tending others' trees, replies | Merchant and envoy roles, neighbour bonds |
| Support | Gifts, weighted but never shown | General and patron roles, prestige items |

Roles are assigned from whichever dimension leads, so a chatty non-spender and a quiet supporter both hold real roles. Roles evolve: a builder who starts tending trees becomes a steward; a merchant who rallies people before a match can be elected general for that battle.

**Identity record (what persists per citizen)**

- TikTok identifier and display name, with opt-out and name-hiding honoured
- Layer, roles held and when, current occupation and home district
- Standing on each dimension, with the raw events that produced it
- Structures contributed to, bonds with other citizens, tree state
- Interaction history that Zeya may reference, scoped to on-stream public moments only

**Agency, not decoration.** A citizen's character has a daily schedule, tasks drawn from its occupation, and dependencies on other roles: the smith needs ore the merchant supplies, the general needs walls the builders raised. Combined action unlocks shared structures, which is what makes the civilization collective rather than a leaderboard with avatars.

## What a civilization is

The civilization is a semantic model, not a scene. It knows that a building is a marketplace with a footprint and interaction sockets; it does not know which mesh represents it. Themes attach to the model, never replace it.

**Semantic chain for every structure**

Structure → Function (home, forge, market, wall, hall, monument, shrine) → Footprint (grid cells occupied) → Tier (1 to 4 grandeur) → Interaction sockets (where a character works, enters, rallies) → Theme representation (mesh, materials, effects, sounds for the active theme)

A theme ships a representation for every function and tier it supports, conforming to a fixed contract: same footprint, same socket positions, same animation names, same collision bounds, same navigation mesh. A theme missing a representation falls back to the base theme for that structure. This contract is built and validated before the first large asset-generation effort.

**Districts.** The world is a grid of districts, each with an identity (the Forge Quarter, the Market, the Grove, the Hall). A district holds structures, resident citizens, and a mood that temporary conditions modify. The MVP is exactly one district.

**Resources, deliberately few.** Three to start: timber, ore, and grain. Occupations produce or consume them on schedules; shared construction projects consume them in stages. Resources exist to create dependencies between roles, not to simulate an economy. Add a fourth only when a specific livestream moment needs it.

**Shared construction.** A project is a structure with a stage list, each stage needing contributions from at least two different roles. The structure rises visibly stage by stage. When complete it becomes a permanent achievement with the names of every contributor recorded.

**World calendar and lore.** The civilization has a founding date, named seasons, and festivals that recur on its own calendar. Emergent events (a harvest, a shortage, a discovery, a storm) arise from world conditions and civic decisions, not only from TikTok battles.

**Civic decisions.** The community periodically chooses: the next project, the next theme, a festival. Choices are made through participation during a vote window and recorded in the world history.

## How events change the world

Every change to the world is caused by a typed event, validated and deduplicated before the simulation sees it, and recorded in an append-only log. The renderer never receives raw TikTok data.

**Event taxonomy**

| Source | Event | Simulation effect |
| --- | --- | --- |
| TikTok | Viewer joins | Visitor character enters frame; citizen character wakes and resumes its schedule |
| TikTok | Comment | Participation standing rises; the character performs its occupation's action; crier events may trigger |
| TikTok | Tap / like burst | Participation standing rises in bulk; square ambience brightens |
| TikTok | Share | Participation and community standing rise; an envoy departs the gate |
| TikTok | Gift | Support standing rises, weighted by value internally; never shown or narrated as a value |
| TikTok | Battle start / end | A temporary world condition begins or resolves (see Battles) |
| TikTok | Viewer leaves | Character finishes its current task, then rests; nothing is lost |
| Simulation | Tick (every few seconds) | Schedules advance, resources flow, construction stages progress, conditions decay toward normal |
| Simulation | Emergent event | A condition the world generates from its own state (harvest, shortage, storm) |
| Director | Override | Bala forces, suppresses, or replays any event; always logged as a director event |

**Rules every event passes through**

1. **Identity resolution.** Map the TikTok identifier to a citizen record; unknown or ambiguous identities become visitors, never a wrong citizen.
2. **Deduplication and ordering.** Replays, retries, and bursts collapse to one effect each, applied in received order with a bounded reorder window.
3. **Rate control.** Bursts (a like storm, twenty gifts in a second) are batched into one simulation effect and one merged focus shot, which is also how the community framing is produced.
4. **Validation.** An effect that would break a constitutional principle is rejected and logged (for example, any effect that would erase a permanent achievement).
5. **Moderation.** Display names pass a filter before they appear on screen; unsafe names render as a village title instead.
6. **Persistence.** The event and its resulting state delta are written before the renderer is notified.

**Contribution pipeline.** Participation, consistency, community, and support are each updated from their own event types. Role assignment and layer promotion run on the tick, not on individual events, so a single burst never flips someone's role mid-stream.

## Battles

A TikTok LIVE match changes temporary world conditions and can add permanent glory; it can never remove a permanent achievement. The sting of a loss is kept, deletion is not.

**Two kinds of world state**

| State | Examples | Battles can… |
| --- | --- | --- |
| Permanent achievements | Completed structures, monuments, titles, contributor names, world history | Add to them on a win. Never damage, hide, or remove them. |
| Temporary conditions | Weather, district mood, gate status, scaffolding, scorch marks, a rebuilding quest, a festival | Set or intensify them on a loss, celebrate on a win; all decay toward normal and all are repairable |

**On a loss.** The loss margin sets condition intensity: a close loss brings a storm and a damaged fortress gate; a heavy loss darkens a district, cracks walls, and opens a rebuilding quest. Scars are visual overlays on permanent structures, never changes to them. Intensity is capped so the world is never unrecognisable, and conditions fade on their own over days even with zero engagement, so nobody is held hostage.

**On a win.** A dated victory banner, a monument on the first major win of a season, and a temporary prosperity condition (brighter lighting, a market festival, faster construction) that lasts the rest of the stream. The general who was elected for the battle is named on the banner.

**Repair is a shared project.** A rebuilding quest is a construction project like any other: stages needing at least two roles, progress shown as the structure visibly mending. All participation counts; support is weighted internally and never narrated. Zeya frames it as "the builders need hands," never as a target.

**Rivals.** The opposing streamer is first an off-screen cause of weather. Later, two civilizations in the same engine can face each other, with the same rules on both sides: no permanent loss for either community.

## Presence and absence

Showing up daily grows a citizen's standing and tree; being away changes what their character is doing, never what they own. The hotmeter-style grey state is kept as a signal; the memorial stone is dropped.

| State | Trigger | What viewers see | What the citizen keeps |
| --- | --- | --- | --- |
| Active | Visited within the last few days | Home lit, tree green, character on its schedule | Everything |
| Resting | About a week away | Character sits by the hearth, home dimmed to grey, tree leans | Everything; neighbours can tend the tree |
| Travelling | About a month away | Character departs the gate on an assignment; a lantern stays lit at their home; an AI villager covers the occupation | Everything, including history, roles, and standing |
| Returned | Any visit from any state | Character walks back through the gate, tree blooms, Zeya announces the return, home relights | Everything, plus a return moment in the recap |

**Tree.** Each citizen tends a tree. It grows with visits and leans when they are away; it never dies and a single visit revives it fully. Neighbours tending an absent citizen's tree is a community event Zeya names. Streaks grow the tree into something grander but are optional: no role, layer, or structure ever requires one.

**Visitors.** A viewer who never returns leaves no persistent character, so the world is never crowded with grey ghosts.

## Simulation architecture

Seven components, with one rule that shapes all of them: TikTok events flow down into the simulation, and the renderer, Zeya, and the recap service only read what the simulation decided.

&#91;embedded content: simulation architecture · 7 components, one direction of change\]

Events pass through ingestion into the simulation; the director console can override at ingestion or simulation; every change is persisted before the three observers see it.

| Component | Responsibility | Must handle |
| --- | --- | --- |
| TikTok event adapters | Capture comments, gifts, joins, taps, shares, battle state, presence from the existing Zeya feed | Reconnects, missing fields, whichever events TikTok actually exposes (open question) |
| Event ingestion | Normalise, validate, deduplicate, order, rate-limit, moderate names | Bursts, duplicates, delayed delivery, identity ambiguity, replay of a stored log |
| World simulation engine | Deterministic tick-based state machine over citizens, roles, resources, structures, conditions | Same log in, same world out; constitutional validation of every effect |
| Persistence | Append-only event log, periodic world snapshots, audit trail, asset registry | Crash recovery from last snapshot plus log replay |
| 3D renderer | Observe state deltas, play reveal animations, run the focus-queue camera, capture to stream | Merged focus shots on bursts; safe fallback scene on disconnect |
| Zeya narration | Observe state and history, pick moments worth telling, narrate within guardrails | Narration intensity set by the director; never the raw event feed |
| Recap service | Replay the stream's logged wow moments in-engine with cinematic cameras after the stream | Deterministic replay from the same log; introduced after the live loop is stable |
| Director console | Bala's controls: force, suppress, or replay events, camera priority, narration level, story beats, fallback | Every action logged as a director event |

**Rendering choice is deferred.** Unity and Three.js/WebGPU are benchmarked against the same recorded event log for GPU load, encoding, and stream capture on the actual streaming machine before one is chosen. A second machine for rendering is the default assumption until that benchmark says otherwise.

**Asset pipeline.** The MVP uses a controlled modular kit conforming to the semantic contract. AI-generated assets (Meshy, Tripo, Rodin, Hunyuan3D, TRELLIS 2 remain candidates) enter one at a time after topology, UV, rigging, LOD, collision, licence, and style-consistency checks.

## Persistence

The event log is the source of truth; the world is always reconstructible from it. Snapshots exist for speed, never as the only copy.

| Must survive | Stored as | Retention |
| --- | --- | --- |
| Every validated event and director override | Append-only log with timestamps and source | Indefinite; it is the civilization's history |
| World snapshots | Full state every few minutes and at stream end | Latest plus one per stream |
| Citizen identity, standing, roles, bonds, tree state | Citizen records derived from the log | Until the viewer opts out or requests deletion, then purged and the character retired from history displays |
| Permanent achievements and contributor names | World history table | Indefinite, subject to the same opt-out |
| Theme assets and their contract validation results | Asset registry | Per theme, with licence and source recorded for each asset |
| Zeya's narrated moments | Narration log linked to the events it referenced | Per stream, used by the recap service |

**Recovery.** On any crash: load the last snapshot, replay the log since, and resume. The renderer shows the fallback scene until the simulation reports ready. Because the simulation is deterministic, the replayed world matches the one that was lost.

**Privacy.** Only on-stream public moments are stored against a citizen. Display names honour TikTok privacy settings and a Zeus World opt-out. Deletion requests remove the citizen record and replace their name in history with a generic title; the events themselves stay in the log for world consistency, without the identity.

## Zeya: historian, director, narrator

Zeya decides which moments deserve attention and tells them as stories with history; she does not announce events. She reads the simulation state and the world history, never the raw TikTok feed.

**Three responsibilities**

- **Historian.** Recognise significance over time: three returning citizens rebuilding the structure they first helped raise weeks ago is a story; a single comment is not.
- **Event director.** Rank candidate moments, request focus shots from the renderer, trigger festivals and civic votes, and queue what the recap should include.
- **Narrator.** Deliver the one-sentence pitch on a loop for newcomers, frame every moment as community, and voice returns, blooms, battle outcomes, and completed projects.

**Guardrails, enforced in code, not prompts alone**

1. Narrates only facts present in the world history or current state; no invented events, dates, or contributions.
2. Never speaks a gift value, coin count, or ranking by spend.
3. References a citizen's past only from on-stream public moments; nothing from private messages or inferred behaviour.
4. Never declares a relationship between two citizens unless both chose a bond in the world.
5. Never interrupts Bala during a flagged conversation; the director console sets a quiet level that Zeya respects.
6. Display names pass moderation before Zeya says them; rejected names become village titles.

**Director controls over Zeya:** narration intensity (silent, key moments, full), camera priority, suppression of any event type, forced story beats, and a one-tap mute.

## Outcomes that must never occur

These are tested as automated assertions against the simulation and reviewed before every stream.

- A viewer loses a structure, title, role, standing, or history because they were away or did not spend.
- A permanent achievement is damaged, hidden, or removed by a battle loss or any other event.
- Any on-screen text or narration references coins, gift values, or money.
- A TikTok event changes a 3D object without passing through ingestion and the simulation.
- Two different viewers are merged into one citizen, or one viewer's actions credit another citizen.
- An offensive display name or an inappropriate narration line reaches the stream.
- A viewer who opted out appears by name anywhere in the world, the history, or a recap.
- A burst of events causes more than one focus shot in the same window instead of a merged community moment.
- The stream shows a broken or frozen world instead of the fallback scene.
- A viewer's role or layer changes mid-stream because of a single burst rather than on the tick.
- A theme swap changes any logical structure, footprint, socket, or ownership.
- Zeya narrates an event that is not in the log.

## MVP validation and open decisions

The first build answers one question: can viewers recognise themselves in the civilization, understand their impact without explanation, and want to return? Nothing else ships until that is a yes.

**MVP scope**

- One district with 10 to 20 recognisable citizens drawn from current regulars, plus AI townsfolk to fill it
- Four occupations, three resources, one shared construction project with staged progress
- The focus-queue camera with merged community shots, the persistent status strip, and the fallback scene
- Five Zeya narration triggers: newcomer pitch, return, project stage complete, project complete, merged community moment
- Full ingestion and simulation pipeline running on a recorded event log before any live stream
- No battles, no tree decay, no themes, no recap in the first increment

**Validation, run privately on recorded events, then on two live streams**

| Question | Measure | Pass |
| --- | --- | --- |
| Do people understand it without explanation? | Ask five new viewers what the world is after two minutes | Four of five describe it as a community they can be part of |
| Do people recognise themselves? | Citizens name their own character unprompted in chat | Most named citizens react within their first visit |
| Does it compete with Bala for attention? | Bala's own read plus chat sentiment during focus shots | Focus shots feel additive, not distracting |
| Does recognition drive voluntary return? | Return rate of the 10 to 20 citizens over two weeks vs the prior two weeks | Noticeably higher, without any prompting to gift |
| Does the pipeline hold? | Replay of a full stream's log reproduces the same world; bursts produce one merged shot | Zero divergence, zero duplicate shots |

**Increments after a pass:** battle conditions and glory → presence states and the tree → recap service → second theme under the semantic contract → neighbour bonds and civic votes → avatar and lip-sync as its own project.

**Decisions locked by this document**

| Decision | Locked as |
| --- | --- |
| Citizenship | Free to earn; prestige separate from belonging; no TikTok-level floor |
| Standing | Four dimensions tracked separately, never one score |
| World simulation | Deterministic, event-driven, tick-based, persistent, replayable |
| Battle outcomes | Temporary conditions only; permanent achievements protected |
| Absence | Resting and travelling states; nothing owned is lost; no memorial stone |
| Themes | Semantic contract first; themes are representations of functions, never mesh swaps |
| Zeya | Historian, event director, narrator, with coded guardrails and a director console |
| Rendering | Benchmark Unity vs Three.js/WebGPU on recorded events before choosing |
| Assets | Modular kit for MVP; AI assets admitted one at a time after validation |
| Recaps | Event-driven replay, after the live loop is stable |

**Open questions to resolve before build**

- [ ] Which TikTok events and identifiers are actually available and permitted through the current capture path?
- [ ] Licence terms for commercial on-stream use of each candidate asset tool and any purchased kit
- [ ] Retention, deletion, name display, and opt-out behaviour, written as a viewer-facing policy
- [ ] Does the renderer run on the streaming machine or a second box, by benchmark?
- [ ] Is persistence on TikTok LIVE truly unoffered today, or is the claim only a positioning hypothesis?
- [ ] Do named recaps measurably drive sharing, tested on the first three posts?

## Addendum, 14 Nov 2026: engine and promo

Zeus World is a real-time 3D game. Pre-rendered plates, AI-generated video, and Unreal Engine 5 are all rejected; the engine is still to be chosen, and the promo must be captured from that engine.

**Engine options under consideration**

| Engine | For | Against |
| --- | --- | --- |
| Unity (HDRP) | Closest to photoreal on a Mac; large asset store with Greek/fantasy packs; easiest TikFinity wiring | Heavier learning curve than Godot |
| Godot 4 | Light, open source, fast on a Mac, pleasant to build in | Lower realism ceiling; needs a stylised art direction |
| Three.js / WebGPU | Browser-native, natural stream overlay, fast to build with Claude Code | More pipeline and asset work by hand; last 10% of realism |
| Blender Eevee | Real-time render quality | Not a game engine; events and camera logic bolted on |

Current lean: Unity for look and ecosystem, Three.js for build speed and overlay simplicity. Open question: what made Unreal a no, so the next choice avoids the same issue.

**Promo / sneak peek**

- Captured in-engine, so every shot is reusable as a launch-night scene
- Tease the feeling, not the mechanics: fog over an empty Olympian valley, the gate opening, named citizens walking in, one shared build rising as they work together, then a title card: "Zeus World. Everyone has a place. Opening soon."
- Lead with people, not architecture: a named citizen is the hero shot, the world is the backdrop
- 20 to 30 seconds, vertical, scored with Bala's own Suno track
- Undecided: name real viewers in the first teaser, or keep it anonymous until the reveal wave

**Next session starts here:** pick the engine, then write the shot list and the Fab/asset-store pull list for the teaser.

## Addendum, 15 Nov 2026: wallets, personal plots, and community builds

This addendum amends the constitution. Where it differs from the text above, the addendum wins. Items marked *proposed* are not yet confirmed.

**Amended principles**

- **Principle 2, collective over individual.** The world has two kinds of structure. Personal plots are individually owned and built. Civic structures (stadiums, halls, monuments, district infrastructure) are funded and raised collectively. No single citizen can fund a civic structure alone.
- **Principle 5, no money on screen.** Diamonds, gift values, and rankings by spend never appear on stream or in narration. The in-world currency may be named and shown. A citizen's balance is visible only to that citizen in the builder, and to the director.

**Currency (working name: Bolts)**

- Every kind of participation earns currency into the citizen's wallet: taps, comments, shares, time spent in the live, and gifts. Gifts earn more, but nothing is gift-only.
- The wallet is a ledger derived from the event log, so every balance is replayable and auditable.
- *Proposed:* earnings from taps and watch time are capped per stream, so automated tapping cannot farm currency.

**Personal plots**

- Every citizen has a plot. They spend currency to build, upgrade, and furnish it from a fixed catalogue (homes, apartments, cafés, furniture, trees).
- A logged-in citizen sees and edits only their own plot. The whole world is visible only on the live stream.
- The director can browse every plot and send any of them to the showcase camera.
- Builder actions enter the simulation as events through ingestion, like every other source.
- Catalogue items only; no uploads. Any free text (such as a café name) passes moderation before it can appear on stream.

**Community builds**

- A community build is a civic structure with a funding goal. Citizens pledge currency from their own wallets directly to the project; there is no shared wallet for anyone to control.
- *Proposed:* once a minimum number of distinct citizens have pledged, every pledged coin counts double toward the goal.
- *Proposed:* no single citizen can supply more than a fixed share of the goal, so a build always needs a group.
- *Proposed:* pledging funds the build; the structure rises stage by stage during the live through participation.
- Every contributor is named on the finished structure. Names are listed without amounts and not ordered by amount.
- Citizens can also gift small public items (a tree, a bench, a fountain, a lamp) to the district on their own, tagged with their name.
- If a community build is cancelled, pledges are returned.

**Account linking**

- *Proposed:* a citizen proves ownership of their TikTok account by typing a one-time code from the builder into the live chat.

**Open questions added**

- [ ] Final currency name
- [ ] Do TikTok's LIVE guidelines restrict rewarding gifts with in-world currency?
- [ ] Earning rates, catalogue prices, the doubling threshold, and the per-citizen share cap
