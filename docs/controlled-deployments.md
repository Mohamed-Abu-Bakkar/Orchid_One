# Controlled Vercel deployments

Orchid One disables Vercel's automatic Git deployments. Production deployments are requested through the GitHub Actions workflow at `.github/workflows/deploy-production.yml`.

## One-time Vercel setup

1. Open the Orchid One project in Vercel.
2. Go to **Settings → Git → Deploy Hooks**.
3. Create one hook named `orchid-one-production` for branch `main`.
4. Copy the generated URL. Treat it like a password; anyone with it can trigger a deployment.

## One-time GitHub setup

1. Open the `Mohamed-Abu-Bakkar/Orchid_One` repository.
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Set the name to `VERCEL_DEPLOY_HOOK` and paste the Vercel hook URL as its value.

Do not commit the hook URL or place it in a public file.

## Deploying a batch

- Normal commits to `main` do not trigger Vercel deployments.
- When a batch is ready for production, include `[deploy]` in the final commit subject, for example: `feat: complete attendance and overtime batch [deploy]`.
- The workflow sends one POST request to the Vercel hook for that commit.
- Alternatively, run **Actions → Controlled Vercel Production Deployment → Run workflow** to deploy the current `main` branch manually.

The hook deploys the latest commit on `main` when it is triggered. Avoid pushing additional commits while a deployment-triggering workflow is running. The workflow serializes deployment requests.

## Important

This controls Vercel production builds only. It does not deploy Convex functions. Convex Development updates remain a separate operation and must continue targeting the existing Development deployment. Never run `npx convex deploy` for this project without an explicit Production migration decision.
