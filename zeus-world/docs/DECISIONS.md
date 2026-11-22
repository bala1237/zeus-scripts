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

## Open questions

- A cost ceiling per batch on fal.
- Licence terms of each fal generator for commercial on-stream use.
- What the four teaser mysteries (colossus, sky temple, harbour, vault) become.
- That the "First 100 become Founders" promise is honoured at launch.
- Whether every citizen gets the same plot size.
