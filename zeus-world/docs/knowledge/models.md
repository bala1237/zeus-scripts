# Models

How the catalogue in `zeus-world/assets/models/` is made. Style rules, the catalogue and the socket table are in `../ASSET-BIBLE.md`; every command is in `../../assets/README.md`.

## Three sources

| Source | Used for | Cost |
| --- | --- | --- |
| Blender scripts (`assets/blender/`) | Anything hard-edged or modular: buildings, walls, street furniture, water pieces | Free |
| Generation on fal (Trellis 2) | Organic pieces: plants, trees, citizens, landmarks from the teaser | About $0.35 a model |
| Poly Haven scans (CC0) | Three rock sets, a marble bust, a lion head; also skies and textures | Free |

Files ending `.trellis.glb`, `.tripo.glb` or `.hunyuan.glb` are earlier versions kept for comparison. The plain name is the catalogue model.

## Scripted models

- `zw.py`: shared helpers (palette, textures, shapes, boolean cuts, the gold bolt, baked contact shadows, export).
- `parts.py`: shared building parts (columns, tiled roofs, walls with windows and doors, awnings, banners, arches, seating).
- `villa_walls.py`, `villa_roof.py`, `villa_porch.py`, `temple.py`, `city.py`, `town.py`, `kit.py`, `bench.py`: the models themselves.
- `build.sh [model name]` builds one model or all of them: Blender script, then the normaliser. The table in `build.sh` is the list of scripted models with their triangle budget and texture size. A full rebuild takes about 15 minutes.
- Scripted models are built at real size, facing the front (+Z), origin at the bottom centre, so the normaliser only compresses them.
- **Material names matter.** The city scene finds `water`, `flame`, `coal` and `cloth_*` by name (see `city-scene.md`).

## Generated models

1. Concept image: Nano Banana 2.1 on fal, 1:1, 2K, from the template prompt in `assets/PROMPTS.md`. The owner approves a sheet before any 3D spend.
2. Image to 3D: Trellis 2 on fal (resolution 1536, texture 2048, decimation 120000).
3. Normalise: `normalize.mjs` turns the raw file into a catalogue model: front +Z, origin bottom centre, scaled to a box, triangle budget, WebP textures, meshopt compression. Settings for each model are in `batch1.sh` and `teaser.sh`.
4. Characters are rigged with Meshy through fal. Rigged models need `--rescale` (explained in the assets README).

Things learned:

- Foliage needs `--maxerr 0.003`, or simplification strips the leaves.
- The triangle budget is a target; a model stays over it rather than lose its shape. Generated models are all over the bible's budget.
- Every model so far needed `--yaw 0`.
- Tripo P2 gave a cleaner result at $1.10 a model; not adopted on cost.

## Checking a model

- `npm run review` (port 4180), then `node shot.mjs renders/x.png "m=models/x.glb&view=3q"` renders it beside the reference villa and a citizen. Add `props&` for small items.
- `qc.sh` renders several models side by side.
- Sheets shown to the owner are kept in `assets/sheets/`.

## Naming

`<group>_<item>_<tier>_<variant>.glb`, for example `home_villa-roof_t3_azure.glb`. Groups: `home`, `biz`, `civic`, `decor`, `nature`, `infra`, `water`, `build`, `char`, `landmark`.
