# Next steps toward real-time interaction

The prototype already runs everything live: there is no pre-rendered video. Each
frame is computed from parameters, which is why the expression buttons and pointer-gaze
work while idle. The steps below turn this into a character that responds in real time.

## 1. Art (biggest quality lever)
- Commission a **layered PSD** of one master pose (part list in ARTWORK_ASSESSMENT.md).
  A frontal or slight 3/4 pose without a hand on the face is best for talking.
- Rig it in **Live2D Cubism Editor** with the parameter IDs in `src/rig/params.ts`,
  add hair, earring and necklace physics, and add a `Live2DRenderer` behind the existing
  `CharacterRenderer` interface.

## 2. Real voice + accurate lip sync
- Record the line with a voice actor (or a chosen TTS voice rendered to a file).
- Get phoneme timing from the audio instead of authoring it:
  **Rhubarb Lip Sync** (offline, open source) or **Montreal Forced Aligner**, or the viseme
  events from cloud TTS (Azure Speech and Amazon Polly emit visemes with timestamps).
- Replace `WORDS` in `speech/dialogue.ts` with the aligned output and play an `<audio>`
  element as the clock (drive `Animator.time` from `audio.currentTime`).
- Add amplitude-driven jaw (Web Audio `AnalyserNode`) for emphasis on loud syllables.

## 3. Real-time input → performance
- **Live speech:** stream TTS audio and its viseme/word events, feeding the viseme track
  incrementally rather than from a fixed list.
- **Listening state:** when the user speaks (mic level via Web Audio), switch to a
  "listening" idle: nods, softer blinks, attentive gaze.
- **Event API:** expose `animator.setManualExpression()`, `setPointer()` and a
  `say(text, timings)` entry point, so the surrounding Zeus World app can trigger acting
  beats ("brow raise when Zeus is named").
- **Acting from text tags:** let dialogue carry tags such as `[smirk] Zeus, [browL] seriously?`
  that map to expression keyframes, replacing the hand-authored `performance.ts` per line.

## 4. Polish
- Secondary motion: hair sway and earring swing (Live2D physics, or springs on the mesh).
- Per-expression mouth shapes painted by the artist (a real "O" and "E") blended via
  parameters, instead of warping only.
- Performance budget: the flat mesh is about 20k vertices updated on the CPU. Move the warp into
  a vertex shader if several characters must run at once.
