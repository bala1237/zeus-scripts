# Performance: memory and frame rate

Backlog: ZW-001 (Chrome memory), ZW-004 (frame rate, download size, quality setting).

## Where it stands (22 Nov 2026)

Memory was measured, the two largest causes were fixed, and it was measured again. Memory use roughly halved or better, with no change to the picture. Frame rate has not been worked on yet; the figures below show why it will need to be.

| | Before | After |
| --- | --- | --- |
| Textures held in graphics memory | 1,065 textures, 1,305 MB | 144 textures, 340 MB |
| Sun's shadow map | 512 MB | 192 MB |
| Geometry | 48 MB | 48 MB |
| Tab process, measured here | 1,438 MB | 708 MB |
| Graphics process, measured here | 2,121 MB | 828 MB |
| Growth over ten simulated minutes | none in the tab; about 100 MB in the graphics process, all in the first two minutes | the same |
| Draw calls a frame | 2,320 | 2,320 |
| Triangles drawn a frame | 5.0 million | 5.0 million |

The process figures come from software rendering on a 1280 × 720 page, where graphics memory is ordinary memory. On the owner's machine the split between the tab and the "GPU Process" will differ, and a larger or high-density window adds to the canvas figure. The counts and the calculated sizes are exact.

**Waiting on the owner:** the real figures from Chrome's task manager (Shift+Esc) on the preview, after one minute and after ten.

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

## How to measure

From `zeus-world/assets/`, with the review server running (`npm run review`):

- `node measure.mjs [out.json] [simulated minutes] [width height] [extra query]`, for example `node measure.mjs renders/measure.json 10`. About four minutes for ten simulated minutes.
- It loads the city in still mode with the day cycle on, then steps the scene forward in simulated time and draws a frame every 30 simulated seconds. It reports:
  - what the scene holds, calculated from the objects: textures, geometry, shadow map and canvas in megabytes, and the heaviest models;
  - draw calls and triangles for a frame;
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

Frame rate (ZW-004), not started:

- Draw repeated models in one go (instancing): about 340 tiles, 60 wall pieces, 27 river pieces, lamps, trees.
- Skip animation and drawing for citizens outside the view. The 58 citizens are skinned and never culled.
- Lighter far-view versions of the citizens and the heaviest models.
- A quality setting (`?q=low|medium|high`, chosen automatically on phones): shadow map size, pixel ratio, number of citizens, number of real lights.
- Load the centre first and distant buildings afterwards.
- The lightning bolt builds new geometry on each strike without freeing the old. It does not show as growth in the measurements, but it should reuse one.

## Measurements

Software rendering, 1280 × 720, `light=cycle`, 44 people. Process memory is at start; frame rate cannot be measured here.

| Date | Change | Draw calls | Triangles | Textures | Texture memory | Shadow map | Tab | Graphics process |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 22 Nov 2026 | Baseline | 2,320 | 5.0 M | 1,065 | 1,305 MB | 512 MB | 1,438 MB | 2,121 MB |
| 22 Nov 2026 | Shared textures, leaner shadow map | 2,320 | 5.0 M | 144 | 340 MB | 192 MB | 708 MB | 828 MB |
