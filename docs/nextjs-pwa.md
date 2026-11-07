# Next.js Progressive Web App

Orchid One's Next.js App Router build is installable as a PWA independently of the static HTML prototype in `OrchidHRM/`.

## Included

- Root web app manifest at `/manifest.json`.
- PWA metadata in the Next.js root layout.
- Client-side service-worker registration at `/sw.js`.
- Generic offline fallback at `/offline.html`.
- App icon at `/icons/icon-512.png`.

## Cache and privacy policy

The service worker caches only versioned Next.js static assets and the generic offline page. It does not cache navigation HTML, authentication pages, API responses, employee information, attendance, policies, payslips, or uploaded documents. The application requires a network connection to load authenticated workspace data and perform server operations.

## Requirements

- Serve the production app over HTTPS (localhost is accepted for development).
- Build and deploy the Next.js app normally.
- Open the deployed app in a supported browser and use its Install App / Add to Home Screen option.
- After changing the service worker cache behavior, increment `CACHE_NAME` in `public/sw.js` to force a clean cache version.

## Validation

Check that `/manifest.json`, `/sw.js`, `/offline.html`, and `/icons/icon-512.png` return successfully. In browser DevTools, verify the service worker is registered and that authenticated routes and `/api/*` are not stored in Cache Storage.
