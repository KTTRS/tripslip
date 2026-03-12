# TripSlip Routes, Connections, Communications, and Data-Flow Audit

_Date: 2026-03-12_

## Why this audit exists

This report focuses specifically on whether the platform route topology and cross-portal communications are simple, correct, and seamless for the core journey (Venue -> Teacher -> Parent), while keeping School optional.

It answers:
- Are routes connected in a way that supports real user journeys?
- Are cross-app links generated correctly for deployment topology?
- Do data and events flow to the right systems at the right time?
- Where are the current complexity and confusion risks?

---

## 1) Route topology health (current state)

## Route surfaces are broad and mostly present
- Each portal has a substantial route map and primary pages are wired.
- Teacher, venue, and parent all include the expected journey pages (trip setup/distribution, booking/experience, consent/payment).

## Critical topology coupling pattern
The current app structure depends on **path-prefix routing behind a shared origin gateway** for cross-app deep links:
- `/venue/*`
- `/teacher/*`
- `/parent/*`
- `/school/*`

This is implemented by `proxy-server.mjs` route forwarding and app Vite `base` settings for non-landing apps.

### What this means in practice
- If traffic goes through the gateway/proxy, links like `/parent/trip/:token` can work well.
- If apps are run on separate direct origins/ports (without gateway rewrite), many generated links become brittle or incorrect.

---

## 2) Core route handoff checks (Venue -> Teacher -> Parent)

## A) Venue-generated consent links
Venue experience detail builds links with path prefixes:
- teacher review: `/teacher/trip/:token/review`
- parent consent: `/parent/trip/:token`

Then concatenates with `window.location.origin`.

### Status: 🟡 Partially integrated
- Works when served under shared host + proxy path prefixes.
- Risky when served as separate app domains (or direct app ports) because `window.location.origin` may not match intended app host topology.

## B) Teacher-shared parent links
Teacher roster flow generates parent links as:
- `${window.location.origin}/parent/trip/${token}`

### Status: 🟡 Partially integrated
- Same shared-origin dependency as above.
- No centralized URL builder tied to `VITE_PARENT_APP_URL` despite env support existing in utilities.

## C) Parent link entry points
Parent app supports tokenized routes (`/trip/:token`) and auth/session routes.

### Status: ✅ Integrated route surface, 🟡 integration reliability
- Route exists and aligns with generated path shapes.
- Runtime success still depends on session/token verification + Supabase/edge-function availability.

---

## 3) Communications/integration wiring health

## Edge-function communication pattern exists
App code invokes Supabase functions for key operations:
- payment intent creation,
- notifications/email,
- Stripe account/payout sync,
- refund flows.

### Status: 🟡 Partially integrated
- Function-level wiring is present.
- End-to-end reliability is environment-sensitive (auth headers, secrets, webhook setup, local runtime topology).

## Direct API proxy dependency
Teacher and venue signup flows call internal API endpoints like:
- `/api/signup/find-or-create-school`
- `/api/signup/link-teacher`
- `/api/signup/find-or-create-venue`
- `/api/signup/link-venue-user`

These are implemented in `proxy-server.mjs`, not native Vite proxies in each app config.

### Status: 🟡 Partially integrated
- Works in expected gateway mode.
- Easy to break in isolated app execution or deployments that skip proxy contract.

---

## 4) Data-flow correctness and completion path

## What is good
1. **Trip/token model is coherent**: venue/teacher generate direct link token, parent consumes token route.
2. **Permission/payment status feedback loops exist**: teacher roster reads slip/payment status; parent pages write consent/payment updates.
3. **Role-gated surfaces exist** for teacher/venue/school where expected.

## What currently hurts seamlessness
1. **URL construction is distributed and manual** (many `window.location.origin + '/parent/...'` patterns).
2. **Topology assumptions are implicit** (shared origin + prefix routing), not enforced via one canonical URL service.
3. **Mixed boot modes** (direct per-app dev ports vs gateway mode) create confusion and false negatives in smoke tests and manual QA.
4. **Optional-school logic exists in docs but needs strict enforcement in route transitions** so teacher flow never stalls when no school policy is active.

---

## 5) Connection-quality scorecard (current)

| Area | Score | Status | Why |
|---|---:|---|---|
| Intra-app routing | 8/10 | ✅ Strong | Major screens/routes are present and buildable. |
| Cross-portal deep linking | 6/10 | 🟡 Medium | Works in gateway mode; brittle with direct-origin execution. |
| Data handoff (trip -> slip -> payment) | 7/10 | 🟡 Medium-strong | Core model exists but reliability depends on env + webhook + runtime setup. |
| Communication/event pipeline | 6/10 | 🟡 Medium | Function calls are wired, but E2E observability/reliability still uneven. |
| UX seamlessness for non-technical operators | 5/10 | 🟡 Needs work | Too much implicit topology complexity; link-generation strategy not centralized. |

---

## 6) Highest-impact simplifications to make flow seamless

## 1. Centralize app URL generation (highest priority)
Create one shared URL builder (e.g., `@tripslip/utils/url-routing.ts`) that uses explicit env-based app URLs:
- `VITE_LANDING_APP_URL`
- `VITE_VENUE_APP_URL`
- `VITE_TEACHER_APP_URL`
- `VITE_PARENT_APP_URL`
- `VITE_SCHOOL_APP_URL`

Then replace all manual `window.location.origin + '/parent/...` and similar concatenations.

**Result:** links always target the right destination regardless of local/proxy/subdomain mode.

## 2. Define and enforce two supported runtime modes
- **Mode A: Gateway mode** (`proxy-server.mjs` + path prefixes)
- **Mode B: Direct app origins** (subdomains/ports)

Add startup checks to fail fast if incompatible mode assumptions are detected.

**Result:** fewer hidden route mismatches and faster debugging.

## 3. Formalize cross-portal route contracts
Add a source-of-truth contract doc/table for all externally shared links:
- route template,
- originating portal,
- target portal,
- required token/session preconditions,
- fallback behavior.

**Result:** less drift and fewer broken handoffs.

## 4. Harden optional-school branching in route transitions
Make `school-required` a first-class policy flag in teacher trip state transitions.
- If false: skip approval route transitions entirely.
- If true: enforce approval gate.

**Result:** no teacher dead-ends in current go-to-market model.

## 5. Add end-to-end route-handoff tests (not just unit/smoke)
Priority E2E scenarios:
1. Venue generates teacher link -> teacher opens -> parent link generated.
2. Teacher-first creates trip -> parent completes consent.
3. Guest teacher reaches manifest gate -> prompted to finalize signup/login.
4. Optional school off -> no approval gate.

**Result:** verifies real process completion, not just page availability.

---

## 7) Bottom-line answer to “is the flow seamless right now?”

**Short answer:** not yet fully seamless.

- The major route and data-flow building blocks are present.
- The platform is **functionally connected** but still **operationally fragile** because route handoffs rely on implicit deployment topology and distributed URL construction.
- By centralizing URL contracts, enforcing runtime mode rules, and validating the 4 critical E2E handoff journeys, TripSlip can move from “partially integrated” to “consistently seamless” for teachers, venues, and parents.

