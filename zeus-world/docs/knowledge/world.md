# The open world

A land that is travelled through, not seen whole (ZW-049). First proof, 25 to 26 Nov 2026. Page: `/world.html` on the preview. It is separate from the city page (`city.html`), which is unchanged.

## What the owner asked for

"I want it to look vast and the exploration should like like infinite. You know the gta game. The one we have it's all in a view area doesn't give the massive scale." By itself it is a story (a newcomer exploring); he can steer to a moment (the MVP's building, one person's place, an attraction); chat steers only through him. The camera is to be cinematic and the choice of moves is ours: "Drone shot, handheld, and so on. You need to improvise." The flight between places is short but itself cinematic. The stream machine is a MacBook Pro M3 Pro with 36 GB.

## Files (`assets/review/`)

| File | What it does |
| --- | --- |
| `worldgen.js` | The land as arithmetic: height of the ground anywhere, the river and its water level, the falls, forest, ground colour, farmland, the road, the named places. No drawing. The same land every time |
| `worldworker.js` | Makes one square of land in the background: ground mesh, trees, grass and flowers, rocks |
| `worldland.js` | Draws the land: squares fine near the camera and coarse far off, trees, sea, river, the falls' white water and mist |
| `worldplaces.js` | The built places: the village of Riverbend, farmsteads, the city |
| `cinecam.js` | The camera: the library of moves, the story, the places the director can go to, the flight between. Numbers only, so it is tested without a picture |
| `world.js`, `world.html` | The page: light and air, the director, controls |
| `test/world.test.mjs` | Ten checks of the land and the camera by numbers |

## The land

- **Directions.** Metres. x is east, z is south. The city's middle is the origin, as in `city.html`. The sea is to the east (the city's harbour side); the mountains are to the west.
- **Trap.** `worldgen.js` was first written with the sea to the south. The arithmetic inside still is; the two axes are swapped in the last lines ("the door"). Inside that file, read "south" as the world's east.
- **The designed heart.** The city on a level plain 4 m above the sea. A river that rises in the high country in the west, goes over a cliff (the Falls of Zeus, a drop of about 84 m), runs through forest, and meets the sea south of the city. A village (Riverbend) on the far bank; a road from it over the ford and a hill (First Sight Hill) to the city's west gate, about 1.7 km. Farmland round the city and the village.
- **Without end.** Beyond the heart the same rules go on making hills, forest and far mountain ranges wherever the camera goes. There is no edge.
- **The river never runs uphill.** Its water level is worked out once along its length: at each point the lower of the land there and the level upstream. The bed is cut below that. Tested.
- **How big.** Village to city is 1.6 km; city to the falls 3.3 km; the mountains reach over 1,000 m, 6 to 9 km out. The city itself is 112 by 128 m, as in `city.html`: it is the land that is large.

## Drawing it

- **Squares.** The ground is a tree of squares from 4,096 m down to 64 m; a square near the camera is split in four. About 300 are up at once. Each has a skirt round its edge to hide the join between fine and coarse.
- **Made in the background.** Squares are made by workers, so the picture never waits. A coarse square stays until the fine ones replacing it are ready. With `also`, `land.update` makes the land ready where the camera will be after the next cut.
- **Trees.** Two kinds made in code (a broad-leaved tree and a pine), drawn as instances per square. Full detail within 128 m squares; a lighter copy beyond; thinner and larger with distance; none beyond 512 m squares, where the forest is painted on the ground instead. They lean in the wind.
- **Grass, flowers, rocks.** Only on the finest squares, under the camera.
- **Water.** Sea: one sheet that moves with the camera in whole steps of its pattern. River: a ribbon at the water's level. Steep stretches get white water; the falls get mist.
- **Trap: depth.** The page draws depth on a logarithmic scale (needed for 0.4 m to 40 km). A hand-written shader must include the `logdepthbuf` pieces or it is silently hidden behind everything. This hid the falls' white water.
- **Trap: colours.** The colours in `worldgen.js` are written as seen on screen; the worker raises them to the power 2.2 for the renderer. Without that the land is washed out.
- **Trap: the river ribbon faced down** and was invisible until drawn double-sided.
- **Shadows** follow the ground in front of the camera (340 m across, 4,096 map), moved in whole steps so that they do not crawl.

## The camera

- **Moves** (`SHOTS` in `cinecam.js`): drone (high, coming down and forward), orbit, crane (low to high: the reveal), track (walking height along the road, hand-held), fpv (fast and low along the road, leaning into bends), skim (the same along the river), top (straight down, the land as a map), long (far off through a long lens), hand (standing, breathing), rise (up into the sky).
- **The story:** fourteen shots in four chapters (Riverbend, The Old Ford, First Sight Hill, Olympus), about two minutes, then round again. Cuts within a chapter; a short black between chapters; a place's name lower left.
- **Places for the director:** Riverbend, The Old Ford, First Sight Hill, The Falls of Zeus, Olympus, The Coast, The High Country. Each has two or three shots that go round until told otherwise.
- **The flight** between two views: 5 to 8.5 s; lifts in proportion to the distance, looks where it is going, leans into the turn, settles on the new view.
- **Rules that are tested:** never under the ground; no jumps within a shot (under 95 m/s); every flight clears the land. High shots take their height from the place they are about, not from the ground passing beneath, or they lurch.

## Using the page

- Buttons: Story, and one per place. Keys: 1 to 7 for the places, 0 or S for the story, H hides the bar.
- Address: `ui=0` (no controls, for OBS), `debug=1` (figures and frames per second), `light=dusk`, `place=falls`.
- From outside: `window.worldGo('falls')`, `window.worldStory()`.
- Stills: `PAGE=world.html node shot.mjs renders/x.png "beat=8&u=0.95" 1280 720`, or `place=falls&at=6`, or `cam=x,y,z,tx,ty,tz&fov=40`. A still takes about 10 s here.
- Figures for a view: `node renders/worldstats.mjs "beat=0&u=0.5"`.

## Load, measured 26 Nov 2026 (software rendering, 1280 × 720)

| View | Trees | Draw calls | Triangles |
| --- | --- | --- | --- |
| Village from the air | 53,000 | 2,450 | 11.2 million |
| Forest road | 47,700 | 1,990 | 9.2 million |
| The falls | 46,400 | 355 | 4.7 million |

Frame rate cannot be measured here. `debug=1` shows it on the owner's machine.

## The forest, after the owner's review (26 Nov 2026)

The owner: "The trees lies very elementary and it doesn't look like Forrest ... Every items in Zeus world should look top notch and professional and closer to real." The first proof's trees were shapes made in code. They are gone. **Rule: nothing in the open world may look more elementary than the city scene.**

- **The system now** (`worldtrees.js`): every tree is a catalogue model shown four ways by distance. The nearest 40 within 40 m are the catalogue model itself; the next 260 within 95 m the city's far-view model; the rest of the finest squares a lighter model (`models/mid/`, made with `lod.mjs` at 600 to 1,500 triangles); everything further is a picture of the tree on three crossed cards, photographed from the model when the page loads. The nearest trees are chosen afresh as the camera moves. With cards the forest is thick to the horizon at almost no cost.
- **What it showed:** the catalogue has no forest tree. Its trees are the cypress and the citizen's tree, which is a memorial oak with a red ribbon and a ring of stones. A forest of those is wrong. **New tree models are needed** (the city's route: concept picture, the owner approves the sheet, then Trellis 2, about $0.35 a model). Waiting for the owner's word.
- **Trap: a card seen from behind goes black** if drawn double-sided, because its upward lighting is turned over. Each card is two faces, both lit from above.
- **Trap:** the lighter `mid` models are rough close up (they are made by clustering); they must not be the nearest thing to the camera.
- **The forest kit (26 Nov 2026).** With the owner's approval, nine models were made the city's way (concept picture, then Trellis 2): holm oak, stone pine, olive, plane, mountain fir, laurel, ferns, broom shrub, fallen log. Concepts in `assets/concepts/forest/`, prompts in `assets/PROMPTS.md`, sizes and budgets in `assets/forest.sh`, which also makes the far (`models/far/`) and middle (`models/mid/`) versions. Sheets: `assets/sheets/forest_concepts.jpg`, `forest_review.jpg`, `world_forest_kit.jpg`.
- **Which tree where:** broad-leaved by share (holm oak 54, laurel 24, plane 16, olive 6); of the tall dark trees, the stone pine on low ground and the fir above about 150 m, mixed where they meet.
- **Corrections made in code, not in the models:** generated models can come out glossy (the stone pine was black and shiny), so every tree's surface is set dull; the fir is tinted from blue towards green and the plane tree darkened; each model stands on a mound of earth, which is set into the ground by a twentieth of the tree's height.
- **The middle version is no longer used for trees.** Seen clearly at 100 m it is blocky. Beyond the 300 nearest trees everything is a card, which looks like the real tree. `models/mid/` is used only for ferns.
- **Grass, flowers and rocks** are now the catalogue's own: the grass tuft and wild flowers as cards photographed from the city's models (tinted greener, kept off paving), and the two scanned rocks as they are. Nothing on the ground is made of plain shapes any more except the ground itself.
- **The village** is rebuilt from the city's villa parts (walls, upper floor, roof, columned porch) on levelled ground, round a paved square with a well, a columned hall, a shrine, an altar, banners, lanterns and benches; the road is paved through it. Farmsteads are stone villas with a pergola, a cart and a low wall.
- **Load with the kit:** forest road 163,600 trees, 2,600 draw calls, 10.9 million triangles; village from the air 177,800 trees, 3,665 calls, 7.8 million.
- **Still below the city's standard:** the ground is flat colour with a grain, not a real surface of grass, earth and rock; the cliff and mountains are plain; water is simple; the village is thin; there are no people.
- **Published 26 Nov 2026** at the owner's word, for him to check motion and frame rate. Only stills had been checked before publishing.

## Smoothness (26 Nov 2026)

The owner, on the published forest: "when camera moves, its jittery since its rendering and lot of jerks". Motion cannot be seen here, so these are fixes for causes found in the code, not a measured cure:

- **Depth.** The page drew depth on a logarithmic scale, which makes every hidden pixel cost as much as a visible one: ruinous in a forest of overlapping leaves and cards. It now uses a reversed depth buffer (`reversedDepthBuffer`), which gives the same range for nothing. If a browser lacks it, three.js falls back to ordinary depth and distant water may flicker.
- **Sharpness.** The picture was drawn at twice the screen's pixels on a Retina display. Now 1.25 times; `?sharp=2` restores full sharpness.
- **Squares arriving.** Each finished square was put into the picture the moment its worker returned it, several in one frame. They now queue and go in within about 3.5 ms a frame (`integrate` in `worldland.js`).
- **Shadows:** the ground no longer casts them (trees, rocks and buildings do). Redrawing them on alternate frames was tried and undone: it makes one frame heavy and the next light.
- **Programs** are compiled once the first view is ready, not when each kind of thing first appears.
- **Less in view:** 28 full trees (was 40) and 220 close ones (was 260); rocks only on the finest squares; fewer fallen logs.
- **Load after this:** forest road 9.0 million triangles and 2,470 draw calls (was 10.9 and 2,600); village from the air 6.4 million and 3,540; the road to the gate 4.0 million and 2,300. The figures include the shadow pass.
- **If it is still not smooth, next:** draw calls (about ten separate drawings per square; the trees' cards could be one), the city and village models as fewer, merged pieces, a lower setting for shadows, and `sharp=1`.

## Jitter on the fast low flights (26 Nov 2026)

After the smoothness fixes the owner said: "still jittery, mostly on the fast low flights". That pointed at the camera, not the drawing.

- **Cause.** The road and the river were rows of points joined by straight pieces (4 m apart on the road, about 35 m on the river). The fast flights follow them and lean into bends, and the lean was worked out from the direction of the piece the camera was on, so it jumped at every joint: by 4 degrees between two frames on the road and 12 to 18 over the river. Heading jumped too.
- **Fix** (`measured` in `cinecam.js`). Each line is first made into a true curve in 2 m steps. A point on it is the average of a stretch (6 m for walking shots, 16 to 20 m for the fast ones), its direction is taken across 24 m, and the bend that sets the lean across 48 m. The lean now changes by under 0.3 degrees a frame.
- **Three other shots had jumps of their own** and are fixed: the walking shot beside the ford dropped into the river's bed (it now starts clear of the water and evens out the ground); the long-lens shot in the mountains rode over the ground beneath it as it drifted (it now keeps one height); the flight up the river to the falls was forced up the cliff at the end (it stops short).
- **How to measure it:** `node renders/camjerk.mjs` prints, for every shot, the largest change between two frames in heading, lean and speed. A test (`no shot turns, leans or changes speed in steps`) holds every shot to 0.3 degrees, 0.4 degrees and 1.5 m/s.
- **Lesson.** Jitter that is worst when the camera is fastest is the camera's path before it is the frame rate. Measure the path first: it needs no picture.
- Also done: each kind of tree is drawn once out of sight while the page opens (`warm` in `worldtrees.js`), so its shape and pictures are on the graphics card before the camera reaches one; shadows are redrawn on every frame again, since alternate frames made frame times uneven; land is put in at full speed while the page is opening.

## People (phase 1 of `WORLD-PLAN.md`, 26 Nov 2026)

`worldpeople.js`. The world's people are the city's own three citizens (man, woman, elder) in the city's colours. All adults.

- **Who is where:** in Riverbend, a seller behind each stall and buyers before it, people at the well, the shrine, the altar and the workshops, and six walking to and fro across the square; at each farmstead one under the pergola and one going between house and cart; seven travellers on stretches of the road; two resting on First Sight Hill; in the town outside the west gate and inside it, walkers on the street and people at the stalls and the gate. About 75 in all.
- **The newcomer** is one more person whom the story's shots place: `who` on a shot in `cinecam.js` is `{ ahead: 7 }` (walking 7 m in front of a tracking camera, at its pace) or `{ stand: 3 }` (standing that far along the road from the shot's place, facing the way the road goes). The tracking shots now move at walking pace (9.5 m in 7 s) so that the camera can keep company.
- **The newcomer is the man by default.** The woman citizen reads as young in close-up, and the owner has ruled out children; `&hero=woman` or `&hero=elder` chooses another. She is still among the villagers, as she is in the city.
- **Cost kept down:** a person is the full body within about 55 m, the city's far-view body out to 420 m, hidden beyond; bodies further than 160 m are not animated. The far body is bound to the full body's bones (as in `life.js`).
- **Not built:** people do not avoid each other or the stalls; nobody carries or works at anything; no one reacts to the newcomer. Working people (farmers, fishers, woodcutters) need new models: phase 6.
- `&people=0` leaves them out.

## The ground's surface (phase 2, 26 Nov 2026)

The ground was flat colour with a grain. It now wears four real surfaces, scanned (Poly Haven, CC0, 1K, in `review/public/ground/`): `leafy_grass` (meadow), `forrest_ground_01` (forest floor), `brown_mud_dry` (road, river mud, sand), `rock_face_03` (rock).

- **Colour still comes from the land's design** (fields, roads, sand, snow, the forest's darker floor). A scan is divided by its own average colour, so it adds only what flat colour lacks: blades, leaves, stones, cracks and the small shadows between them. The averages are in `SURF` in `worldland.js`; measure a new scan with `convert x.jpg -resize 1x1 -format '%[fx:r] %[fx:g] %[fx:b]' info:`.
- **What is where** comes from `surfaceAt` in `worldgen.js`: three shares for each point (forest floor, bare earth, rock; the rest is grass), sent with the ground as the attribute `mixw`.
- **Each scan is laid at two sizes** and mixed, so its repeat does not show; its normal map roughens the light; all of it fades out between 180 and 700 m, where it would only shimmer.
- **On steep ground the rock is laid from the side.** Laid from above, a cliff smears into streaks.
- **Trap: the pictures must be loaded before the first draw** (`land.ready`), or the ground near the camera is black. A still showed this at once.
- Cost: about eleven picture look-ups for each pixel of ground. 4 MB of pictures.

## The remote (phase 4, 26 Nov 2026)

The page with controls is the remote for the same page running without them as a browser source in OBS (`world.html?ui=0`).

- "Connect to OBS" (the password is from OBS: Tools, WebSocket Server Settings) uses `obsremote.js`, as the hero film does. Once connected, **Story** and the place buttons steer the world in OBS as well as in the remote's own window. The message is the event `zeusWorld` with `{ cmd: 'go', key }` or `{ cmd: 'story' }`.
- Two tabs of one browser also work without OBS (the `ui=0` tab obeys).
- Checked with `node renders/worldremotetest.mjs` against a stand-in for OBS. **Not checked in OBS itself.**

## Not yet built

- **Working people and animals** (phase 6). The citizens are in; see "People".
- **The city is a stand-in** made from catalogue models on the real ground plan, with a town outside the west gate. `city.js` is a page with no parts that can be imported; to stand the living city on this land it has to be turned into a part first.
- The director's moments: building for the MVP, one person's place (phase 9).
- Dusk has only its light; no lamps.
- Texture sharing (see `performance.md`) is not used in `worldplaces.js`.

## Verified, and not

- **Verified:** stills of nine views; the ten checks by numbers; build.
- **Not verified:** anything in motion: the camera moves, the flight, the cuts, land appearing as the camera travels, wind, water, frame rate.

## Light, sky and weather (`worldair.js`, phase 5)

One part owns the sun, the sky dome, the fog and everything that changes with the hour: `createAir({ scene, renderer, tickers, lamps, mistAt, start })`, then `air.set('night')` at any time. The table `AIR` holds each look: `day`, `dusk`, `night`, `dawn`, `storm`. On the page: the Light row, `&light=night` in the link, `window.worldLight('storm')`, and the remote (`{cmd:'air',key}`, `{cmd:'bolt'}`).

- **Two sky pictures serve five looks.** Night is the dusk sky multiplied by a dark blue (`tint`); dawn is the dusk sky turned by 2.356 radians so its glow sits over the sea in the east; the storm is the day sky tinted grey. The fog colour must be close to the tinted sky, or the far mountains come out lighter than the sky behind them.
- **Night needs blue fill, not only less light.** With the day's warm sky light simply turned down, the forest came out yellow-green. Night has its own sky and ground colours for the fill light and a lower-saturation grade on the canvas (`grade`).
- **Lamps.** `worldplaces.js` returns `lamps`: lanterns, braziers and altars by name, a lamp in front of every home and building (front taken from the model's turn), and three travellers' camps beside the road. Each gets a glow (one `Points`), a pool of light on the ground (one instanced flat square, added to the picture), and fires get three flame sprites. Only five real lights exist; each sits on one of the lamps nearest what the camera looks at and dims with distance, so moving them never pops.
- **Things the lights do not reach** (the white water, the mist at the falls) are dimmed by `dim` in `air.set`: a shader with `uFog`/`uDim` is updated, sprites have their colour scaled. Sprites made by `worldair.js` carry `userData.air` and are left alone.
- **Rain** is 7,000 streaks in a 90 m box that wraps round the camera in the vertex shader; **lightning** is a bolt drawn on a canvas for each stroke, shown on a sprite 3.5 to 7 km away, with the sky and the fill light flashing twice.
- **Trap, stills only:** the things that travel with the camera take its position in `air.follow`, so the still path calls it before the tickers; otherwise rain is drawn round the world's origin.
- Not checked here: motion of rain and flames, the flash, frame rate at night (five extra lights).

## The countryside and the animals (phases 3 and 6)

- **Models:** `assets/blender/country.py` builds twelve `country_*` models from the reference pictures in `assets/concepts/countryside/`. New materials there: thatch and hay (both from the Poly Haven `thatch_roof_angled` scan, tinted), dry stone (`stacked_stone_wall`), weathered planks, wicker, sacking. Hay needed strong contrast (2.0) and a deeper gold or it reads as a smooth yellow blob.
- **Models that go below the ground** (bridge piers 4 m, jetty piles 3 m, the boat's hull 0.42 m): `normalize.mjs` lifts every model so its lowest point is the origin, so the world sets these down again by that depth (`worldplaces.js`, the river section).
- **Placement** is in `worldplaces.js`: each farm gets a barn, haystacks and a pen of twelve fence lengths, and by kind a threshing floor, a hay cart or beehives; three huts stand in clearings; the mill, jetty, boats and bridge are found from the river's own points (`near`, `bank`: walk out from the middle of the river until the ground is above the water). The mill is turned so its wheel side faces the water.
- **Clearings:** a model in the forest needs an entry in `PLACES` in `worldgen.js` with `clear`, or trees grow through it. Those entries are in the land's inner directions (x and z swapped from the world's).
- **Animals** (`worldanimals.js`): no bones, so they stand. Each kind is two sets of instanced meshes, the full model within 55 m of the camera and the far-view model beyond, re-sorted every 12 frames. About 110 animals. Eagles are whole models that fly a circle, banked.
- **Lamps:** the barn, mill and huts have a door lamp; a roadside shrine has a flame.

## New places (phase 7)

- A place is three things: an entry in `PLACES` in `worldgen.js` (inner directions; `clear` keeps the forest off, `flat` levels the ground out to that radius, the same way the village is levelled), a block in `worldplaces.js` that sets the models down, and an entry in `PLACE` in `cinecam.js` with its shots, which also gives it a Go-to button and a remote command.
- `flat` is generic now: `FLATS()` in `worldgen.js`. The level is the land's own height at the centre, found once.
- The harbour finds its own shoreline (walk east from the centre until the ground is under 0.9 m) and hangs the quay, jetties and boats on that line. `worldpeople.js` does the same sum to stand people on the quay.
- A camera orbit needs the clearing wider than the orbit: the ruins' first orbit (34 m) sat inside the trees of a 34 m clearing. Clearing 62 m, orbit 25 m.
- Olive grove trees are whole catalogue models set down one by one (about sixty); fine for one place, not a way to plant a forest.

## What a frame costs, and how the buildings are drawn (ZW-052)

The owner measured 35 frames a second at the low end of the story and 32 to 35 at Thalassa. `assets/wstat.mjs "<query>" ...` counts the draws and triangles of one frame for any still view, then again without shadows, without buildings and with the land alone. It showed the buildings were the cost: every model set down was its own object, so the village shot made 4,635 draws.

`worldplaces.js` now only lists what is set down, and at the end turns the lists into batches: one instanced draw per material of a model, for all of that model standing in the same 128 m square. Each square has two versions, the models themselves and their far-view versions (`models/far/`, made by `assets/places_far.sh`, no textures), and shows the far one beyond 210 m. Only squares within 150 m of where the camera looks cast shadows; paving never does. `built.update(camera, focus)` does the switching every frame.

| View | Draws before | Draws after | Triangles before | After |
| --- | --- | --- | --- | --- |
| Thalassa | 1,900 | 685 | 3.8 M | 3.8 M |
| Story, in the village | 4,635 | 1,271 | 8.9 M | 5.3 M |
| Story, at the city gate | 2,797 | 919 | 4.7 M | 3.1 M |

- **Trap:** a far-view file holds many small pieces. Each must be joined into one geometry (`join` in `worldplaces.js`) or the far version costs more draws than the model it replaces: the first try had 1,496 far pieces on screen.
- The picture is capped at 60 frames a second (`?fps=`; 0 removes the cap).
- These are counts, not speeds. The frame rate itself can only be read on the owner's Mac (`?debug=1`).

## What moves (`worldlife.js`, ZW-054 item 1)

- **Cloth** is the city's trick (materials named `cloth_*` ripple in the vertex shader, in world space) with one change: the buildings are drawn in batches, so the shader must use `modelMatrix * instanceMatrix`.
- **Boats** are still one batch per square; `built.batchesOf(name)` gives a model's batches with their list of placements, and the boats' matrices are rewritten every frame with a small rise, roll and pitch. Thirteen boats.
- **The mill wheel** is its own model (`country_mill-wheel`, `mill_wheel` in `country.py`); the mill is built without it. A model's origin is the centre of its bounding box, not the house's centre, so the wheel's place relative to the mill was read from the raw file's bounds: 2.59 m to the right, 1.99 m up, 0.4 m back.
- **The mill's shelf.** The river's bank by the village is a 3.4 m step, so a mill on the bank had its wheel in the air. A place with `flat` can now carry its own level (`y`): `millshelf` in `worldgen.js` cuts a shelf 0.1 m above the water. `bank()` in `worldplaces.js` then finds the shelf's edge, and the mill is set 0.15 m under the water's level so the paddles dip.
- **Smoke** is one `Points` for every hearth (huts and camp fires); each puff's place comes from its hearth and its age in the shader. Its fog colours are set by `air.set`, which is why `world.js` calls `air.set` once more after `createLife`.
- **Gulls** are one instanced draw of a three-triangle bird; the wing tips flap in the shader.
- Not checked here: any of the motion itself.

## The remote and OBS: what the messages mean (ZW-055)

- The page with controls reaches OBS at `ws://127.0.0.1:4455` from an https page. Chrome allows that only if the site has "Local network access"; it asks once, and a refused or ignored question blocks the link silently. Safari does not allow it at all.
- Close code 1006 ("went away") from a link that never joined means it never opened: OBS not running, its WebSocket server off, another port, or the browser blocking. `obsremote.js` keeps `done` (the promise is settled) apart from `joined` (OBS accepted us) so a failed attempt is not also reported as a closed link.

## Water (ZW-054 item 2)

- **The patchwork on the water was the ripple picture, not the mesh.** The ripple normal map is built from a handful of cosine waves. With fractional numbers of waves across the picture it does not tile, so each repeat ends in a straight seam, and three layers at three scales and angles made a lattice of them. Proof: with the normal map's strength at zero the water was smooth. The waves now have whole numbers across (`W` in `ripple`, `worldland.js`). Tangents and coordinate precision were both tried first and were not the cause.
- **The river ribbon** is resampled to a point every 9 m on a curve through the river's points, three points across, with normals straight up and given tangents. Its material takes `banks = true`: an attribute `across` (0 at a bank, 1 in midstream) makes the shallows pale and half clear and puts drifting flecks of foam there.
- **The sea shore** is done in the ground's shader, since the sea is one flat sheet that knows nothing of the shore: ground within about 0.6 m above sea level is darkened as wet sand, and a band of white follows a height that rises and falls with time and place (`lap`). Bright sand hides foam drawn on it; the wet band under it is what makes it show. A steep shore makes the band very thin.

## Trees close up (ZW-054 item 3)

Two causes made near crowns look like broken glass, and both are fixed in `worldtrees.js`:

- **Back faces.** Leaves are drawn from both sides. The renderer turns a face's normal round when it is seen from behind, so about half of every crown was lit as if from inside the tree. `sway()` now multiplies the normal by `faceDirection` a second time in the fragment shader, which undoes it. This applies to the full and the far-view trees.
- **The models' own leaf normals** face every way, because each leaf is a loose scrap of surface. `round()` turns every normal above the trunk to face outward from the middle of the crown and somewhat upward (half outward, 0.42 up, a little of its own), the same idea `lod.mjs` uses for the far-view models. The fern is rounded whole; the log is left alone.

The crowns are now evenly lit, which also makes them flatter and a little brighter than before. If more depth is wanted, raise the share of the model's own normal in `round()`.

## The story's shots off the road (ZW-054 item 4)

A story line whose anchor is not on the road uses `at(x, z)` in `cinecam.js` (a point with a fixed direction). Such shots have no `who`, so the newcomer is hidden for them. Chapters that begin far from the last one start with `fade: true`; the land there is made ready during the last five seconds of the shot before (`upcoming()` in `world.js`). The story is now 19 shots.
