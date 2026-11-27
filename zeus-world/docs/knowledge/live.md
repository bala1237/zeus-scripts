# Zeus Live: one page for every scene

Made 26 Nov 2026 (ZW-056, ZW-057). The owner streams through OBS and had one address per scene (`world.html`, `laser.html`, `city.html`, `hero.html`, …), each with its own controls and, for two of them, its own connection to OBS.

## Controls never show inside OBS (ZW-056)

- OBS gives every page it shows as a browser source an object, `window.obsstudio`. `source.js` reads it: inside OBS, a page behaves as if its address said `ui=0`, whatever the address says. `pageQuery()` returns the address's settings with that applied, and every page takes its settings from it (`city.html` does the same check inline).
- `?ui=1` brings the controls back inside OBS, for OBS's "Interact" window.
- Other streaming software gives no such sign. In TikTok LIVE Studio the address still needs `ui=0`.
- `stage.html` had no controls-off option before; it has now, and as a source it starts moving by itself, as the lasers do. `city.html` also hides its frame-rate figure.

## The one page: `live.html`

The scenes are still the pages they were. `live.html` holds one of them at a time in a frame. Where it runs decides what it is.

- **In OBS: the picture.** Nothing but the scene, filling the source. Add it once, as a browser source of 1920 by 1080, and never change the address again. It starts on the scene it showed last (the world the first time).
- **In a browser: the control room.** A bar at the top: a tab for each scene (Open world, City, Lasers, Liquid sky, Music stage, Hero film, Andie's Place), the one connection to OBS, **Show this in OBS**, and **Copy the address for OBS**. Under the bar, the scene of the tab with its own controls, as on its own page.
- Looking at a tab changes nothing on the stream. **Show this in OBS** does; the tab then carries a red "IN OBS" mark.
- "Settings in OBS" takes what would be written in that scene's address (`input=rode`, `bpm=128`, `light=dusk`), kept per scene, sent with Show.

### How the messages travel

- The control room is connected to OBS's own remote control (`obsremote.js`, as before) and sends events that OBS hands to its browser sources:
  - `zeusLive` `{ cmd: 'show', scene, opts }`: change scene. The picture goes dark for a third of a second, loads the scene, and comes back. The scene before is thrown away, with its memory.
  - `zeusWorld`, `zeusHero`, `zeusLiquid`, `zeusCity`: the scenes' own orders. OBS delivers them to `live.html`, which passes them into the frame.
- A scene shown inside the control room does not connect to OBS itself: it finds `parent.zeusLive` (see `host` in `source.js`) and sends through that. Its own password box is hidden. So one password, one connection.
- An order for a scene that is not on screen is dropped, with one exception: a hero film told to play is put on screen first, and the order is kept until the film's page says it listens (`sceneReady`, a message to the page around it).
- A scene that is in OBS by its own address (an old `hero.html` or `world.html` source left beside `live.html`) ignores numbered messages: they are meant for the scene inside `live.html`, and OBS hands every event to every source. Without this a film played twice, with two sounds (ZW-059). The old pages' own remotes send no number, so they still work.
- Every message from the control room carries a number (`_n`); a scene obeys a number once (`onceOnly`), in case OBS ever hands an event to the frame as well as to the page.
- Without OBS, two tabs of one browser work: `live.html?ui=0` in one, `live.html` in the other (a BroadcastChannel carries Show; the scenes' own channels carry their orders).
- From outside, later (TikFinity): `window.zeusShow('hero')` on the picture.

### Liquid Sky (ZW-058)

`liquid.html` is the owner's flash-safe show, brought in from a file of his own: one shader, no three.js. It is the accessible alternative to the lasers: no strobes, no blackouts, fades of three seconds, hue limited to 12 degrees a second, slower under "reduce motion". Keep those properties when changing it.

- Its order is its whole state: `zeusLiquid` `{ on, pal, flow, depth, glow, shimmer, drift, badge }`, sent on every change. The same names work in the address (`pal=aurora&glow=0.6`).
- When the control room presses Show it tells the tab's page (`zeusShown`), which sends its state, so OBS starts with what the control room is set to. A scene that wants the same only has to listen for `zeusShown`.
- **Grey sky (ZW-061).** The first frame's clock (`requestAnimationFrame`'s time) can be earlier than `performance.now()` read when the script began. A negative step made the palette index -1 and the hue NaN for ever; a NaN hue draws grey. `dt` is clamped at zero and a NaN hue is reset. Check colour with a still: `PAGE=liquid.html node shot.mjs out.png "ui=0"`-style, or any screenshot after five seconds.
- It starts by itself in OBS and in the control room; opened alone in a browser it waits for Start, as the original did.

### The city (ZW-060)

- `zeusCity`: `{ cmd: 'battle', wins }`, `{ cmd: 'tour', on }`, `{ cmd: 'spin', on }`, `{ cmd: 'reset' }`, `{ cmd: 'address', view, light }`. Sent by `tell()` in `city.js`, obeyed by `obey()` in the battle block (where the camera's `go()` lives).
- A view link still loads the control room's copy again with `?view=`, as it always did. The picture in OBS does not: it flies to that view's camera, because a loading bar would show on the stream. A different light does load it again (the light is chosen when the city is built).
- Zoom, pan and dragging are not sent.

### Why a frame and not one merged program

Each scene is a heavy program with its own renderer, written as a page. Merging them into one program would mean rewriting all of them and keeping every scene's models in memory at once. A frame costs nothing: one scene is loaded at a time, the old pages keep working at their own addresses, and a new scene is one line in `SCENES` in `live.js`.

### The hero film from the control room (ZW-059)

- "Play in OBS" also plays the film in the control room, without sound (`play(true)` in `hero.js`), so the owner sees what the stream sees and the sound is not heard twice. The film's video is always silent; the sound is two separate audio players, and those are what `quiet` mutes.
- A browser may refuse to start sound that nobody clicked for. `play()` then starts again without sound. OBS allows sound unasked, so this is for other software.
- On the picture, the curtain between scenes lifts when the scene's page has loaded, at once when an order was waiting for it, and after five seconds whatever happens.
- Checked with a throwaway script that tells the picture to play the film from the world, from the lasers and from the film itself, and reads the video's clock: it ran every time. The films are WebM, which the test browser can play.

### Known limits

- The control room runs its own copy of the scene, so the computer draws the scene twice (once in Chrome, once in OBS). The world and the city are heavy; if the stream's frame rate suffers, look at a light tab (Hero film) after pressing Show, or ask for a "controls only" mode.
- The world, the city, the hero film and Liquid Sky take live orders. The lasers, the stage and Andie's Place have none yet: their controls in the control room change the control room's copy only. What reaches OBS for them is the scene and its "Settings in OBS". Orders for the lasers (theme, gifts) are the natural next step.
- The control room cannot ask OBS what it is showing. "OBS was last told" is what this browser sent last.
- After the hero film ends the picture stays on the film's last frame; going back to the scene before is by hand.

### Checking

`node livetest.mjs` in `assets/` (after `npm run build`) runs both faces against a stand-in for OBS: controls hidden on all six pages, Show, the settings, the world's buttons arriving once, the film coming on screen with its name, the scene kept across a reload. **Not checked in OBS itself**, which cannot run on the build machine.
