# TripSlip Monorepo

A multi-app platform for managing school field trips. Includes digital permission slips, Stripe payments, and real-time parent communication.

## Architecture

Monorepo using npm workspaces + Turborepo with 5 Vite/React apps and shared packages.

### Apps
- `apps/landing` — Public marketing site (port 5000, primary Replit webview)
- `apps/venue` — Venue management portal (port 3001)
- `apps/teacher` — Teacher portal (port 3002)
- `apps/parent` — Parent portal (port 3003)
- `apps/school` — School admin portal (port 4200)

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

The Replit workflow runs `npx turbo run dev`, which starts all 5 apps simultaneously.

The landing page (port 5000) is the main entry point and has an /apps page that links to all other portals.

### App URLs (via Replit dev domain)
- Landing: port 5000 (shown in webview)
- Venue: port 3001
- Teacher: port 3002
- Parent: port 3003
- School: port 4200

The `apps/landing/src/utils/appUrls.ts` utility dynamically generates correct URLs for each app based on the Replit domain.

## Environment Variables

Required env vars (see `.env.example`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only, stored as secret)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_SECRET_KEY` — Stripe secret key (server-only, stored as secret)
- `TWILIO_ACCOUNT_SID` — Twilio account SID (stored as secret)
- `TWILIO_AUTH_TOKEN` — Twilio auth token (stored as secret)
- `TWILIO_PHONE_NUMBER` — Twilio phone number (stored as secret)
- `CUSTOMERIO_API_KEY` — Customer.io API key (stored as secret)

## Replit Migration Notes
- All vite configs bind `host: '0.0.0.0'` and `allowedHosts: true` for Replit compatibility
- Landing app on port 5000 (required for Replit webview)
- School app moved from port 3004 to 4200 (3004 not a supported Replit port)
- Node.js upgraded from 18 to 20 (required by dependencies)
- Vercel/Netlify config files removed
- Added /apps hub page on landing site for navigating between portals
