---
name: render-still
description: Render a still image of the Zeus World city, the street test, or a single model, to check a change or to show the owner. Use when a visual change needs checking, since motion cannot be watched on this machine.
---

# Render a still

Run from `zeus-world/assets/`. Details in `zeus-world/docs/knowledge/environment.md`.

1. `npm install` if `node_modules` is missing.
2. Start the review server in the background: `npm run review` (port 4180). Leave it running.
3. `mkdir -p renders`, then render:
   - City: `PAGE=city.html node shot.mjs renders/<name>.png "view=<view>&light=<day|dusk>"`. Views: `wide`, `plaza`, `street`, `temple`, `harbour`, `river`, `homes`, `civic`, `top`.
   - Street test: `PAGE=street.html node shot.mjs renders/<name>.png "view=wide&light=day"`.
   - One model: `node shot.mjs renders/<name>.png "m=models/<model>.glb&view=3q"`. Add `props&` in front for small items.
   - Several models side by side: `./qc.sh <name> <props|wide> <label> <model> <model> ...`.
   - A character's animation as a frame sheet: `PAGE=poses.html node shot.mjs renders/<name>.png "m=models/<character>.glb&clip=Walk&n=8" 1600 760` (clips: `Walk`, `Idle`, `Cheer`, `Clap`, `none`). Use it for anything about how a citizen moves; see `zeus-world/docs/knowledge/characters.md`.
4. Read the output for "page error" or "console error". An error makes the render hang until timeout.
5. Open the image and look at it before reporting anything about it.

Limits:

- A city still takes about four minutes. Run one per command and set a ten-minute timeout; do not chain two.
- A still shows the scene 8 seconds in. It cannot show motion, flicker or frame rate.
- `renders/` is not committed. To show the owner, send the file, or save a sheet in `sheets/`.
