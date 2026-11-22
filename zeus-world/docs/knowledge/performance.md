# Performance: memory and frame rate

Backlog: ZW-001 (Chrome memory), ZW-004 (frame rate, download size, quality setting).

## Where it stands (22 Nov 2026)

Two rounds of work, both the same day. Memory was measured and roughly halved (ZW-001). Then the cost of drawing a frame was cut by about half (ZW-004, first batch). Frame rate itself cannot be measured on the build machine; draw calls and triangles are the stand-in, and the owner's frame counter on the preview is the real test.

Memory (ZW-001):

| | Before | After |
| --- | --- | --- |
| Textures held in graphics memory | 1,065 textures, 1,305 MB | 144 textures, 340 MB |
| Sun's shadow map | 512 MB | 192 MB |
| Geometry | 48 MB | 48 MB |
| Tab process, measured here | 1,438 MB | 708 MB |
| Graphics process, measured here | 2,121 MB | 828 MB |
| Growth over ten simulated minutes | none in the tab; about 100 MB in the graphics process, all in the first two minutes | the same |

Cost of a frame (ZW-004):

| View | Draw calls before | after | Triangles before | after |
| --- | --- | --- | --- | --- |
| Wide (the whole city) | 2,330 | 1,154 | 5.0 million | 2.2 million |
| Plaza | 667 | 431 | 2.8 million | 1.9 million |
| Street | 908 | 591 | 3.2 million | 2.3 million |

The process figures come from software rendering on a 1280 × 720 page, where graphics memory is ordinary memory. On the owner's machine the split between the tab and the "GPU Process" will differ, and a larger or high-density window adds to the canvas figure. The counts and the calculated sizes are exact.

**Waiting on the owner:** memory figures from Chrome's task manager (Shift+Esc), and the frame rate shown top right on the preview, on a computer and a phone.

## What was found

1. **The same textures were loaded many times over.** Every scripted model file carries its own copy of the shared textures: the same marble image is in 42 files, dark wood in 36. The 91 preloaded models hold 1,046 textures between them, of which only 137 are different images. Each copy was decoded and uploaded separately. This was two thirds of the memory, counted twice: once in graphics memory and once as the decoded copy the tab keeps.
2. **The shadow map was 512 MB.** At 8192 × 8192, three.js gives it a full colour layer that is never read (256 MB) and 32-bit depth (256 MB).
3. **There is no leak.** Over ten simulated minutes, including day-to-dusk changes and lightning strikes, geometry and texture counts stay flat (679 to 682, 209 to 212) and script memory moves from 179 to 181 MB. The graphics process grows by about 100 MB when dusk first arrives (lamps and their shaders) and then holds.
4. **The scene is heavy to draw:** 2,196 meshes, 804 materials, 5.1 million triangles, 2,320 draw calls a frame, and the shadow pass costs about 1,800 more draw calls each time the shadows are redrawn. This is frame rate, not memory: ZW-004.

## What was changed

Both in `assets/review/city.js`.

- **Shared textures (`shareTextures`).** As each model loads, the bytes of each of its images are hashed. If an identical image is already loaded, the texture is pointed at it and its own decoded copy is freed before it is ever uploaded. Matching is by content, so it needs nothing from the model files and cannot confuse two images that share a name. If anything about a file is unexpected, that model's textures are left alone and a warning is logged.
- **Leaner shadow map.** The scene now creates the sun's shadow map itself: a one-byte colour layer and 16-bit depth, 192 MB instead of 512 MB. 16-bit depth steps are 6 mm over the 400 m range, far below the shadow bias of 0.2 m.
  - **Trap:** three.js only updates the shadow camera's projection when it creates the map itself. With our own map, `sun.shadow.camera.updateProjectionMatrix()` must be called, or there are no shadows at all and no error.
  - The shadow type is now `PCFShadowMap`. three.js 0.187 has removed the soft type and was already substituting this one, with a warning.

**How it was checked.** Stills of four views (wide day, plaza dusk, street day, temple dusk) before and after, compared pixel by pixel. Between 5 and 183 pixels out of 921,600 differ by more than 8 levels, which is the same as two renders of unchanged code (82 pixels). With 32-bit depth the stills are identical, so texture sharing changes nothing; the handful of differing pixels are shadow edges from the 16-bit depth, and are not visible at four times zoom.

## Frame cost: what was found and changed (ZW-004)

**Found.** `measure.mjs` now lists what each model costs in the scene as placed. Before the work:

- The 58 citizens were 1.8 of the 5.0 million triangles. The man alone was 1.0 million: he was the style test's copy at 59,000 triangles, three times the other two.
- Trees and bushes were another 1.5 million. A single bush is 50,000 to 60,000 triangles.
- Most of the 2,330 draw calls were copies of the same pieces: 194 road-tile meshes, 171 wall meshes, 168 quay meshes, 144 plaza tiles.

**Changed.** All in `assets/review/`, with tools in `assets/`.

1. **Repeated pieces are drawn in one go** (`city.js`, the instancing block after the city is placed). Every set of meshes sharing a shape and a material becomes one instanced mesh. Meshes went from 2,196 to about 1,000. Left out: anything marked `userData.dynamic` (it moves, or is shown and hidden), buildings under construction, people, and fire and cloth materials, which the effects handle one mesh at a time. The picture is unchanged.
   - Anything added to the scene that moves or toggles must set `userData.dynamic = true` on itself or a parent before that block runs, or it will be frozen into an instance.
   - An instanced set is culled as a whole, so pieces spread over the city (tiles, walls) are always drawn. Their triangle counts are small.
2. **Citizens outside the camera's view are neither posed nor drawn** (`life.js`). Their walk carries on; only the skeleton work and the drawing stop. A citizen coming back into view picks up its step where it left off, so two stills can differ at the frame edge.
3. **The man is now a catalogue model** at 20,000 triangles (`models/char_citizen_man.glb`), like the other two. A frame sheet beside the original shows no difference.
4. **Far-view models** for the citizens, the trees and the bushes (`models/far/`, made by `lod.mjs`, listed in `far.sh`): about a fifth of the triangles. A citizen switches beyond 45 m, a plant beyond 70 m, with a 7% margin either side so nothing flickers at the boundary. `?far=0` turns them off; `?peoplefar=` and `?plantfar=` set the distances.
   - A far citizen is a second body on the same skeleton, so its movement is identical.
   - Far models carry a colour on each vertex and no texture, so they add no texture memory and only 1.1 MB of download.

**How the far models are made, and what did not work** (`lod.mjs`):

- The usual simplifier (meshopt, through gltf-transform) stops far short of the target on generated models: 20,000 triangles came down only to 12,000 to 18,000. These meshes are thousands of loose islands that it will not join. Ignoring texture seams and allowing it to prune loose pieces did not help.
- Vertex clustering is used instead: vertices are snapped to a grid, each cell keeps one, and collapsed faces are dropped. The grid is searched for the finest one that meets the budget. Coarse close up, but it always reaches the budget and keeps the outline.
- **Colour.** A clustered vertex with its old texture position shows whatever texel it sat on, and on generated models vertices sit on texture seams, which are darker than the surface. So colour is sampled inside each face, weighted by the face's size, averaged per cell and stored on the vertices.
- **Trap: metallic.** A material whose roughness map is removed falls back to its factors, which on these models are fully metallic, and renders dark. The far material resets metalness to 0 and roughness to 0.9.
- **Facing.** Clustering turns some faces inside out, so far materials are drawn double-sided. Foliage (`round`) gets facing that mixes outward-from-the-middle with straight up, so it lights evenly from any side, as the many leaf tops of the full model do. Plain outward facing went dark on the side away from the sun and under tall trees.

**How it was checked.** Stills of four views before and after instancing: only citizens at the frame edge differed. Far models: rendered beside the full models, and the wide view by day and dusk with `far=0` and without, compared side by side and by mean colour (within one level of 255). Frame sheets of the lighter man.

## How to measure

From `zeus-world/assets/`, with the review server running (`npm run review`):

- `node measure.mjs [out.json] [simulated minutes] [width height] [extra query]`, for example `node measure.mjs renders/measure.json 10`. About four minutes for ten simulated minutes. For one view's frame cost: `node measure.mjs renders/m.json 0.2 1280 720 "view=plaza"`.
- It loads the city in still mode with the day cycle on, then steps the scene forward in simulated time and draws a frame every 30 simulated seconds. It reports:
  - what the scene holds, calculated from the objects: textures, geometry, shadow map and canvas in megabytes, and the heaviest models;
  - draw calls and triangles for a frame, and what each model costs in the scene as placed;
  - counts of live geometries and textures over time, and script memory (a rise means a leak);
  - resident memory of the browser's tab and graphics processes.
- The page exposes `window.__zw` (`renderer`, `scene`, `camera`, `tickers`, `sun`, `cache`) for this script.
- On the owner's machine: Chrome's task manager (Shift+Esc) shows the tab and the "GPU Process".
- Measure before and after each change and add a row to the table below.

## What is left

Memory, in order of size:

| Item | Size now | Idea |
| --- | --- | --- |
| Textures | 340 MB in graphics memory | GPU-compressed textures (KTX2) stay compressed in memory, roughly a sixth of the size. Needs an encoder in the pipeline and a check of the look |
| Decoded copies kept by the tab | about 255 MB | Free each image once it has been uploaded. Needs care: a texture first shown later, or a lost graphics context, would need the image again |
| Shadow map | 192 MB | A quality setting: 4096 is 48 MB, with softer shadow edges. A look decision for the owner |
| Script memory | 180 MB | Mostly model data kept after upload. Not yet looked into |
| Canvas | 35 MB at 1280 × 720, about 320 MB on a 4K or high-density full screen | A quality setting for pixel ratio. `preserveDrawingBuffer` is only needed for stills and costs one extra copy |

Download: the model files still each carry their own copies of the shared textures (57 MB preloaded). Storing shared textures once, outside the model files, would cut the download as well. Related: ZW-011.

Frame rate (ZW-004), still to do, in rough order of value:

- **A quality setting** (`?q=low|medium|high`, chosen automatically on phones): shadow map size, pixel ratio, number of citizens, number of real lights, shorter far distances. Needs a phone to check.
- **Buildings.** They are now most of what is left: about 1.7 million triangles in the wide view. Far-view versions of the largest (grand villa, temple, gymnasium, amphitheatre, apartment blocks) would cut that, but hard-edged architecture shows simplification far more than foliage does.
- **Scaffolding** is 245,000 triangles in 90 meshes. A lighter scaffold model, or instancing it per level.
- **Merge the single meshes.** About 800 meshes are one-off building parts, around 20 per building, one per material. Merging them by material would cut draw calls again, at the cost of memory and of culling.
- Load the centre first and distant buildings afterwards.
- The lightning bolt builds new geometry on each strike without freeing the old. It does not show as growth in the measurements, but it should reuse one.

## Measurements

Software rendering, 1280 × 720, `light=cycle`, 44 people. Process memory is at start; frame rate cannot be measured here.

| Date | Change | Draw calls | Triangles | Textures | Texture memory | Shadow map | Tab | Graphics process |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 22 Nov 2026 | Baseline | 2,320 | 5.0 M | 1,065 | 1,305 MB | 512 MB | 1,438 MB | 2,121 MB |
| 22 Nov 2026 | Shared textures, leaner shadow map | 2,320 | 5.0 M | 144 | 340 MB | 192 MB | 708 MB | 828 MB |
| 22 Nov 2026 | Instancing, culling of citizens, lighter man, far-view models | 1,154 | 2.2 M | 154 | about 345 MB | 192 MB | about 710 MB | about 830 MB |
