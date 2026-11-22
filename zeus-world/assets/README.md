# Zeus World assets

The catalogue pipeline from the asset bible (`../docs/ASSET-BIBLE.md`).

- `concepts/`: approved concept images, named like the model (`home_cottage_t1_a.jpg`). Prompts are in `PROMPTS.md`.
- `raw/` (not committed): models as the generator returned them.
- `models/`: normalised, compressed, catalogue-ready models.
- `normalize.mjs`: raw model to catalogue model: front +Z, origin bottom centre, scale to a box, triangle budget, WebP textures, meshopt.
  `node normalize.mjs raw/x.glb models/x.glb --fit 6.8,0,4.8 --yaw 0 --tris 30000 --tex 1024`
  `--maxerr` caps how far simplification may go (default 0.01; use 0.003 for foliage, or the leaves are stripped off). The triangle budget is a target: a model stays over it rather than lose its shape.
- `batch1.sh`: the sizes and settings used for every batch 1 model.
- `sheets/`: concept and review sheets shown to the owner.
- `review/`: the standard review scene: the item beside the reference villa and a citizen on the 2 m grid, day or dusk.
  `npm run review`, then open `http://localhost:4180/?m=models/x.glb&view=3q&light=day` (views: 3q, front, back, side, top). Add `&props` for small items: tight spacing and a close camera.
- `shot.mjs`: renders review stills: `node shot.mjs renders/x.png "m=models/x.glb&view=3q"` with the review server running.

Setup: `npm install`.
