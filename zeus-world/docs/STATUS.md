# Zeus World: where we stand

Handoff for a new session, written 22 Nov 2026. Repository `bala1237/zeus-scripts`, folder `zeus-world/`.

**Branch:** all current work is on `claude/eager-faraday-svkb22`. It continues `claude/dazzling-mendel-y9qquo` and has not been merged anywhere. Start from it.

**Read in this order:** this file, `docs/CONSTITUTION.md` (product rules, especially the 15 Nov addendum on Bolts), `docs/ASSET-BIBLE.md` (style rules and catalogue), `assets/README.md` (pipeline and commands).

**Live preview:** https://zeus-world-preview-bala-0416.vercel.app/city.html (public link; see "Hosted preview").

## What exists

| Area | State |
| --- | --- |
| Product rules | Constitution with Bolts, personal plots, community builds, account linking by chat code |
| Teaser | 32.5 s vertical teaser in `teaser-3d/` with Zeya voiceover. Untouched this round |
| Catalogue | 124 files in `assets/models/` (about 115 distinct models plus kept alternates) |
| Scripted models | 87 built by Blender script, free, via `assets/build.sh` |
| Scenes | Single-model review, six-plot street, whole walled city with harbour |
| City scene | Lit, graded for streaming, alive: people, construction, ambient motion, day-to-dusk cycle, camera tour |
| Hosting | Vercel preview of the review scenes |

### Models, by how they were made

- **Scripted in Blender (free).** Villa parts (walls: stone, ochre, gold-trim marble; roofs: terracotta, azure, slate, gold, roof garden; porches: Doric, Ionic; second storey: plaster, marble), cottages tier 1 and 2, apartment blocks tier 1 to 3, grand villa, Temple of Zeus in four build stages, stoa, library, council hall, bathhouse, gymnasium, amphitheatre, round shrine, lighthouse, aqueduct, city wall, tower, gate, bridge, plaza fountain, taverna, bakery, flower shop, pottery, scroll shop, olive press, forge, four market stalls, street lamp, lantern post, tiles (road, plaza, mosaic), boundary stones, signpost, plaque, obelisk, victory column, altar, sundial, shrine, banners, statue plinth, bench, amphorae, garden wall and gate, pergola, dining set, planter, garden bed, cart, barrels, brazier, scaffolding, crane, stone blocks, timber stack, crates, pond, river (straight, bend), stepping stones, quay, pier, well, reflecting pool.
- **Generated on fal (Trellis 2).** Bushes, hedge, flowers, grass tuft, three pots, citizen's tree (an oak) at four stages, and the cleaned-up teaser models: city gate and its door leaf, stadium, Founders wall, cypress, colossus, sky temple, trireme, vault, two rigged citizens.
- **Poly Haven scans (CC0, free).** Three rock sets, a marble bust, a lion head.
- **Kept alternates.** Files ending `.trellis.glb`, `.tripo.glb`, `.hunyuan.glb` are earlier versions kept for comparison; the plain name is the catalogue model.

Status and remaining gaps per catalogue line are in `docs/ASSET-BIBLE.md`, Part 2.

### The city scene (`assets/review/`)

| File | What it does |
| --- | --- |
| `city.js` | Layout of the city, lighting and colour grade, sky, camera views, controls panel, time of day, water, fire and lamp effects |
| `life.js` | Citizens walking a route graph, building sites rising with Bolts labels, lightning on completion, birds |
| `ambient.js` | Rippling cloth, swaying trees, chimney smoke, fountain spray, boats |
| `city.html` | Page, loading bar, collapsible controls |
| `street.js`, `main.js` | The six-plot street test and the single-model review scene (older, still on the pale lighting) |

Page options: `?view=wide|plaza|street|temple|harbour|river|homes|civic|top`, `?light=cycle|day|dusk` (cycle is the default), `?people=N` (default 44), `?tour=0`, `?spin=0`, `?grade=soft` (the old pale look), `?shot` (one still frame, used by `shot.mjs`).

Everything that moves registers a function in the `tickers` list in `city.js`. Effects find their targets by material name (`water`, `flame`, `coal`, `cloth_*`), so new models pick them up without code changes.

**All motion is a timed demo.** Bolts counts, viewer names and build progress are made up. Nothing is connected to TikTok or a simulation.

## Hosted preview

- Vercel project `zeus-world-preview`, team "Bala" (`team_sbCFPbyQjCI8e29mwR2c9t3U`), project id `prj_CxFJGUOEOvvLAiTCftIXpYpWqOds`.
- Linked to this repository, root `zeus-world/assets`, framework Vite, build `npm run build`, output `dist`.
- **It does not redeploy on push to this branch.** The project's production branch is another one, so each update was deployed by hand through the Vercel tools: `create_deployment` with `gitSource` (github, org `bala1237`, repo `zeus-scripts`, ref this branch, the commit sha) and `target: production`.
- The link is public and serves every model file. Protect it or take it down before sharing more widely.

## Verified, and not

- **Verified:** every model rendered beside a citizen and the villa; the city from several fixed views in day and dusk as still frames; the controls panel by driving it in a browser; no page or shader errors.
- **Not verified:** anything in motion. The build machine has no graphics card, so a still takes about four minutes and motion cannot be watched. Walking, the build loop, cloth, smoke, the day-to-dusk change, the camera tour and the frame rate have only been seen by the owner, on the live preview.
- The owner has confirmed: the page loads, the city "looks awesome", auto-rotation and controls work. They reported flicker on the tower tops (fix shipped, not yet confirmed gone).

## Waiting on the owner

The plan agreed on 22 Nov was to deliver liveliness in batches and have the owner check each on the preview, rather than one fix at a time. Batches 1, 2, 3 and 5 are delivered. No feedback has come back yet on any of them. The checklists sent were:

1. **People.** Natural walking, no sliding or walking through stalls, lamps or buildings; correct height over the bridge; is 44 the right number.
2. **Construction.** Does the council hall rise convincingly; do the Bolts labels stay on their buildings; is the lightning and flash too strong.
3. **Ambient.** Is the cloth ripple visible enough; tree sway; smoke amount; does the fountain spray read as water; the sailing boat.
4. **Day cycle and tour.** Is the change smooth; any stutter (shadows are redrawn about eight times per change); cycle length; tour pace and stops; does any stop start inside a building.
5. **Frame rate** on a computer and a phone, day and dusk (counter is top right).

## Next

1. **Collect the owner's feedback** on batches 1, 2, 3 and 5 and fix it in one pass.
2. **Batch 4, animals.** Birds are in. Cats, dogs, a donkey with a cart and goats need generating and rigging: roughly $1 to $2 each on fal, or free if Mesh2Motion works for four-legged rigs (not yet evaluated). The owner has not approved the spend.
3. **Performance.** Unmeasured. The city is about 80 MB and 110 models; 50 animated citizens are about a million triangles. Likely work: far-view models, loading distant buildings last, fewer real lights, a quality setting. Needed before OBS or phone use.
4. **Finish the look.** Marble reads slightly cool under the sky light; grass is strong, especially at dusk; apply the stream grade to `street.js` and `main.js`; the dusk fountain water still shows a faint speckle.
5. **Known model flaws.** Gymnasium roof has notches at the corners; the amphitheatre's stage building hides the stage from the front; pergola vines are sparse; river bank stones are thin on one side; gate posts in the garden set are fine but the boundary stones read a little like logs; one villa in the north-east row of the city scene was dropped because it sat on the wall.
6. **Construction loop.** A finished building vanishes and restarts abruptly; walls are cut off flat so the hollow inside shows; only the temple has real stage models; builders "hammer" with the clap animation.
7. **Cloth.** Banner ripple is kept small because the gold bolts are separate meshes and sink into moving cloth. A proper flag wave needs the bolt made part of the cloth in `blender/parts.py` (`banner`).
8. **Wire the catalogue into the product.** The phone plot builder (`style-test/`) still uses the old generated villa parts stretched to fit; the new parts are at real size with fixed origins (see socket table in the asset bible). Then drive the city from real Bolts and viewers.
9. **Still to make.** Corinthian porch, arched windows, rooftop statue and chimney extras, apartment block tier 4, more tree species (laurel, pomegranate, fig, plane, almond), vines, more citizens and outfits, statues, Zeya and Zeus figures. Trees and characters need generation or another route; the rest can be scripted.
10. **Housekeeping.** Merge this branch; decide whether `assets/models/` (83 MB in git) should move to file storage; licence check on the fal generators before anything ships.

## Decisions taken

| Topic | Decision |
| --- | --- |
| Plot size | 16 × 12 m on a 2 m grid |
| Interiors | Exteriors only for now |
| Cost | Keep spend low. Hard-edged and modular items are scripted in Blender for free; paid generation only for organic pieces (plants, citizens, statues, landmarks) |
| Quality bar | "Visual excellence is non-negotiable" (owner) |
| Engine | Three.js in the browser. Unreal was considered and rejected: it does not run in a phone browser |
| Asset packs | Not buying any. Style clash with the "not low-poly, not photoreal" rule, and licences often forbid shipping files to browsers. Used only as inspiration (painted temples, walls, market stalls) |
| Free sources | Poly Haven for skies and textures (CC0). Its models only selectively (single rocks, the bust) |
| Budgets | Props up to 30k triangles and 1.3 MB, plants up to 60k and 2.8 MB, with the original 5k and 10k as goals. Scripted models meet the goals; generated ones do not |
| Concept images | Nano Banana 2.1 on fal, 1:1, 2K, template prompt; owner approves a sheet before any 3D spend |
| Image to 3D | Trellis 2 on fal (resolution 1536, texture 2048, decimation 120000). Measured at $0.35 a model. Tripo P2 gave a cleaner result at $1.10; not adopted |
| Characters | Meshy rigging through fal. Mesh2Motion (free, browser) suggested by the owner, not evaluated |
| Construction stages | Done in code (a rising cut-off behind scaffolding), not separate models. The temple also has four real stage models |
| Citizen's tree | An oak, four growth-stage models; the leaning "resting" pose is to be done in code |
| Stream look | Deeper sky and grass, harder sun, less fill, saturation and contrast boost, because the first look was too pale for OBS |
| Working method | Deliver in batches with a checklist; the owner validates on the hosted preview |

## Environment notes

- **Blender** is not preinstalled. Set up once per session: `python3 -m venv bl && bl/bin/pip install bpy pillow` (Blender 5.3 as a Python module), then `PY=bl/bin/python ./build.sh [model name]` from `assets/`. A full rebuild takes about 15 minutes.
- **Node:** `npm install` in `assets/`, then `npm run review` (port 4180). Stills: `node shot.mjs renders/x.png "props&m=models/x.glb&view=3q"`; for the city, `PAGE=city.html node shot.mjs renders/x.png "view=plaza&light=dusk"`. `qc.sh` renders several models side by side.
- **Rendering here is software only.** A city still takes about four minutes and can exceed a ten-minute command limit if two are chained; run one per command. A page error makes the render hang until timeout, so check `shot.mjs` output for "page error".
- **fal** is connected through the fal tools (account "Bala murugan"). The tools cannot report charges or the balance; the owner reads them off the fal dashboard. Balance was $96.48 after about $9 of use this round.
- **Vercel** is connected through the Vercel tools.
- **Poly Haven:** `python3 blender/fetch_textures.py <asset>` downloads a texture set; the API is `api.polyhaven.com`.
- An ElevenLabs key and a Meshy key are saved on the cloud environment. Direct calls to api.meshy.ai were blocked by a permission check earlier; use Meshy through fal or ask the owner.

## Open questions

- A cost ceiling per batch on fal.
- Licence terms of each fal generator for commercial on-stream use.
- What the four teaser mysteries (colossus, sky temple, harbour, vault) become.
- That the "First 100 become Founders" promise is honoured at launch.
- Whether every citizen gets the same plot size.

## Sheets worth opening first

`assets/sheets/city.jpg` (the whole city), `city_life.jpg`, `city_ambient.jpg`, `city_effects.jpg`, `street_milestone.jpg`, `temple_of_zeus.jpg`, `polyhaven_trial.jpg`, `city_grade_before_after.jpg`.
