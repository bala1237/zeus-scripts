---
name: build-model
description: Build or rebuild a Zeus World catalogue model from its Blender script, including the one-time Blender setup, and check the result. Use when adding or changing a scripted model under zeus-world/assets/blender.
---

# Build a scripted model

Run from `zeus-world/assets/`. Background in `zeus-world/docs/knowledge/models.md`; style rules, sizes and sockets in `zeus-world/docs/ASSET-BIBLE.md`.

1. **Set up Blender once per session:** `python3 -m venv bl && bl/bin/pip install bpy pillow`. Also `npm install`.
2. **Write or change the model** in the script that owns it (`town.py`, `city.py`, `kit.py`, `temple.py`, the villa scripts). Use the helpers in `zw.py` and `parts.py`. Build at real size, front facing +Z, origin at the bottom centre.
3. **Name materials for effects:** `water`, `flame`, `coal`, `cloth_<something>`. The city scene finds them by name.
4. **New model:** add a line to `build.sh` (name, script, argument, triangle budget, texture size).
5. **Build:** `PY=bl/bin/python ./build.sh <model name>`. With no name it rebuilds everything, about 15 minutes.
6. **Check:** render it beside the villa and a citizen (`render-still` skill) and look at the image. Check against the acceptance checklist in the asset bible, section 1.9.
7. **Use it in the city:** add the name to `PRE` in `review/city.js` and place it with `P()`. A chimney needs a line in `CHIMNEYS` in `review/ambient.js`.
8. **Far-view version:** if the model is one of those listed in `far.sh` (citizens, trees, bushes), run `./far.sh` so its far-view version matches.
9. **Update the documents:** the catalogue line in the asset bible, the changelog, and the backlog entry if there is one.

Generated models (fal) cost money. Ask the owner before generating anything.
