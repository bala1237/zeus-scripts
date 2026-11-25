# Hero films: how one is made and played

The rules and the scripts are in `docs/hero-films/`. This file is the how: the page, the files, the timings, and what it took to make the first film (The Fire-Bringer, ZW-047, 25 Nov 2026).

## The page

`/hero.html` on the preview. A 16:9 picture with a bar below: a box for the name, Play, Stop, Captions.

- `hero.html?name=Andie%20Howard` fills the name in. `&autoplay` starts it (a browser may refuse sound until the page has been clicked once). `&ui=0` hides the bar, for a browser source. `&captions` shows the narrator's words.
- Keys: Space plays and stops, H hides the bar.
- From another page or a tool: `window.playHeroFilm('A Name')`.
- Code: `assets/review/hero.html`, `hero.js` (the player), `herofilms.js` (the library: one entry per film with its files and every timing).

## Playing it in OBS from a remote (ZW-048)

The film runs in OBS as a browser source with the address `hero.html?ui=0` (1920 × 1080, "Control audio via OBS" ticked). The same page opened in Chrome, with its controls, is the remote: type the name, press **Play in OBS**. It does not play in Chrome when sent this way.

- **How it reaches OBS.** OBS has a remote control built in (Tools, WebSocket Server Settings: switch it on; "Show Connect Info" gives the password). The page connects to it on the same computer (`ws://127.0.0.1:4455`; `&obsport=` for another port), finds the browser source whose address contains `hero.html`, and asks OBS to hand every browser source an event named `zeusHero` carrying `{ cmd: 'play', name }` or `{ cmd: 'stop' }`. If OBS cannot pass the event on, the remote instead points the source at an address with the name and `autoplay` in it, which makes it load again and play (slower by a second or two). Code: `obsremote.js` (the connection), the remote section of `hero.js`.
- **The password** is kept in that browser on that computer so the page reconnects by itself next time. It is the password of OBS's own remote control, nothing else.
- **Use Chrome** for the remote: it lets a web page reach a program on the same computer; Safari does not.
- Two tabs of one browser also work without OBS (the tab with `ui=0` obeys the other), which is how it was checked here.
- **Checked** with `node renders/obstest.mjs`, a stand-in for OBS's remote control with a password: wrong password refused, right one connected and the source found, Play sent the event with the name, the other tab played, Stop stopped, and the load-again route set the right address. **Not checked: OBS itself.** In particular, that OBS hands the event to browser sources is from OBS's documentation and has not been seen working by us.
- The film only shows if its scene is on screen; the remote does not switch scenes.

## How the name gets in

The film itself is generic. The name is added by the page when it plays:

- **Forged in gold** over the fire at the heroic moment, **cut in stone** over the dawn, and on the **end card** under a laurel. Any name works, shortened to 24 letters; long names are drawn smaller.
- **Spoken.** The narration is in two parts. `hero/fire-bringer.mp3` holds every line except the one with the name. That line is a separate recording played at its second (34.9): `hero/names/<name>.mp3` when one exists for this name (`andie-howard.mp3` does: "Andie Howard brought the fire home."), otherwise `hero/fire-bringer-line5.mp3`, which says only "Brought the fire home." while the gold letters give the name.
- So to have the narrator say a new person's name, record that one line (about 35 characters) in the same voice and save it as `review/public/hero/names/<name in lower case with dashes>.mp3`. Nothing else changes.
- Not built: saying a name that was not recorded beforehand. That needs a voice call at the moment of playing, with the owner's own key; the page cannot hold one.

## The files, and how they are put together

`bash assets/hero-build/fire-bringer.sh <folder>` builds everything in `review/public/hero/` from the six shots (`s2.mp4` … `s7.mp4`), the narration lines (`n1.mp3` … `n7.mp3`, `n5_generic.mp3`) and, when there is one, `score.mp3`. The sources are large and are not in the repository; the shots can be downloaded again from fal with the request numbers below.

| Time | What | Source |
| --- | --- | --- |
| 0:00 | The hook: faces looking up, cause not shown | the last 4.9 s of shot 6 |
| 0:04.4 to 0:09 | Black. The ember crossing the dark is drawn by the page | none |
| 0:08.6 | The city in the storm, the great fire dying | shot 2 |
| 0:14.6 | The hooded figure at the foot of the stair | shot 3 |
| 0:20.6 | The climb; the flame nearly lost | shot 4, from 2.5 s |
| 0:28.6 | The summit; the fire erupts at 0:33.4 and the name is forged | shot 5 |
| 0:39.1 | Fire runs down the mountain; the faces again | shot 6 |
| 0:49.6 | Dawn, the city gathered | shot 7 |
| 0:58.6 to 1:03 | Last frame held under the end card | |

- Half-second dissolves between shots. 1280 × 720, VP9, 21 MB.
- **The eruption decides the cut.** In shot 5 the fire erupts 4.8 seconds in (found by measuring the brightness of each frame). The shot is placed so that this lands at 33.4, and the name's forging starts at 33.3. If shot 5 is ever remade, measure again and move it.
- Narration lines start at 0.8, 5.4, 9.2, 15.4, 21.4, 27.4, (34.9, the name line), 42.6, 47.4 and 52.6 seconds.
- **The score decides the climax.** Its loudness was measured second by second: it dips from 26 to 32 s and lifts at 33 s. The eruption and the name are placed on that lift, so the opening was rebuilt to fit before it and nothing after 28.6 s moved.
- **The mix.** The voice is raised (×1.9; the recordings come out near -20 dB). The score steps down whenever the narrator speaks and comes back in between. The name line is a separate file, so the build feeds it in only as a signal to make the score step down at 34.9 s. A limiter keeps the peaks under full scale.
- The picture is the clock. The sound is nudged back if it drifts more than a quarter of a second from it.

## What was generated

- **Video:** six shots, 60 seconds, Wan 3.0 Prime text-to-video on fal (`alibaba/wan-3.0-prime/text-to-video`), 1080p, sound off. Listed price $0.05 a second: about **$3.00**. Request numbers: shot 2 `01a2132c-6cdb-78a2-95c5-fb67a8d849c8`, 3 `01a2132c-7340-75b0-ab3f-3bba172778b0`, 4 `01a2132c-798f-7a11-818b-d0b72ad09468`, 5 `01a2132c-7fea-7f61-a355-3889f0b11b61`, 6 `01a2132c-8710-7bf2-898b-9cf7cfcb06e9`, 7 `01a2132c-8de2-7af2-9385-0c147f2a404d`. The prompts are in `docs/hero-films/01-fire-bringer.md`.
- **The hero stayed the same person without a reference picture.** Each prompt repeats the same words: "a lone figure in a long deep-crimson hooded cloak with a thin gold hem, hood up, the face never visible", seen from behind. All four shots with the figure came back matching on the first try. This is cheaper than making a picture first and animating from it.
- **Narration:** ElevenLabs, model `eleven_multilingual_v2`. First cut: the owner's voice named "movie" (479 characters); he judged it "very poor". Second cut: his voice named **"Zeus-authorative"** (`46S3c7ncP9PE3UfhhkFZ`), stability 0.6, style 0.25, eleven recordings, 479 characters. Use this voice for name lines from now on.
- **Score:** one Suno request, which made two versions of "The Fire-Bringer (hero film score)". The 62-second one (`99f8ba3e-de94-4640-ab3e-37b598b76ac4`) is in the film; fetching it used one of the owner's download credits, with his word ("we can use suno"). The other (`fc914af0-01a9-42f8-86d1-7dbec32c912c`) is unused.
- A first shot of the ember was not generated; the page draws it.

## The name as a film title

The owner on the first cut: "name is good. but we need good animation and font selection and the reveal." What it is now (`forged()` in `hero.js`, styles under `.name` in `hero.html`):

- **Each letter is its own piece.** The letter itself is dark with a stack of small shadows beneath it, which gives the gold a deep edge; its gold face is a second copy laid on top (`::after`) with a hard line across the middle, as polished metal has. It has to be this way round: a copy placed behind a letter that is being moved is drawn in front of that letter's own background, so the face cannot be the background.
- **The reveal.** A streak of white light crosses the picture; the letters come from the middle outward, each arriving large, blurred and white-hot and settling into gold while the spacing closes; the honour ("Fire-Bringer of Olympus") arrives beneath between two lines that draw outward; a streak of light then crosses the gold, twice; embers rise through it; and the whole title keeps drifting slowly wider and closer until it leaves. The picture behind is dimmed a fifth while it is up.
- **It leaves before the cut** to the next shot (gone by 39.1 s), or it hangs over the wrong picture.
- Everything is worked out from the film's second, not from a running animation, so a still at any second is exact and the title cannot drift from the picture.
- **Lettering.** Cinzel, weight 800. Three others can be tried without changing code: add `&font=Cinzel Decorative&weight=700`, `&font=Cormorant SC&weight=700` or `&font=Cinzel&weight=900` to the address. A sheet of all four was sent to the owner on 25 Nov 2026.
- The words on screen (optional) are in Cormorant Garamond italic.

## Checks

- `node renders/herotest.mjs "Andie Howard" 40` presses Play with a real pointer and reports picture time, sound time and which name recording was used. On 25 Nov 2026: picture and sound within 0.1 s, the named recording used, on both cuts.
- Stills: `PAGE=hero.html node shot.mjs renders/x.png "name=Andie%20Howard&t=36" 960 600`.
- Not checkable here: how it sounds, and how the motion looks.
