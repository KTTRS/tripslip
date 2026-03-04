# TripSlip Monorepo

A multi-app platform for managing school field trips. Includes digital permission slips, Stripe payments, and real-time parent communication.

## Architecture

Monorepo using npm workspaces + Turborepo with 5 Vite/React apps and shared packages.

### Apps
- `apps/landing` — Public marketing site (port 5000, primary Replit app)
- `apps/parent` — Parent portal (port 3003)
- `apps/school` — School admin portal (port 3004)
- `apps/teacher` — Teacher portal (port 3002)
- `apps/venue` — Venue management portal (port 3001)

### Packages
- `packages/auth` — Supabase auth helpers
- `packages/database` — Supabase DB client and types
- `packages/i18n` — Internationalization
- `packages/ui` — Shared component library
- `packages/utils` — Shared utilities

## Tech Stack
- **Framework**: Vite + React 19
- **Routing**: React Router 7
- **Styling**: Tailwind CSS
- **Auth/DB**: Supabase
- **Payments**: Stripe
- **Monorepo**: Turborepo + npm workspaces
- **Runtime**: Node.js 20

## Running the Project

The Replit workflow runs: `npm run dev --workspace=apps/landing`

This starts the landing page on port 5000. To run other apps locally:
```
npm run dev --workspace=apps/parent    # port 3003
npm run dev --workspace=apps/venue     # port 3001
npm run dev --workspace=apps/teacher   # port 3002
npm run dev --workspace=apps/school    # port 3004
```

## Environment Variables

Required env vars (see `.env.example`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_SECRET_KEY` — Stripe secret key (server-only)
- `VITE_GOOGLE_MAPS_API_KEY` — Google Maps API key (optional)

## Replit Migration Notes
- All vite configs updated to bind `host: '0.0.0.0'` for Replit compatibility
- Landing app changed from port 3000 to port 5000 (required for Replit webview)
- Node.js upgraded from 18 to 20 (required by some dependencies)
