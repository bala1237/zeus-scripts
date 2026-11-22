# Characters

The citizens: where they come from, how their rigs work, and how to check and repair them.

## The three citizens

| Model | File | Skeleton | State |
| --- | --- | --- | --- |
| Man | `assets/models/char_citizen_man.glb`, normalised to 20,000 triangles from `style-test/public/models/citizen.glb` (59,000) on 22 Nov 2026 | 22 bones | Works. Coarse binding: torso rigid on the hips, head on the head bone |
| Woman | `assets/models/char_citizen_woman.glb` | 22 bones, same as the man | Binding rebuilt 22 Nov 2026 (ZW-012) |
| Elder | `assets/models/char_citizen_elder.glb` | 24 bones, different order | Works. Cloak follows the arms |

All three were generated, then rigged and animated by Meshy through fal. Each carries four clips with the same names and lengths: `Walk` (1.07 s), `Idle` (4.03 s), `Cheer` (9.03 s), `Clap` (13.70 s). The supplied `Idle` clip is a wide stride that turns round, not a standing pose, so the city replaces it with one made in code (see "Standing still").

In the city each citizen is a copy of one of these, tinted one of eight colours and scaled to between 1.66 and 1.82 m (`review/life.js`, `spawn`).

Each citizen also has a far-view body of about 3,900 triangles in `models/far/`, shown beyond 45 m. It is bound to the same skeleton by bone name, using the far file's own bind data, because the two files are quantised differently (`review/life.js`, `spawn`).

## Things to know about these rigs

- **A wrong binding is invisible at rest.** Each vertex follows one to four bones. In the rest pose every bone is where the mesh expects it, so the model looks perfect whichever bones the vertices follow. Only an animation shows the fault. Never accept a rigged model from a still of its rest pose; make a frame sheet.
- **The skeleton sits towards the front of the body**, and the spine doubles back on itself (hips, up to the neck, back down, up again). Rules such as "bind to the nearest bone" give wrong results: hair and the back of a dress end up on the arms.
- **Surface normals on generated meshes are unreliable** (clothing is a shell with faces both ways), so they cannot be used to tell inside from outside.
- **The legs do not exist inside a skirt.** There is a cap across the inside a little above the hem, and the legs start below it.
- The automatic rig is coarse even when it works: on the man, both thighs follow one leg bone and the whole torso follows the hips.

## Checking an animation: the frame sheet

Motion cannot be watched on the build machine, so `review/poses.html` draws one character at evenly spaced moments of a clip, from the side (top row) and the front (bottom row).

From `zeus-world/assets/`, with the review server running:

- `PAGE=poses.html node shot.mjs renders/walk.png "m=models/char_citizen_woman.glb&clip=Walk&n=8" 1600 760`
- `clip`: `Walk`, `Idle` (the supplied one), `Cheer`, `Clap`, `Stand` (the pose made in code), or `none` for the rest pose. `n`: how many moments.
- `cut=0` slices the character open through the middle, to see how the mesh is built inside.
- Each render takes about ten seconds.

What a broken binding looks like: the body leaning or twisting with a limb, parts stretching into sheets or strings, pieces left behind in mid-air.

## Repairing a binding: `reskin.mjs`

`node reskin.mjs models/<character>.glb [out.glb] [--hem 0.16]`

Rewrites which bones each vertex follows, from the shape of the body. The skeleton and animations are untouched. It expects the 22-bone skeleton the man and woman share.

The rules, by region:

| Region | How it is recognised | Follows |
| --- | --- | --- |
| Arms and hands | Within the arm's own thickness of an arm bone. The upper arm starts 30% of the way down from the shoulder and only takes what is on its outer side, so the ribs stay with the body | That arm bone |
| Head and the hair on it | Above the midpoint of the two head bones | Head |
| Torso, and clothing down to the hem | Everything else above the hem | Hips, with clothing below the hips following the thigh on its side more and more towards the hem (up to 60%), so a skirt is pushed by the stride |
| Bare legs and feet | Below the hem | Nearest of shin, foot, toe |

- **The hem** is found as the lowest point where the body is closed between the legs. `--hem` overrides it, as a fraction of the height from the feet.
- **Faces are removed** where a bare leg joins the clothing above it (the underside of the skirt) and where a hand or forearm joins the body beside it. Left in, they stretch into a sheet between the feet or strings from the hands. They are inside the hem or between touching parts and are not seen from the camera's angles. For the woman: 166 and 16 faces.
- **Weights are then blended** across the surface in six passes, so joints bend smoothly; vertices split by texture seams are treated as one.

What was tried and dropped: binding each vertex to the nearest bone (hair went to the arms); using normals to exclude bones outside the surface (normals unreliable); binding the skirt to the shins (it kicked out behind and tore); a skirt fixed to the hips alone (the feet walked out from under it).

Known compromise on the woman: in a long stride her feet show slightly ahead of or behind the hem, with nothing of the leg above the ankle.

The step is part of the pipeline: `teaser.sh` runs `reskin.mjs` on the woman straight after normalising her.

## Standing still: `review/stand.js`

The supplied `Idle` clip is a turning stride, so it is not used. `standClip(model)` builds a clip called `Stand` from the model's rest pose, and `life.js` installs it under the name `Idle`, so everything that asks a citizen to idle gets it.

- Legs and body stay in the rest pose, which is a straight stand.
- The rest pose holds the arms out, so each upper arm is swung in until the hand hangs 0.2 radians from straight down. It is measured from shoulder to hand, because the elder's rest pose bends at the elbow and measuring to the elbow left his hands out.
- Small movement over a seven-second loop: the head turns 0.22 radians each way with a slight nod, the arms drift, and the bone named `neck` leans a hundredth of a radian for breathing.
- Rotations are worked out as seen from outside the character and converted to each bone's own frame, so the same code serves skeletons with different bone layouts. It needs bones named `LeftArm`, `RightArm`, `LeftHand`, `RightHand` and `Head`.
- The clip has a track for every bone, and one for the hips' position, so nothing is left where the walk put it.
- One clip is made per model and shared by all its copies.
- To see it: `clip=Stand` on the frame sheet page.

Tune it with the options of `standClip`: `seconds`, `steps`, `arm`.

## Adding a character

1. Concept image and generation as in `models.md`; rigging through Meshy on fal. Ask the owner before spending.
2. Normalise with `--rescale` (assets README).
3. Make frame sheets of every clip before accepting it. If the binding is wrong and the skeleton is the 22-bone one, run `reskin.mjs`.
4. Add it to the list `C` in `review/city.js`, and to `far.sh` and `FAR_PEOPLE` in `city.js` for a far-view body.
