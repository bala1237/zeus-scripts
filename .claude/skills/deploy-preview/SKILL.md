---
name: deploy-preview
description: Deploy the Zeus World review scenes (city, street, single model) to the hosted Vercel preview and confirm the deployment is live. Use after changing anything under zeus-world/assets that the owner should see.
---

# Deploy the preview

Details of the project are in `zeus-world/docs/knowledge/hosting.md`.

1. **Build locally first.** From `zeus-world/assets/`: `npm install` if needed, then `npm run build`. Fix any error before deploying.
2. **Commit and push** the change.
3. **Deploy.**
   - If the change has been merged into the default branch, Vercel builds a production deployment by itself. Go to step 4.
   - Otherwise use the Vercel tool `create_deployment` for project `zeus-world-preview` (id `prj_CxFJGUOEOvvLAiTCftIXpYpWqOds`, team `team_sbCFPbyQjCI8e29mwR2c9t3U`) with `gitSource`: type `github`, org `bala1237`, repo `zeus-scripts`, `ref` the branch, `sha` the commit; and `target: production`.
4. **Confirm.** Use `list_deployments` or `get_deployment` until the state is `READY`. On `ERROR`, read the build log, fix, and deploy again.
5. **Give the owner the link:** https://zeus-world-preview-bala-0416.vercel.app/city.html, with a checklist of what to look at. Motion and frame rate cannot be checked from here; say so.

Do not change the project's settings, domains or protection without asking the owner.
