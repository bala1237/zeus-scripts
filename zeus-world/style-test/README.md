# Zeus World style test

One citizen's plot, built from AI-generated 3D models, to judge the art direction before committing to it.

- `concepts/`: the concept images every model was generated from (one shared style prompt).
- `public/models/`: the 3D models, compressed for phones (meshopt geometry, WebP textures). About 9 MB in total.
- `src/main.js`: the scene: plot, lighting, models, citizen walk/idle/cheer, and the modular villa builder.

## Modular villa

The villa is assembled from three slots, each a separately generated part scaled to a fixed socket (6.4 x 4.4 m footprint, 3 m walls):

| Slot | Options (Bolts) |
| --- | --- |
| Walls | Plaster 300, Marble 800 |
| Roof | Terracotta 200, Azure 600 |
| Porch | None, Doric 250, Ionic 700 |

That gives 12 combinations from 6 parts; each new part adds combinations rather than one more house. The citizen has 2,000 Bolts, so the most expensive combination is out of reach and its chips grey out.

## Pipeline used

1. Concept image per item: Nano Banana 2.1 (fal.ai), same style prompt for all.
2. Image to 3D: Trellis 2 (fal.ai).
3. Citizen rig and animations: Meshy rigging (fal.ai), clips merged with `merge-citizen.mjs`.
4. Compression: `gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 1024`.
5. For the published artifact page, `glb2json.py` turns each model into a self-contained `.json` glTF, because the artifact host does not serve `.glb` files. Build with `VITE_MODEL_EXT=json npx vite build --outDir dist-artifact`.

## Run it

`npm install`, then `npm run dev`. Add `?walls=1&roof=1&porch=2` to start with a given combination, `?light=day` for daylight.

The licence terms of each generator for commercial on-stream use still need checking before these models ship.
