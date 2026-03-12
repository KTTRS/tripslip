# TripSlip Feature + Function Integration Audit (Current State)

_Date: 2026-03-12_

## Scope

This audit reviews the current codebase implementation status for:
- all five portals (landing, venue, school, teacher, parent),
- shared package capabilities,
- Supabase edge functions/integrations,
- and build/test integration health.

Status legend used throughout:
- **✅ Integrated**: feature is implemented, routed/wired, and included in build.
- **🟡 Partially Integrated**: implemented but blocked by configuration, missing end-to-end wiring, or reliability gaps.
- **🔴 Broken**: currently failing in validation/build/test execution path.
- **⚪ Not Started / Dormant**: little/no runtime wiring found in app code.

---

## 1) Validation evidence used for this audit

1. `npm run build` completed for all app workspaces, but emitted browser-compat warnings around Node `crypto` usage in shared database service and large chunk-size warnings.
2. `npm run lint` failed in `@tripslip/utils` with 77 lint violations (explicit `any`, unused vars, console usage).
3. `npm run test:smoke` failed due to missing runtime prerequisites:
   - local apps not running on expected ports,
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` not configured.
4. Route inventory reviewed from each app’s `App.tsx`.
5. Edge function inventory reviewed from `supabase/functions/*/index.ts` and reference scan across TS/TSX code.

---

## 2) Portal-by-portal feature inventory and status

## A) Landing Portal (`apps/landing`)

| Feature / Function | Status | Notes |
|---|---|---|
| Home page (`/`) | ✅ Integrated | Routed and buildable. |
| Pricing page (`/pricing`) | ✅ Integrated | Routed and buildable. |
| App-directory page (`/apps`) | ✅ Integrated | Routed and buildable. |
| 404 handling | ✅ Integrated | Explicit catch-all route. |
| Runtime backend integration | ⚪ Not Required | Marketing portal; no core trip writes expected. |

### Assessment
- Landing is the most complete/lowest-risk portal from integration standpoint.

---

## B) Venue Portal (`apps/venue`)

| Feature / Function | Status | Notes |
|---|---|---|
| Auth: login/signup/verify/reset | ✅ Integrated | All auth routes present. |
| Protected route shell | ✅ Integrated | Main app routes are gated. |
| Dashboard | ✅ Integrated | Routed and buildable. |
| Experience list/detail/editor | ✅ Integrated | Create/edit/detail routes wired. |
| Booking management + roster | ✅ Integrated | Bookings + roster routes wired. |
| Financials | 🟡 Partially Integrated | Route exists; depends on Stripe + edge function env/wiring. |
| Employee management | 🟡 Partially Integrated | Route exists; docs still indicate pending invite-email follow-through. |
| Venue profile | ✅ Integrated | Route wired. |
| Stripe Connect account linking | 🟡 Partially Integrated | Edge function exists; contains hardcoded country TODO (`US`). |
| Venue claim workflow | 🟡 Partially Integrated | Service imports Node `crypto` in browser bundle path; Vite warns externalization. |

### Assessment
- Rich feature surface is present, but financial/claim integrations need hardening.

---

## C) School Portal (`apps/school`)

| Feature / Function | Status | Notes |
|---|---|---|
| Auth: login/signup/verify/reset | ✅ Integrated | Routes present and buildable. |
| Role-gated dashboard | ✅ Integrated | `ProtectedRoute` with role requirements. |
| Teacher management page | ✅ Integrated | Route wired. |
| Approvals page | ✅ Integrated | Route wired. |
| District admin dashboard | ✅ Integrated | Role-gated route wired. |
| TripSlip admin dashboard | ✅ Integrated | Role-gated route wired. |
| District detail page | ✅ Integrated | Role-gated route wired. |
| School detail page | ✅ Integrated | Role-gated route wired. |
| Go-to-market relevance right now | ⚪ Dormant by business stage | Product direction says schools are optional and not current adoption center. |

### Assessment
- Technically wired but currently secondary to teacher/venue/parent operating model.

---

## D) Teacher Portal (`apps/teacher`)

| Feature / Function | Status | Notes |
|---|---|---|
| Auth: login/signup/verify/reset | ✅ Integrated | Full route set present. |
| Dashboard | ✅ Integrated | Routed and buildable. |
| Trips list | ✅ Integrated | Routed and buildable. |
| Create trip | ✅ Integrated | Dedicated create route. |
| Trip roster management | ✅ Integrated | Per-trip roster route wired. |
| Permission slip tracking | ✅ Integrated | Per-trip slip tracking route wired. |
| Trip manifest | 🟡 Partially Integrated | Route exists; product requirement now says manifest should be identity-gated for invited guest teachers. |
| Students directory | ✅ Integrated | Route present. |
| Profile management | ✅ Integrated | Route present. |
| Venue search/detail | ✅ Integrated | Search and detail routes wired. |
| Public consent review (`/trip/:token/review`) | 🟡 Partially Integrated | Public route exists; correctness depends on token, env, and parent flow sync. |

### Assessment
- Teacher portal is functionally central and broadly implemented; primary risk is E2E orchestration with parent + venue + auth gating policies.

---

## E) Parent Portal (`apps/parent`)

| Feature / Function | Status | Notes |
|---|---|---|
| Parent auth/login/signup/dashboard | ✅ Integrated | Routes present. |
| Trip lookup by token | ✅ Integrated | Tokenized lookup route exists. |
| Permission slip page (by route and slip ID) | ✅ Integrated | Multiple routes wired. |
| Permission success flow | ✅ Integrated | Success routes present. |
| Payment page + payment success | 🟡 Partially Integrated | Routed, but E2E depends on Stripe + Supabase env and webhook processing. |
| Session expiry handling | ✅ Integrated | Explicit route present. |
| Parent-facing consent completion | 🟡 Partially Integrated | Implemented UI flow exists, but smoke tests currently fail without required env/backend runtime. |

### Assessment
- Parent UX surface exists; production readiness depends on environment + payment orchestration stability.

---

## 3) Shared package capability status

## `@tripslip/database`

| Capability cluster | Status | Notes |
|---|---|---|
| Supabase client creation + lazy proxy | ✅ Integrated | Exported and used across apps/tests. |
| Domain services (experience, trips, notifications, etc.) | ✅ Integrated | Large service surface exported. |
| Venue claim service | 🟡 Partially Integrated | Uses Node `crypto` in browser build path (warnings during build). |

## `@tripslip/auth`

| Capability cluster | Status | Notes |
|---|---|---|
| Auth service + RBAC service | ✅ Integrated | Exported and used by app contexts/guards. |
| Guards (`ProtectedRoute`, role guards) | ✅ Integrated | Used in school/teacher/venue routing. |
| Token helpers and selectors | ✅ Integrated | Exported for cross-app usage. |

## `@tripslip/utils`

| Capability cluster | Status | Notes |
|---|---|---|
| Utility surface (errors, env validation, logging, monitoring, security, FERPA, etc.) | ✅ Integrated (code present) | Broad exports are available. |
| Lint quality gate | 🔴 Broken | Workspace lint currently fails with 77 errors; blocks repo lint success. |

## `@tripslip/ui`

| Capability cluster | Status | Notes |
|---|---|---|
| Shared component library + ErrorBoundary | ✅ Integrated | Imported across all portals. |
| One intentionally disabled export (`document-viewer`) | ⚪ Not Built Out | Commented out due to import issues. |

---

## 4) Edge functions and integration status

| Edge function | Status | Integration assessment |
|---|---|---|
| `create-payment-intent` | 🟡 Partially Integrated | Referenced in app code; requires Stripe + Supabase env + slip data validity. |
| `stripe-webhook` | 🟡 Partially Integrated | Implemented; depends on webhook secret and Stripe event delivery setup. |
| `process-refund` | 🟡 Partially Integrated | Implemented and referenced; requires valid charge IDs + Stripe config. |
| `create-stripe-connect-link` | 🟡 Partially Integrated | Wired; includes TODO for country configurability. |
| `get-stripe-account` | 🟡 Partially Integrated | Implemented and referenced. |
| `get-stripe-payouts` | 🟡 Partially Integrated | Implemented and referenced. |
| `send-email` | 🟡 Partially Integrated | Referenced broadly, but provider/env readiness not verified in this run. |
| `send-sms` | 🟡 Partially Integrated | Twilio-backed; requires credentials and runtime setup. |
| `send-notification` | 🟡 Partially Integrated | Exists; full end-to-end dispatch validation not confirmed. |
| `generate-pdf` | ⚪ Dormant | Implemented function exists but no strong runtime references found in app code scan. |
| `export-user-data` | ⚪ Dormant | Exists; no strong app reference found (likely admin/compliance path not wired). |
| `export-student-data` | ⚪ Dormant | Exists; no strong app reference found (likely admin/compliance path not wired). |
| `cleanup-logs` | ⚪ Dormant | Operational job function; not app-linked. |
| `cleanup-old-data` | ⚪ Dormant | Operational job function; not app-linked. |
| `run-migration` | ⚪ Dormant / restricted | Admin utility function; not app-linked by design. |

---

## 5) End-to-end workflow integration status (teacher/venue/parent priority)

| Workflow | Status | Why |
|---|---|---|
| Venue-first teacher invitation path | 🟡 Partially Integrated | Product flow documented; route/service surfaces exist, but full guest-to-manifest gate path needs explicit E2E verification. |
| Teacher-first trip creation + parent link sharing | 🟡 Partially Integrated | Teacher and parent route surfaces are present; smoke tests currently fail without env/runtime. |
| Parent consent submission and tracking | 🟡 Partially Integrated | Parent and teacher pages exist, but integration test runtime is not green in current environment. |
| Parent payment and reconciliation | 🟡 Partially Integrated | Payment routes/functions exist; production-grade confidence needs webhook + env + integration run. |
| School-governed approval path (optional) | 🟡 Partially Integrated | Role-gated school routes are implemented; adoption is intentionally optional right now. |

---

## 6) What is clearly broken right now

1. **Repository lint gate is failing** (77 errors in `packages/utils`) → blocks clean CI signal.
2. **Smoke suite fails in current environment** due to missing app servers and missing required Supabase env vars.
3. **Shared service browser-compat risk**: `packages/database/src/venue-claim-service.ts` imports Node `crypto`, triggering Vite externalization warnings and `randomBytes` export warnings in app builds.

---

## 7) What appears fully built vs partially built vs not yet operational

## Fully built (code + routing present, build succeeds)
- Landing pages and 404.
- Core auth route surfaces across venue/school/teacher/parent.
- Teacher trip/roster/slip/venue navigation surfaces.
- Venue experience and booking management surfaces.
- Shared UI and auth guard foundation.

## Partially built (implemented but requires integration hardening)
- Stripe payments/refunds/webhooks/connect.
- Parent payment completion + reconciliation confidence.
- Venue claim flow (crypto/browser compatibility + claim verification path hardening).
- Teacher manifest gating policy for guest-invite journeys.
- Notification delivery observability and retry assurance.

## Dormant or not fully wired into app UX
- Data export edge functions (`export-user-data`, `export-student-data`) in active UI flows.
- `generate-pdf` edge function in explicit user workflow.
- Ops utility functions (cleanup/migration) from runtime app surfaces.
- `document-viewer` export in shared UI package (commented out due to import issues).

---

## 8) Immediate “make it truly seamless” priorities (teacher + venue + parent)

1. **Stabilize quality gates first**: bring `npm run lint` to green.
2. **Fix browser-compat in shared database service**: remove Node `crypto` dependency from browser bundles (use Web Crypto).
3. **Make smoke test deterministic**: add startup orchestration and env bootstrap for `test:smoke`.
4. **E2E the dual-initiation flow**: venue-invite guest teacher flow + teacher-first flow with manifest identity gate.
5. **Harden payment chain**: verify `create-payment-intent` -> webhook -> payment/slip state transitions in CI.
6. **Wire/verify dormant compliance features**: export and PDF paths either fully integrate or archive until used.

