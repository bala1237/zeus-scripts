# The siege at the south gate

Backlog: ZW-018. A TikTok battle shown as a fight outside the city wall, driven by the two sides' share of the score. First version built 22 Nov 2026. It runs on a made-up score; real battle events are not connected yet (ZW-009).

Source: `assets/review/battle.js`, wired up in `assets/review/city.js` (search for `createBattle`).

## What is on screen

- **Two armies** in front of the south gate, 72 hoplites each in three ranks. Ours carry blue shields and cream tunics; the rival's carry crimson shields and dark tunics. Each has four standards.
- **The line between them moves with the score.** At an even score it sits midway. When we lead it is pushed towards the rival's camp; when we trail it is pushed back to our gate. The losing side's ranks grow ragged.
- **The rival's camp** to the south: tents and three catapults.
- **Guards on the wall** either side of the gate.
- **Arrows** in volleys both ways, and from the wall when the fight is close to the gate. **Catapult stones** from the rival's engines, which strike the wall when we are well behind, and from our towers, which reach the camp when we are well ahead. **Dust** along the line.
- **A bar on the page**: "Zeus World" against the rival's name, the share of strength, the time left, and a line of commentary. No numbers are shown, because the constitution forbids showing coins or gift values.
- **The ending.** A win: the rival's army falls back to its camp and vanishes, lightning strikes the field three times and the citizens near the gate cheer. A loss: our army falls back through the gate; the bar says the gate is battered and the builders will be needed. Thirteen seconds later the field clears.
- Nothing in the city is damaged. What a loss leaves behind is ZW-015.

## How to see it

| Way | What happens |
| --- | --- |
| The **Battle** button in the controls | Starts one demo battle and flies the camera to the field. Wins and losses alternate |
| `?battle` | Demo battles on a loop: the first after 10 seconds, then every 30 seconds after one ends |
| `?view=battle` | The camera position for the field |
| `?shot&battle=0.3&view=battle` | A still with our share of the score at 0.3 |

The camera returns to where it was, and the tour resumes, when the field clears. Touching the view stops the camera move.

## How it is driven

`createBattle()` returns:

- `start({ rival, seconds, share })`: armies march out over seven seconds and the clock starts.
- `setScore(ours, theirs)` or `setShare(0 to 1)`: call whenever the score changes. The line follows smoothly.
- `end()`: decides win or loss from the share and plays the ending. Called automatically when the clock runs out.
- `stop()`: clears the field at once.
- `onResult(result)`: a callback given to `createBattle`, where the city reacts. ZW-015 and ZW-016 hook in here.

The demo in `city.js` is a few lines that call `setShare` from a wave that swings both ways and ends on the chosen side. Connecting real battles means replacing that with calls from the event feed; nothing in `battle.js` changes.

## How it is built

- Everything is made in code; there are no models and no cost. A soldier is seven simple shapes (tunic, head, crest, shield, shield boss, spear, shadow), and each army draws each shape once for all its soldiers, so the whole battle adds about 30 draw calls.
- Soldiers bob, sway and, in the front rank, thrust. They have no legs or arms: at the distance of the battle camera they read as hoplites, but they are not close-up characters.
- The battle's objects are marked `dynamic`, so the instancing pass leaves them alone, and they cast no shadows because the sun's shadows are drawn once.
- The road from the gate to the field is part of the battle and appears with it.

## Known limits and next steps

- **Not seen in motion.** Checked as stills at three scores and by stepping a whole demo battle through in a headless browser (phases and timing correct, no errors). The owner judges the movement on the preview.
- The soldiers are stylised pegs. Marching, fighting figures need models and animations from the rigging service, which costs money.
- The tents and catapults are plain. Scripted Blender models would match the rest of the city better.
- No sound.
- The rival is a name and a colour. A rival city across the water is a later idea in `../BRAINSTORM-GAME.md`.
- Whether the capture path provides both scores and the time left during a TikTok battle is still unconfirmed.
