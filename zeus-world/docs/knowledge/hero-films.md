# Hero films: how one is made and played

The rules and the scripts are in `docs/hero-films/`. This file is the how: the page, the files, the timings, and what it took to make the first film (The Fire-Bringer, ZW-047, 25 Nov 2026).

## The page

`/hero.html` on the preview. A 16:9 picture with a bar below: a box for the name, Play, Stop, Captions.

- `hero.html?name=Andie%20Howard` fills the name in. `&autoplay` starts it (a browser may refuse sound until the page has been clicked once). `&ui=0` hides the bar, for a browser source. `&captions` shows the narrator's words.
- Keys: Space plays and stops, H hides the bar.
- From another page or a tool: `window.playHeroFilm('A Name')`.
- Code: `assets/review/hero.html`, `hero.js` (the player), `herofilms.js` (the library: one entry per film with its files and every timing).

## How the name gets in

The film itself is generic. The name is added by the page when it plays:

- **Forged in gold** over the fire at the heroic moment, **cut in stone** over the dawn, and on the **end card** under a laurel. Any name works, shortened to 24 letters; long names are drawn smaller.
- **Spoken.** The narration is in two parts. `hero/fire-bringer.mp3` holds every line except the one with the name. That line is a separate recording played at its second (34.6): `hero/names/<name>.mp3` when one exists for this name (`andie-howard.mp3` does: "Andie Howard brought the fire home."), otherwise `hero/fire-bringer-line5.mp3`, which says only "Brought the fire home." while the gold letters give the name.
- So to have the narrator say a new person's name, record that one line (about 35 characters) in the same voice and save it as `review/public/hero/names/<name in lower case with dashes>.mp3`. Nothing else changes.
- Not built: saying a name that was not recorded beforehand. That needs a voice call at the moment of playing, with the owner's own key; the page cannot hold one.

## The files, and how they are put together

`bash assets/hero-build/fire-bringer.sh <folder>` builds everything in `review/public/hero/` from the six shots (`s2.mp4` … `s7.mp4`), the narration lines (`n1.mp3` … `n7.mp3`, `n5_generic.mp3`) and, when there is one, `score.mp3`. The sources are large and are not in the repository; the shots can be downloaded again from fal with the request numbers below.

| Time | What | Source |
| --- | --- | --- |
| 0:00 to 0:06 | Black. The ember crossing the dark is drawn by the page | none |
| 0:06 | The city in the storm, the great fire dying | shot 2 |
| 0:14 | The hooded figure at the foot of the stair | shot 3 |
| 0:22 | The climb | shot 4, its last 7 seconds |
| 0:28.6 | The summit; the fire erupts at 0:33.4 and the name is forged | shot 5 |
| 0:39 | Fire runs down the mountain; faces in the street | shot 6 |
| 0:49.6 | Dawn, the city gathered | shot 7 |
| 0:58.6 to 1:03 | Last frame held under the end card | |

- Half-second dissolves between shots. 1280 × 720, VP9, 21 MB.
- **The eruption decides the cut.** In shot 5 the fire erupts 4.8 seconds in (found by measuring the brightness of each frame). The shot is placed so that this lands at 33.4, and the name's forging starts at 33.3. If shot 5 is ever remade, measure again and move it.
- Narration lines start at 0.8, 6.6, 15.0, 22.6, (34.6, the name line), 43.2 and 52.6 seconds.
- The picture is the clock. The sound is nudged back if it drifts more than a quarter of a second from it.

## What was generated

- **Video:** six shots, 60 seconds, Wan 3.0 Prime text-to-video on fal (`alibaba/wan-3.0-prime/text-to-video`), 1080p, sound off. Listed price $0.05 a second: about **$3.00**. Request numbers: shot 2 `01a2132c-6cdb-78a2-95c5-fb67a8d849c8`, 3 `01a2132c-7340-75b0-ab3f-3bba172778b0`, 4 `01a2132c-798f-7a11-818b-d0b72ad09468`, 5 `01a2132c-7fea-7f61-a355-3889f0b11b61`, 6 `01a2132c-8710-7bf2-898b-9cf7cfcb06e9`, 7 `01a2132c-8de2-7af2-9385-0c147f2a404d`. The prompts are in `docs/hero-films/01-fire-bringer.md`.
- **The hero stayed the same person without a reference picture.** Each prompt repeats the same words: "a lone figure in a long deep-crimson hooded cloak with a thin gold hem, hood up, the face never visible", seen from behind. All four shots with the figure came back matching on the first try. This is cheaper than making a picture first and animating from it.
- **Narration:** ElevenLabs, the owner's own voice named "movie", model `eleven_multilingual_v2`. Eight recordings, 479 characters.
- **Score:** one Suno request, which made two versions of "The Fire-Bringer (hero film score)", about 60 and 62 seconds. **Not yet in the film:** fetching the file uses one of the owner's download credits and waits for his word. When it is fetched, save it as `score.mp3` beside the shots and run the build script again; it is mixed under the narration at half volume.
- A first shot of the ember was not generated; the page draws it.

## Checks

- `node renders/herotest.mjs "Andie Howard" 40` presses Play with a real pointer and reports picture time, sound time and which name recording was used. On 25 Nov 2026: picture and sound within 0.1 s for 40 seconds, the named recording used.
- Stills: `PAGE=hero.html node shot.mjs renders/x.png "name=Andie%20Howard&t=36" 960 600`.
- Not checkable here: how it sounds, and how the motion looks.
