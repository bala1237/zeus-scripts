# Zeus World style test

One citizen's plot, built from AI-generated 3D models, to judge the art direction before committing to it.

- `concepts/`: the concept images every model was generated from (one shared style prompt).
- `public/models/`: the 3D models, compressed for phones (meshopt geometry, WebP textures). About 9 MB in total.
- `src/main.js`: the scene: plot, lighting, models, citizen walk/idle/cheer, upgrade toggle.

## Pipeline used

1. Concept image per item: Nano Banana 2.1 (fal.ai), same style prompt for all.
2. Image to 3D: Trellis 2 (fal.ai).
3. Citizen rig and animations: Meshy rigging (fal.ai), clips merged with `merge-citizen.mjs`.
4. Compression: `gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 1024`.
5. For the published artifact page, `glb2json.py` turns each model into a self-contained `.json` glTF, because the artifact host does not serve `.glb` files. Build with `VITE_MODEL_EXT=json npx vite build --outDir dist-artifact`.

## Run it

`npm install`, then `npm run dev`. Add `?tier=3` to start with the upgraded villa, `?light=day` for daylight.

The licence terms of each generator for commercial on-stream use still need checking before these models ship.
