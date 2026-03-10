# TripSlip Monorepo - Compressed

## Overview

TripSlip is a multi-app monorepo platform designed to streamline school field trip management. It offers a comprehensive solution for schools, teachers, parents, and venues, digitalizing the entire field trip process. Key capabilities include digital permission slips, integrated Stripe payments, real-time communication tools, and robust venue discovery features. The project aims to reduce administrative burden, enhance communication, and provide a seamless experience for all stakeholders involved in organizing and participating in school excursions.

## User Preferences

I prefer iterative development, with a focus on delivering functional components that can be reviewed and refined.
For styling, I prefer the neo-brutalist design system with specific color palettes and interactive elements.
I want to be consulted before any major architectural changes or external dependency integrations.
Ensure all UI/UX decisions adhere strictly to the defined design system.
I expect all new features to have corresponding test coverage.

## System Architecture

TripSlip is structured as a monorepo utilizing npm workspaces and Turborepo, hosting five distinct Vite/React applications and several shared packages. All applications are served through a single reverse proxy on port 5000.

**Applications:**
- **Landing Page (`/`)**: Entry point for the platform.
- **Venue Portal (`/venue/`)**: For venue management.
- **Teacher Portal (`/teacher/`)**: For teachers to manage trips.
- **Parent Portal (`/parent/`)**: For parents to manage permission slips and payments.
- **School Admin Portal (`/school/`)**: For school administrators.

**Shared Packages:**
- `packages/auth`: Supabase authentication helpers.
- `packages/database`: Supabase DB client and type definitions.
- `packages/i18n`: Internationalization utilities.
- `packages/ui`: Reusable UI component library.
- `packages/utils`: General shared utilities.

**Technical Implementations & Feature Specifications:**
- **Routing**: Each React app uses React Router 7 with a `basename` for sub-path routing, managed by the reverse proxy.
- **Styling**: Tailwind CSS with a neo-brutalist design system, featuring specific colors (White, Black, Yellow), custom fonts (Fraunces, Plus Jakarta Sans, Space Mono), and distinctive hover effects (cards/buttons lift up, shadows grow to 8px).
- **Visual Assets**: Utilizes 3D glossy clay render PNG icons and claymation character mascots, deployed to all apps.
- **Supabase Authentication**: Each app uses a unique `storageKey` for Supabase client isolation. Authentication flow includes RPC functions for role assignment and teacher creation during signup, bypassing RLS for initial user setup.
- **Trip Management**: Teachers can create multi-step trip drafts (saved to localStorage), manage student rosters, track permission slip statuses, and handle interactive attendance via a manifest page.
- **Permission Slip Flow**: Features a token-based system for parents to access and submit permission slips without requiring a login. It supports guest consent submissions and optional parent account creation post-submission.
- **Venue Consent Flow**: A specific workflow for venues to send consent links to teachers, which teachers then forward to parents. This allows for indemnification and consent collection with no initial login required for teachers or parents. The teacher review page (`/teacher/trip/:token/review`) shows a manifest of all parent responses with expandable detail rows (student info, parent info, emergency contact, signature). Teachers can add requirements manually or upload PDF/DOC/DOCX/TXT files. PII is role-gated: parent lookups never return other families' data. A "Create Manifest" button appears when slips are returned, gated behind account creation (shows manifest preview with attendance checkpoints, emergency info, exportable roster features, plus signup CTA). Both teacher and parent consent pages include signup prompts at the bottom encouraging free account creation.
- **JA Venue**: "Junior Achievement of Michigan" (venue ID `aa000000-...-0001`) with Marcell Copeland admin (`Mcopeland@jamichigan.org`). Only the "JA Stock Market Challenge" experience remains; all other demo experiences/trips have been removed. Consent document stored at `public/forms/JA_SMC_Consent_Text.txt` and `.docx`.
- **Venue Discovery**: Integrates Geoapify for live venue search, enriching results with Wikipedia data and storing new venues in the database. Prioritizes existing database venues and continuously grows the venue database.
- **UI/UX**: Emphasizes Human-Centered Design with global focus states, `aria-current="page"` for navigation, staggered animations, clear empty states, and improved touch targets for accessibility.

**Deployment Strategy**:
- Development: `start-dev.sh` script launches all Vite dev servers via `turbo dev` and the reverse proxy.
- Production: `vite build` creates static assets for each app, which are then served by `proxy-server.mjs` in a static file serving mode (detects `NODE_ENV=production` or `REPL_DEPLOYMENT=1`).

## External Dependencies

- **Database & Authentication**: Supabase (utilizing Supabase DB client, auth helpers, and PostgreSQL database with RLS policies).
- **Payments**: Stripe (for processing payments related to trips).
- **Venue Discovery & Geocoding**: Geoapify (for Places API, geocoding, and POI search).
- **SMS Communication**: Twilio (for sending SMS notifications, e.g., permission slip links to parents).
- **Email/Marketing Automation**: Customer.io (for transactional emails and marketing campaigns).
- **Monorepo Management**: Turborepo (for build orchestration and caching).
- **Package Management**: npm workspaces.
- **Frontend Framework**: React 19.
- **Build Tool**: Vite.
- **Routing**: React Router 7.
- **Styling**: Tailwind CSS.
- **Runtime**: Node.js 20.