# The Zeus Stage

Backlog: ZW-034. A show for the owner's music, separate from the city. Built 24 Nov 2026.

Source: `assets/review/stage.html`, `stage.js` and `beat.js`. Hosted with the other pages at `/stage.html`. The city's controls have a **♪ Stage** link that opens it in a new tab.

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

## Backdrop only

A button (or `?mode=backdrop`) shows just the moving background, filling the window, with no stage. This is for putting behind the owner's own camera in OBS or LIVE Studio: capture this window as a layer and place the camera over it, with a green screen or background removal if he uses one.

## How the owner uses it

1. Open it from the **♪ Stage** link in the city's controls, or directly at `/stage.html`.
2. Set the beat: **Tap the beat** three or more times in time with the music (or press the space bar), or **Listen** and share the tab or screen playing the music with its audio ticked.
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
