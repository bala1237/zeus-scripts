# Zeus World: decisions

Decisions already taken, so they are not reopened by accident, and the questions still open. Add a row with the date when a decision is made; if one is reversed, change the row and say so in the changelog.

## Taken

| Topic | Decision |
| --- | --- |
| Plot size | 16 × 12 m on a 2 m grid |
| Interiors | Exteriors only for now |
| Cost | Keep spend low. Hard-edged and modular items are scripted in Blender for free; paid generation only for organic pieces (plants, citizens, statues, landmarks) |
| Quality bar | "Visual excellence is non-negotiable" (owner) |
| Engine | Three.js in the browser. Unreal was considered and rejected: it does not run in a phone browser |
| Asset packs | Not buying any. Style clash with the "not low-poly, not photoreal" rule, and licences often forbid shipping files to browsers. Used only as inspiration (painted temples, walls, market stalls) |
| Free sources | Poly Haven for skies and textures (CC0). Its models only selectively (single rocks, the bust) |
| Budgets | Props up to 30k triangles and 1.3 MB, plants up to 60k and 2.8 MB, with the original 5k and 10k as goals. Scripted models meet the goals; generated ones do not |
| Concept images | Nano Banana 2.1 on fal, 1:1, 2K, template prompt; owner approves a sheet before any 3D spend |
| Image to 3D | Trellis 2 on fal (resolution 1536, texture 2048, decimation 120000). Measured at $0.35 a model. Tripo P2 gave a cleaner result at $1.10; not adopted |
| Characters | Meshy rigging through fal. Mesh2Motion (free, browser) suggested by the owner, not evaluated |
| Construction stages | Done in code (a rising cut-off behind scaffolding), not separate models. The temple also has four real stage models |
| Citizen's tree | An oak, four growth-stage models; the leaning "resting" pose is to be done in code |
| Stream look | Deeper sky and grass, harder sun, less fill, saturation and contrast boost, because the first look was too pale for OBS |
| Working method | Deliver in batches with a checklist; the owner validates on the hosted preview |
| Documentation (22 Nov 2026) | The repository is the project's memory: `CLAUDE.md` as the entry point, plan, backlog, knowledge files, changelog, and skills for repeatable procedures. Documents are updated in the same commit as the change |
| Backlog (22 Nov 2026) | Kept as a file (`BACKLOG.md`), not GitHub Issues |
| Branches (22 Nov 2026) | Work is merged into the default branch at the end of each session, by pull request |
| Battles (22 Nov 2026) | The siege at the south gate is the accepted way to show a battle. A real TikTok battle runs five minutes, and the score dictates the action. Wiring to real events comes later |
| Bolts (23 Nov 2026) | People build from the Bolts they own and grow slowly. Comments and taps earn Bolts, and so does winning the games played on stream |
| Games on stream (23 Nov 2026) | The owner plays Family Feud, Bible quiz, number guessing and similar games on stream. Anyone can take part, and winners earn Bolts |
| Battle MVPs (23 Nov 2026) | The MVPs of a battle are its top three. They are the ones honoured and showcased afterwards. Amounts are never shown. This amends the constitution's rule on ranking by spend; see its addendum of 23 Nov 2026 |
| Backbone of the game (23 Nov 2026) | Left to Claude's recommendation by the owner: four ladders (home, street, city, world) and the city passing through ages (wood, stone, marble, gold). To be confirmed when the owner sees it working |
| First spectacle (23 Nov 2026) | Left to Claude's recommendation by the owner: "Zeus's storm of gold" |
| Stream format (23 Nov 2026) | The stream is wide (landscape). Camera shots are composed for that |
| City tour (23 Nov 2026) | A cinematic tour replaces the 360 rotation; place names appear on screen; calm pace by default |
| The owner's setup (24 Nov 2026) | Music is played on the same computer that streams. He goes live with OBS or TikTok LIVE Studio. His games run in a browser |
| Order of the stream features (24 Nov 2026) | Concert mode first, then the game stage |
| Music (24 Nov 2026) | Music gets its own stage, separate from the city. Concert mode inside the city was tried and rejected by the owner |
| Stage direction (25 Nov 2026) | The stage is to become a professional virtual laser and lighting system: 70% premium underground nightclub, 20% minimalist industrial techno, 10% festival spectacle; dark, restrained, physically coherent. Built in phases, each passed by the owner. The owner streams from macOS |
| Stage direction, revised (25 Nov 2026) | The owner sent the Transmission Prague 2016 laser show as "something i loved": many projectors, fans of twenty or more beams each, green with magenta shafts, a temple stage. The lasers get a festival look in that manner alongside the club themes. This relaxes the "dark, restrained" rule of the first brief for that look |
| Largest gifts (25 Nov 2026) | A gift of 5,000 coins or more is shown as a realistic, pre-made animated clip for its family, played inside the stage. The owner chose realistic over stylised and accepted that a clip plays the same each time. Clips are generated on fal; he approved a small spend for the first |
| Gift clips are original work (25 Nov 2026) | The owner: "These are our creatives and we are not mimicking or copying anyone." The clips are made from our own written prompts, show no real person, brand or existing character, and do not imitate TikTok's gift artwork. Keep it so: prompts must never name an artist, a film, a brand or a real person, or ask for something "in the style of" one |
| No children on screen | Owner, 26 Nov 2026: "We can't have kid in the video." Applies to the hero films and to the open world's newcomer (who is the man for that reason) |
| Hero film scripts | Generic and without gender, so one script serves anyone (owner, 26 Nov 2026) |
| Greek throughout | Owner, 26 Nov 2026: "ensure we don't deviate from the Greek theme". Dry stone, cream plaster, terracotta, azure, bronze, marble, the gold bolt; shutters, never glass. A reference picture that strays is corrected when the model is built |
| Open world: frame rate | A steady 60, capped by the page (owner, 26 Nov 2026). In OBS he runs the source at 30, because LIVE Studio and OBS run together (27 Nov 2026) |
| Open world: fidelity | Lower detail where a phone cannot show it (far buildings, shadows, drawing resolution); keep it close up (agreed 26 Nov 2026) |
| Order of work on the open world | Improve what exists before building more (owner, 26 Nov 2026). Then, 27 Nov 2026: the brainstorm on voice-overs and story comes first, "the core that can make the game to be looked at a different level"; hand camera controls (ZW-056) and measuring the world's memory are parked until after it |
| Sounds | Generated on the owner's ElevenLabs account with his word ("Let's do it", 27 Nov 2026). A sound costs about a cent; say the cost before a batch |

| Long-term vision (27 Nov 2026) | Zeus World is to become "an ongoing television series inside a living, open-world simulation, experienced live alongside Zeus and ZEYA": inhabitants with personalities, relationships, routines and conversations, on the open world as the stage. The owner's brief is kept word for word in `VISION.md`. Built in his five phases: Discover Zeus World; Bring the world to life; Interactive living world; Persistent stories; Expanding universe |
| Narrator (27 Nov 2026) | Zeya is the primary narrator, in her established personality, not a documentary voice. No other dedicated narrator at this stage |
| World identity before any saga (27 Nov 2026) | Viewers must first understand what Zeus World is: its origin, mythology, regions and people. "The Cold Fire" is only a candidate for a later storyline and must not define the world. Several stories may run at once |
| Myth and fact (27 Nov 2026) | "The fictional mythology of the world and the factual history of the community must remain clearly distinguishable" (owner) |
| Not only money (27 Nov 2026) | The world must stay interesting with no battles or gifts. Recognition is for "presence, participation, kindness, loyalty and meaningful contributions" as well |
| Dialogue quality (27 Nov 2026) | "We should avoid meaningless AI-generated dialogue simply to make characters appear active. Conversations need purpose, personality and entertainment value" (owner) |
| Foundations (27 Nov 2026) | Nothing built early may restrict the world to a scripted cinematic tour. The architecture must allow persistent world state, character intelligence, memory, event orchestration, dialogue, narrative management and an autonomous camera |
| Measure of success (27 Nov 2026) | Not beauty alone: whether viewers know recurring characters, have favourites, remember earlier streams, ask what they missed and return to see what happens next |

| One Zeya (27 Nov 2026) | "ZEYA should be the same character across the entire Zeus entertainment ecosystem. I do not want a separate Zeus World version of ZEYA with a different personality, voice or identity. Zeus World should become another domain of knowledge and capability" (owner). She is to be guide, observer, commentator and participant, able to decide that something elsewhere is more interesting and take the audience there; never "a sequence of automated announcements" |
| First cast (27 Nov 2026) | Six to eight recurring characters with contrasting personalities, each "memorable enough that viewers eventually recognize them without an introduction". "I would rather start with a small number of convincing characters than populate the world with hundreds of lifeless ones" (owner) |
| Tone (27 Nov 2026) | A broad spectrum, not only warm everyday comedy: comedy, friendship, mystery, adventure, rivalry, romance between fictional characters, festivals, philosophy, epic moments, suspense. The tone follows what is happening |
| Conversations (27 Nov 2026) | Heard aloud, with captions. To grow step by step towards character voices, lip-sync, expressions, eye contact, gestures, body language, cinematic angles and spatial audio |
| Myth and fact, agreed (27 Nov 2026) | Zeya may tell fictional legends and take part in fictional storytelling; she must never fabricate facts about real community members. Fictional characters may have friendships, rivalries, romances and stories. Real members control how they are represented and are never placed in fictional relationships or sensitive storylines without consent. To be written into the constitution as an addendum once the direction is final |
| A recorded Zeus voice (27 Nov 2026) | Not forbidden. Allowed for cinematic introductions, trailers, special productions and mythology. It must not compete with the owner while he is hosting the LIVE |
| Names of real people (27 Nov 2026) | Both displayed and spoken, depending on "the context, significance and entertainment value", not only for the biggest honours. Pronunciation preferences for recurring members to be supported in time. Recognition is never based only on gifting |
| The world runs by itself (27 Nov 2026) | "Fundamental to the long-term vision" (owner): characters with their own routines, goals, relationships and memories; the world entertains while he talks, plays music, hosts another segment or steps away. Introduced step by step |
| World bible (27 Nov 2026) | `WORLD-BIBLE.md` is a brainstorm for the owner's review. Nothing in it is canon until he approves it |


## Open questions

- A cost ceiling per batch on fal.
- Licence terms of each fal generator for commercial on-stream use. For the gift clips (Wan 3.0 Prime) fal's terms were read on 25 Nov 2026: the model is tagged for commercial use and nothing forbids it, but there is no plain grant of ownership, no warranty, and the model maker's own terms were not found (`STAGE-PLAN.md`, "Terms for using the generated clips"). Still open: TikTok's rules on labelling AI-generated content, and the terms for the other generators (Trellis, Meshy, Nano Banana).
- What the four teaser mysteries (colossus, sky temple, harbour, vault) become.
- That the "First 100 become Founders" promise is honoured at launch.
- Whether every citizen gets the same plot size.
- **The world bible (`WORLD-BIBLE.md`), for the owner's review:** which origin myth; the cast and their names; whether the inhabitants can hear Zeya; the humour; how far drama may go; the first mystery.
- **Zeya (`knowledge/zeya.md`):** three descriptions of her on record disagree (the March brain, the November campaign, the avatar); which is the true one, what she runs on today on stream, and which voice.
- **Characters with living faces (`VISION.md`, part 6):** which route; prices and licences not yet looked up; the running cost of dialogue written live is also unknown.
- Open world: mirror a hand-moved camera from the Chrome page to the OBS source, or Chrome only; and how the story resumes afterwards (ZW-056, parked).
- Open world: the page's memory has never been measured (parked).
- Animals that walk and working people: the cost of rigging is not known (ZW-054, item 7).

