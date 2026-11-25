# zeus-scripts

This file is loaded by every Claude session. It is the entry point; the detail is in `zeus-world/docs/`.

## Projects

- `zeus-world/`: Zeus World, a community-built miniature civilisation for the Zeus TikTok LIVE stream. The active project.
- Andie's Place: a branded stream backdrop for another host, at `zeus-world/assets/review/andie.html`. Uses Zeus World's beat and laser code; see `zeus-world/docs/knowledge/andie.md`.
- `bougie-prototype/`: an older 2D character animation prototype. Not active.

## Start of a session

Read these two before doing anything else:

1. `zeus-world/docs/PLAN.md`: where the project stands, what is in progress, what is waiting on the owner.
2. `zeus-world/docs/BACKLOG.md`: every open bug and enhancement, numbered.

Then read whatever the task touches:

| Topic | File |
| --- | --- |
| How things work and how they were built | `zeus-world/docs/knowledge/` (index in its `README.md`) |
| What changed and when | `zeus-world/docs/CHANGELOG.md` |
| Decisions already taken, and open questions | `zeus-world/docs/DECISIONS.md` |
| Product rules | `zeus-world/docs/CONSTITUTION.md` |
| The bigger plan, in phases | `zeus-world/docs/ROADMAP.md` |
| Ideas for making it a game (not decided) | `zeus-world/docs/BRAINSTORM-GAME.md` |
| Research behind the game direction | `reports/Zeus World game design research.md`, notes in `research_notes/` |
| The music stage: the owner's brief, audit and phased plan | `zeus-world/docs/STAGE-PLAN.md` |
| Hero films: story films that celebrate a battle's top givers; the rules and the scripts | `zeus-world/docs/hero-films/` |
| Art style and model catalogue | `zeus-world/docs/ASSET-BIBLE.md` |
| Asset pipeline commands | `zeus-world/assets/README.md` |

## Working rules

These are the owner's standing instructions (set 22 Nov 2026).

1. **Log reports first.** When the owner reports a bug or asks for an enhancement, add it to `BACKLOG.md` with the next number before working on it. Use the `log-report` skill.
2. **Documents change with the code.** A commit that changes behaviour also updates, in the same commit: the knowledge file for that area, `CHANGELOG.md`, the backlog entry's status, and `PLAN.md` if the plan moved. A document that disagrees with the code is a bug.
3. **Record how, not only what.** When something took effort to work out (a workaround, a measurement, a setting that matters), write it in the knowledge file so the next session does not rediscover it.
4. **Say what was verified.** Rendering here is software only, so motion and frame rate cannot be checked on this machine. Mark changes as verified, or as waiting for the owner to check on the preview.
5. **End of session.** Run the `wrap-up` skill: bring the documents up to date, push, open a pull request into the default branch and merge it. The owner has approved merging at the end of each session.
6. **Skills.** Repeatable procedures live in `.claude/skills/`. When a procedure changes, update its skill. When a new procedure is repeated a second time, make it a skill.

## Owner preferences

- Visual excellence is non-negotiable.
- Keep spend low. Ask before any paid generation (fal, Meshy); the owner approves spend per batch.
- Deliver in batches with a checklist; the owner checks each batch on the hosted preview.
- Plain language in reports. The owner is not reading the code.

## Branches

- The default branch is the home of the project. Every session starts from it and merges back into it.
- A session develops on the branch it was given, then merges by pull request at wrap-up.
- Do not put a model name or identifier in commits, pull requests or code.
