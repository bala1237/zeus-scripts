# Zeus World assets

The catalogue pipeline from the asset bible (`../docs/ASSET-BIBLE.md`).

- `concepts/`: approved concept images, named like the model (`home_cottage_t1_a.jpg`). Prompts are in `PROMPTS.md`.
- `raw/` (not committed): models as the generator returned them.
- `models/`: normalised, compressed, catalogue-ready models.
- `normalize.mjs`: raw model to catalogue model: front +Z, origin bottom centre, scale to a box, triangle budget, WebP textures, meshopt.
  `node normalize.mjs raw/x.glb models/x.glb --fit 6.8,0,4.8 --yaw 0 --tris 30000 --tex 1024`
  `--maxerr` caps how far simplification may go (default 0.01; use 0.003 for foliage, or the leaves are stripped off). The triangle budget is a target: a model stays over it rather than lose its shape.
  `--rescale` is for rigged characters: the fit box is measured on the unposed mesh, which the skeleton renders at another size. Normalise once, read the rendered height from `window.sizes` in the review scene, and pass target ÷ rendered as `--rescale`.
- `batch1.sh`, `teaser.sh`: the sizes and settings used for every batch 1 model and for the 12 cleaned-up teaser models. Every model so far needed `--yaw 0`.
- `sheets/`: concept and review sheets shown to the owner.
- `review/`: the standard review scene: the item beside the reference villa and a citizen on the 2 m grid, day or dusk.
  `npm run review`, then open `http://localhost:4180/?m=models/x.glb&view=3q&light=day` (views: 3q, front, back, side, top). Add `&props` for small items: tight spacing and a close camera.
- `shot.mjs`: renders review stills: `node shot.mjs renders/x.png "m=models/x.glb&view=3q"` with the review server running.

Setup: `npm install`.

## Scripted models (Blender, free)

`blender/` builds models by script, with no generation cost.

- `zw.py`: shared helpers. Palette, textures (numpy-made marble and meander, and `tex_photo()` which grades CC0 Poly Haven scans towards the palette), boxes, prisms, cylinders, lathed shapes, rods, beams, rings, boolean cuts, the gold bolt, hand-made wobble, baked contact shadows, glTF export.
- `villa_walls.py <stone|ochre|goldmarble>`, `villa_roof.py <terracotta|azure>`, `villa_porch.py <doric|ionic>`: the three villa parts, each built to its socket.
- `bench.py`, `kit.py <item>`: bench; street, construction and garden pieces.
- `parts.py`: shared building parts (materials by name, Doric and Ionic columns, tiled roofs, walls with windows and doors, awnings, banners, arches, curved seating).
- `temple.py <stage>`, `city.py <item>`, `town.py <item>`: the Temple of Zeus; civic buildings, walls, monuments and water; homes, shops, stalls and furniture.
- `fetch_textures.py`: downloads Poly Haven texture sets into `blender/textures/` (see the README there).
- `build.sh [model name]`: builds everything, or one model, into `models/`.

Setup once: `python3 -m venv bl && bl/bin/pip install bpy pillow` (Blender 5.3 as a Python module; no graphics card needed). Then `PY=bl/bin/python ./build.sh`.

Scripted models are built at real size, facing the front, so the normaliser only compresses them.

## Scenes

`review/city.html` is the whole scripted city (`PAGE=city.html node shot.mjs renders/x.png "view=wide"`; about 3 minutes a still). `qc.sh` renders any set of models side by side for checking.

`review/life.js` (citizens, building sites, birds) and `review/ambient.js` (cloth, trees, smoke, spray, boats) add the motion; `review/city.js` holds layout, lighting, time of day and effects. Page options and how the scene works are in `docs/knowledge/city-scene.md`. `npm run build` makes the hosted version in `dist/`.

`measure.mjs` reports what the city holds in memory and what a frame costs: `node measure.mjs renders/measure.json 10` with the review server running. See `docs/knowledge/performance.md`.

`review/poses.html` is a frame sheet of a character's animation (`PAGE=poses.html node shot.mjs renders/x.png "m=models/char_citizen_woman.glb&clip=Walk" 1600 760`), and `reskin.mjs` rebuilds a rigged character's bone binding from its shape. Both are explained in `docs/knowledge/characters.md`.

`lod.mjs` makes a far-view version of a model (`models/far/`), and `far.sh` rebuilds all of them; the city swaps them in at a distance. See `docs/knowledge/performance.md`.

## Street test

`review/street.html` is the look test: six plots on a road, from catalogue models only. `PAGE=street.html node shot.mjs renders/x.png "view=wide&light=day"` (views: wide, street, villas, ochre, gold, site, garden). `review/main.js` also takes `m=asm:models/<walls>.glb` to show a wall body with a roof and porch.

## Lasers

`review/laser.html` is the laser show (ZW-036). Stills: `PAGE=laser.html node shot.mjs renders/x.png "shot&pattern=tunnel&theme=3&cam=1&beats=6&bg=mock" 800 450` (patterns and themes are listed in `review/director.js`; `bg` is black, clear or mock). `npm test` runs the Lighting Director's rule tests in `test/`. It also runs the beat tracker's tests on made-up music. `node beattest.mjs 128` (review server running) plays a test kick to the page in a real browser and prints the tempo it locked to. Add `look=flow` or `look=both` to a laser still for the Flow mode, and `flowt=40` to choose a moment in it. `node clicktest.mjs` clicks every button on the laser page with a real pointer.

## Andie's Place

`review/andie.html`. Stills: `PAGE=andie.html node shot.mjs renders/x.png "shot&beats=calm"` for the calm room; `"shot&beats=3.2&cue=chase"` for a cue (glow, chase, oracle, fill, strobe); add `mode=lasers&lasers&pattern=fan` for the lasers. Buttons: `node clicktest.mjs http://localhost:4180/andie.html demo,mode,tap,stop,listen`.
