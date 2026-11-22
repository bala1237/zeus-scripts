# Session environment

Sessions run in a fresh cloud container each time. Nothing installed in one session survives to the next, so set up what the task needs.

## Node (review scenes, stills, normaliser)

From `zeus-world/assets/`:

- `npm install`
- `npm run review` serves the scenes on port 4180.
- `npm run build` makes the hosted version in `dist/`.

## Blender (scripted models)

Not preinstalled. Once per session, from `zeus-world/assets/`:

- `python3 -m venv bl && bl/bin/pip install bpy pillow` (Blender 5.3 as a Python module; no graphics card needed)
- `PY=bl/bin/python ./build.sh [model name]`

## Rendering stills

- Chromium and Playwright are preinstalled. `shot.mjs` uses them with software rendering.
- Single model: `node shot.mjs renders/x.png "props&m=models/x.glb&view=3q"`.
- City: `PAGE=city.html node shot.mjs renders/x.png "view=plaza&light=dusk"`.
- **There is no graphics card.** A city still at 1280 × 720 took about 22 seconds on 22 Nov 2026 (pass `1280 720` after the query). Earlier sessions recorded about four minutes at the default 1400 × 800, on a slower machine or before the memory fix; if it is slow again, run one still per command so it stays inside the ten-minute command limit.
- **Motion cannot be watched here.** Anything that moves, and the frame rate, can only be checked by the owner on the preview. Say so when delivering.
- A page error makes the render hang until timeout. Check the output of `shot.mjs` for "page error". A syntax error in a script hangs it with no message at all: run `node --check review/<file>.js` after editing, wrap renders in `timeout 200`, and look at the end of `renders/server.log`, where the review server reports it.
- To compare two stills pixel by pixel, load both with Pillow and take the largest channel difference; two renders of unchanged code differ in under 100 pixels (moving particles), so anything in the thousands is a real change.
- `renders/` is not committed.

## Connected services

| Service | How | Notes |
| --- | --- | --- |
| fal | fal tools, account "Bala murugan" | The tools cannot report charges or the balance; the owner reads them from the fal dashboard. Balance was $96.48 on 22 Nov 2026 after about $9 of use. Ask before spending |
| Vercel | Vercel tools | See `hosting.md` |
| GitHub | GitHub tools | Scoped to `bala1237/zeus-scripts` |
| Poly Haven | `python3 blender/fetch_textures.py <asset>`; API at `api.polyhaven.com` | CC0 |
| ElevenLabs | Key saved on the cloud environment | Used for the teaser voiceover |
| Meshy | Key saved on the cloud environment | Direct calls to api.meshy.ai were blocked by a permission check earlier; use Meshy through fal, or ask the owner |
