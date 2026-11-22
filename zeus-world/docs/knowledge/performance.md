# Performance: memory and frame rate

Backlog: ZW-001 (Chrome memory), ZW-004 (frame rate, download size, quality setting).

**State on 22 Nov 2026: nothing has been measured and nothing has been changed.** Everything under "Suspects" comes from reading the code. Replace it with measurements as they are taken.

## What the page holds

- 91 models preloaded, about 80 MB of files.
- About 58 animated citizens: 44 in the town, 6 on the quay, 8 builders. Estimated at about a million triangles together.
- Two sky photos and two HDR files.
- One shadow map for the sun.

## Suspects

| Suspect | Why | Where |
| --- | --- | --- |
| Shadow map | 8192 × 8192 is about 256 MB of graphics memory, and more than many phones allow | `city.js`, `sun.shadow.mapSize` |
| Textures | WebP is small on disk but unpacked in graphics memory: about 21 MB for each 2048 texture with its smaller copies. Generated models carry the largest | `assets/models/`, set by `--tex` in the normaliser |
| Everything loaded at once | All 91 models are downloaded and kept, including ones far from the camera | `city.js`, `PRE` |
| One object per copy | Each placed copy is drawn separately: about 340 tiles, 60 wall pieces, 27 river pieces | `city.js`, `put()` |
| Citizens | Each has its own copy of its materials; all are animated every frame even when off screen, and never skipped when out of view | `life.js`, `spawn()`, `step()` |
| Lightning | Each strike builds new geometry and never frees the old; would show as memory growing slowly | `life.js`, `strike()` |
| Screen resolution | Drawn at up to twice the screen's pixel count | `city.js`, `setPixelRatio` |

## How to measure

- **On the owner's machine.** Chrome's task manager (Shift+Esc) shows memory for the tab and for the GPU process. Note both after one minute and after ten. Growth over time means a leak; high from the start means the scene is simply heavy.
- **Here.** `renderer.info` gives draw calls, triangles, geometries and textures in the page. It is not yet exposed; add it to `window.__fx` or similar and read it from a `shot.mjs`-style script. Memory in megabytes is not meaningful under software rendering; counts are.
- Measure before and after each change, and record the figures in the table below.

## Ideas, not yet tried

- A quality setting (`?q=low|medium|high`, chosen automatically on phones): shadow map size, pixel ratio, number of citizens, number of real lights.
- Draw repeated models in one go (instancing) for tiles, walls, river pieces, lamps, trees.
- Skip animation and drawing for citizens outside the view.
- Lighter far-view versions of the citizens and the heaviest models.
- Smaller textures on generated models, or GPU-compressed textures (KTX2), which stay small in graphics memory.
- Load the centre first and distant buildings afterwards.
- Reuse the lightning bolt's geometry.

## Measurements

| Date | Change | Draw calls | Triangles | Textures | Tab memory | GPU memory | Frame rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | None yet | | | | | | |
