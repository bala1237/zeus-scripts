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
