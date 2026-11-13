# Local development and environment setup

## Development isolation

Use a dedicated Convex development deployment for local work. Do not point local development at the live Orchid Flowers deployment. Production contains employee, attendance, wage and document data and is a release target only.

## Install and start

Use npm for this repository:

```bash
npm install
npx convex dev
```

Keep `npx convex dev` running during development. Sign in to Convex and select/create the development deployment. Copy its generated cloud and site URLs into `.env.local`.

## Local `.env.local`

```env
NEXT_PUBLIC_CONVEX_URL=https://YOUR-DEV-DEPLOYMENT.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR-DEV-DEPLOYMENT.convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not commit `.env.local`.

## Development Convex environment

Generate a unique development secret:

```bash
openssl rand -base64 32
```

Set server-side environment variables on the development deployment:

```bash
npx convex env set SITE_URL http://localhost:3000
npx convex env set BETTER_AUTH_SECRET "YOUR_DEVELOPMENT_SECRET"
npx convex env set ORCHID_ORGANIZATION_CODE ORCHID
```

The `ORCHID_ORGANIZATION_CODE` value must match the code used by the idempotent organization seed mutation. Run the internal organization bootstrap only against the intended development deployment first.

## Better Auth schema generation

After dependencies are installed and `convex/convex.config.ts` is registered, generate the component schema using the official CLI:

```bash
npx auth generate --config ./convex/betterAuth/auth.ts --output ./convex/betterAuth/schema.ts
```

Then keep `npx convex dev` running so Convex generates the component references and application types. Do not hand-write the generated Better Auth component schema or generated API files.

## Production configuration

Production application URL: `https://orchid-one.cusptech.dev`

Production Convex URLs:
- `https://giant-clam-371.convex.cloud`
- `https://giant-clam-371.convex.site`

Set the following in Vercel's Production environment only:

```env
NEXT_PUBLIC_CONVEX_URL=https://giant-clam-371.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://giant-clam-371.convex.site
NEXT_PUBLIC_SITE_URL=https://orchid-one.cusptech.dev
```

Configure `SITE_URL`, `BETTER_AUTH_SECRET` and `ORCHID_ORGANIZATION_CODE` in the production Convex environment only during an approved production release. Generate a distinct production secret. Do not deploy or migrate production as part of local development.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also verify the Better Auth generated schema, Convex code generation, registration, pending approval, admin review, employee route and attendance in the development deployment before any production release.
