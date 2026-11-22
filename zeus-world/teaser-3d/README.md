# Zeus World teaser (3D model kit)

The 32-second vertical teaser, rebuilt with the AI-generated model kit so it matches the look of the real game.

## Run and record

1. `npm install`
2. `npm run dev` to watch it in a browser (space pauses, arrow keys scrub).
3. `scripts/music.sh` cuts `music/mythic-dawn.mp3` to length, then `npm run capture -- --audio out/teaser-audio.wav` records `out/zeus-world-teaser.mp4` (about 15 to 20 minutes on a machine without a graphics card; `--resume` continues an interrupted run).

## Where things are

- `public/models/`: every model, compressed (about 20 MB). Generated with fal.ai: concept image (Nano Banana 2.1), image to 3D (Trellis 2), and for citizens auto-rigging with walk, idle, cheer and clap (Meshy rigging).
- `concepts/`: the concept images the newer models came from.
- `src/main.js`: the city layout, shots, cameras and animation. Every frame is a pure function of time.
- `src/timeline.js`: cut times (matched to the music), captions and placeholder names.
- `scripts/merge-citizen.mjs`: merges a rigged citizen's separate animation files into one model.

The licence terms of each generator for commercial use still need checking before launch.
