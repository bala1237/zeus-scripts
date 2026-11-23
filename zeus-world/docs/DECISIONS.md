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

## Open questions

- A cost ceiling per batch on fal.
- Licence terms of each fal generator for commercial on-stream use.
- What the four teaser mysteries (colossus, sky temple, harbour, vault) become.
- That the "First 100 become Founders" promise is honoured at launch.
- Whether every citizen gets the same plot size.
