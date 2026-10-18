# Artwork assessment: what can be animated from the Bougie sheet

Source: `reference/bougie-character-sheet.png`, a 1536×1024 character sheet with
a hero portrait, five expression panels, three head-angle panels, an upper-body
view and a five-frame "speech animation sequence".

## What the sheet is (and isn't)

It is a **flattened, painterly, semi-realistic illustration**, almost certainly
AI-generated. Every panel is a separate flat painting. There are no layers,
no separated parts, and no transparency.

I measured whether the speech-sequence frames ("Idle", "Speaking (mouth open)",
"Listening (blink)") are the same painting with only the mouth or eyes changed,
which would let us swap in the real painted mouth and lids. **They are not.** After
best alignment, the frames differ by about 10–14 grey levels on average across
the whole frame, including hair and eyes, not just the mouth. The same is true of
the expression and profile panels: each one is a fresh painting of a slightly
different face. Cutting between them would make Bougie's identity flicker.

So the sheet is a **style and acting reference**, not a set of animation assets.

## What we can animate from a single panel

The app animates one painting with a dense mesh warp (see `src/render/FlatImageRig.ts`).
Everything below moves the painting's own pixels:

| Motion | Result on the hero portrait | Notes |
|---|---|---|
| Blink, slow blink, half-lidded looks | **Good** | The painted upper-lid skin is slid down over the eye, and the eye and lashes fold into the lid line. Holds up at speaking speed. |
| Brow raise / lower / angle, skeptical one-brow | **Good** | Forehead stretches naturally. Tilt-aware, so the brows move along her tilted face. |
| Smile, smirk, frown tweaks | **Good** | Corners and cheeks move. Her base expression is already a smile, so "neutral" is her smile and we add to or subtract from it. |
| Lip sync (open/close, wide, round) | **Good for small openings** | The lips part along her real seam, and the painted teeth stay in place. The dark interior is the only painted-in element (blurred to match the art). Wide-open vowels are limited because her chin rests on her hand (`jawScale: 0.8`). |
| Head tilt, nod, small turn, breathing | **OK up to ~10°** | 2.5D parallax warp. Larger turns would need the far cheek, ear and hair, which aren't painted. |
| Gaze / eye roll | **Weak** | The iris can only be dragged slightly before the sclera smears. The eye roll beat at 2.8s is subtle for this reason. |
| Hand, rings, bracelet | **Pinned** | The hand on her chin is pinned so it doesn't bend with the face. Skin between the chin and hand stretches a little on big moves. |
| Earrings, hair strands | **Move with the face** | There's no secondary physics, because they aren't separate pieces. |

The frontal panel (`public/bougie-front.png`) shows the same techniques without
the hand or tilt. Speech reads more clearly there, but at 194×298 px it is soft
when scaled up.

## What cannot be done from flat art, at any quality

- Eye whites and irises that rotate freely (the eyeball isn't a separate layer).
- A wide-open mouth with real painted teeth, tongue and throat.
- A real head turn showing the far side of the face or the back of the hair.
- Hair, earring and necklace physics.
- Hands or props moving independently of the face.

These aren't limits of the code. The pixels simply don't exist in a flat painting.

## What the art needs to reach "cinematic"

Commission (or paint over) **one master pose** as a layered PSD, roughly 2–3k px
tall, with these parts on separate layers and painted *underneath* where they
overlap:

- Face base with no eyes, brows or mouth, and skin painted under the lids
- Per eye: sclera, iris + pupil, highlight, upper lid + lashes, lower lid
- Per brow
- Mouth: upper lip, lower lip, upper teeth, lower teeth, tongue, mouth interior
  (plus a few hand-painted mouth shapes for A / O / E / M if desired)
- Nose, cheeks/blush
- Front hair, side locks (left/right), back hair (painted fully behind the head)
- Ears, earrings (each), necklace pieces
- Neck, body, arms, hands, clothing

`src/render/BougieRig.ts` (the "layered vector rig" in the app) is a working
example of exactly this part structure, driven by the same parameters. With a
layered PSD, those drawn shapes become textured meshes cut from the real art,
or the PSD goes straight into Live2D Cubism Editor (see TECH_EVALUATION.md).
