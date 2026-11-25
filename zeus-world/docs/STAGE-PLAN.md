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
