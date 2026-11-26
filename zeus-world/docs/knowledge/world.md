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
- **Not published.** This state is on the work branch only; the preview still shows the first proof.

## Not yet built

- **No people.** The newcomer of the story, and people in each place doing different things, are the next batch.
- **The city is a stand-in** made from catalogue models on the real ground plan, with a town outside the west gate. `city.js` is a page with no parts that can be imported; to stand the living city on this land it has to be turned into a part first.
- The director's moments: building for the MVP, one person's place. A remote page (as for the hero film).
- Dusk has only its light; no lamps.
- Texture sharing (see `performance.md`) is not used in `worldplaces.js`.

## Verified, and not

- **Verified:** stills of nine views; the ten checks by numbers; build.
- **Not verified:** anything in motion: the camera moves, the flight, the cuts, land appearing as the camera travels, wind, water, frame rate.
