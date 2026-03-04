# TripSlip Monorepo

A multi-app platform for managing school field trips. Includes digital permission slips, Stripe payments, and real-time parent communication.

## Architecture

Monorepo using npm workspaces + Turborepo with 5 Vite/React apps and shared packages, served through a reverse proxy on port 5000.

### Apps (all served through proxy on port 5000)
- `/` — Landing page (internal port 3000)
- `/venue/` — Venue management portal (internal port 3001)
- `/teacher/` — Teacher portal (internal port 3002)
- `/parent/` — Parent portal (internal port 3003)
- `/school/` — School admin portal (internal port 4200)

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

The workflow runs `bash start-dev.sh` which:
1. Starts all 5 Vite dev servers via `turbo dev`
2. Starts a reverse proxy (`proxy-server.mjs`) on port 5000

The landing page at `/` has an `/apps` hub page that links to all other portals.

### Key Files
- `proxy-server.mjs` — Reverse proxy routing requests to the correct app
- `start-dev.sh` — Startup script for turbo + proxy
- `apps/landing/src/utils/appUrls.ts` — URL helper for cross-app navigation
- `apps/landing/src/pages/AppsPage.tsx` — Apps hub page

### Routing
Each sub-app uses a `basename` on its `BrowserRouter` (e.g., `/venue`, `/teacher`) and a matching `base` in its Vite config. The proxy forwards requests by path prefix to the correct internal Vite dev server.

## Environment Variables

Required env vars (see `.env.example`):
- `VITE_SUPABASE_URL` — Supabase project URL (env var)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (env var)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (secret)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (env var)
- `STRIPE_SECRET_KEY` — Stripe secret key (secret)
- `TWILIO_ACCOUNT_SID` — Twilio account SID (secret)
- `TWILIO_AUTH_TOKEN` — Twilio auth token (secret)
- `TWILIO_PHONE_NUMBER` — Twilio phone number (secret)
- `CUSTOMERIO_API_KEY` — Customer.io API key (secret)

## Replit Migration Notes
- All vite configs bind `host: '0.0.0.0'` and `allowedHosts: true`
- Reverse proxy on port 5000 routes to all apps by path prefix
- Each app has `base` set in vite config and `basename` on BrowserRouter
- Node.js upgraded from 18 to 20
- Vercel/Netlify config files removed
- `packages/database` updated to use `import.meta.env` with `process.env` fallback
