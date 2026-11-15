# Zeus World teaser

A 30-second vertical (1080x1920) teaser, rendered in real time with Three.js.

- `npm install`, then `npm run dev` to watch it in a browser. Space pauses, arrow keys scrub.
- `npm run capture` records `out/zeus-world-teaser.mp4`. Add `-- --audio track.mp3` to include music.
- `src/timeline.js` holds the cut times, captions and placeholder names. Retime the cuts there to match the music.
- `src/world.js` builds the world; `src/main.js` animates it. Every frame is a pure function of time.
