# The siege at the south gate

Backlog: ZW-018. A TikTok battle shown as a fight outside the city wall, driven by the two sides' share of the score. First version built 22 Nov 2026. It runs on a made-up score; real battle events are not connected yet (ZW-009).

Source: `assets/review/battle.js`, wired up in `assets/review/city.js` (search for `createBattle`).

## Rebuilt 24 Nov 2026 (ZW-026, ZW-027, ZW-028)

The first version drew soldiers as simple shapes, arrows as thin boxes, and filmed it at a documentary pace. The owner's verdict after seeing it closer: the soldiers were "just like a shape and no hands", the arrows "like lines", the lightning "very basic", and the camera needed to be "a cinematic action sequence with fast cuts". All four were rebuilt. Where the sections below describe the first version, this section is the current state.

**Soldiers (`soldier.js`).**

- A soldier is now a real human figure: the man citizen with his arms properly bound (`models/char_soldier.glb`, made by `reskin.mjs`; the original has its upper arms bound to the hips, which tears when an arm is raised). 48 a side in three ranks of 16, plus 10 guards on the wall.
- Gear: a helmet with a brow band and a crest, a round shield with a rim and a boss on the left forearm, a spear through the right hand. Ours have bronze helmets and blue shields rimmed in gold; theirs have iron helmets, crimson shields rimmed in black and darker tunics.
- Movement: `March` is the model's own walk. `Guard` (a braced stance, shield forward, spear levelled) and `Thrust` (the spear driven forward and back every 1.7 seconds) are made in code, the same way as the standing pose. The front rank thrusts, the ranks behind hold guard.
- **How the gear is fitted.** The figure is put into the guard stance first; each piece is placed where it should be in the world; then it is handed to the bone that carries it, by working out its position relative to that bone. Fitting in the rest pose, with the arms held out, put every piece in the wrong place once the arm moved.
- Each piece of gear is one mesh coloured per vertex, so a soldier costs five draw calls (body, three pieces, shadow) and not ten.
- Like citizens, a soldier is only posed when the camera can see him, and beyond 24 m he swaps to a light body of 3,800 triangles.
- The team tint multiplies the whole body, skin included, and the scene is brightly lit, so the rival's tunics can only be made somewhat darker. Shield and helmet colour are what tell the sides apart.
- Frame sheet of a soldier: `PAGE=poses.html node shot.mjs renders/x.png "m=models/char_soldier.glb&kit=us&clip=Thrust&n=6" 1200 760` (`kit=us` or `them`; clips `March`, `Guard`, `Thrust`).

**Arrows.** Each has a wooden shaft, a bronze head and feathers, flies on an arc pointing along its path, and stays standing where it lands for four to eight seconds, so the field fills with spent arrows. Volleys are 14 arrows.

**Catapult stones** tumble, burn, leave a trail of fire and smoke, and land with a burst, dust and a jolt of the camera that is stronger the closer it is.

**Lightning (`life.js`, `strike`)** has a white-hot core inside a wider blue-white glow, four forks on the way down, a burst of light and sparks where it lands, and a softer, bluer flash across the screen. It also frees its old shapes on each strike, which the first version did not.

**The action camera.** Cuts every 1.5 to 3 seconds:

| Shot | What it shows |
| --- | --- |
| `duel`, `enemy` | From knee height between the lines, up at one soldier of ours or theirs as he thrusts |
| `shields` | A fast run along the gap between the two front ranks |
| `faces` | A long lens down our line of helmets |
| `shoulder`, `theirs` | Over one soldier's shoulder at the enemy facing him |
| `arrow` | Riding behind an arrow in flight |
| `stone` | Riding behind a catapult stone until it lands |
| `engine` | Past a catapult's frame at the battle and the wall |
| `wall` | Down from the wall |
| `wide` | A three-second high view, so the viewer keeps their bearings |
| `gate`, `rout` | The closing shot of a loss or a win |

- The camera is hand-held throughout and jolts when a stone lands.
- A ride needs something in the air; if there is nothing, another shot is used.
- For a still of one shot: `?shot&view=battle&battle=0.5&cine=duel`.

**Cost.** In the wide battle view about 1,400 draw calls and 2.0 million triangles a frame; in a close shot about 190 draw calls and 0.9 million triangles.

**Labels are put away during a battle (ZW-029).** The Bolts labels over the building sites are page elements drawn over the picture, and the name plates grow to stay readable from afar, so both floated across the close shots. `city.js` hides them (`life.showLabels`, `names.show`) for as long as a battle or its aftermath is running. Anything new that draws labels over the city should be added to that one place.

## What is on screen

- **Two armies** in front of the south gate, 72 hoplites each in three ranks. Ours carry blue shields and cream tunics; the rival's carry crimson shields and dark tunics. Each has four standards.
- **The line between them moves with the score.** At an even score it sits midway. When we lead it is pushed towards the rival's camp; when we trail it is pushed back to our gate. The losing side's ranks grow ragged.
- **The rival's camp** to the south: tents and three catapults.
- **Guards on the wall** either side of the gate.
- **Arrows** in volleys both ways, and from the wall when the fight is close to the gate. **Catapult stones** from the rival's engines, which strike the wall when we are well behind, and from our towers, which reach the camp when we are well ahead. **Dust** along the line.
- **A bar on the page**: "Zeus World" against the rival's name, the share of strength, the time left, and a line of commentary. No numbers are shown, because the constitution forbids showing coins or gift values.
- **The ending.** A win: the rival's army falls back to its camp and vanishes, lightning strikes the field three times and the citizens near the gate cheer. A loss: our army falls back through the gate; the bar says the gate is battered and the builders will be needed. Thirteen seconds later the field clears.
- Nothing in the city is damaged. What a loss leaves behind is ZW-015. What follows a win is described under "After a win" below.

## How to see it

| Way | What happens |
| --- | --- |
| The **Battle** button in the controls | Starts one demo battle and flies the camera to the field. Wins and losses alternate |
| `?battle` | Demo battles on a loop: the first after 10 seconds, then every 30 seconds after one ends |
| `?view=battle` | The camera position for the field |
| `?shot&battle=0.3&view=battle` | A still with our share of the score at 0.3 |

The camera returns to where it was, and the tour resumes, when the field clears. Touching the view stops the camera move and the cinematic camera.

## The cinematic camera (ZW-019)

Five seconds into a battle, once the camera has flown to the field, a film-style camera takes over: a close shot held for six to eight seconds with a slow move, then a cut to the next.

| Shot | What it shows |
| --- | --- |
| `line` | Down the corridor between the two front ranks |
| `clash` | Across the front ranks from the flank |
| `ours` | Over our ranks towards the rival and their camp |
| `theirs` | From behind the rival towards our gate and the city |
| `engine` | Past a catapult to the fight and the wall |
| `wall` | Down from our wall onto the field |
| `high` | A slow arc high over the field |
| `gate` | The gate under pressure. Replaces `engine` when we are far behind, and is the closing shot of a loss |
| `rout` | Behind our line as the rival falls back. The closing shot of a win |

- Every shot is placed from where the fighting line is at that moment, so it stays on the action as the line moves.
- The order is fixed (`ORDER` in `battle.js`), with the side of the field chosen at random each time, and two swaps that follow the story: the gate when we are losing badly, our ranks instead of the wall when we are well ahead.
- Touching the view hands the camera back to the viewer for the rest of the battle. `?cine=0` turns the cinematic camera off, leaving the single wide view.
- For a still of one shot: `?shot&view=battle&battle=0.5&cine=line`.
- For the closer shots the soldiers gained legs, a bronze helmet and a smaller crest. They still have no arms; the closest shots keep a few metres away for that reason.
- To add a shot, add a function to `SHOTS` (it receives progress through the shot from 0 to 1, the line's position, and which side), then put its name in `ORDER`.

## After a win (`aftermath.js`, ZW-025)

When a battle is won and the field has cleared, three things follow, about a minute in all. The names are made up for now: the owners of three of the homes stand in as the battle's top three.

| Part | Length | What happens |
| --- | --- | --- |
| The storm of gold | 14.5 s | The picture darkens, storm clouds gather over the temple and Zeus's eyes open in them, lightning strikes the temple roof six times, then the roof blazes gold and a rain of gold falls on the whole city while every citizen cheers. Filmed from low on the sacred way, then from high over the city |
| The triumph | 27 s | The top three enter by the south gate wearing laurel crowns, their names above them, and walk up the main street to the edge of the plaza while citizens near them turn and cheer. Four shots: inside the gate, from above, crossing the bridge seen from over the river, and arriving |
| The house tour | 18.5 s | The first of the three's home: from above the neighbouring roofs, in an arc round it, then down to the door, under the title "Home of ..., Champion of the battle". A wreath is hung over the door and stays until the next tour |

- Titles appear lower left for each part.
- Afterwards the camera goes back to what it was doing, normally the city tour.
- Touching the view ends it at once. `?after=0` skips it.
- **They walk; there is no chariot**, because the catalogue has no horses. A chariot needs a horse model, which is paid generation.
- **The tour stays outside.** Interiors are not built or decided (ZW-022).
- **The storm plays after every win in the demo.** Making it rare and earned (Zeus's favour, in the brainstorm) is not built.

How it is built:

- The darkening and the gold wash are two page layers blended over the picture, not changes to the scene's lights, so the storm can never leave the city's lighting in the wrong state.
- Clouds, eyes, the roof's blaze and the rain are sprites and points made in code. The lightning is the one the building sites use.
- The heroes are ordinary citizens created for the procession (`life.addWalkers` with a start point, speed and lane) and removed when it ends (`life.remove`).
- The house tour works out its three shots from the home's size and the way its door faces. The first two stay above roof height, because neighbours can stand only a few metres in front of a home.
- To use real results: call `after.play({ heroes })` with the top three, each `{ name, home: { box, front } }`. Homes are measured in `city.js` when the name plates are made, before the city's pieces are instanced; afterwards a building's parts can no longer be measured.

Things learned:

- **The main street's bridge cannot be filmed from its deck or its banks**: high parapets, and apartment blocks on both banks. The crossing is filmed from over the river to the east.
- **Two cameras must never run at once.** Creating the heroes takes a moment, and in that gap the city tour restarted and fought the after-battle camera. The battle demo now waits explicitly, and the tour checks that nothing else is filming.
- **Stills of a sequence must run the whole scene forward**, not only the sequence, or people are not where they would be. `?shot&after=triumph,16` runs everything for 16 seconds. A still also has to point the camera at its target itself and then work out again who is in view, because citizens outside the camera's view are hidden.

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

- **Seen in motion only by the owner**, who approved the battle on 22 Nov 2026. On the build machine it is checked as stills (three scores, each camera shot) and by stepping a whole demo battle through in a headless browser, which confirms the phases, the timing and the sequence of shots.
- The soldiers are real figures as of 24 Nov 2026, but all one man, and they do not fall, clash or react to being hit. More bodies and real fighting animations need the rigging service, which costs money.
- The tents and catapults are plain. Scripted Blender models would match the rest of the city better.
- No sound.
- The rival is a name and a colour. A rival city across the water is a later idea in `../BRAINSTORM-GAME.md`.
- Whether the capture path provides both scores and the time left during a TikTok battle is still unconfirmed.
