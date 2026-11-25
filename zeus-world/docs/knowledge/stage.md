# The Zeus Stage

Backlog: ZW-034. A show for the owner's music, separate from the city. Built 24 Nov 2026.

Source: `assets/review/stage.html`, `stage.js` and `beat.js`. Hosted with the other pages at `/stage.html`. The city's controls have a **♪ Stage** link that opens it in a new tab.

**From 25 Nov 2026 the stage is being rebuilt as a professional laser and lighting system.** The brief, the audit of what is described below, the plan, the phase 2 prototype and the phase 3 show (`laser.html`, `laser.js`, `beams.js`, `director.js`; seven projectors, a Lighting Director, themes, camera) are in `../STAGE-PLAN.md`, with how each was worked out. The director's rules are tested: `npm test` in `assets/`.

**The beat (from 25 Nov 2026, ZW-038).** `beat.js` no longer detects beats itself. `tracker.js` finds the tempo and the beat from the audio and holds them through quiet parts; `beat.js` runs the count of beats at that tempo and eases it onto the tracker's beat. How it works, the traps met and what was tested are in `../STAGE-PLAN.md`, "Phase 4, first part". The description of beat detection further down this file is the old method and no longer applies. Check it in a real browser with `node beattest.mjs 128` (review server running). The page described here still works and is unchanged.

## Why it is separate

Concert mode was first built inside the city (ZW-033): evening light, pulsing lamps, beams, lantern strings and citizens dancing in the plaza. The owner tried it and rejected it: "no, it's not looking good." He asked for "a separate module and staging with laser light and something interesting background transitioning". The city version was removed. What was kept from it: the beat logic (now `beat.js`), and the city's ability to hold a time of day (`dn.hold`), which nothing uses at present.

Lesson: a sunlit miniature city is the wrong canvas for a light show. Lasers and colour need darkness, and code-made dances on citizens looked weak. The stage starts from black.

## What is on screen

- **A dark arena** with a rig overhead and Zeus's gold bolt hung above the screen.
- **A great screen** showing one of six moving backgrounds, drawn by the graphics card:

  | Name | What it is |
  | --- | --- |
  | Aurora | Curtains of northern lights over stars |
  | Tunnel | Flying down a tunnel of rings and spokes |
  | Sunset drive | A striped sun over mountains and a moving grid |
  | Kaleidoscope | Folding, flowing colour |
  | Warp | Streaks of stars rushing outward |
  | Skyline | Bars that jump like a sound meter |

- **The background changes every 32 beats** with a wipe that eats across the screen over four beats, and each background brings its own three colours for the lasers and lights.
- **Lasers** in fans from five points on the rig and four on the floor: thin bright cores in a soft glow. The pattern changes every eight beats: a fan opening and closing, scissors, a turning cone, a wave, and a new burst on every beat.
- **Wide beams** from six moving heads, haze, glowing edges round the screen and the stage, and the screen reflected in the floor.
- **A crowd in silhouette** that bounces on the beat, some with hands in the air.
- **The camera** cuts between six angles every sixteen beats.

## Still without music, visibly on the beat, and a neon glow (ZW-035, 24 Nov 2026)

The owner approved the look, then reported three things: he could not tell whether it followed the beat, it moved when no music was playing, and the lights lacked a neon glow.

**Still without music.**

- The stage starts still and dark: the screen dimmed to a fifth and frozen, lasers off, crowd standing.
- It moves only while it is listening and hears music, or after the beat has been tapped in. **Stop** makes it still again.
- When listening, a second or so of silence freezes it, and it wakes when the music returns. Time itself stops for the backgrounds, the lasers and the camera; they resume where they left off.
- `beat.js` holds this in `state.act`, which eases from 0 (still) to 1 (playing). Everything in `stage.js` is multiplied by it.

**Visibly on the beat.**

- The panel has a **lamp** that flashes on every beat the stage acts on, and a **Hearing** bar that shows the loudness it is receiving. If the bar does not move, the stage is not hearing the music.
- A line of status says which state it is in: still; running on the tapped beat; listening with no music; listening and on the beat; listening and finding the beat.
- On each beat the lasers flare from 30% to full, the screen brightens, the glowing edges and the bolt flash, the crowd jumps and the camera kicks. Before, these followed a smooth wave and the beat was hard to pick out.
- When listening, each flash comes from the beat as heard in the music, not from a clock, so it stays with the song.
- The listener now judges loudness against the loudest the song has been in the last few seconds, so a quiet stream is followed as well as a loud one, and it reacts faster (less smoothing of the sound).

**Neon glow.**

- A glow pass (bloom) makes everything bright bleed light into what is around it: lasers get a halo, the screen and its edges glow.
- Trap: with the glow pass, light is added up the way real light adds, which made every faint see-through layer (haze, wide beams, the lasers' own soft sleeve) several times brighter and turned the black arena into coloured fog. They were cut to about a tenth, and a last step pulls the darkest tones back down to black. Neon only reads as neon beside black.
- Settings that worked after four tries: strength 0.55, radius 0.14, threshold 0.7. `?glow=0.8` tries another strength.
- The screen's picture has to be handed to the glow pass in linear light (`pow(colour, 2.2)`), or it comes out washed.

Tested with exact made-up input: at rest nothing advances; a tapped beat runs; Stop freezes it; a loud made-up song at 124 beats a minute was found as 124 with 21 beats heard in ten seconds; a song a fifth as loud at 100 was found as 100; four seconds of silence were judged silent after the first 1.2.

## Backdrop only

A button (or `?mode=backdrop`) shows just the moving background, filling the window, with no stage. This is for putting behind the owner's own camera in OBS or LIVE Studio: capture this window as a layer and place the camera over it, with a green screen or background removal if he uses one.

## How the owner uses it

1. Open it from the **♪ Stage** link in the city's controls, or directly at `/stage.html`.
2. Start it: **Listen to the music** and share the tab or screen playing the music with its audio ticked, which is the way to have it follow the song by itself; or **Tap the beat** three or more times in time (or press the space bar). **Stop** makes it still.
3. **Next background** (or N) changes it at once. **Auto** turns the change every 32 beats on and off. **Camera cuts** turns the angle changes on and off.
4. The panel hides when the mouse is still, so it does not appear on stream. **H** keeps it hidden.

Listening needs the page open in a normal browser window such as Chrome; OBS's built-in browser source cannot give a page access to sound, so there only tapping works. Options in the address: `?bpm=128`, `?scene=0` to `5`, `?auto=0`, `?cuts=0`, `?mode=backdrop`.

## How it works

- **The beat (`beat.js`)** is a clock at a tempo. Taps set the tempo; a pause of more than two and a half seconds starts a fresh count. When listening, the loudness of the low notes is measured about sixty times a second; a beat is the bass jumping to more than 1.3 times its recent average; the middle of the last twelve gaps, folded into 75 to 165 beats a minute, gives the tempo. Overall loudness is an "energy" value that scales the brightness.
- **The screen** is one flat surface with a small program (a shader) that draws all six backgrounds from a time value, the beat and three colours. A transition draws two at once and blends them along a moving, ragged edge. The same picture drawn upside down under a dark see-through floor is the reflection.
- **Lasers** are 63 thin cylinders drawn in one go, twice (core and glow), with positions and colours set every frame.
- Everything is unlit glowing shapes; there are no lights and no models, so it is light to draw and loads at once.
- To add a background: write a function in the shader, add it to `pic()`, add its name to `NAMES` and a palette to `PALETTES`, and raise the count of six where it is used.

## What was checked, and what was not

- Stills of all six backgrounds from six camera angles, of a transition halfway through, and of backdrop only.
- The controls in a headless browser, with no errors: tap tempo (taps 0.46 s apart gave 130), next background, automatic change, the backdrop, camera and tempo buttons.
- The beat detector with made-up songs at 96, 128 and 150 beats a minute: detected as 95, 129 and 150 (tested when it was part of concert mode; the code is unchanged).
- **Not checked:** anything in motion, and listening to real music. The build machine has no graphics card or sound.

## Trap met

A still hung with no message because the page removed its control panel in still mode and then tried to write the background's name into it. In still mode the panel is now hidden, not removed.

## Ideas not built

- A performer on the stage: a figure, the owner's own camera, or his avatar.
- Words on the screen: the song's name, a shout-out, a viewer's name.
- The crowd growing with the number of viewers; lasers triggered by gifts or taps.
- More backgrounds; a Greek-themed set (columns, a temple front) round the screen.
- Pyrotechnics and confetti on big moments.
