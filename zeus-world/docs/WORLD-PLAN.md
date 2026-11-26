# The open world: the plan, in phases

The owner's brief, 26 Nov 2026: "Come up with and plan and start building I phases. The quality and close to reality is what dictates our success. Ensure you pick the right picture and then build on blender. Top notch quality. Go ahead and finish all."

How it works and what exists is in `knowledge/world.md`. This file is the order of work. Backlog: ZW-049 (the world), ZW-051 (this plan).

## The rules for every phase

1. **Quality first.** Nothing goes in that looks more elementary than the city scene. If a thing cannot be made to that standard yet, it waits.
2. **The right picture, then the model.** Every new model starts from a reference picture chosen for it (a concept picture in the house style, approved on a sheet), and is then built: in Blender by script where the thing is hard-edged (buildings, boats, carts, fences, tools), by generation where it is organic (plants, animals, people). This is the route the city's catalogue took.
3. **Spend is approved per batch.** Free work goes ahead. Concept pictures and generated models are listed with their cost and wait for the owner's word.
4. **Each phase ends published,** with stills, what was verified, and a checklist. Motion and frame rate are the owner's to check.
5. **Tested by numbers where it can be:** land, camera, people's paths.

- **Greek throughout** (owner, 26 Nov 2026: "ensure we don't deviate from the Greek theme"). Dry stone, cream plaster, terracotta tile, azure paint, bronze, marble, the gold bolt; shutters, never glass; nothing medieval or modern. A reference picture that strays is corrected when the model is built.

## Phases

| No. | Phase | What it gives | Cost | State |
| --- | --- | --- | --- | --- |
| 1 | **Life** | The newcomer walking the road in the story. People in the village square, at the stalls, in the fields, on the road, at the city gate. | Free (the city's three citizens) | Done 26 Nov 2026; waiting for the owner to watch it |
| 2 | **The ground** | Real surfaces from the scanned library the city uses: meadow grass, forest floor, bare earth, sand, rock. Cliffs and mountains that look like stone. | Free | Done 26 Nov 2026; waiting for the owner |
| 3 | **A fuller countryside, built in Blender** | Things the catalogue lacks: a shepherd's hut, a barn, a mill, fences, haystacks, a hay cart, a fishing boat, a wooden bridge, a jetty, beehives, a threshing floor, a roadside shrine with columns. Each from an approved picture. | Pictures: about $0.10 each. Models: free | Done 26 Nov 2026: twelve models from `blender/country.py`, placed in the world; waiting for the owner |
| 4 | **The director's remote** | A control page like the hero film's: fly to a place from Chrome while OBS shows the world. | Free | Done 26 Nov 2026; not yet tried in OBS itself |
| 5 | **Dusk, night and weather** | Lamps and windows lighting across the land, campfires, stars; morning mist; a storm from the mountains. | Free | Done 26 Nov 2026 (`worldair.js`); stills checked, motion (rain, flames, lightning) waits for the owner |
| 6 | **Animals and more people** | Sheep, goats, horses, oxen, birds; farmers, fishers, woodcutters, shepherds in working clothes. | About $0.45 a model, rigging extra | Animals done 26 Nov 2026 (six models, standing still; eagles circle). Working people and walking animals not started: both need new paid work |
| 7 | **New places** | A harbour town, a mountain sanctuary above the falls, a quarry, vineyards and olive groves, ruins in the forest, an island. | Mostly free once phases 3 and 6 exist | |
| 8 | **The living city on this land** | The real city of `city.html` (temple, market, citizens, battles) standing where the stand-in stands. Needs `city.js` turned from a page into a part. | Free | |
| 9 | **The game** | The newcomer is a real new follower; each supporter's plot; the MVP's building rising; the world growing with what the community gives; monuments to past heroes; a map. | Free | Waits for TikFinity for the live parts |

## Why this order

- An empty world is the first thing a viewer feels, so people come first, and they cost nothing.
- The ground is in every shot, so it comes second.
- New models are the only part that costs money and needs approval, so they are gathered into two batches (3 and 6) and do not hold up the free work.
- The living city and the game are the largest pieces and stand on everything before them.
