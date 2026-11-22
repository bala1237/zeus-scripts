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

## Street test

`review/street.html` is the look test: six plots on a road, from catalogue models only. `PAGE=street.html node shot.mjs renders/x.png "view=wide&light=day"` (views: wide, street, villas, ochre, gold, site, garden). `review/main.js` also takes `m=asm:models/<walls>.glb` to show a wall body with a roof and porch.
