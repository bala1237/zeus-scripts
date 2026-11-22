---
name: log-report
description: Log a bug or enhancement the owner reports into the Zeus World backlog. Use whenever the owner reports a problem, asks for a change, or suggests an improvement to Zeus World, before starting work on it.
---

# Log a report

1. Open `zeus-world/docs/BACKLOG.md` and read "Next number" near the top.
2. Decide the type: `Bug` (something is wrong) or `Enhancement` (something new or better). If one message holds several separate things, log each under its own number.
3. Check the open table for an existing entry about the same thing. If there is one, add the new information to its detail section instead of creating a duplicate.
4. Add a row to the open table: number, type, short title, priority, status `Open`, date and reporter. If the owner gave no priority, write your guess followed by `(proposed)`.
5. Add a detail section under "Details": the owner's own words in quotes, what is known, what is not yet known, and likely causes if you have read the code. Mark guesses as guesses.
6. Raise "Next number" by one.
7. If it changes what should be worked on next, update `zeus-world/docs/PLAN.md`.
8. Tell the owner the number it was logged under, in one line.

Commit the backlog change with the work it belongs to, or on its own if no work follows in this session.
