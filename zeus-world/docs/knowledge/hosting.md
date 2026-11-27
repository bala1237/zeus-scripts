# Hosting, deploying and branches

The build targets 2022-level JavaScript (2020 was tried and fails: the city and street pages use top-level await) (`build.target` in `assets/review/vite.config.js`), not the newest, so that pages also run in the older browsers built into streaming software (ZW-043).

## The preview

- **Link:** https://zeus-world-preview-bala-0416.vercel.app/city.html
- Vercel project `zeus-world-preview`, team "Bala" (`team_sbCFPbyQjCI8e29mwR2c9t3U`), project id `prj_CxFJGUOEOvvLAiTCftIXpYpWqOds`.
- Linked to this repository. Root directory `zeus-world/assets`, framework Vite, build `npm run build`, output `dist`.
- The build (`review/vite.config.js`) has four pages: `index.html` (single-model review), `street.html`, `city.html`, `stage.html` (the music stage) and `laser.html` (the laser prototype).
- **The link is public and serves every model file.** Protect it or take it down before sharing more widely (ZW-011).

## Deploying

- Vercel builds a preview deployment for every branch pushed, at its own address.
- The main link above shows the production deployment. Vercel's production branch is the repository's default branch, so **merging into the default branch deploys to the main link automatically** (confirmed 22 Nov 2026 with the first merge). Before that the work was on other branches, so each update was deployed by hand.
- To deploy by hand, use the Vercel tools: `create_deployment` with `gitSource` (type github, org `bala1237`, repo `zeus-scripts`, the branch as `ref`, the commit `sha`) and `target: production`. The `deploy-preview` skill has the steps.
- After any deploy, check that the deployment reached `READY` and that the page loads.

## Branches

- The repository's default branch is the home of the project. Each session works on its own branch and merges into the default branch by pull request at the end (owner's instruction, 22 Nov 2026).
- **The default branch is named `claude/zeus-world-2d-animation-an0a52`, not `main`.** There is no `main` branch. Sessions start from the default branch whatever it is called, so this works, but the name is misleading. The owner can rename it in GitHub: repository Settings, General, Default branch, the pencil icon, type `main`. GitHub redirects the old name. After renaming, check that Vercel's production branch (project Settings, Git) is also `main`.
- Earlier work branches, all merged: `claude/dazzling-mendel-y9qquo`, `claude/eager-faraday-svkb22`.

## Size

`assets/models/` is about 85 MB in git, and every rebuilt model adds to the history. Moving models to file storage is an open question (ZW-011).

**Trap: a failed build hidden by `tail`.** `npm run build | tail -1` prints the last line of an error as happily as "built in". Check for the words: `npm run build 2>&1 | grep -E "built in|error|failed"`. A build that fails here also fails on Vercel, and the preview then keeps showing the previous version.

## The preview follows the default branch (learned 27 Nov 2026)

Every merge into the default branch makes Vercel publish the default branch to the preview address. A session that published its own branch there (step 3 of the `deploy-preview` skill) is replaced the moment any other session merges, and pages that exist only on its branch answer "not found". This took `live.html` off the air while the owner was using it. So: when the owner is using a page for real, merge it into the default branch soon, not only at wrap-up; and when two sessions run at once, expect this.

Two sessions at once also take the same backlog numbers. Before merging, compare "Next number" with the default branch and renumber the newer entries.
