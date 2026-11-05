# Orchid One – Phase 1

Production application foundation for Orchid Flowers HRM. The original UI prototype is preserved in `OrchidHRM/`; the Next.js application is at repository root.

## Local development
1. Install Node.js 20 LTS or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure Convex and run `npx convex dev` to generate the Convex client and local deployment.
5. Configure the identity provider and its Convex JWT integration before enabling authenticated access.
6. Run `npm run dev`.

## Important
The current branch is a foundation, not a completed production release. Do not deploy with placeholder environment variables. Review `docs/IMPLEMENTATION-STATUS.md` and `docs/REQUIREMENTS-REGISTER.md` before enabling client data.
