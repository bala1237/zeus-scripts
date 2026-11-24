# Concert mode

Backlog: ZW-033 (from the discussion in ZW-032). When the owner plays music, the city becomes the show. First version built 24 Nov 2026.

Source: `assets/review/concert.js`, wired up in `assets/review/city.js` (search for `createConcert`), with its small control panel in `city.html`.

## What happens

- **Evening falls** over a few seconds and stays for the concert.
- **Every lamp and brazier pulses** on the beat.
- **Beams of light** sweep from the four corner towers and from beside the sacred way, changing colour every four beats.
- **Lantern strings** hang from the fountain out to the corners of the plaza and round its sides, chasing in colour.
- **Coloured light** washes the plaza and the temple.
- **Fireworks** go up every eight beats.
- **44 citizens dance**: a ring of twelve circling the fountain hand to hand, and a crowd of sixteen on each side of it who change dance every sixteen beats (a groove, clapping, hands in the air).
- **The camera cuts on the beat**, every four or eight beats, between nine shots: high over the plaza, low among the dancers on each side, round the fountain, the temple, straight down, up the main street, a long lens across the ring, and the whole city with its beams.
- The Bolts labels, the name plates and the city tour are put away for the concert and come back when it ends.

## How the owner uses it

1. Press **♪ Concert** in the controls. A small panel appears bottom right.
2. Set the beat, either way:
   - **Tap the beat**: tap the button in time with the music three or more times. A pause of more than two and a half seconds starts a fresh count. **−** and **＋** adjust by one.
   - **Listen**: the city hears the music and follows it. Chrome asks what to share: choose the tab or screen that is playing the music and tick the box to share its audio. If that is refused, the page asks for the microphone instead.
3. **End** stops it and returns to the tour.

- Touching the view keeps the concert going but stops the camera cutting.
- A battle and a concert do not run together; the Concert button does nothing during a battle.
- `?concert` starts in concert mode; `?bpm=128` sets the tempo.

**Listening needs the city to be open in a browser window**, such as Chrome, with OBS or LIVE Studio capturing that window. Inside OBS's own built-in browser source there is no way to grant the page access to sound, so there only tap tempo works.

## How it works

- **The beat is a clock** running at the tempo. Taps set the tempo and line the clock up. When listening, the clock's tempo and phase come from the music.
- **Listening** measures the loudness of the low notes about sixty times a second. A beat is the bass jumping to more than 1.3 times its recent average. The gaps between beats are folded into the range 75 to 165 a minute and the middle value of the last twelve gives the tempo. Overall loudness becomes an "energy" value that scales how strong the lights are.
- **Dances are made in code**, like the standing pose: each is four beats long, written at one beat a second and played faster or slower to match the tempo. A dance is a set of turns per bone, driven by a bounce (on each beat), a sway (every two beats) and a slower sway.
- The dancers are the woman, the soldier's body (the man with his arms properly bound, without his gear) and the elder. The plain man is not used because his arms tear when raised (see `characters.md`).
- **Time of day.** The concert sets `dn.hold = 1`, which eases the lighting to dusk and keeps it there; the day cycle is paused while anything holds it and eases back afterwards. `dn.beat` is the pulse the lamps follow. Both are general and could be used by other modes.
- **Lights.** Beams, lanterns and fireworks are unlit glowing shapes, which cost almost nothing. The four colour washes are real lights, so they are switched on only for the concert; switching them causes one short pause while the picture's shaders are rebuilt.

## What was checked, and what was not

- Stills of six of the nine shots; the lights were far too strong at first and were cut to about a sixth.
- Starting, ending, the panel, and the return to the tour, in a headless browser with no errors.
- Tap tempo and the beat detector with exact made-up timings: taps 0.5, 0.6 and 0.43 seconds apart gave 120, 100 and 140; made-up songs at 96, 128 and 150 beats a minute were detected as 95, 129 and 150.
- **Not checked:** anything in motion, and listening to real music. The build machine draws under one frame a second, so timing cannot be judged on it, and it has no sound to share. Real songs with weak or busy bass will be harder than the made-up ones; tap tempo is the fallback.

## Known limits and next steps

- The dances are simple and everyone in a group does the same one.
- Dancers appear and disappear at once; they do not walk in.
- The fountain does not react to the bass yet.
- The music itself is not played by the city; it comes from whatever the owner uses.
- Bought dance animations would look better and cost money.
