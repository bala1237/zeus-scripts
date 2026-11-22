---
name: wrap-up
description: End-of-session routine for Zeus World. Brings the plan, backlog, changelog and knowledge files up to date, pushes, and merges into the default branch. Use when the owner says the session is done, before a long pause, or after finishing a piece of work.
---

# Wrap up

Work through this list in order. Skip nothing; say so if a step does not apply.

1. **Backlog** (`zeus-world/docs/BACKLOG.md`). Every item touched this session has the right status. Finished items needing no owner check move to the closed table with date and commit; items the owner must check become `Fix shipped`. Anything the owner reported that is not yet logged gets logged.
2. **Knowledge** (`zeus-world/docs/knowledge/`). For each area changed: does its file still describe the code. Add what was learned the hard way (a workaround, a measurement, a setting that matters). New area: new file, listed in the folder's `README.md`.
3. **Changelog** (`zeus-world/docs/CHANGELOG.md`). One plain-language entry per piece of work under today's date, with the backlog number and the reason.
4. **Decisions** (`zeus-world/docs/DECISIONS.md`). Any decision the owner took, with the date. Any new open question.
5. **Plan** (`zeus-world/docs/PLAN.md`). "Now", "Next" and "Waiting on the owner" are current, and the "Last updated" date is today. Include a checklist for anything the owner has to check on the preview.
6. **Skills** (`.claude/skills/`). If a procedure changed, its skill is updated. If a new procedure was repeated, it has a skill.
7. **Check the documents against each other.** No file refers to something removed or renamed. Search for the old name.
8. **Commit and push** to the session's branch.
9. **Merge.** Open a pull request from the session's branch into the repository's default branch and merge it. The owner approved this on 22 Nov 2026 as the routine. If the merge has conflicts or a check fails, stop and tell the owner.
10. **Preview.** If anything visible changed, make sure the preview shows it (`deploy-preview` skill) and give the owner the link.
11. **Report** to the owner: what was done, what was verified and what was not, what is waiting on them.
