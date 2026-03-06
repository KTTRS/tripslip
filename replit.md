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

### Teacher App Pages
- `/` `/dashboard` — Dashboard with stats, quick actions, upcoming trips
- `/trips` — Full trip list with filters (upcoming/past/all), status badges
- `/trips/create` — Trip creation wizard (4 steps)
- `/trips/:tripId/roster` — Per-trip student roster with permission slip status
- `/trips/:tripId/slips` — Permission slip tracking with send/remind
- `/students` — Full student management page (add, CSV import with parent info, edit, delete, send permission slip links)
- `/profile` — Teacher profile editing + password change
- `/venues/search` — Venue discovery
- `/venues/:venueId` — Venue detail

### Key Files
- `proxy-server.mjs` — Reverse proxy + API routes (SMS, email, permission slips, file upload)
- `start-dev.sh` — Startup script for turbo + proxy
- `apps/teacher/src/components/roster/SendLinksModal.tsx` — Generate ONE link per trip for all parents (copy, SMS, Remind/ClassDojo)
- `apps/teacher/src/components/roster/CSVImportModal.tsx` — CSV import with parent contact info columns
- `apps/teacher/src/components/roster/AddStudentModal.tsx` — Add student with parent info
- `apps/parent/src/pages/TripLookupPage.tsx` — Parent opens trip link, searches for child, routes to permission slip

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

## Supabase Auth Isolation
Since all apps run on the same domain, each app uses a unique `storageKey` for its Supabase client to prevent GoTrueClient lock conflicts:
- Teacher: `sb-tripslip-teacher-auth` (in `apps/teacher/src/lib/supabase.ts`)
- Venue: `sb-tripslip-venue-auth` (in `apps/venue/src/lib/supabase.ts`)
- Parent: `sb-tripslip-parent-auth` (in `apps/parent/src/lib/supabase.ts`)
- School: `sb-tripslip-school-auth` (in `apps/school/src/lib/supabase.ts`)
- Landing: `sb-tripslip-landing-auth` (in `apps/landing/src/lib/supabase.ts`)

The default `supabase` export from `@tripslip/database` is lazy-initialized (via Proxy) to prevent duplicate GoTrueClient instances during HMR. The `@tripslip/auth` shared package exposes `supabaseClient` through the auth context so child components don't need to create new clients.

**Important**: The `onAuthStateChange` callback in `packages/auth/src/context.tsx` defers database queries via `setTimeout(fn, 0)` to avoid deadlocking with Supabase GoTrueClient's internal Web Lock (which is held during `signInWithPassword`). Do NOT make `supabase.from()` calls directly inside `onAuthStateChange`.

## Supabase RLS & Signup

Migration `supabase/migrations/20250304000001_fix_rbac_signup_policies.sql` must be applied to Supabase. It adds:
- `assign_user_role()` RPC (SECURITY DEFINER) for role assignment during signup
- `create_teacher_on_signup()` RPC (SECURITY DEFINER) for creating teacher records
- `list_schools_for_signup()` RPC for school selector (public access)
- INSERT/UPDATE/DELETE policies on `active_role_context` (user self-management)
- Public read policy on `schools` table for signup form
- `is_active` column and unique `user_id` index on `teachers` table

The signup flow uses RPC functions instead of direct table inserts to bypass RLS safely.

## Database Seeding

Run `node scripts/seed-demo-data.mjs` to populate Supabase with professional demo data:
- 6 venues (Science Museum, Zoo, Botanical Garden, History Museum, Aquarium, Art Center)
- 12 experiences (2 per venue) with real descriptions, durations, grade levels
- 15 pricing tiers with tiered pricing ($10-$25 per student)
- 1 school (Lincoln Elementary)
- 1 roster with 15 students
The script uses `upsert` and is idempotent.

## Real Database Integration

The teacher app queries **real Supabase data** (no mock fallbacks):
- **Dashboard**: Queries `trips` joined with `experiences` and `venues` for the logged-in teacher. Shows empty welcome state if no trips exist.
- **Step 2 (Experiences)**: Queries `experiences` joined with `venues` and `pricing_tiers`. Shows venue name, duration, grade levels, and pricing.
- **Step 3 (Students)**: Queries `students` via the teacher's `rosters`. Falls back to all students (scoped to authenticated user) if no roster found.
- **Step 4 (Review/Submit)**: Fetches `pricing_tiers` for cost calculation, `venues` for location display. Creates real trip record in DB.

Trip creation drafts are stored in **localStorage** (not the `trip_drafts` DB table, which doesn't exist). The `useAutoSave` hook saves drafts every 30 seconds via localStorage keyed by teacher ID.

The `ProtectedRoute` in the teacher app only requires `user` auth — it does not require a `teachers` table record, which allows demo login without DB seeding.

The `signIn` flow wraps role-loading in try/catch and falls back to a default `teacher` role if no `role_assignments` records exist.

## Design System

TripSlip uses a neo-brutalist design language:
- Primary yellow: `#F5C518`
- Primary black: `#0A0A0A`
- Card borders: `border-2 border-[#0A0A0A]`
- Drop shadows: `shadow-[4px_4px_0px_#0A0A0A]`
- Hover effect: `hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px]`
- Accent background: `bg-[#FFFDE7]`
