---
name: measure-memory
description: Measure what the Zeus World city page holds in memory, what a frame costs to draw, and whether anything grows over time. Use before and after any change aimed at memory or frame rate, and when the owner reports the page being heavy or slow.
---

# Measure memory and frame cost

Run from `zeus-world/assets/`. Background and past figures in `zeus-world/docs/knowledge/performance.md`.

1. `npm install` if needed, and start the review server in the background: `npm run review`.
2. **Before changing anything**, take a baseline: `mkdir -p renders && node measure.mjs renders/measure-before.json 10 > renders/measure-before.txt`. About four minutes. Also render stills of the views the change could affect (`render-still` skill).
3. Make the change.
4. Measure again into `renders/measure-after.json`, and render the same stills.
5. **Compare the stills pixel by pixel.** Two renders of unchanged code differ in under about 100 pixels; thousands means the picture changed. A change meant to save memory must not change the picture unless the owner agreed to it.
   For the frame cost of one camera view: `node measure.mjs renders/m.json 0.2 1280 720 "view=plaza"`. The output lists the heaviest models in the scene by triangles and by number of meshes; start with those.
6. **Read the result:**
   - "calculated graphics memory" and the counts are exact.
   - Process memory is from software rendering: use it to compare before and after, not as what the owner will see.
   - Geometry or texture counts rising over time mean a leak.
   - Frame rate cannot be measured here; draw calls and triangles are the stand-in.
7. Add a row to the measurements table in `performance.md`, and record what was found and what was changed there.
8. Ask the owner for the real figures from Chrome's task manager (Shift+Esc): the tab and "GPU Process", after one minute and after ten.
