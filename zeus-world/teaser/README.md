# Zeus World teaser

A 32-second vertical (1080x1920) teaser, rendered in real time with Three.js.

## Run it

1. `npm install`
2. `node scripts/fetch-assets.mjs` downloads the free skies, textures and models into `public/assets` (about 300 MB, not kept in git).
3. `npm run dev` to watch it in a browser. Space pauses, arrow keys scrub.

## Record it

1. `scripts/music.sh` cuts `music/mythic-dawn.mp3` to the teaser length.
2. `npm run capture -- --audio out/teaser-audio.wav` records `out/zeus-world-teaser.mp4`.

## Where things are

- `src/timeline.js`: cut times, captions and placeholder names. Retime the cuts here.
- `src/kit.js`: the buildings (house, café, stadium, gate, fountain, names wall).
- `src/terrain.js`: ground, mountains, sky and trees.
- `src/people.js`: the citizens, built in code.
- `src/text.js`: caption animation.
- `src/main.js`: lighting, cameras and the per-frame animation. Every frame is a pure function of time.

## Assets and licences

Skies, textures and prop models come from Poly Haven and are CC0 (free for commercial use, no attribution needed). The font is Cinzel (SIL Open Font Licence). Buildings and citizens are built in code.
