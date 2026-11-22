# Zeus World: where we stand

Handoff for a new session, 22 Nov 2026. Latest work is on branch `claude/eager-faraday-svkb22` (continues `claude/dazzling-mendel-y9qquo`) of `bala1237/zeus-scripts`, folder `zeus-world/`.

Read in this order: this file, `docs/CONSTITUTION.md` (product rules, especially the 15 Nov addendum), `docs/ASSET-BIBLE.md` (3D style rules and catalogue), `assets/README.md` (pipeline).

## Done

**Product**
- Constitution with the 15 Nov addendum: Bolts ⚡ earned from all participation, personal plots (citizens see only their own; the full world is shown on the live), community builds (pledges, doubling at 10 people, 20% cap per person, names without amounts), account linking by typing a one-time code in the live chat. TikTok login dropped.

**Teaser** (`teaser-3d/`)
- 32.5 s vertical teaser in Three.js, beat-synced to Mythic Dawn, with the AI-generated model kit: comments become citizens, phone builder, upgrade montage, Featured on Zeus LIVE, stadium, four "coming soon" mysteries, First 100 Founders wall, title card.
- Zeya voiceover from ElevenLabs (voice "Zeya-Seductive", mixed delivery), fitted and ducked: `scripts/voice.py` then `scripts/mix.sh` (seconds, no re-render). Rendered videos live in `out/`, which is not committed.
- Known nit: a blue streak (the sea) crosses the bottom of the Founders shot. Moving that camera needs a 1.5 h re-record.

**Style test** (`style-test/`)
- One plot with a modular villa: walls (Plaster, Marble), roof (Terracotta, Azure), porch (None, Doric, Ionic) snapping to fixed sockets. Published page: https://claude.ai/artifact/RK9YuFhmNptF6VPBHKTSLh

**Asset bible and pipeline** (`docs/ASSET-BIBLE.md`, `assets/`)
- Style rules: look, palette, gold-bolt motif, fixed prompt templates, scale (1 unit = 1 m, citizen 1.75 m, 2 m grid), +Z front, tiers 1–4, budgets, naming, 8-point acceptance checklist.
- Catalogue of about 90 lines with status and priority (P1/P2/P3).
- `assets/normalize.mjs`: raw model to catalogue model (orientation, origin, fit-to-box scale, triangle budget, WebP, meshopt).
- `assets/review/` + `assets/shot.mjs`: review scene that renders an item beside the reference villa and a citizen on the 2 m grid, day or dusk.
- First catalogue item done: **starter cottage** (`home_cottage_t1`). Concept A, built with Trellis 2 and Hunyuan 3D 3.1 Pro; the owner chose **Trellis 2**.

**Batch 1: P1 small items (22 Nov)**
- 17 models built from owner-approved concepts with Trellis 2: myrtle bush, oleander bush, box hedge segment, wildflowers, grass tuft, marble bench, bronze lantern, three pots, amphorae cluster, garden wall segment, garden gate, and the citizen's tree (an oak) at 4 stages. Concepts in `assets/concepts/batch1/`, models in `assets/models/`, sheets in `assets/sheets/`, settings in `assets/batch1.sh`.
- All face +Z, sit at the origin and are scaled to real size (tree stages 0.9, 2.5, 5 and 7 m). Checked in day and dusk.
- **Budgets raised (owner agreed, 22 Nov).** The models are 11k to 31k triangles and 0.5 to 1.3 MB for props, 14k to 61k and 0.5 to 2.7 MB for plants and trees, against original goals of 5k and 10k. Simplifying further strips the leaves, and a test of Trellis at `decimation_target` 5000 (one bush, one pot) gave a broken bush and a blotchy pot. The asset bible now carries the higher limits with the old ones as goals, and the batch is marked Done there.
- **Owed: far-view LODs** for all 17, before the full-city live view. Ordinary simplification cannot make them; try meshopt's sloppy simplifier or flat cards.
- Other open points: the gate posts are 1.1 m against the wall's 0.9 m, the bench marble lost most of its veining, the grand tree's gold leaves read pale yellow, the lantern has no light source yet (add in code).
- `normalize.mjs` gained `--maxerr` and repeated simplification passes; the review scene gained `?props`.

**Teaser models cleaned up (22 Nov)**
- The 12 teaser models are now catalogue models in `assets/models/` (settings in `assets/teaser.sh`, sheet `assets/sheets/teaser_models_review.jpg`): city gate 12 m, its bronze door leaf, stadium 15 m high and 32 m across, Founders wall 6 m, café 5 m, cypress 7 m, colossus 24 m, sky temple 30 m, trireme 24 m long, vault 10 m, citizen woman and elder at 1.75 m with Walk, Idle, Cheer, Clap. All face +Z and are within budget. The sizes are first proposals, not owner-approved.
- The teaser itself still loads its own copies in `teaser-3d/public/models/`; nothing there changed.
- The "villa door" the bible listed as a teaser model is really the city-gate door leaf, so a villa door is still to build.
- Not checked: dusk views, and the citizens' animations in motion after simplifying to 20k triangles (the clips are present).

## Decisions taken

| Topic | Decision |
| --- | --- |
| Plot size | 16 × 12 m on a 2 m grid |
| Interiors | Exteriors only for now |
| Concept images | Nano Banana 2.1 (`google/nano-banana-2.1`) on fal, 1:1, 2K, template prompt |
| Image to 3D | Trellis 2 (`fal-ai/trellis-2`, resolution 1536, texture 2048, decimation 120000) is the default; Hunyuan 3D 3.1 Pro is the fallback |
| Tried and rejected | Higgsfield 3D Jutsu (poor result on the cottage) |
| Characters | Meshy rigging via fal (`fal-ai/meshy/rigging/multi-animation`) |
| Construction stages | Made in code (rise from the ground behind a scaffolding kit), not separate models |
| Citizen's tree | 4 growth-stage models; the drooping "resting" pose is done in code |
| Roads, paths, plaza tiles, boundary stones | Drawn in code, not generated |
| Review flow | Concepts in batches of about 10 on one sheet; the owner approves before any 3D spend |

## Environment notes

- fal is connected through the fal MCP tools (account "Bala murugan").
- An ElevenLabs key is saved on the Default cloud environment (header `xi-api-key`; the proxy injects it).
- A Meshy key is also saved there, but direct calls to api.meshy.ai were blocked by the session permission check. Use Meshy through fal, or ask the owner before retrying.
- No Blender installed; the clean-up is done in Node with gltf-transform.
- Software rendering only: review stills take seconds, full teaser renders about 1.5 hours.

## Next

1. **Homes:** three new villa wall styles (stone, ochre, gold-trim marble), then tier 2 of the cottage (the "repaired" version: same footprint, no cracks, azure shutters).
2. **Construction kit:** scaffolding, crane, stone blocks; then the stadium rising in code.
3. **Far-view LODs** for batch 1 (see above).
4. **First milestone:** one street of 6 plots built only from finished catalogue items, rendered in the review scene, to prove the style holds at scale.

Open: a cost ceiling per batch on fal, licence check for commercial on-stream use of each generator, what the four teaser mysteries become, and that the "First 100 become Founders" promise is honoured at launch.

Watch on Trellis output: wall-crack patches (fine for tier 1, not for higher tiers) and greyish shutters instead of the palette azure.
