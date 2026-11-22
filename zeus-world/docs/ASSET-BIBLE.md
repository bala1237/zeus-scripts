# Zeus World asset bible

What has to be built in 3D for Zeus World, and the rules that keep every piece looking like it belongs to the same world. Draft for review, 16 Nov 2026.

Part 1 is the consistency rules. Part 2 is the catalogue. Part 3 is the open decisions for planning.

---

## Part 1: Consistency rules

### 1.1 The look

**One sentence:** a hand-crafted collectible diorama of a sunlit Olympian city, like a high-end mobile city-building game.

| Rule | Detail |
| --- | --- |
| Proportions | Slightly exaggerated and chunky: thick columns, deep roof overhangs, oversized doors and steps. Silhouettes read clearly from a phone screen. |
| Materials | Rich and realistic, never flat colour: veined white marble, warm cream plaster, terracotta tile, polished gold, painted wood, bronze, stone. |
| Not | Not cartoon, not chibi, not low-poly, not photoreal. |
| Era | Ancient Greek inspired, idealised. No modern objects (no glass windows, cars, electric lights, plastic). Modern ideas are translated: a café is a taverna with awnings, a shop is a stall with amphorae. |
| Signature motif | A gold lightning bolt. It appears on every building that has a pediment, crest or sign, and on civic structures at a larger scale. It is Zeus's mark. |
| Secondary motifs | Fluted columns, laurel wreaths, meander (Greek key) bands, lion heads, olive branches. |

### 1.2 Palette

Every asset uses these families. A new colour needs a reason and an entry here.

| Family | Use | Approx. colour |
| --- | --- | --- |
| Marble white | Columns, temples, civic buildings, statues | #F2EEE6 with grey veins |
| Cream plaster | Homes, walls | #EAD9BC |
| Terracotta | Roof tiles, pots, amphorae | #C4673A |
| Azure | Premium roofs, shutters, doors, banners | #2F6FB0 |
| Gold | Trim, emblems, capitals, finials | #E2B34A, polished |
| Bronze | Lamps, braziers, statues, fittings | #9A6A3A |
| Olive green | Foliage, accents | #6E8B3D |
| Deep red | Cloth, banners, awnings | #A8322D |

Tier rule: higher tiers add marble, gold and azure; lower tiers are plaster, wood and terracotta. A viewer should be able to guess a building's tier from its materials alone.

### 1.3 Generation prompts

Every concept image starts from one of these fixed templates. Only the bracketed part changes. Do not edit the rest without updating this file and regenerating a test item.

**Buildings, props, nature**

> A single premium stylised 3D game asset: **[item description]**. Three-quarter isometric view from slightly above, the whole object fully visible and centred, isolated on a plain light grey studio background, no ground, no scenery, no text. Style: hand-crafted collectible diorama look like a high-end mobile city-building game, slightly exaggerated chunky proportions, rich realistic materials (**[materials from the palette]**), soft warm studio lighting, crisp detail, clean silhouette. Not cartoon, not low-poly, not photoreal.

**Characters**

> Premium stylised 3D game character: an Olympian citizen, **[description: age, skin, hair, clothing in palette colours]**. Standing in a neutral A-pose, arms held slightly away from the body, legs slightly apart, facing the camera straight on, full body visible head to feet, centred, isolated on a plain light grey studio background, no ground, no text. Style: hand-crafted collectible figure like a high-end mobile game hero, slightly stylised proportions (slightly larger head and hands), rich realistic fabric and skin materials, soft warm studio lighting, crisp detail. Not cartoon, not chibi, not photoreal.

**Modular parts** (wall bodies, roofs, porches) add: "a single module only, straight-on symmetric, flat clean edges where it joins other parts".

**Style anchor.** Keep a reference sheet of approved items (villa, fountain, olive, citizen). When a new item drifts in style, generate it as image-to-image with the anchor sheet as a reference rather than rewriting the prompt.

### 1.4 Scale, orientation and origin

| Rule | Value |
| --- | --- |
| Units | 1 unit = 1 metre |
| Citizen height | 1.75 m (stylised; doors are at least 2.4 m tall so they read as grand) |
| Storey height | 3.0 m |
| Grid cell | 2 × 2 m (proposed; see Part 3) |
| Footprints | Whole grid cells. The villa body is 6.4 × 4.4 m and sits in a 4 × 3 cell slot with margin. |
| Front | Every model faces +Z after import, baked into the file by `assets/normalize.mjs`, not left to scene code. Trellis 2 and Hunyuan 3D buildings already come out square and facing +Z (yaw 0); check every new model in the review scene's front view, which has a red +Z arrow. |
| Origin | Bottom centre of the footprint, ground at Y = 0 |
| Ground contact | Flat base, no floating parts, no ground plate unless the item is a plaza tile |

### 1.5 Modular sockets

Homes are built from parts that snap into fixed sockets, so every new part multiplies the combinations. The villa sockets are already proven in the style test.

| Socket | Fits | Box (W × H × D) |
| --- | --- | --- |
| Walls (body) | All wall styles | 6.4 × 3.0 × 4.4 m |
| Roof | All roof styles | Sits on the wall top, overhang included |
| Porch | All porches | Front face, 6.4 m wide |
| Door | All doors | Front centre of the body |
| Upper storey (planned) | Second-floor bodies | Same as walls, stacked |
| Rooftop (planned) | Terrace, statue, garden | Flat roof variants only |

Apartments, shops and civic buildings get their own socket tables before their parts are generated.

### 1.6 Tiers

The constitution sets four grandeur tiers. Each upgradeable item ships every tier it claims, and every tier keeps the same footprint so an upgrade never moves anything.

| Tier | Feel | Materials |
| --- | --- | --- |
| 1 Humble | Small, warm, lived-in | Plaster, wood, terracotta |
| 2 Comfortable | Tidier, a porch, planters | Plaster, marble trim |
| 3 Fine | Columns, carved details | Marble, gold accents, azure |
| 4 Grand | Statement piece, glow at night | Marble, gold, bronze, braziers |

### 1.7 Technical budget

Everything has to run on a mid-range phone and on the live-stream scene with hundreds of plots.

| Item | Triangles | Texture | File size |
| --- | --- | --- | --- |
| Small prop (bench, amphora, lamp) | ≤ 30k (goal 5k) | 512 | ≤ 1.3 MB (goal 300 KB) |
| Tree, plant | ≤ 60k (goal 10k) | 512–1024 | ≤ 2.8 MB (goal 600 KB) |
| Building part / small building | ≤ 30k | 1024 | ≤ 1.5 MB |
| Civic structure | ≤ 80k | 2048 | ≤ 4 MB |
| Character (rigged) | ≤ 20k | 1024 | ≤ 2 MB |

Prop and plant budgets were raised on 22 Nov 2026 after batch 1. Trellis 2 output cannot be simplified to the original goals without falling apart (the hedge lost its leaves at 11k triangles), and asking Trellis for a 5k-triangle mesh gave a broken bush and a blotchy pot. File size follows triangle count; the textures are already small. The original goals stay as targets if a better route appears (leaf cards, another generator). Until then the far-away LOD below is required, not optional, for these items.

All models: glTF binary, meshopt geometry, WebP textures, PBR metal/rough. Far-away LOD (a simplified version at about 10% of the triangles) for anything that appears in the full-city live view.

### 1.8 Naming

`category_item_tier_variant`, lower case, for example `home_villa-walls_t3_marble`, `nature_olive_t1`, `civic_stadium_stage2`. The concept image keeps the same name as the model.

### 1.9 Acceptance checklist

An asset is accepted only when all of these pass:

1. Made from the template prompt, with its prompt saved alongside the concept image.
2. Palette and motifs match Part 1; the bolt emblem is present where it should be.
3. Front faces +Z, origin at bottom centre, correct real-world size.
4. Fits its socket or footprint with no gaps or overlaps.
5. Within the technical budget.
6. Looks right in the standard review scene in both daylight and dusk lighting, next to the villa and a citizen for scale.
7. No baked-in shadows or lighting in the textures; no stray background fragments.
8. Licence of the generator recorded.

### 1.10 Pipeline

1. Concept image: Nano Banana 2.1 on fal, template prompt, 2K.
2. Image to 3D: **Trellis 2 on fal** is the default (chosen 17 Nov 2026 on the starter cottage: closest to the concept, keeps small details, matches the existing models). Hunyuan 3D 3.1 Pro on fal is the fallback when Trellis mangles an item; it is cleaner but drops small details and leaves plain backs. Record which was used.
3. Clean-up: orientation, origin, scale, remove fragments, LOD.
4. Characters: Meshy rigging, standard animation set merged into one file.
5. Compress with gltf-transform, then run the acceptance checklist.

---

## Part 2: Catalogue

Status: **Done** = built and usable now. **Teaser** = built for the teaser and needs clean-up (orientation, scale, budget) before the builder can use it. **To build** = not made yet.

Priority: **P1** = needed for the first playable version (one district, one plot builder, one community build). **P2** = soon after. **P3** = later.

### A. Homes (personal plots)

| Item | Tiers / options | Status | Priority |
| --- | --- | --- | --- |
| Villa walls | Plaster, Marble | Done | P1 |
| Villa walls | Stone, Painted (ochre), Gold-trim marble | To build | P1 |
| Villa roof | Terracotta, Azure | Done | P1 |
| Villa roof | Slate grey, Gold tile, Roof garden (flat) | To build | P2 |
| Villa porch | Doric, Ionic | Done | P1 |
| Villa porch | Corinthian, Pergola with vines | To build | P2 |
| Villa door | Blue double door | Teaser | P1 |
| Villa door | Wood, Bronze, Gold | To build | P2 |
| Shutters and windows | Blue, Green, Arched | To build | P2 |
| Second storey module | Plaster, Marble | To build | P2 |
| Rooftop extras | Terrace, statue, chimney, banner | To build | P3 |
| Starter cottage (tier 1 home) | One-room plaster house | To build | P1 |
| Apartment block (insula) | Tiers 1–4 | To build | P2 |
| Grand villa (tier 4 home) | Two storeys, courtyard | To build | P3 |

### B. Businesses on a plot

| Item | Notes | Status | Priority |
| --- | --- | --- | --- |
| Café building | Taverna with awning | Teaser | P1 |
| Café terrace set | Tables, chairs, umbrella | Done | P1 |
| Bakery | Oven, bread display | To build | P2 |
| Market stall | Fruit, cloth, pottery versions | To build | P2 |
| Flower shop | Pots and garlands | To build | P2 |
| Pottery workshop | Wheel, kiln, amphorae | To build | P3 |
| Forge | Anvil, glowing hearth (ties to the smith role) | To build | P3 |
| Olive press | Ties to the grain and timber resources | To build | P3 |
| Scroll shop / small library | | To build | P3 |

### C. Plot decor and furniture (outdoor)

| Item | Status | Priority |
| --- | --- | --- |
| Fountain | Done | P1 |
| Statue (citizen on plinth) | Done | P1 |
| Brazier | Done | P1 |
| Marble bench | Done | P1 |
| Potted plants (3 sizes) | Done | P1 |
| Amphorae cluster | Done | P1 |
| Bronze lantern on post | Done (light to add in code) | P1 |
| Low garden wall and gate | Done | P1 |
| Mosaic path tiles | To build | P1 |
| Pergola with vines | To build | P2 |
| Outdoor dining table set | To build | P2 |
| Garden beds and planters | To build | P2 |
| Small shrine | To build | P2 |
| Reflecting pool | To build | P3 |
| Sundial | To build | P3 |
| Banners and flags | To build | P3 |

Indoor furniture is listed as a decision in Part 3; it is not in this list yet.

### D. Nature

| Item | Status | Priority |
| --- | --- | --- |
| Olive tree | Done | P1 |
| Cypress | Teaser | P1 |
| **Citizen's tree**: growth stages sapling, young, mature, grand, plus a leaning "resting" pose for each (constitution). An oak. | Done (4 stages; resting pose in code) | P1 |
| Laurel tree | To build | P2 |
| Pomegranate tree | To build | P2 |
| Fig tree | To build | P3 |
| Plane tree (big shade tree for squares) | To build | P2 |
| Flowering almond (seasonal) | To build | P3 |
| Bushes and hedges (3) | Done | P1 |
| Flowers and grass tufts | Done | P1 |
| Rocks (3) | To build | P2 |
| Grape vines | To build | P3 |

### E. Community builds (civic, funded by pledges)

Each one needs construction stages so it can rise during the live: foundation, frame with scaffolding, half built, complete. Each also needs a name surface for contributors.

| Item | Status | Priority |
| --- | --- | --- |
| City gate | Teaser | P1 |
| Stadium | Teaser (complete stage only) | P1 |
| Founders wall | Teaser | P1 |
| Agora (market square) | To build | P2 |
| Temple of Zeus | To build | P2 |
| Amphitheatre | To build | P2 |
| Library | To build | P3 |
| Bathhouse | To build | P3 |
| Gymnasium | To build | P3 |
| Council hall | To build | P3 |
| Lighthouse | To build | P3 |
| Aqueduct segment | To build | P3 |

### F. Public gifts (small items one citizen gifts to the district)

| Item | Status | Priority |
| --- | --- | --- |
| Tree (reuses nature items) | Partly done | P1 |
| Bench (reuses decor) | Done (reuse) | P1 |
| Lamp (reuses decor) | Done (reuse) | P1 |
| Small fountain | Done (reuse) | P1 |
| Name plaque that attaches to any gift | To build | P1 |

### G. Infrastructure and construction kit

| Item | Status | Priority |
| --- | --- | --- |
| Paving tiles: road, plaza, path | To build | P1 |
| Plot boundary marker (low stones) | To build | P1 |
| Street lamp | To build | P1 |
| Signpost with district name | To build | P2 |
| City wall segment, corner, tower | To build | P2 |
| Bridge | To build | P3 |
| Scaffolding (scales to footprint) | To build | P1 |
| Crane, stone blocks, timber stack, crates | To build | P1 |

### H. Characters

| Item | Status | Priority |
| --- | --- | --- |
| Citizen, young adult | Done (rigged) | P1 |
| Citizen, young woman | Teaser (rigged) | P1 |
| Citizen, elder | Teaser (rigged) | P1 |
| More citizen variety (8 to 12 looks, mixed ages and skin tones) | To build | P2 |
| Occupation outfits: builder, merchant, smith, steward, general | To build | P3 |
| Zeya in-world avatar | To build | P3 |
| Zeus in-world figure | To build | P3 |

Standard animation set for every character: idle, walk, cheer, wave, sit, work (hammer), clap. Done so far: idle, walk, cheer.

### I. World landmarks and teaser mysteries

| Item | Status | Notes |
| --- | --- | --- |
| Mount Olympus backdrop | Done (procedural) | |
| Veiled colossus | Teaser | Future community build |
| Floating sky temple | Teaser | Future reveal |
| Trireme and harbour | Teaser | Future district |
| Sealed lightning vault | Teaser | Future event |

These were promised as "coming soon" in the teaser, so each needs a plan for what it becomes.

### Totals

Counted by catalogue line. Many lines hold several models (the citizen's tree alone is eight), so the model count is roughly double.

| Status | Lines |
| --- | --- |
| Done | 22 |
| Teaser, needs clean-up | 12 |
| To build, P1 | 9 |
| To build, P2 | 23 |
| To build, P3 | 22 |

---

## Part 3: Decisions for planning

1. **Plot size and grid.** Proposed: 2 m cells, standard plot 16 × 12 m (8 × 6 cells), enough for a villa, a garden and one business. Does every citizen get the same size, or can plots expand?
2. **Interiors.** Do citizens furnish inside their home? Interiors roughly double the asset list. Recommendation: exteriors only for P1.
3. **Tiers.** Four tiers per upgradeable item (constitution), or fewer to start? Recommendation: tiers 1–3 for P1, tier 4 later as a goal.
4. **Generator.** Fal (Trellis 2) vs Meshy for buildings. Recommendation: test both on the same three concepts and pick on quality and clean geometry.
5. **Budget.** About 65 catalogue lines still to build, roughly 130 models once tiers, stages and variants are counted, and more generations than that once retries are included. Agree a cost ceiling per batch.
6. **Licence.** Confirm commercial on-stream use is allowed for every generator before anything ships.
7. **Theme.** Greek only for now; the constitution allows other themes later under the same footprints and sockets. Confirm Greek is the only theme for the first year.
8. **Teaser promises.** Decide what the colossus, sky temple, harbour and vault actually become, and when.
