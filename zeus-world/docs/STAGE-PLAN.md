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
