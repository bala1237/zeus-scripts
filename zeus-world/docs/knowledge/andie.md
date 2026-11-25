# Andie's Place

A stream backdrop for Andie Howard, a TikTok LIVE host who plays the owner's songs on her stream. The owner is giving it to her in her own branding (ZW-042, 25 Nov 2026). It is not part of Zeus World; it lives beside it because it uses the same beat tracker and laser code.

**Page:** `/andie.html` on the preview site. Files: `assets/review/andie.html` (the room and its styling), `andie.js` (words, lights, controls), `roomcues.js` (which lights are on when; tested), `roomlasers.js` (the laser layer).

## What it is

Her studio from the screenshot she streams with, rebuilt in code: black, gold and purple. A gold script name sign, a framed neon welcome panel with a crown, four neon word signs, gold shelves with framed mottoes, plants, two armchairs, roses, a lit step. With no music it is her room, calm and fully lit. With music, the room's own lights follow it.

## The owner's requirements

1. She streams with **TikTok LIVE Studio** and can add a browser source.
2. It is a **background**; she is on camera in front of it as a cut-out.
3. **Her colours**, and a way to **turn the brightness down**.
4. An option where **only her background's own lights** are the show, no lasers.

## How it behaves

- **Two modes.** "Room only": just the neon and the room react. "Room + lasers": purple and gold laser light joins in now and then (about an eighth of the time) and on drops, with the room dimmed behind it.
- **The room's cues** (`roomcues.js`), sixteen beats each, with the plain lit room between any two of them:
  - glow: everything on, breathing slightly with the beat
  - chase: one neon piece lit, travelling left to right and back, the rest black
  - oracle: short flashes with black between: the whole room, the middle, the sides, pairs, single pieces
  - fill: pieces come on one by one from the left, go out, then from the right
  - strobe: the whole room blinks, twice a beat and no faster (photosensitive viewers)
- **The music's shape:** in a breakdown it returns to the plain lit room; when the bass comes back, four beats of everything, with lasers if allowed.
- **Brightness** 20 to 100%, remembered.
- **The sign's two lines** can be typed in the panel and are remembered. The big line shrinks to fit.

## Using it in TikTok LIVE Studio

LIVE Studio cannot be run on the build machine, so everything here is built to the two ways a page can be added and confirmed only by the owner or Andie.

1. **As a browser source (simplest).** Set the page up in Chrome as wanted, press **Copy link for LIVE Studio**, and paste that link as the browser source's address. The link carries the mode, brightness, sign words and tempo, and switches the controls off. A page with its controls off **starts by itself** at a steady tempo (124, or `bpm=` in the link); `calm=1` keeps it still. **It cannot hear the music this way**: a browser source cannot ask to listen. The lights keep a steady beat that is near the song's, not locked to it.
2. **As a window capture (follows the music).** Open the page in Chrome, press "Listen to the music", pick the tab playing the songs and tick its audio. In LIVE Studio capture that Chrome window and crop to the picture. Keep the Chrome window open and not minimised.

**If nothing moves in LIVE Studio (ZW-043).** Add `&debug=1` to the link: a line across the top of the picture says what the page is doing (running or calm, the cue, a frame count that should climb, the browser's version, and any error). No line at all means the page's code did not run in that browser.

Address settings: `mode=room|lasers`, `bright=20..100`, `size=25..100`, `bpm=`, `demo`, `calm=1`, `debug=1`, `top=`, `big=`, `name=`, `place=`, `tag=A|B|C`, `ui=0`.

### Why it did not animate at first, and what was changed

- The plain link shows the calm room and waits for Listen or Demo. In a browser source nobody can press them. Now a controls-off page starts itself.
- A browser stops calling its drawing loop for a window it thinks nobody can see (covered, minimised, in the background), and a window capture freezes. Now a timer in a worker steps the show whenever the normal loop has gone quiet for a tenth of a second. Checked by switching the normal loop off: the beat count kept climbing.
- The build now targets 2022-level JavaScript, not the newest (2020 does not build: other pages use top-level await), because the browser built into streaming software can be some years old.

## How it is built, and why

- **The room is ordinary page elements, not 3D.** Text stays sharp at any size and every word is real text that can be changed. Neon is `text-shadow`; gold is a gradient clipped to the letters with a slow shimmer.
- **A 16:9 box in the middle, resizable, with the controls below** (the owner, 25 Nov: "placed in 16:9 and controls can be below", then "in a small space with 16:9 and make that resizeable, so we have enough space around, preferably in the middle"). The room is drawn at 1920 × 1080 and scaled into a 16:9 box centred in the space above the controls bar. Its size is a share (25 to 100%, opening at 60%) of the largest box that would fit, set by the Size slider or by dragging the gold corner, and remembered. Double-clicking the corner fills the space. The corner grip and the thin outline lie just outside the box, so a capture cropped to the box is clean. With `ui=0` (a browser source) the box fills the window, since nobody is there to resize it; `size=` in the address overrides that.
- **Layers, back to front:** the room; a black sheet whose opacity dims the room; the six neon pieces, each with its own light (`--l`); the laser canvas; the panel. The pieces sit above the black sheet, which is how one sign can be lit in a black room.
- **The lasers are fetched only when first switched on**, so room-only mode loads no 3D at all. They are the club rig from the laser page with a theme called Mogul (`only: 'andie'` in `director.js`, which keeps it out of the Zeus rotation). `roomlasers.js` is a trimmed copy of the rig code in `laser.js`; a change there should be mirrored.
- Fonts are bundled (open licence, from the `@fontsource` packages): Dancing Script for the name, Great Vibes for "Season", Montserrat for the rest. Great Vibes was tried for the name first; its capital A reads as a C.
- The laser canvas takes no clicks (the trap from ZW-040). The controls no longer hide by themselves, since they are not over the picture.

## Checked, and not

- **Checked:** three tests of the cues and of what plays when (`npm test`); stills of the calm room, two cues and the lasers (`assets/sheets/andie_place.jpg`); every button clicked with a real pointer; six minutes stepped through with settings taken from the address, no errors; the build.
- **Not checked:** motion; real music; TikTok LIVE Studio; how the room reads behind a cut-out of a person.

## Known gaps against her picture

The furniture and plants are drawn simply and are the weakest part; her picture's are richer. The heart on the name sign is missing. The exact lettering of her logo is not matched (a similar script is used). If she has her logo as an image file, it can replace the lettering.
