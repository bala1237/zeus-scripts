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

**Cost check (22 Nov)**
- Measured on the fal balance: Trellis 2 at our settings is $0.35 a model; Tripo P2 (5k-triangle limit, PBR) is $1.10. The fal tools cannot report charges or the balance; the owner reads them off the dashboard. Tripo gave a cleaner bench but at three times the price.
- Mesh2Motion (free, open-source rigging in the browser) was raised by the owner as a possible replacement for paid Meshy rigging. Not evaluated.

**Free Blender route (owner's decision, 22 Nov: "visual excellence is non-negotiable")**
- Hard-edged and modular items are now built by script in `assets/blender/` (Blender 5.3 as a Python module), at no cost. `zw.py` holds the helpers; `villa_walls.py`, `bench.py` and `kit.py` build the models; `build.sh` builds everything into `assets/models/`. Textures are CC0 Poly Haven scans in `blender/textures/`, graded to the palette; soft contact shadows are baked into vertex colours.
- Built this way: villa walls in stone, ochre and gold-trim marble (panelled double doors, louvred shutters, cornice with dentils, corner stones, wall lantern; 28.5k triangles each, 0.8 to 1.5 MB, tested under the existing roofs and behind the porches), terracotta and azure roofs (17k triangles), Doric and Ionic porches (11k and 14k), marble bench, bronze lantern post, amphorae cluster, garden wall and gate (same height now, so they join), street lamp, name plaque, road, plaza and mosaic tiles, boundary stones, scaffolding bay, crane, stone blocks, timber stack, crates. All within the original budgets except the bench at 6.3k triangles (goal 5k).
- The scripted bench, lantern, amphorae, garden wall and gate replaced the Trellis versions in the catalogue; the Trellis files are kept beside them as `*.trellis.glb`.
- **Milestone reached: the street test.** `assets/review/street.html` lays out six 16 x 12 m plots on a cobbled road from catalogue models only; sheet `assets/sheets/street_milestone.jpg` (views: wide, street, ochre, gold, site, villas; day and dusk).
- The villa is now fully scripted: a complete house (walls, roof, porch) is about 57k to 60k triangles and 1.7 to 2.4 MB. The street test uses the scripted roofs and porches; the older Trellis roof and porch parts in `style-test/` are no longer needed for new work.
- Still generated, not scripted: trees, bushes, flowers, pots, cypress, café, cottage, citizens. They sit well beside the scripted pieces in the street test.
- **Temple of Zeus** (`blender/temple.py`, sheet `assets/sheets/temple_of_zeus.jpg`): Doric temple with columns all round on a stone podium, 15 x 28 m and 12.3 m tall, in four build stages (21k, 28k, 33k, 52k triangles; 0.9 to 1.9 MB; budget 80k, 4 MB). Painted trim (azure triglyphs and pediment, red fillet, gold rosettes, bolt and roof ornaments) was taken as an idea from a low-poly city pack the owner showed; nothing from the pack is used. Flaws: brazier flames read as eggs; not yet placed in a scene.
- City ideas noted from that pack for later: temple on a terraced hill with stairs, city wall with towers and a gate arch, market stalls with striped awnings, round shrine (tholos), fountain plaza, banners, curved paved paths, harbour edge.
- **Everything scriptable is now scripted (owner's instruction, 22 Nov: build all Blender items, self-check, no approval needed).** About 90 scripted models: civic set (stoa, plaza fountain, library, council hall, bathhouse, gymnasium, amphitheatre, round shrine, lighthouse, aqueduct, city wall, tower, gate, bridge), monuments (obelisk, victory column, altar, sundial, shrine, banners, statue plinth, signpost), water kit (pond, river straight and bend, stepping stones, quay, pier, well, reflecting pool), homes (cottage tiers 1 and 2, insula tiers 1 to 3, grand villa, second-storey modules, slate and gold roofs, roof garden), businesses (taverna, bakery, flower shop, pottery, scroll shop, olive press, forge, four market stalls) and furniture (pergola, dining set, planter, garden bed, cart, barrels, brazier). Builders: `blender/parts.py` (shared columns, roofs, windows, doors, awnings, arches), `city.py`, `town.py`, `temple.py`. All within budget; the heaviest are the temple (52k triangles) and grand villa (48k).
- The scripted taverna replaced the generated café (kept as `biz_cafe_t1.trellis.glb`); scripted cottages sit beside the generated one.
- **Whole-city scene:** `assets/review/city.html` (views wide, plaza, street, temple, harbour, river, homes, civic, top; day and dusk), sheet `assets/sheets/city.jpg`. It takes about 3 minutes per still on this machine and has not been tested for frame rate on a phone.
- **Colour grade for streaming (owner found the scenes too pale for OBS):** `review/city.js` now defaults to a deeper sky and grass, a harder sun with less fill light, lower exposure and a saturation and contrast boost on the canvas; `?grade=soft` gives the old look. Before and after in `assets/sheets/city_grade_before_after.jpg`. This is scene lighting only: the models are unchanged, and `street.js`, `main.js` and the game renderer still use the pale settings. The sky is a flat colour and wants a gradient or clouds.
- Quality check: every model was rendered beside a citizen and the villa, and the city scene was checked from six views. Fixed along the way: stretched stone on round towers, egg-shaped brazier flames on the temple.
- Remaining flaws seen: gymnasium roof has small notches at the corners; the amphitheatre's stage building hides the stage from the front; pergola vines are sparse; river bank stones are thin on the near side; water is flat blue until the game adds movement; dusk lamps are not yet lit by the models themselves.
- Known flaws: the café's back wall is broken (visible from behind); boundary stones read a little like logs; some louvre slats catch the sun as white lines.

## Decisions taken

| Topic | Decision |
| --- | --- |
| Plot size | 16 × 12 m on a 2 m grid |
| Interiors | Exteriors only for now |
| Concept images | Nano Banana 2.1 (`google/nano-banana-2.1`) on fal, 1:1, 2K, template prompt |
| Hard-edged and modular items | Built free by Blender script (`assets/blender/`), not generated |
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

1. **Owner review** of `assets/sheets/city.jpg`, `street_milestone.jpg` and `temple_of_zeus.jpg`.
2. **Phone performance test** of a district, and far-view versions of the heaviest models.
3. **Wire the scripted villa parts and new homes into the builder** (`style-test/`).
4. **Build stages** for the other civic buildings (only the temple has them), and the stadium rising in code.
5. **Water, fire and lamp effects in code** (the models only carry flat water and unlit flames).
6. **Still needing generation or another route:** more trees (laurel, pomegranate, fig, plane, almond), rocks, vines, more citizens and outfits, statues, Zeya and Zeus figures. Look at Mesh2Motion for free rigging.

Open: a cost ceiling per batch on fal, licence check for commercial on-stream use of each generator, what the four teaser mysteries become, and that the "First 100 become Founders" promise is honoured at launch.

Watch on Trellis output: wall-crack patches (fine for tier 1, not for higher tiers) and greyish shutters instead of the palette azure.
