# Hosting, deploying and branches

## The preview

- **Link:** https://zeus-world-preview-bala-0416.vercel.app/city.html
- Vercel project `zeus-world-preview`, team "Bala" (`team_sbCFPbyQjCI8e29mwR2c9t3U`), project id `prj_CxFJGUOEOvvLAiTCftIXpYpWqOds`.
- Linked to this repository. Root directory `zeus-world/assets`, framework Vite, build `npm run build`, output `dist`.
- The build (`review/vite.config.js`) has four pages: `index.html` (single-model review), `street.html`, `city.html`, and `stage.html` (the music stage).
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
