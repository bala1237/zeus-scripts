# Zeya: what exists, and how she joins Zeus World

Reviewed 27 Nov 2026 for ZW-057, read-only, at the owner's request ("Review the existing ZEYA implementation before proposing how to integrate her"). Nothing was changed, run or generated. The proposal at the end is **not decided**.

The owner's rule: "ZEYA should be the same character across the entire Zeus entertainment ecosystem. I do not want a separate Zeus World version of ZEYA with a different personality, voice or identity. Zeus World should become another domain of knowledge and capability for ZEYA."

## Where she lives

She is not in this repository. Three pieces were found in the owner's other repositories:

| Piece | Repository | Last change | What it is |
| --- | --- | --- | --- |
| Her brain | `bala1237/tiktok-ai-cohost` | March 2026 | A desktop app (Electron, about 61,000 lines): reads a TikTok LIVE, decides what is worth saying, speaks it |
| Her body | `bala1237/zeya-ai-coshot`, branch `claude/zeya-animation-takeover-78cu2n` (the default branch is empty) | 22 Nov 2026 | A 3D avatar in three.js for OBS: lip-sync, face, gaze, gestures |
| Her campaign voice | Same branch, `assets/promo/campaign/voice_profile.md` | Nov 2026 | The approved voice and manner used in her promos |

Labels below: **working** (code with tests or measurements), **unproven** (code exists; nothing shows it running live), **paper** (documents only).

## Her character, as written down

- **In the brain** (`src/main/engagement/templates.ts`): "High-glam, highly observant, sharp-tongued AI cohost who treats the live like a living room, a stage, and an arena at the same time." Teasing that "roasts situations, not people"; flirting "playful and selective (earned, not default)"; towards Zeus "protective, amplifying, co-sign energy". Seven voice modes: Sassy Socialite (the default), Velvet Flirt (rare), Chaos Goblin, Crown Judge, Battle Emcee, Soft Loyalty, Dry Troll. Six "lore pillars": The Room, The Temperature, The Crown, The Storm, The Ledger, The Silence.
- **In the campaign** (approved, newer): mostly natural talking, playful, a nerdy streak, mischievous, and sincere warmth about people.
- **Rules found:** never announce that she "remembers" someone, show that she noticed; never defensive, hurt or preachy; PG-13; no politics; sensitive facts about a viewer (health, loss, money) are never spoken; signature words rest three minutes and whole lines ten; and from the campaign, never the word "gift" or "gifts", and never a synthesised Zeus.
- **Voice:** ElevenLabs. The one approved voice on record is the campaign's: "Zeya - option a", model `eleven_v3`, most expressive setting, sped up 6% in the edit.

## Her brain (unproven: no evidence in the repository of live use)

- **Hears the stream** through a free TikTok LIVE library; EulerStream is an optional extra.
- **Decides** in steps: moderation, an eight-second gathering window, scoring. Most lines for joins and support are ready-written templates with no writing model. Commentary and answers to chat use a writing model (OpenAI, Anthropic or Google; a small, cheap one by default), told to keep to 25 words and one topic.
- **A gate for when not to speak** (called the "narrative engine": it is a filter, not a storyteller): silence, repetition, intensity, emotion, queue.
- **A speech queue** with priorities, interruption, expiry, a cap on backlog, a cache, and a bank of lines recorded ahead.
- **Memory** in a local database on the owner's machine: viewers, visits, loyalty, facts picked up from chat (sorted safe, flagged, manual), and a hand-set **spoken name** for each viewer.
- **Knowing when Zeus is talking:** a hotkey or pause button, and commands he types. **She cannot hear him:** there is no speech-to-text anywhere.

## Her body (working on stills and measurements only; never run on a graphics card or in OBS)

- Lip-sync from the sound of the voice, with exact lip closure on B, M and P when ElevenLabs supplies letter timings. Nine emotions on a standard set of face shapes, blinking, eyes that lead the head, eight gestures.
- A "Performance Director" that takes simple orders: speak this, smile, laugh, look at Zeus, look at the camera, wave.
- **Her face is rejected** for production by that project's own review; a replacement head is a candidate with faults. A cloud video-avatar service was tried and rejected for lack of expression; the owner chose local 3D.

## What disagrees, and what could not be found out

- **Three Zeyas on record do not match.** The brain is eight months old and its own contract still describes a whisperer in the creator's ear; its default voice settings differ from the approved campaign voice; and its templates use the word "gift" constantly, which the campaign forbids.
- **Not known:** which voice and settings she uses on stream today (kept in the app's settings on the owner's machine); whether the brain has run live since March; real delay and cost; whether a newer Zeya runs somewhere not seen here.

## What Zeus World can reuse

| From | Reusable | For |
| --- | --- | --- |
| Brain | The gate for when not to speak | Exactly the owner's wish that she should not sound like "a sequence of automated announcements" |
| Brain | The speech queue (priority, interrupt, never talking over Zeus) | Narration and scenes sharing one voice channel |
| Brain | Word and line rest periods | Not repeating herself over a long stream |
| Brain | Spoken names and name clean-up | The base for pronunciation preferences (today a respelling typed by hand) |
| Brain | The viewer database | The start of the community's Chronicle |
| Body | Lip-sync, face, gaze and gesture code | The same engine as the world (three.js). It will drive **any** character that has the standard face shapes, not only Zeya. See `VISION.md`, part 6 |
| Campaign | The approved voice and manner | Her one voice everywhere |

## What is missing for her role in the world

1. **One character sheet.** A single written source for who she is, her rules and her voice, read by every product. Today there are three that disagree.
2. **A "say this" service.** Nothing today turns a line of text into her voice plus lip timings on request. The nearest piece is a small tool in the avatar project.
3. **World knowledge.** The world bible, the cast's records and the events of the day, given to her as something she knows.
4. **Story memory.** She remembers facts about viewers, not what happened. She needs the world's record.
5. **Hands on the camera.** A way for her to say "take us to the mill".
6. **Ears.** Hearing Zeus, to talk with him live.
7. **A link between brain and body.** Neither calls the other today.
8. **Other voices.** Dialogue between several characters does not exist anywhere yet.

## Proposal (not decided)

- **One Zeya core, many rooms.** Her character sheet, voice, speech queue, silence gate and memory are the core. The stream's chat is one room she works in; Zeus World is another. Each room gives her things to know and things she can do. The core never forks.
- **The owner settles the character sheet first**, since the three on record differ. Suggested starting point: the November campaign's voice and manner, as the newest thing he approved, with the brain's seven modes kept as her range.
- **Two of her existing lore pillars already fit the myths in the world bible:** The Storm (Myth A) and The Ledger (Myth B, where she keeps the tally).
- **Phase 1 needs only items 1 to 3**, and can be done with recorded lines. Items 4 to 8 come with phases 2 and 3.
