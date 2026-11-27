# The city scene

The whole scripted city in one browser page: agora, temple, civic buildings, shops, homes, river, walls and harbour. Built with Three.js. Source in `zeus-world/assets/review/`.

## Files

| File | What it does |
| --- | --- |
| `city.html` | Page, loading bar, collapsible controls panel, view links |
| `city.js` | Renderer, lighting and colour grade, skies, camera views and tour, model loading, the layout of the city, water, fire and lamp effects, time of day |
| `life.js` | Citizens walking a route graph, building sites rising with Bolts labels, lightning on completion, birds |
| `ambient.js` | Rippling cloth, swaying trees, chimney smoke, fountain spray, boats |
| `stand.js` | The standing pose citizens use when they stop, made in code (see `characters.md`) |
| `tour.js` | The cinematic city tour: places, shots, titles, following a citizen |
| `soldier.js` | The battle's soldiers: figure, gear, guard and thrust |
| `aftermath.js` | After a battle is won: the storm of gold, the triumph, the house tour (see `battle.md`) |
| `battle.js` | The siege at the south gate during a battle (see `battle.md`) |
| `names.js` | Name plates over the homes |
| `poses.html`, `poses.js` | Frame sheet of a character's animation, for checking motion without watching it (see `characters.md`). Not part of the hosted build |
| `street.js`, `main.js` | The six-plot street test and the single-model review scene. Older; still on the pale lighting (ZW-005) |
| `public/` | Served as-is: `sky/`, plus two links: `models` to `assets/models/` and `ref` to `style-test/public/models/` (the older reference villa and citizen) |

## Page options

| Option | Values | Default |
| --- | --- | --- |
| `view` | `wide`, `plaza`, `street`, `temple`, `harbour`, `river`, `homes`, `civic`, `battle`, `top` | `wide` |
| `light` | `cycle`, `day`, `dusk` | `cycle` |
| `people` | 0 to 120 | 44 (plus one seventh as many on the quay, plus builders) |
| `tour` | `0` turns the camera tour off; `classic` uses the older tour that turns round each viewpoint | on, unless a view is chosen |
| `pace` | `lively` shortens every tour shot to six tenths of its length | calm |
| `film` | With `shot`: one tour shot to pose, as place, shot number, progress, for example `film=agora,1,0.5` | absent |
| `spin` | `0` turns the slow rotation off | on |
| `grade` | `soft` gives the old pale look | stream grade |
| `names` | `0` hides the name plates over the homes | shown |
| `battle` | present: demo battles at the south gate on a loop. With `shot`, a number sets our share of the score for a still | absent |
| `after` | `0` skips what follows a won battle. With `shot`: `storm`, `triumph` or `home` poses a still, and `triumph,16` one at 16 seconds in | on |
| `cine` | `0` turns the battle's cinematic camera off. With `shot` and `battle`, the name of one shot to pose | on |
| `far` | `0` turns the far-view models off | on |
| `peoplefar`, `plantfar` | distance in metres beyond which citizens and plants switch to their far-view model | 45, 70 |
| `shot` | present: render one still frame, 8 seconds in, no animation loop | absent |
| `label` | text for the top-left label | view and light |

## How it is put together

**The ticker list.** Everything that moves registers a function in the `tickers` array in `city.js`. The animation loop calls each with the elapsed seconds, then draws. To add motion, push a function; do not start a second loop.

**Loading.** Every model in the `PRE` list is downloaded before anything is placed, behind the loading bar. `get(url)` caches each file; `put()` and `P()` place a copy (a full clone of the model's objects, sharing geometry and materials). `P()` also records the copy in `placed[name]`, which the ambient effects use to find chimneys, fountains and ships.

**Shared textures.** Model files each carry their own copies of the common textures. `shareTextures()` in `get()` keeps one copy of each distinct image, matched by the image's bytes (see `performance.md`). Anything that loads models another way would bring the duplicates back.

**Instancing and far-view models.** After the city is placed, copies that share a shape and a material are turned into instanced meshes, and distant citizens and plants are swapped for lighter models. Both are described in `performance.md`. The rule to remember when adding things: anything that moves, or is shown and hidden, must set `userData.dynamic = true` before the instancing block runs.

**Layout.** The city is laid out by hand in `city.js`, section by section: agora, sacred way, main street, river, civic buildings, homes, wall, harbour, greenery. Coordinates are metres; the plaza centre is the origin; north is negative z; the sea is to the east (positive x). The wall runs from x −56 to 56 and z −68 to 60.

**Homes.** `home()` assembles a villa from parts (walls, optional upper storey, roof, optional porch) and adds a garden. `userData.parts` holds the building without its garden, for construction.

**Effects find their targets by material name.** `water`, `flame`, `coal` and `cloth_*` are looked up by name after the city is placed, so a new model picks up the effect without code changes, provided its Blender material has the right name.

- `water`: replaced with a shared rippling material (three layers of one tileable ripple pattern at unrelated sizes, so no repeat shows). The sea and the small pools have separate settings; pools are calmer because sharp ripples catch every lamp.
- `flame`, `coal`: made to glow and flicker. Each separate flame gets a soft glow sprite; a street lamp's two lanterns share a mesh, so its points are grouped by position to find each flame.
- Up to 14 lamps near the centre cast real light once it gets dark.
- `cloth_*`: rippled in the vertex shader, in world space (`ambient.js`).

**Lighting and grade.** Two looks, `LD.day` and `LD.dusk`, each a set of numbers: sky, ground, sun colour, strength and position, fill, exposure, fog, water colour. The stream grade adds a saturation and contrast boost on the canvas through CSS. Skies are two Poly Haven photo domes (CC0) with matching HDR files for light and reflections.

**Time of day.** `setTime(d)` blends everything between day (0) and dusk (1). In `cycle` mode: 40 s day, 16 s change, 30 s dusk, 16 s back. The environment light swaps at the halfway point and dips there so the swap does not pop.

**Shadows.** The scene creates the sun's shadow map itself, in a compact form (see `performance.md` for why, and for the trap with the shadow camera). It is drawn once, because only people and effects move and they cast none. It is redrawn about eight times during a change of light. Citizens get a soft blob under them instead of a real shadow.

**Camera tour.** The default is the cinematic tour described below. The older one (`?tour=classic`) glides between seven views, 13 s at each and 5 s moving, turning round each. Touching the view or choosing one stops either.

## The cinematic tour (`tour.js`, ZW-024)

The city filmed like a documentary. It runs whenever the tour is on and no battle is being fought.

- **Seven places** in `PLACES`: the city from above, the agora, the Temple of Zeus, the main street, the harbour, the river, the civic quarter. One loop takes about three and a half minutes.
- **Each place is a visit of three shots**: a flight in, a move through at street level, and a close detail. Shots cut directly within a place; between places the picture dips to black for under half a second.
- **A title** for each place appears lower left for about five seconds, and the label top left shows the place.
- **Between places the camera follows a citizen** for nine seconds, a few metres behind and above the shoulder: the one nearest the next place who is walking and is not a builder.
- **A shot** is `{ a: [position, target], b: [position, target], s: seconds, fov, hand }`. The camera eases from `a` to `b`. `fov` is the lens: about 44 is wide, 34 normal, 22 to 26 long. `hand` adds a slight hand-held sway, used at street level.
- **Pace.** Shots last seven to eleven seconds. `?pace=lively` multiplies every length by 0.6. Calm is the default because the tour is a backdrop to the owner talking; quicker cutting is kept for the battle.
- **The stream is wide**, so shots are composed for a landscape frame.

Things learned:

- **The viewer's controls fight a film camera.** They stop the camera going below what it looks at, and from coming closer than 4 m. A low shot looking up at the temple was silently lifted to roof height. The tour lifts both limits while it runs and restores them when it stops.
- **Set-up order matters.** The tour's ticker mentions the battle, and tickers start running while the city is still loading, so the tour must be created after the battle or the page fails with an error about using something before it is defined.
- **Shots cannot be judged from coordinates.** Trees, awnings and walls end up in front of the lens. Every shot was rendered at its midpoint and looked at (`?shot&film=agora,1,0.5`), and eight of nineteen were reframed.
- **Close shots show what the wide view hides**: flat grass, plain ground at street level, and few things happening. The living day (ZW-021) is what will give these shots something to look at.

To add or change a shot, edit `PLACES`, render it with `film=`, and look at the picture. To add a place, add an entry with a name, a subtitle and its shots.

## Citizens (`life.js`)

- Walk a graph of named points joined by edges. A point can carry a stop: how long, which way to face, which animation, and the chance of stopping.
- Three graphs: the town (gate, main street, shops, plaza, stalls, sacred way, library, council hall site), the quay, and one small graph per building site for its builders.
- Each walker keeps to a lane offset from the line, so two-way traffic passes.
- `height(x, z)` gives the ground height; the town graph uses it to climb the bridge.
- Three citizen models (`char_citizen_woman`, `char_citizen_elder`, `char_citizen_man`), each tinted one of eight colours. Animations by name: `Walk`, `Idle`, `Clap`, `Cheer`. `Idle` is the standing pose from `stand.js`, not the clip supplied with the model. The models and their rigs are described in `characters.md`.
- `cheerNear()` makes everyone within a radius turn and cheer.

- Citizens outside the camera's view are not posed or drawn, and beyond 45 m a lighter body on the same skeleton is shown. The counter top right shows frames a second, how many citizens are in view, and the draw calls of the last frame.

## Construction (`life.js`)

- `construct()` takes a building's objects and reveals them from the ground up with a clipping plane, behind scaffolding, with a timber hoist lifting blocks.
- A label above shows the name, a Bolts bar and the count. All made up, on a timer.
- On completion: lightning strike, flash, gold puffs, nearby citizens cheer. After a rest the loop restarts (abruptly; ZW-007).
- Three sites: the council hall and two villas in the north-east row, each on its own clock.

## Name plates (`names.js`)

- `names.add(building, name)` puts a plate just above the highest point of a building: cream with a gold rim and bolt, the handle in dark blue, drawn on a canvas.
- A plate is a sprite in the scene, so nearer buildings hide it, unlike the Bolts labels, which are page elements drawn over everything.
- Each frame a plate is resized so it is 0.85 m tall when the camera is close and never less than 20 pixels tall on screen, up to 3.6 m. That keeps names readable from the wide view. Plates of neighbouring homes can touch at the widest views.
- It is unlit, so it is dimmed by 30% at dusk to sit with the scene.
- The list of homes and names is in `city.js` (search for `createNames`). The names are made up. The two villas being built are left out; their Bolts label names the owner.
- Trap: a building inside a group that has not been drawn yet does not know its position. `add()` updates the world matrices first; without that every plate lands at the centre of the city.

## Ambient (`ambient.js`)

- Smoke rises from chimneys listed in `CHIMNEYS`, given in each model's own coordinates. A new building with a chimney needs a line there.
- Fountain spray: jets from the top bowl, drips from the middle one.
- The trireme rides at anchor; a small sailing boat crosses the bay and back.
- Trees (oaks and cypresses) lean slightly, each on its own beat.

## Known limits

- All motion is a demo on a timer.
- Motion and frame rate have not been checked on this machine (see `environment.md`).
- Open issues are in `../BACKLOG.md`.

## Steered from the control room (ZW-060)

Inside `live.html` the city's view links, Battle, Tour, Rotate and Reset also act on the picture in OBS. See `live.md`, "The city".
