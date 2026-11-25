# The Zeus Stage: brief, audit and plan

Backlog: ZW-036. Written 25 Nov 2026. This is the working document for turning the stage from a music visualiser into a professional virtual laser and lighting system. How the stage works today is in `knowledge/stage.md`.

## The owner's brief, 25 Nov 2026 (condensed; his words where quoted)

**Goal.** "When I play music during my TikTok LIVE, viewers should feel as though they are watching a professionally produced nightclub or electronic music festival laser show." An enhancement of the existing stage, "not a request to rebuild it from scratch".

**Look.** "70% Premium Underground Nightclub + 20% Minimalist Industrial Techno + 10% Festival-Scale Spectacle." Predominantly dark. "Professional lighting is about contrast, timing, precision, and restraint, not simply adding more beams."

**Must not resemble:** random neon lines, audio spectrum visualisers, screensavers, wireframe animations, flat 2D patterns, cheap game effects, randomly flashing RGB lights, excessive glowing particles.

**Requirements, in his order of importance.**

1. **Realistic laser rendering.** Bright narrow cores, subtle scattering in haze, controlled glow, perspective and depth, falloff with distance where justified, real projector origins, smooth movement, occlusion by the stage, no uncontrolled bloom. Projectors with a position, orientation, scan angles, spread limits, speed limits, intensity, colour and pattern; "a coordinated lighting rig, not independent animated lines"; no instant changes of direction. Haze that reveals beams and keeps strong blacks. "The scene should look impressive even when only four laser projectors are active."
2. **Choreography.** A Lighting Director that runs the whole rig. A starting library of ten patterns: symmetrical fan, horizontal laser ceiling, opposing arrays, geometric tunnel, laser cage, precision sweep, minimal single-beam moment, drop explosion, rotating beam architecture, festival finale. Rules: symmetry, coordinated movement, easing, alignment to musical phrases, controlled transitions, contrast, deliberate blackouts, colour discipline, never everything at once. No obvious repetition over long sessions.
3. **Music intelligence.** Beat, tempo, kick, bass, mids, highs, onsets, energy changes, breakdowns, build-ups, drops. A state engine: INTRO, GROOVE, BUILD, BREAKDOWN, DROP, HIGH_ENERGY, TRANSITION, with smoothing and hysteresis. "Do not claim precise musical structure detection unless the audio analysis actually supports it." No AI inference or outside services. Measure latency and allow compensation.
4. **Stage.** A premium underground club: dark architecture, trusses, real mounting positions, haze, reflective surfaces where right. "The stage must support the lighting rather than compete with it." A composed default camera and restrained presets.
5. **Moving heads**, optional, only after the lasers meet the quality bar.
6. **OBS and TikTok.** macOS, browser, OBS. Mode A: full-screen show. Mode B: transparent overlay over a camera scene. Do not compromise A for B.
7. **Performance and reliability.** 1920 × 1080, 60 frames a second where supported, about five hours continuously, no leaks, quality presets, diagnostics. "Do not assume performance is acceptable without measuring it."
8. **Controls.** Automatic by default. Manual scene, laser intensity, haze, palette, choreography intensity, audio sensitivity, blackout, mode, quality.
9. **Validation.** Judged by whether it looks like a professional production, with captured frames and sequences. "Do not claim that an implementation is photorealistic without visual evidence."

**Method.** Six phases: audit; a rendering prototype of one projector and one fan ("the first major quality gate"); choreography; music intelligence; stage production; OBS and reliability. Tests for audio events, state transitions, pattern selection, choreography constraints, configuration and resource lifecycle.

**Who decides what.** Claude decides shaders, optimisation, geometry, code organisation, audio algorithms, resource management, testing. The owner decides: major changes to visual direction, choices between different stage aesthetics, replacing major parts of the architecture, paid dependencies, major changes to OBS integration, any trade that materially reduces visual quality.

## Phase 1: the audit

### How the stage works today

- **Engine.** Three.js 0.187 on WebGL2, one page (`stage.html`, `stage.js`, 155 lines) plus `beat.js` (41 lines). Drawn through a chain: the scene, a bloom pass (strength 0.55, radius 0.14, threshold 0.7), a pass that pulls dark tones to black, then conversion for the display. The intermediate images are half-float, so the chain can carry brightness above white, but nothing uses that: there is no tone mapping.
- **Beams.** 63 of them: 9 emitters with 7 beams each. A beam is a six-sided tube 70 m long, drawn twice (a 2.2 cm core and an 8.5 cm sleeve) with a flat colour added onto the picture. All 63 are drawn in two calls.
- **Movement.** Each frame, each beam's direction is computed from one of five formulas chosen by `floor(beats / 8) % 5`. Brightness is `0.3 + 0.9 × pulse`.
- **Atmosphere.** Fourteen large soft sprites and six wide cones, both turned down to under 0.5% opacity when the glow was added, so in practice there is none.
- **Environment.** A rig of boxes, a 34 × 15 m screen showing six shader backgrounds, the screen mirrored under a see-through floor, a crowd of capsules.
- **Audio.** The page gets sound from Chrome's tab or screen sharing, or the microphone. An analyser (1,024-point, about 47 Hz a bin) is read once per drawn frame. "Bass" is the mean of bins 1 to 5 (about 47 to 235 Hz). A beat is bass above 1.3 times its running average. Tempo is the median of the last twelve gaps between beats, folded into 75 to 165. There is one overall loudness value.
- **Output.** An opaque page. "Backdrop only" shows just the screen's picture. No transparency.
- **Controls.** Tap, tempo up and down, listen, stop, next background, auto, backdrop, camera cuts.
- **Tests and measurement.** None in the repository. Frame rate on a real graphics card has never been measured. Latency has never been measured.

### Assessment

| Component | Current implementation | Identified issue | Recommended enhancement |
| --- | --- | --- | --- |
| Rendering | Bloom on the whole picture by threshold; no tone mapping; black level fixed by subtraction afterwards | Glow is uncontrolled: anything bright blooms, including the screen. Colours clip flat instead of burning to white. The black fix is a patch for the bloom lifting everything | Render beams far brighter than white, tone-map at the end so cores burn white with colour in the halo, and set the bloom threshold above anything but the beams. Bloom becomes selective without extra passes |
| Beam geometry | Tubes of fixed width in metres, flat colour, fixed 70 m length | Width in pixels depends on distance: far beams go under one pixel and shimmer, near ones are fat bars. No profile across the beam, no change along it, no change with viewing angle. Beams pass through floor, wall and screen and never land on anything | Ribbons that turn to face the camera, shaded per pixel: a tight core, a soft skirt, a minimum width in pixels, brighter when seen nearly end-on (as real beams are), fading with distance, cut off where they hit a surface with a small bright spot there |
| Scanned light | None. A "fan" is seven separate lines | Real club lasers are scanners. They draw sheets and cones of light as well as beams, and the sheet cutting through haze is the signature look. Without sheets, a ceiling, tunnel or cage cannot be done convincingly | Add sheets and cones as their own shaded geometry from the same projector |
| Atmosphere | Effectively none | Beams are uniform along their length, so they read as drawn lines. No depth cue, no sense of air | Slowly drifting 3D noise sampled inside the beam and sheet shaders, so light is visible where haze is thick and fainter where it is thin. No fog over the picture, so blacks stay black. Cheap: a few noise lookups per beam pixel |
| Projectors | A position and nothing else | No visible fixture or aperture, no limits on angle or speed. Patterns switch instantly every eight beats; the "burst" pattern teleports every beam on each beat | A projector with position, facing, a scan cone, a speed limit and an aperture that glows. Every direction change goes through a speed and acceleration limit |
| Lighting choreography | A fixed loop of five formulas; all 63 beams always lit; three palette colours at once, tied to the background | No hierarchy, no contrast, no blackout, no restraint, no relation to the music beyond a brightness kick. Colour is undisciplined. Many crossings are accidental | A Lighting Director: patterns as data (which projectors, what shape, what motion, what colours), cues placed on bars and phrases, an intensity budget, history to avoid repeats, one or two colours at a time |
| Audio analysis | One bass band and one loudness value, read once per frame | Timing is tied to the frame rate, so a dropped frame is a missed or late beat. No mids or highs, no sense of energy over time, no structure. Tempo can halve or double | Analyse on the audio thread at a fixed rate. Three bands, onset strength per band, tempo by autocorrelation with phase tracking, short and long energy windows, then a state engine with hysteresis |
| Environment | A large bright screen, a mirrored copy, a capsule crowd | The screen is the brightest thing in the picture and competes with the lasers; several of its backgrounds are exactly the "screensaver" look the brief rules out | A dark room that takes light: matte floor with a soft reflection, truss, projector housings, walls that catch beam ends. The screen becomes optional (see questions) |
| Performance | Unmeasured. Small arrays allocated every frame for the camera | Unknown on the owner's Mac. The screen's shader is drawn twice at full size with five layers of noise | An on-screen meter for frame time and memory, three quality presets, no per-frame allocation, a soak test |
| OBS integration | Opaque page; backdrop-only mode | No overlay mode. Sound reaches the page only through Chrome's sharing prompt | Overlay: a black-background page set to "Add" or "Screen" blending in OBS, which is how light really combines and avoids fragile transparency. Sound: see questions |

### Why it looks artificial: the specific causes

1. Beams are flat-coloured tubes with no profile, no falloff and no variation along their length.
2. There is no haze in the beams, so nothing says "light in air".
3. Beams never end on a surface.
4. No scanned sheets, which are most of what a real laser show is.
5. Sixty-three beams lit all the time, three colours at once.
6. Directions jump; nothing has mass.
7. No visible source: light starts in mid-air.
8. The screen behind is brighter and busier than the lasers.
9. The bloom is doing the job the beam shading should do.

### Can the current architecture reach the target?

**Yes for the engine, no for the beam technique.** Three.js on WebGL2, the half-float chain and instanced drawing are all adequate and stay. What has to be replaced is how a beam is drawn and how the rig is driven; both are small, self-contained parts of one 155-line file. Ray-marched volumetrics are not needed: a real laser beam is thin enough that an analytic shader on a ribbon gives the same picture at a fraction of the cost.

**Honest limits.** This will be a convincing stylised simulation, not a photograph. The build machine has no graphics card and no sound, so motion, frame rate and real music can only be judged by the owner; stills and frame sequences can be produced here. Structure detection (build, breakdown, drop) will be reliable on four-on-the-floor dance music and approximate elsewhere.

## Proposed plan

| Phase | What | The gate |
| --- | --- | --- |
| 2. Rendering prototype | One projector, one fan and one sheet, in a dark hazy room, with the new beam shader, tone mapping and selective bloom, and speed-limited motion. On a separate page so the current stage keeps working | The owner compares it with the current stage and with real footage. Nothing else is built until this passes |
| 3. Choreography | Projector model; Lighting Director; the first four patterns (fan, ceiling, opposing arrays, single-beam moment), then the rest | Transitions, symmetry and restraint, in recorded sequences |
| 4. Music intelligence | Audio-thread analysis, tempo and phase tracking, the state engine, latency measurement and offset | Tests against made-up and real tracks; the owner's ear on stream |
| 5. Stage | The room, truss, housings, camera presets; moving heads only if the lasers have passed | Composition stills |
| 6. OBS and reliability | Overlay mode, presets, meter, a five-hour soak | Measured figures on the owner's Mac |

**Smallest prototype with the largest gain:** a single projector throwing a nine-beam fan that opens and closes, and a single sheet sweeping, through drifting haze in an otherwise black room. If one projector looks real, the rest is arrangement. If it does not, no number of patterns will help.

## Questions for the owner

1. **The screen and its backgrounds.** Two days ago the brief was "something interesting background transitioning"; this brief says the stage must not compete with the lasers and must not look like a screensaver. Recommended: off by default, kept as an optional element that can be faded in for the 10% festival moments.
2. **How the music is played on the Mac.** In a browser tab, or in DJ software or a music app? This decides how the stage hears it: Chrome can share a tab's sound directly, while anything else on a Mac normally needs a free loop-back sound device.
3. **Which mode first.** Full-screen show (A), or overlay behind or over the owner's camera (B)?
4. **Mostly what music.** House and techno, or a wide mix? This sets how much the state engine can be trusted.
5. **Which Mac.** Model and year, to set the performance target.

## The owner's answers, 25 Nov 2026

| Question | Answer | What follows |
| --- | --- | --- |
| How the music is played | In a browser tab | Chrome's tab sharing with audio is the capture route; no loop-back device needed |
| Which mode first | Overlay: "overlay works better to add as source overlay with my camera" | Phase 2 is built as an overlay. There is no room and no screen in it, so the question about the screen backgrounds no longer applies to this mode |
| Streaming software | "I have the ability to have different sources with TikTok LIVE Studio" | The overlay must work as a source in LIVE Studio. Open point below |
| Music | A wide mix | The state engine must be conservative: energy and beat first, structure (build, breakdown, drop) only when confident |
| Computer | M3 Pro | A strong graphics chip; 1920 × 1080 at 60 frames a second is a reasonable target. Still to be measured |

**Open point: how LIVE Studio combines the overlay with the camera.** Three ways exist, and which is available decides the output:

1. A blending setting on the source ("Add" or "Screen"). Best: the page stays black and light is added to the camera picture.
2. A browser source with a transparent background. Good, but a page inside LIVE Studio's own browser cannot be given access to the music, so it could not listen.
3. Capturing a Chrome window. This is the route that can listen to the tab's music, but a captured window has no transparency, so it needs option 1, or a colour key that removes black.

The prototype supports all three (`?bg=black`, `?bg=clear`, and black is also what a key would remove) so the owner can try them in LIVE Studio.

**Known limit of an overlay:** the lasers are drawn over the camera picture, so a beam cannot pass behind the owner. The projector is placed high so that beams cross above and beside him.

## Phase 2: the rendering prototype, built 25 Nov 2026

**Where:** `assets/review/laser.html`, `laser.js` and `beams.js`; hosted at `/laser.html`. The current stage (`stage.html`) is untouched.

**What it is:** one projector, high and behind where the performer sits, facing the camera. It runs a four-part loop of sixteen beats each: a nine-beam fan opening; the fan sweeping side to side; a single scanned sheet tilting down; fan and sheet together. One colour at a time from a list of six, changing every 64 beats.

**How a beam is drawn now (`beams.js`).**

- A ribbon divided into 56 parts along its length, turned to face the camera, shaded per pixel: a tight core and a faint skirt.
- Width follows the real beam (6 mm at the aperture, spreading slightly) but is held between about one and three pixels, so it is a clean thin line at any distance.
- Brightness goes well above white; the picture is tone-mapped at the end (ACES), so cores burn to white with the colour in the halo. The glow pass only acts on what is brighter than white, so only the beams glow.
- Haze: three layers of drifting 3D noise sampled where the beam is, so the light is patchy the way it is in smoke. No fog is laid over the picture, so black stays black.
- A beam is brighter when seen nearly end-on (you look through more of it) and when it points towards the viewer (haze throws light forward).
- It fades over distance, at the aperture, at its far end, and as it comes within a few metres of the lens.
- **A sheet** is a fan-shaped surface with the same haze, bright when seen edge-on and a faint veil face-on, with brighter lines at the two ends of the scan.
- Beams and sheets are each drawn in one call, and nothing is allocated per frame.

**Movement.** Every angle eases to its target under a speed limit. Measured over 70 seconds of the loop: the largest change in one frame was 0.47 degrees of pan and 1.29 degrees of spread. Nothing jumps.

**Output for an overlay.** The page shows only light. `?bg=black` is for a source set to Add or Screen blending; `?bg=clear` makes the page transparent, with each pixel as see-through as it is dark; `?bg=mock` puts a stand-in camera picture behind it for judging. The Background button cycles the three.

**Controls.** Listen to the music, tap, demo (124 beats a minute without music), stop; sliders for brightness, haze and glow; a readout of frames a second, the slowest frame and memory.

**What was learned.**

- A ribbon with only its two ends cannot work: its width in pixels depends on distance from the camera, and a beam that passes the lens was drawn as a fat wedge because the width was worked out at the far end, behind the camera. It needs dividing along its length.
- The first settings flooded the frame with colour. The skirt had to be cut to a quarter and the glow made tighter; a closed fan is nine beams on top of each other and must be dimmed to match an open one.
- A comment placed in the middle of a line of shader code silently removed the rest of the line and the beams vanished with no error. Comments in shader strings go on their own line.

**Known flaws in the prototype.**

- A beam pointing almost straight at the lens shows a slight wobble near the camera.
- Beams do not land on anything; in an overlay there is nothing for them to land on.
- The sheet has a faint seam down its middle.
- Light is drawn over the camera picture, so it cannot pass behind the performer.

**Checked:** stills at six moments, on black and over the stand-in camera picture; the loop stepped through with no errors; still when stopped (nothing drawn). **Not checked:** motion; frame rate on a real graphics card (the page reports it); listening to real music; how it combines in TikTok LIVE Studio.

**The gate.** The owner looks at it over his own camera and says whether the light itself now looks like real laser light. Phase 3 does not start until it passes.

## Phase 2 passed, 25 Nov 2026

The owner on the prototype: "I love it. If it's more like 3D it will be extraordinary. All having different themes will up the ante, and cinematic camera movements."

So phase 3 carries three requests on top of the brief's choreography: a stronger sense of depth, themes, and camera movement. Still unanswered from the gate: how the overlay combines in TikTok LIVE Studio, and the frame rate on his Mac.


## Phase 3: rig, Lighting Director, themes and camera, built 25 Nov 2026

On `/laser.html`, replacing the one-projector prototype. The existing stage (`stage.html`) is still unchanged.

**What it adds**

- **A rig of seven projectors placed in depth**, which is what gives the 3D feeling: three across the back and high up, one on each side wall, two on the floor. Beams from different distances cross each other, and cones of beams can be looked down into.
- **A Lighting Director** (`review/director.js`) that runs the show instead of every light moving all the time. It plays one pattern for a set number of beats (a cue), then chooses the next. Ten patterns: fan, ceiling ("liquid sky"), opposing, tunnel, cage, sweep, single beam, explosion, architecture, finale.
- **Its rules.** No pattern returns within three cues. At most five of the seven projectors are lit except in the two big patterns (explosion, finale). A big pattern is always entered from one beat of darkness. Left and right mirror each other. The same seed gives the same show.
- **Six themes**, each with its own colours, its own choice of patterns, its own cue length and camera style: Emerald, Ice, Inferno, Ultraviolet, Monochrome, Solar. A theme holds for eight cues and then the next one comes in. One can be chosen by hand, which stops the automatic change.
- **Cinematic camera.** Six camera positions; the view glides from one to another on cue changes (never a cut), with a slow drift in between. Calm, lively or still depending on the theme. It can be switched off with the Camera button, which matters for the overlay: over a real camera picture a moving view may look wrong, and that is the owner's call.
- **Controls:** theme list, Next look (key N), Blackout (key B), Camera on or off, plus the phase 2 controls.
- **An intensity budget.** The more beams are lit, the dimmer each one is, so the full rig does not flood the frame. Fans pointing at the lens are dimmed further.
- A little dust in the beams: sparse bright specks that drift.

**How it was worked out (for the next session)**

- Projectors take targets from the director (pan, tilt, spread, roll, level, sheet, cone) and ease towards them with a speed limit; the director never moves a beam directly. That is why nothing snaps.
- The director plans the next pattern at the start of each cue. Without that, it cannot know to go dark before a big one.
- Three fans in the same flat plane, seen edge-on, add up to a wall of colour. They are set at different heights and dimmed (fan level 0.42).
- A single beam must not point into the lens: it turns into a blob. It crosses over the camera's shoulder.
- Tests: `npm test` in `assets/` runs `test/director.test.mjs` (eight rules of the director).

**Checked:** eight director tests pass; fifteen minutes of show stepped through in a headless browser with no errors, all six themes and all ten patterns seen, at most 51 beams lit (limit 64), fastest projector turn 126 degrees a second, fastest camera move 1.6 metres a second, nothing drawn at rest, in blackout and after Stop; a still of each pattern (`assets/sheets/laser_phase3.jpg`); the build.

**Not checked:** motion, the glide of the camera, frame rate on a real graphics card, real music, and how it sits over a real camera in LIVE Studio. Those are the owner's to judge.

**Known flaws**

- The fan still glows more than the other patterns when seen head-on.
- In some camera positions the single beam ends near the performer's head.
- A faint seam in scanned sheets; a slight wobble on beams aimed near the lens.
- Light cannot pass behind the performer in overlay.
- The show follows the beat only (tap or listen). It does not yet know a build from a drop; that is phase 4.

**The gate.** Does it now feel 3D; do the themes feel different enough; are the camera moves right, and should they be on or off over the camera picture; any pattern to drop or change.

## Phase 4, first part: the beat tracker (ZW-038), built 25 Nov 2026

The owner on phase 3: "the beat capture is not perfect." The old listener watched the bass for jumps once per drawn frame and guessed the tempo from the gaps between them. It is replaced.

**How it works now** (`review/tracker.js`, used by `review/beat.js`, so both `/laser.html` and `/stage.html` get it)

- The loudness of the bass, the mids and the highs is measured on the audio thread 200 times a second, each reading stamped with its own time. What is heard no longer depends on the frame rate.
- Each band is turned into "how much did it just jump". The bass counts most, then the mids (snare), then the highs (hats).
- **Tempo:** the repeat distance at which the last six seconds of those jumps best match themselves, leaning towards ordinary dance tempos to choose between half and double. Range 70 to 180; outside that it reads half or double.
- **Where the beat falls:** the offset at which evenly spaced ticks collect the most jump.
- Both are held and corrected gently. A different tempo has to win clearly for a second before it is taken. A part with no drums changes nothing: the beat carries on at the tempo it had, which is what keeps it right when the kick returns.
- The lights are driven by the *predicted* beat, not by hearing a hit, so they land on the beat and not after it.
- **Beat timing slider** on the laser page: moves the lights up to a quarter of a second earlier or later, for the delay between sound and picture. Remembered between visits.
- **The music's shape, first step:** when the bass drops out for a second and a half it is a breakdown, and the director moves to its quiet patterns (liquid sky, single beam, sweep, architecture). When the bass comes back it is a drop, and the theme's biggest pattern fires at once.

**Worked out the hard way (for the next session)**

- Each band is judged against the loudest it has been lately, so quiet streams work. But a band with almost nothing in it must count as empty (floors of 3%, 1% and 0.2% of the whole music's loudness for bass, mids, highs); otherwise the faint spill of a held note into the bass is read at full scale and the tracker locks onto nothing.
- Held chords beat against each other 50 or more times a second in the mids. Mids and highs are therefore compared as 20 ms averages, not reading by reading.
- The low band goes through its filter twice (130 Hz), to keep bass notes and pads out of it.
- The preference for ordinary tempos must only choose between candidates. If it also shapes the exact reading it pulls every tempo towards 122.
- A first lock asks for more certainty than keeping one, or a pad alone gets "locked".
- One enormous click deafens the tracker for several seconds (its sense of "loud" decays over twelve seconds). Seen through a fault in the test's own music maker; real music is level-limited, so left as it is.
- The audio-thread code is made from the text of `makeBands`, so that function must not use anything outside itself.
- An audio-thread node only runs if it leads to the speakers; it goes through a silent gain.

**Checked:** fifteen tests on made-up music with a known answer (`npm test`): tempo within half a percent and beat within 20 ms at 90 to 150; 174 read as itself or half; a broken beat; a stream at a twenty-fifth of the volume; the beat carried across sixteen beats with no drums; a breakdown and one drop noticed; a change of song followed within eight seconds; silence and a pad alone give no lock; music stopping noticed. In a real browser (`node beattest.mjs`), a test kick at 128 was locked at 128.01. The old stage page still renders.

**Not checked:** real music. Made-up drums are far cleaner than a real track. Music with no drums at all, live bands that drift, and very syncopated tracks are the likely weak spots, and only the owner's ear can judge the timing.

**Still to come in phase 4:** the fuller state engine from the brief (intro, build, high energy, transition), bars and phrases (where "one" is), and a measured delay in place of the slider.

## The owner's references, 25 Nov 2026

Three videos sent after phase 3, with "i want like some infinite move version as well":

1. "Vibrant OLED Screensaver, Liquid Art" (the Chill Gallery): ribbons and smoke of saturated colour flowing endlessly on pure black. This is the "infinite move".
2. Gareth Emery, LSR/CITY at the Kia Forum, 2025: hundreds of laser beams at once, in every colour together, over a crowd, with a great screen.
3. Armin van Buuren, Vini Vici and Hilight Tribe at Transmission Prague 2016: dense green fans with magenta accents, moving-head white beams, built stage architecture.

What they say about direction: far denser and more colourful than the brief's "70% club, restrained". Many more beams, several colours on stage at once, and a screen-style flowing visual as well as beams. Recorded under ZW-037; to be confirmed with the owner since it changes the visual direction he set.

## Flow: the "infinite move", first version (ZW-037), built 25 Nov 2026

Built from the owner's first reference (the liquid-art screensaver), as something for him to react to. It may not be what he meant; that is the question put to him.

- **What it is:** three ribbons of coloured silk that wind, twist and cross on pure black, with fine strands, bright edges and a little smoke. It never repeats, because the shapes come from slowly drifting noise and not from a loop.
- **Where:** the laser page. The "Show" button (key L) switches between lasers, flow, and both together. `?look=flow` opens it directly.
- **Colour:** the theme's two colours plus a third from across the colour wheel, so every theme gives a different flow.
- **Music:** it drifts faster as the music's energy rises, calms in a breakdown, brightens a touch on each beat, and stops and goes dark when the music stops (the owner's rule from ZW-035).
- **How:** one full-screen shader (`review/flow.js`) drawn behind the beams, through the same glow and overlay output. A ribbon is a band along a wandering line; the whole space is bent by noise (that is the liquid feel); a twist term narrows it to a bright edge and opens it again; strands are sine lines across its width, pushed about by noise.
- **Checked:** four stills in three themes and with lasers (`assets/sheets/laser_flow.jpg`); the page's fifteen-minute stepped run with no errors; the build. **Not checked:** the motion itself, which is the whole point of it, and its cost on a real graphics card.
- **Not yet done from the references:** the smoky, cloud-like version of the liquid (the reference's main image is more smoke than ribbon); the dense many-coloured laser look of the two concert videos.

## The festival look, "Olympus" (ZW-039), built 25 Nov 2026

The owner sent the Transmission Prague 2016 video again on its own: "this is something i loved it". Only its cover frame could be studied from the build machine (YouTube pages are blocked; thumbnails are not). What that frame shows is listed in the backlog entry. This look is built from it, as a seventh theme that opens the show.

- **A second rig, used only by this theme:** a wall of ten projectors at five heights across a wide stage, twenty beams each, and six projectors that throw wide soft shafts (two at the booth, four at the sides). Up to 245 beams at once, against 51 in the club themes.
- **Colour:** green fans with magenta shafts, as in the reference.
- **Five patterns:** cathedral (the reference picture: every fan standing open and leaning outwards, shafts rising through the middle and crossing from the sides), crown (level fans in tiers, breathing), wave wall (upright fans swinging one after another), spears (each projector a tight ray, like a rising sun), sunburst (the big one: everything wide and turning).
- **The stage:** a temple front with eight columns and a pediment (it is Zeus's stage), the booth with ZEUS on it in white, and a lattice of laser lines on the structure behind. All dark shapes that only catch the colour in the air. The "Stage set" button turns it off, leaving only the light, for use over a camera. `?name=` changes the word on the booth.
- **Views:** four of its own, low in the crowd looking up, to either side, and further back.
- The club themes are unchanged and follow it in the rotation.

**Worked out the hard way**

- A fan's plane always contains the projector's forward direction. Pointed at the audience, every fan is seen edge-on and they pile into one bundle. For fans that stand open like a hand fan, the projector is tilted steeply up (about one radian) with roll 0, and a new value, **lean**, tips the fan sideways within its own plane.
- A shaft seen face-on is thin, so it needs about five times the strength of a sheet seen along its length.
- The intensity budget is set per theme (`budget` in the theme): 110 here against 13 for the club, or two hundred beams come out as faint threads.
- The big patterns of the club rig used to light "everything that is not the floor", which lit the wall too. Patterns must name the groups they use.

**Checked:** ten director tests (the wall and the club rig never light together; left and right mirror, including lean and roll); the fifteen-minute stepped run with no errors, seven themes and fifteen patterns seen; a still of each pattern and one without the set over the stand-in camera (`assets/sheets/laser_festival.jpg`); the build. **Not checked:** motion; frame rate with 245 beams on a real graphics card, which is the main risk of this look; how close the movement is to the reference, which could not be watched.

## Building cues for Olympus (ZW-041), built 25 Nov 2026

The owner, on what Olympus was missing from the video: "it does blackout and highlight different corners. where the building blinks fast, corner one pillar blinks and it shows from left to right and right to left which gives the feeling of it moving or getting focus. rest are black." Built from that description; the video still could not be watched.

Four cues in which every laser is off and the temple is the show. They sit in the Olympus rotation between the laser patterns.

- **Chase:** one pillar lit, stepping along the row every half beat from left to right and back. The light seems to travel.
- **Corners:** the pillar at one corner blinks fast (four times a beat), then the other corner, then each corner's pair. Everything else black.
- **Colonnade:** pillars come on one after another from the left until all eight are lit, go out again, then the same from the right.
- **Strobe:** the whole building blinks.

**How**

- Each pillar has its own lamp: its own material, a fluted texture that is bright at the foot and fades upward and is brightest on the side facing the audience, and a soft glow at its base. A lamp comes on at once and dies away over about a tenth of a second, which leaves a short trail behind the chase.
- What is lit is decided by `building(pattern, beats, n)` in `director.js`, so it is tested without a browser. In the director these patterns simply switch every projector off.
- With "Stage set: off" there is nothing to light, so the page skips these cues.
- In a breakdown the director may choose corners or colonnade; the drop still fires the sunburst.

**A limit set on purpose.** The whole-building strobe blinks twice a beat (about four times a second at 128), not faster. Fast flashing of a large part of the picture is a known risk for photosensitive viewers, and platforms act on it. The single-pillar blink is faster because it is a small part of the picture. If the owner wants the building strobe faster, that is his call to make knowingly.

**Checked:** a test of each cue's sequence (the chase visits 0 to 7 and back one pillar at a time; corners touch only the end pillars; the strobe flashes sixteen times in eight beats; the colonnade fills from both sides); the two rigs and the building never light together; a still of each cue (`assets/sheets/laser_building.jpg`); the stepped run and the click check; the build. **Not checked:** the timing and feel in motion, and whether this matches the video.

## The reference video, watched (25 Nov 2026), and the building cues rebuilt

The owner uploaded the video file (Armin van Buuren, Vini Vici and Hilight Tribe, "Great Spirit", Transmission Prague 2016; 6 min 12 s). It was read frame by frame with ffmpeg: a sheet of one frame every two seconds for the whole show, and five frames a second for the first 26 seconds. The frames are not kept in the repository (they are someone else's film); this is what they show. **It supersedes the guesses above that were made from the cover frame alone.**

**The stage.** A temple front in the middle (six pillars, a roof with a pediment) and, either side of it, a group of three free-standing pillars. Twelve pillars in all. Rows of warm bulbs: an arch over the temple and rows beside the side groups. The artist's name on the booth. Later the temple front is also used as a screen (chevron patterns, 2:12 to 2:38).

**The opening, 0:00 to 0:25, which is what the owner loves.** No lasers. Timeline:

- 0:00 to 0:02: every bulb on, the whole hall washed in warm white haze, then it fades.
- 0:02 to 0:25: short flashes, about a fifth of a second each, with black between them, often a half second or more of nothing. Each flash lights one thing: the whole stage; the temple alone; the two side groups alone; one pillar on each side (and the pair that is lit changes from flash to flash, which reads as the light moving); a single pillar. The gaps are uneven; it follows the music's stabs.
- The colour changes from flash to flash: warm amber, red-pink, and a gold with a cool edge.
- The picture cuts as well: wide from the front, a low angle along one side group, and close on a single pillar.

**After that.** 0:25 lasers and red wash begin, chaotic, yellow and green on red. 1:40 to 1:52: a long, still passage of green fans on black making a symmetrical W shape, slowly opening. 1:54, 2:00, 2:04, 4:32, 5:16: white-outs, the whole picture flooded. 2:12 on: white moving-head beams with green lasers. 2:58: yellow zigzag lasers with white beams. 3:00 on: red, white and blue. 3:50 to 4:24: the pillars and temple held in red against blue, calm. 4:26 to 4:40: bulbs and pink temple. 4:42 to 4:48: single pillars in red again. 5:00 to the end: blue and white, lasers and beams.

**What that changes.** The cover frame (green fans, magenta shafts) is one moment of a show that is mostly red, amber, white and blue, and whose signature is the building itself. So:

- The stage set is rebuilt to the real layout: temple of six pillars, three free-standing pillars each side, bulbs in an arch and in rows.
- The building is lit in warm colours (amber, red-pink, gold), not the theme's green.
- A new cue, **oracle**, reproduces the opening: flashes with black between, jumping between the whole stage, the temple, the side groups, a pair stepping inwards, and single corners, changing colour as it goes. It is written as a string of letters, one per half beat (`ORACLE` in `director.js`), so it is easy to rewrite.
- Chase, corners, colonnade and strobe now run over twelve pillars; the strobe includes the bulbs.
- In building cues the view **cuts** every four beats between wide, close on a side group, and across the temple front, as the video does. Elsewhere it still glides.

**Checked:** twelve director tests, including the oracle cue (lit under 40% of the time, mirrored, every kind of flash present, three colours); eight stills (`assets/sheets/laser_building.jpg`); the stepped run, the click check and the build. **Not checked:** timing against music, and the cuts, which only show in motion.

**Not yet taken from the video:** the white-outs; white moving-head beams; the red wash with yellow lasers; the long still green passage at 1:40; the temple front as a screen; the red-on-blue hold. The oracle cue follows a fixed script on the beat, where the video follows the music's stabs.

## Gift moments, test version (ZW-045), built 25 Nov 2026

The owner: "We can work on it later. For now it can be more with buttons to test." So the moments are built and fired by buttons; reading real gifts from TikFinity comes later.

On `/laser.html`: a "Gift test" row with a name box and three buttons (keys 1, 2, 3).

- **Small gift (4 beats):** lightning strikes one pillar, which blinks gold and dies away; the sender's name replaces ZEUS on the booth. The lasers step back to a fifth.
- **Medium gift (8 beats):** a run of light along all twelve pillars and back, then two flashes of the whole row; the name on the booth.
- **Big gift (16 beats):** one beat of black, then lightning on three pillars at once, every pillar and bulb lit in gold, the lasers' biggest pattern, and the name in lights across the temple front. Lightning again every four beats.

**Rules built in**

- Gifts wait their turn in a queue; none cuts another short.
- With music, a gift starts on the beat, and a big one on a bar of four. With no music it starts at once and runs at two beats a second, so it can be tried on a still stage.
- A gift brings the temple on whatever theme is playing and whether or not "Stage set" is on, and the view cuts to a square-on angle for it, then goes back.
- No amount is ever shown; only the name.

**How**

- `review/gifts.js` holds the queue, the timing and which pillars are lit (tested, four tests). It knows nothing about TikTok.
- **The door for later:** `window.zeusGift(size, name)` adds a gift. Reading TikFinity's events and deciding the size from the coin value will call that; the moments do not change.
- Lightning is drawn with the same beams as the lasers: a jagged line of nine short beams from above the picture to the pillar's top, with one or two forks, bright for a tenth of a second and gone in a third.
- The booth sign is now redrawn on a canvas whenever its words change, fitted to the width.

**Checked:** four tests of the gift logic; the three buttons clicked with a real pointer; gifts stepped through with no music and with music (order kept, lightning seen, names on the booth, the big pattern fired, the sign and the lasers back to normal afterwards); stills (`assets/sheets/laser_gifts.jpg`); the build. **Not checked:** the timing and feel in motion; a still of the small gift never caught the bolt, which lasts a third of a second, though the stepped run counted it.

**Still to do:** the sender's profile picture; streaks; the TikFinity connection and coin thresholds; the same moments in Andie's room.

## Gift moments redesigned (ZW-045), 25 Nov 2026

The owner on the first test version: "I need professional creativity please. It should make people say wow and wanna see it again." The first three moments were lights going on and off. They are replaced. **The section above ("Gift moments, test version") describes what was thrown away.**

**The idea.** A gift is a short piece of theatre: a wait, a pay-off, and something left behind. And Zeus's sign is the thunderbolt, so every gift is lightning.

- **Small (4 beats).** Lightning feels its way down from the dark and strikes one pillar. Sparks burst from its top, the sender's name arrives on the booth, and **a flame is lit on that pillar and stays burning** for two and a half minutes.
- **Medium (8 beats).** Lightning strikes the end pillar, then **leaps from pillar to pillar** along the whole row, each one staying lit as it passes, to a full-row finish. Three flames stay.
- **Big (16 beats).** Two beats of black while **a storm gathers** over the temple and flickers from inside, more and more often, and the view pushes in. Then **a great bolt on the temple's peak**: a flash, a ring of gold spreading from where it lands, the ground jumping, sparks. The pillars catch from the middle outwards. The lasers come back in gold. **The name is written across the temple front** behind a white-hot edge that throws sparks, and settles into molten gold with a travelling shine. **Gold rains.** Two more strikes. At the end the name burns away to embers and the view draws back.
- **The flames are the reason to come back.** Small and medium gifts leave flames on the pillars, and "Flames 5 of 12" shows in the controls. When all twelve burn at once **the temple answers by itself** with the big moment, under the name OLYMPUS AWAKENS, and the flames start again. So the smallest gift moves the whole stream towards something, and the stream fills the temple together.

**How it is built**

- `review/gifts.js` is the script: the queue, the timing in beats, which pillars are lit, the flames, and a list of requests for the picture (`bolt`, `arc`, `forge`, `name`). Seven tests. It still knows nothing about TikTok; `window.zeusGift(size, name)` is still the door.
- `review/giftfx.js` is the picture:
  - **the sky**, one full-screen shader: storm cloud from drifting noise in the upper part of the picture, lit from inside; the flash of a strike, strongest where it lands and held well under white elsewhere; the spreading ring.
  - **lightning**, drawn with the lasers' own beams: a jagged line made by halving and nudging four times, with forks. It first feels its way down dimly over a tenth of a second (the leader), then the full stroke runs along it and flickers out. A thin white core and a wider faint sleeve.
  - **sparks and gold rain**: 1,100 points that fly, fall and fade.
  - **flames**: two soft sprites on each pillar top, flickering; they gutter in their last twelve seconds.
  - **the name**: a shader that writes it on from the left behind a hot edge and later eats it away with noise, leaving an ember rim.
- The lasers are held dark until the bolt has landed (a quarter of a beat after it is sent); lighting them on the same instant stole the strike.
- **Buttons for testing:** Small, Medium, Big, and "Light all 12" to see the temple answer without sending twelve gifts.

**Kept in mind.** One flash per strike, not a strobe, and the flash is capped. No amounts shown.

**Checked:** seven tests of the script (queue, start on the beat and bar, one bolt and one flame for a small gift, eleven leaps in order for a medium one, two beats of black then the cascade for a big one, twelve small gifts waking the temple, a flame burning out); the buttons by real clicks; a stepped run with and without music; stills of the storm, the strike, the name being written, the full moment, the burn-away and a flame (`assets/sheets/laser_gifts.jpg`); the build. **Not checked:** how it plays in motion, which is everything for a piece like this; frame rate while it runs.

**Ideas not built yet:** the sender's profile picture inside the pediment; a streak making the bolt strike again and again, each time bigger; thunder (sound); the same language in Andie's room (her neon and crown in place of lightning).

## The largest gifts as figures in the sky (ZW-046), first one built 25 Nov 2026

The owner: "Check the gifts from TT and we need to animate some like that gift. For gifts 5k and above."

**What TikTok has.** 93 gifts cost 5,000 coins or more, as listed on coinvertify.com/tiktok-gifts (prices "checked September 29, 2026") and livecade.io/tiktok-gifts/most-expensive, read 25 Nov 2026. The two agree on every price they share but not on which gifts exist; TikTok's catalogue differs by country and changes. The top: TikTok Universe 44,999; Julius the Champion and Valerian's Oath 43,999; King Leonardo, Legend Marcellus, Pegasus and Yuki's Vigilance 42,999; Fire Phoenix 41,999; Thunder Falcon and TikTok Stars 39,999; TikTok Universe+ 34,999; Seal and Whale 34,500; Leon and Lion and **Zeus** 34,000; Gorilla, Sam the Whale 30,000; Lion and Golden sports car 29,999; Dragon Flame 26,999; a long row at 25,999 (Phoenix, Adam's Dream, Griffin, T-rex, Light Castle, Vulcan and others). The whole list, grouped, is in `assets/review/giftcatalog.js`.

**The decision that had to be made.** Ninety-three separate animations is not buildable, and TikTok's own artwork is theirs: it is not copied. So:

- The gifts are grouped into **ten families** that share a figure: lion (the big cats), wings (falcon, phoenix, Pegasus, griffin), dragon, cosmos (Universe, Stars, Interstellar), sea (whales, ships), citadel (castles and landmarks), chariot (the cars), heart, hero (Zeus and the champions), revel (the parties).
- The figure is **our own drawing, as a constellation**. The Greeks put their heroes and beasts among the stars; on Zeus's stage a great gift becomes one. It suits the stage, it is recognisably "that gift", and it is not TikTok's picture.

**What a 5,000-and-over gift does (24 beats, about 12 seconds).** The storm and the bolt on the temple's peak, as for a big gift. Then the view tilts up and **a point of lightning draws the figure in the sky above the temple**, line by line, a star coming out at every corner, sparks falling from the pen. When it is complete it **wakes**: a flare, a ring spreading from it, sparks, the lasers back in gold (held lower than usual so the figure stays the hero). The sender's name is forged across the temple beneath it. Gold rains. At the end the figure's stars fall and the name burns away.

**Built so far:** the lion family (Lion, Leon and Lion, King Leonardo, Black Tiger, Cyber Roar, Lili the Leopard, Leon and Lili, Wolf), as a lion's face in a mane. A gift in a family not yet drawn plays the big moment. Test button: "Lion (29,999)".

**How**

- `giftcatalog.js`: the families, and `stageGift(giftName, coins)`, which returns the size (small under 100 coins, medium under 1,000, big under 5,000, legend from 5,000; **these thresholds are a first guess for the owner to set**) and the figure.
- `constellations.js`: a figure is a list of strokes in a square from -1 to 1. `prepare()` turns it into segments with their place along the whole drawing, and its stars. Adding a figure is adding a list of points here and its name to `DRAWN` in the catalogue.
- `giftfx.js` draws it with the lasers' beams (a core and a wide faint sleeve), a sprite for each star, and sparks from the pen.
- `window.zeusGiftFromTikTok(giftName, coins, sender)` is the entry for real gifts.

**Checked:** nine tests in all for gifts (the catalogue's sizes and families, the figure's segments, the order of the legend's script); the Lion button by a real click and the sequence stepped through (about 12 seconds, four views, everything back to normal after); three stills (`assets/sheets/laser_gift_lion.jpg`); the build. **Not checked:** motion. Whether a face made of twelve strokes reads as a lion at stream size is for the owner to say.

## The largest gifts as a cinematic show that grows with the gift (ZW-046), 25 Nov 2026

The owner on the Lion proof: "People love watching the animation. We need to do it like a cinematic show. The bigger the massive show." The constellation stays; it becomes a short film in acts, in three sizes.

| | Coins | Length | Test button |
| --- | --- | --- | --- |
| First size | 5,000 and up | 24 beats, about 12 s | 5,500 (Wolf) |
| Second size | 15,000 and up | 36 beats, about 18 s | 22,000 (Black Tiger) |
| Largest | 30,000 and up | 52 beats, about 26 s | 34,000 (Leon and Lion) |

**What makes it cinema**

- **Bars and a title.** Black bars slide in at the top and bottom of the picture, as in a film. When the figure wakes, the title fades up in the lower bar: the sender and the gift ("ATHENA · LEON AND LION").
- **Acts, each with its own camera.**
  1. *The omen.* Black. Seen from far back, pushing in, while the storm gathers and flickers.
  2. *The strike.* A cut to the foot of the temple, looking straight up it, as the bolt lands on the peak.
  3. *The drawing.* The view rises into the sky. A shaft of light stands from the peak; a point of lightning draws the figure, a star at every corner.
  4. *The awakening.* A cut to the whole picture, temple and sky. The figure flares, its eyes light, a ring spreads, and from then on it breathes: a slow ripple runs out through it.
  5. *The glory.* The name is forged across the temple; gold rains; the lasers return in gold, kept under the figure. The view passes slowly from one side to the other.
  6. *The farewell.* The figure rises, its stars fall, the name burns away, the bars open.
- **What the bigger sizes add.** Second: a larger figure, an aurora across the top of the sky, a shower of meteors, and lightning walking in along six pillars from both ends. Largest: larger again, two more rings after the first, a web of lightning from one side of the sky to the other (three times), all twelve pillars struck one after another, and more passes of the camera.

**How**

- `gifts.js`: `LEGEND` holds each size's length and waking beat; the script asks for `ring`, `web`, `meteors` and `ascend` as well as `bolt`, `draw`, `wake`, `forge`.
- `giftcatalog.js`: `stageGift()` now returns the tier (by coins) and the gift's name for the title.
- `giftfx.js`: the aurora is part of the sky shader; meteors and the web are drawn with the lasers' beams; the eyes are two sprites placed from `EYES` in `constellations.js`; breathing is a ripple applied where the figure's points are placed.
- The bars and the title are ordinary page elements inside the picture's frame, so they are in a capture of it.
- While a gift plays, the stage's ordinary camera moves are held off; they were cutting into the choreography.

**Checked:** ten tests for gifts in all, including that each size runs longer and asks for more (bolts 3, 7, 13; rings 0, 0, 2; webs 0, 0, 3); the three buttons by real clicks and each show stepped through to its end (11.6 s, 17.4 s, 25.2 s; views in the planned order; bars and the right title; everything back to normal after); stills of six acts of the largest (`assets/sheets/laser_gift_lion.jpg`); the build. **Not checked:** motion, pacing and frame rate, which is where a film is judged. The aurora is soft and blocky in stills and may want sharpening once seen moving.

## The largest gifts as realistic film clips (ZW-046), first clip 25 Nov 2026

The owner on the constellation show: "I wanted it like a show. A 3d animation like." Asked what he pictured, he answered: realistic; a pre-made clip is fine; a small spend is approved. So the figure for a 5,000-and-over gift is now a **realistic animated clip**, made once per family and played inside our stage. This is how TikTok's own gift animations work. The constellation remains as the fallback for a family that has a drawing but no clip.

**How a film gift plays (26 beats on the clock, 13 seconds).** Black and the storm; the bolt on the temple's peak seen from its foot (beat 2); a cut to the whole picture as **the clip begins behind the temple, filling the sky** (2.5); a slow push in towards it; on the clip's big moment (the lion's roar, 6.2 s into the clip) the stage answers with a ring, sparks and a jolt, kept gentle so the roar itself is seen; the sender's name is forged across the temple; gold rains; the clip fades as it ends and the lasers come back. Film bars and the title throughout. Bigger gifts add meteors, the web of lightning and more pillars struck inside the same thirteen seconds; **a longer show for a bigger gift needs a longer clip**, which is a later choice.

**The lion clip.** A storm of dark cloud and lightning; a photoreal lion walks out of it towards the camera; a full roar with lightning either side and sparks; he closes his mouth and stares. 10 s, 1920 × 1080, no sound.

- Made on fal with **Wan 3.0 Prime, text to video** (`alibaba/wan-3.0-prime/text-to-video`), 10 s, 1080p, 16:9, audio off, prompt expansion on, seed 402660878. Listed rate $0.05 a second, so **about $0.50** (an estimate from the listed rate; the account's bill is the record). One attempt; the first result was used.
- Prompt: "Photorealistic cinematic visual effects shot on a pure black background. Out of complete darkness, dark storm clouds roll in at the edges of the frame and flicker with lightning. A colossal, majestic male lion with a huge golden mane emerges from the clouds in the centre of the frame, seen from the front, head and shoulders, walking slowly toward the camera. He lifts his head and lets out a tremendous roar, mouth wide, mane blowing in the wind, while forked lightning strikes behind him and lights the edges of his mane in gold and white. Then he closes his mouth and stares straight into the camera with glowing amber eyes as embers of gold drift upward. Dramatic low-key lighting, strong golden rim light, volumetric mist, extremely detailed fur, film grain, anamorphic lens, slow push-in. The background stays pure black everywhere outside the lion and the clouds, with no ground, no scenery, no text, no logos."
- The model ignored "pure black background" and filled the frame with cloud. That turned out better: the clip is used as the whole sky, not laid over the stage.
- Stored as `assets/review/public/films/lion.webm` (VP9, 1600 × 900, 6.4 MB; converted with `ffmpeg -c:v libvpx-vp9 -crf 34 -vf scale=1600:900`). WebM so that the test browser, which has no H.264, can play it too. The 46 MB original is not kept in the repository.
- **Open question: the licence.** Whether fal's and the model's terms allow a generated clip on a commercial stream has not been checked. It is one of the open questions in `DECISIONS.md` and should be settled before real use.

**How it is built**

- `giftcatalog.js`: `FILMS` gives each family's clip, its length and the second of its big moment. `stageGift()` passes it on.
- `gifts.js`: a gift with a film runs on the clock (two beats a second) so the stage stays in step with the clip at any tempo; `legendWake()` and `giftBeats()` take their timing from the film.
- `giftfx.js`: the clip is a video texture on a quad that fills the picture and is drawn first of all, so the temple, the lightning and the name stand in front of it. It sits a little high and large so the middle of the clip is above the temple, and fades to dark towards the ground. `seekFilm()` lets a still show a chosen second.
- The lasers are off while a clip plays; they washed it out.

**Traps met**

- A clip placed as a screen in the 3D scene looked like a television floating in the dark. Filling the picture is what makes it the sky.
- At full brightness the clip went white through the glow pass; it is shown at 0.86.
- The roar in the clip is at about 6.2 s, not where the open mouth first appears (5.2 s).
- **A comment put in the middle of a line swallowed `gift.dim += ...`**, so from the cinematic version onwards the lasers never stepped back for any gift, and a check that only looked at the end state ("lasers back to 1") passed. Found because the lasers were blazing over the film. This is the trap that has been met several times before; comments go on their own line.

**Checked:** eleven tests for gifts (the film's start, waking beat and length among them); the 22,000 button by a real click with the show played in real time in a browser (clip fades in at beat 4, the view pushes in for the roar, the clip fades at beat 22, lasers and stage back to normal after); stills of the strike, the lion walking out, the roar and the name (`assets/sheets/laser_gift_lion.jpg`); the build, with the clip copied into it. **Not checked:** the clip in motion on the stage at full frame rate; playback inside TikTok LIVE Studio.

## Zeus, with a staging of his own (ZW-046), 25 Nov 2026

The owner: "Let's try Zeus. But I want it to be in a very creative staging." TikTok has a gift called Zeus (34,000 coins); on this stage it is the one that must be different.

**The idea: the bolt leaves the film and lands on the stage.** In the lion's show the stage strikes first and the clip follows. Here there is no lightning at all until Zeus throws it, and the bolt he throws in the clip is the one that hits our temple.

**What plays (34 beats on the clock, 17 seconds)**

1. *Black.* A beat of nothing, from far back.
2. *The eyes.* A cut to the foot of the temple, looking straight up it. Far above, two eyes glowing white-blue open in the storm; the clip fades up slowly from black so they are the first thing seen. The temple stands in front as a **black silhouette**: nothing on the stage is lit.
3. *The reveal.* Lightning in the cloud shows Zeus: white beard, laurel wreath, towering over the temple, looking down at it. He raises his fist and a thunderbolt forms in it.
4. *The throw.* A cut to the whole picture. He hurls the bolt down, and it comes to the foot of the frame, where the temple stands.
5. *The strike* (8.0 s into the clip, beat 17). The stage's own bolt lands on the temple's peak, the hardest there is: flash, ring, the ground jumps. Two more rings. Then **lightning runs out along the pillars from the middle, one every quarter of a beat, and every pillar it touches takes a flame.** The dark temple is alight in three beats. Zeus has lit all twelve himself.
6. *The name.* Forged across the temple, gold rain, meteors behind. The view goes closer; he lowers his arm and watches.
7. *The end.* The clip fades, the lasers return in gold, and the twelve flames stay burning for over a minute.

The flames he lights do not trigger "OLYMPUS AWAKENS" (the script holds that off for a minute and a half): he is the awakening.

**The clip.** Made on fal with Wan 3.0 Prime, text to video, 14 s, 1080p, 16:9, audio off, prompt expansion on, seed 150392040; **about $0.70** at the listed rate ($0.05 a second). One attempt, used as it came. Stored as `assets/review/public/films/zeus.webm` (VP9, 1600 × 900, 6.6 MB).

Prompt: "Photorealistic cinematic visual effects shot, low camera angle looking steeply up into a night sky of towering black storm clouds. The shot begins in near-total darkness: only two eyes glowing white-blue with lightning open high in the clouds. Lightning flickers inside the clouds and slowly reveals Zeus, the colossal Greek god of thunder: a powerful old man with a long flowing white beard and white hair blowing in the wind, a stern majestic face, bare muscular shoulders and chest draped in white and gold cloth, a golden laurel wreath on his head. He fills the upper two thirds of the frame, centred, towering over the viewer and looking straight down at the camera. He slowly raises his right arm above his head and a blazing white-gold thunderbolt forms crackling in his fist, lighting his face and beard. Then he hurls the thunderbolt straight down toward the bottom centre of the frame and the whole frame flashes bright white-gold for an instant. After the flash he lowers his arm, sparks and golden embers rise around him, and he gazes down calmly with glowing eyes as the storm rolls. The bottom third of the frame stays dark storm cloud only, with no ground, no buildings, no people, no text, no logos. Dramatic low-key lighting, strong rim light from the lightning, volumetric cloud, extremely detailed skin, hair and cloth, epic scale, film grain, anamorphic lens."

What worked in the prompt, for the next clip: describing the shot as a sequence in time (begins, then, after); saying where in the frame the action must end ("toward the bottom centre"), which is what lets the stage pick it up; and keeping the bottom third empty for the temple. The model did add a little rocky ground with fire at the foot of the frame for a second around the strike; the temple and the flash cover it.

**How it is built.** A film can name a staging (`staging: 'zeus'` in `FILMS`), with its own start beat and tail. `gifts.js` has that staging's script; `laser.js` has its camera plan and fades the clip in slowly. Everything else is shared with the lion.

**Checked:** a test of Zeus's script (the clip first; no lightning before the throw; the stage's bolt on the peak at the clip's strike; twelve pillar bolts, middle pillars first; twelve flames; no awakening set off); the Zeus button by a real click with the show played in real time in a browser (clip fading up from beat 2, views 9, 15, 19, 20, 19 in order, lasers off until the clip ends, everything back to normal after); eight stills (`assets/sheets/laser_gift_zeus.jpg`); the build. **Not checked:** motion at full frame rate; whether the stage's bolt and the clip's bolt meet to the eye, which is a matter of a tenth of a second and can only be judged moving. `roar` in `FILMS.zeus` is the number to nudge.
