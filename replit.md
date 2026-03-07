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
- **Styling**: Tailwind CSS with neo-brutalist design system
- **Auth/DB**: Supabase
- **Payments**: Stripe
- **Monorepo**: Turborepo + npm workspaces
- **Runtime**: Node.js 20

## Design System (Neo-Brutalist)
- **Colors**: 60% White / 20% Black (#0A0A0A) / 20% Yellow (#F5C518)
- **Fonts**: Fraunces (display headings, `font-display`), Plus Jakarta Sans (body, `font-sans`), Space Mono (labels, `font-mono`)
- **Hover**: Cards/buttons lift UP (`translate(-4px,-4px)`) with shadow GROWING to 8px. NEVER shrink shadow on hover.
- **Shadows**: Default `shadow-offset` (4px), hover `shadow-offset-lg` (8px), active = 2px
- **Icons**: Claymorphic layered shadows: `0 2px, 0 4px, 0 8px`
- **Borders**: 2px bold borders, `border-3` available for emphasis
- **All app Tailwind configs** scan `packages/auth/src/` and `packages/ui/src/` and include `borderWidth: { '3': '3px' }`
- **Characters**: Buddy (blue, Planner), Gem (purple, Organizer), Scout (green, Navigator), Sparkle (pink, Explorer), Sunny (yellow, Leader), Dash (red, Adventurer)

## Running the Project

The workflow runs `bash start-dev.sh` which:
1. Starts all 5 Vite dev servers via `turbo dev`
2. Starts a reverse proxy (`proxy-server.mjs`) on port 5000

The landing page at `/` has an `/apps` hub page that links to all other portals.

### Teacher App Pages
- `/` `/dashboard` — Dashboard with stats, quick actions, upcoming trips
- `/trips` — Full trip list with filters (upcoming/past/all), status badges
- `/trips/create` — Trip creation wizard (4 steps: details+transportation, experience, students, review+forms+funding+addons)
- `/trips/:tripId/roster` — Per-trip student roster with permission slip status + prominent shareable link (copy link / copy-with-message for parents)
- `/trips/:tripId/slips` — Permission slip tracking with send/remind/communication modal
- `/trips/:tripId/manifest` — Printable trip manifest for day-of attendance (all signed slips, medical alerts, emergency contacts, CSV download)
- `/students` — Full student management page (add, CSV import with parent info, edit, delete, send permission slip links)
- `/profile` — Teacher profile editing + password change
- `/venues/search` — Live Geoapify-powered venue discovery (enter address, finds nearby museums/zoos/etc)
- `/venues/:venueId` — Venue detail

### Key Files
- `proxy-server.mjs` — Reverse proxy + API routes (SMS, email, permission slips, file upload, venue discovery)
- `services/venue-discovery.mjs` — Geoapify-powered venue discovery service (geocoding, POI search, dedup, ranking, DB storage)
- `start-dev.sh` — Startup script for turbo + proxy
- `apps/teacher/src/components/roster/SendLinksModal.tsx` — Generate ONE link per trip for all parents (copy, SMS, Remind/ClassDojo)
- `apps/teacher/src/components/roster/CSVImportModal.tsx` — CSV import with parent contact info columns
- `apps/teacher/src/components/roster/AddStudentModal.tsx` — Add student with parent info
- `apps/parent/src/pages/TripLookupPage.tsx` — Self-service permission slip: parent opens trip link (`/parent/trip/:token`), fills in child info + contact + signature, creates slip in DB with form_data JSONB
- `apps/parent/src/pages/PermissionSlipSuccessPage.tsx` — Success page with optional account creation
- `apps/teacher/src/pages/TripManifestPage.tsx` — Printable trip manifest with all signed slips (handles both roster-linked and parent-submitted slips)

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

## Permission Slip Flow
1. Teacher generates ONE link per trip via `trips.direct_link_token` (SendLinksModal)
2. Teacher shares link via SMS bulk send, copy-with-message, or Remind/ClassDojo
3. Parent opens `/parent/trip/{token}` → TripLookupPage shows full form
4. Parent fills in: child name/grade/allergies, parent contact, emergency contact, signature
5. On submit: creates `permission_slips` record with `student_id = NULL`, data in `form_data` JSONB
6. Status: `signed_pending_payment` (if payment needed) or `signed` (free/assistance)
7. If payment needed: redirects to PaymentPage → Stripe checkout → PaymentSuccessPage
8. If no payment: redirects to PermissionSlipSuccessPage with optional account creation
9. Teacher sees slip appear in real-time on PermissionSlipTrackingPage
10. Teacher views trip manifest for day-of attendance at `/trips/:tripId/manifest`

### Status Values for permission_slips
`pending` → `sent` → `signed` / `signed_pending_payment` → `paid` / `cancelled`

### localStorage
- `tripslip_parent_info` — Stores parent+child info for pre-filling on future trips

## Design System

TripSlip uses a neo-brutalist design language with premium 3D claymorphic visual elements:
- Primary yellow: `#F5C518`
- Primary black: `#0A0A0A`
- Card borders: `border-2 border-[#0A0A0A]`
- Drop shadows: `shadow-[4px_4px_0px_#0A0A0A]` (offset) / `shadow-[8px_8px_0px_#0A0A0A]` (offset-lg)
- Hover effect: `hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px]`
- Accent background: `bg-[#FFFDE7]`
- Fonts: Fraunces (display), Plus Jakarta Sans (body), Space Mono (mono)
- Animations: float, bounce-slow, fade-in, slide-up (defined in tailwind.config.ts)

### Visual Assets (deployed to all apps in public/images/)
- **Stock photos**: hero-fieldtrip, students-museum, science-lab, zoo-visit, teacher-leading, art-workshop (AI-generated field trip scenes)
- **3D Claymorphic icons**: icon-permission, icon-payment, icon-magic, icon-venue, icon-tracking, icon-language, icon-bus, icon-backpack, icon-compass, icon-calendar, icon-shield, icon-megaphone, icon-pencil, icon-trophy, icon-team, icon-graduation (transparent PNGs, used throughout all apps)
- **Claymation characters**: char-pink-heart, char-blue-square, char-green-octagon, char-purple-diamond, char-yellow-star, char-red-pill (individual animated mascots used in headers/sidebars)
- **Brand characters**: brand-characters.png (mascot crew)

### Landing Page Sections (HomePage.tsx)
Header → Hero (photo + live dashboard overlay) → PhotoShowcase (5-photo gallery) → HowItWorks (4 steps) → FeatureGrid (6 features with claymorphic icons) → BrandCharacters (mascot crew) → Testimonials → CTASection → Footer (dark)

## Navigation Structure

Navigation is defined in `packages/auth/src/components/Navigation.tsx`:
- **Teacher**: Dashboard, Trips, Venues, Students, Profile
- **School Admin**: Dashboard, Approvals, Teachers
- **District Admin**: Dashboard, District Overview
- **TripSlip Admin**: Dashboard, Admin Panel
- **Venue Admin**: Uses its own `VenueNavigation` component in `apps/venue/src/components/VenueNavigation.tsx` (Dashboard, Experiences, Bookings, Trips, Financials, Employees)

Active nav state uses `startsWith()` for sub-paths (except Dashboard which is exact match).

## Venue Discovery (Geoapify)

The venue search uses Geoapify Places API for live discovery. The `GEOAPIFY_API_KEY` env var is required.

### Correct Geoapify Categories (v2/places API)
- `entertainment.museum` — museums
- `entertainment.zoo` — zoos  
- `entertainment.aquarium` — aquariums
- `entertainment.planetarium` — planetariums
- `entertainment.culture.arts_centre` — arts/science centers
- `heritage` — historic sites
- `tourism.attraction` — general attractions
- `leisure.park.nature_reserve` — nature reserves
- `leisure.park.garden` — botanical gardens
- `national_park` — national parks
- `natural.protected_area` — protected areas
- `commercial.food_and_drink.farm` — farms

NOTE: Categories like `tourism.museum`, `tourism.zoo`, `tourism.aquarium` do NOT exist in the Geoapify API — they return 400 errors.

### Discovery + Growing Database
Every search ALWAYS runs both DB lookup AND Geoapify discovery in parallel. New venues not yet in our database get enriched with Wikipedia images/descriptions and stored automatically. The database grows with every teacher search — eventually becoming the primary source with ratings, reviews, and experiences that Geoapify doesn't have.

Response includes `db_count` (venues from our DB) and `new_discovered` (freshly found venues being stored). DB venues get priority in ranking (they have richer data, experiences, reviews). Discovered venues stored with: name, description (from Wikipedia or generated), address JSON with lat/lon, website, phone, primary_photo_url (Wikipedia or Unsplash stock by type), source='geoapify'.

### API Endpoints
- `POST /api/discovery/search` — DB-cached Geoapify search: `{address, radiusMiles, venueTypes?, searchText?}` → checks DB first, falls back to Geoapify, enriches with Wikipedia, stores in DB, returns ranked results with photos/descriptions
- `POST /api/discovery/nearby` — Same as search but accepts lat/lon directly: `{lat, lon, radius_miles}`
- `POST /api/discovery/geocode` — Geocode only: `{address}` → `{lat, lon, formatted}`
- `POST /api/discovery/run` — Full pipeline for a school: `{school_id}` → discover + store in DB

## Critical DB Facts (for querying)

- `trips` has NO `title`, NO `school_id` — use experience title; filter by teacher_id
- `teachers` has `first_name` + `last_name`, NOT `name`; has `school_id`
- `venues.address` is JSON: `{city, state, street, zipCode}`
- FK patterns: trips → `experience:experiences(...)`, experiences → `venue:venues(...)`; NO direct trips→venues FK
- `venue_users` table (NOT `venue_employees`): columns are id, venue_id, user_id, role
- `pricing_tiers` has NO `tier_name`; belongs to experience via `experience_id`
- `experiences` has NO `pricing_per_student`
- Trip statuses: `draft`, `pending`, `pending_approval`, `approved`, `confirmed`, `rejected`, `cancelled`, `completed`
- Slip statuses: `pending` → `sent` → `signed` / `signed_pending_payment` → `paid` / `cancelled`

## Pilot Users

Four demo accounts exist for testing. Credentials are stored in the team's password manager (not in source control).
