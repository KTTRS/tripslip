# TripSlip Master Remediation Execution Spec

_Date: 2026-03-12_

## Purpose

This is the single execution spec that consolidates all findings from:
- `CODEBASE_AUDIT_ACTION_PLAN.md`
- `docs/operations/FEATURE_FUNCTION_INTEGRATION_AUDIT.md`
- `docs/operations/PLATFORM_FUNCTIONAL_FLOW.md`
- `docs/operations/ROUTE_CONNECTIONS_AND_DATA_FLOW_AUDIT.md`
- `docs/operations/SUPABASE_DATABASE_INTEGRATION_AUDIT.md`

It defines **what to fix, in what order, how to verify it, and what “done” means**.

---

## 0) Operating principles (must hold for all tasks)

1. **Teacher + Venue + Parent flow is primary**; School flow is optional unless explicitly policy-required.
2. **Security before convenience** at DB/RLS layer (no broad permissive production policies).
3. **One source of truth** per concern:
   - operational docs,
   - route contracts,
   - database schema/migration truth,
   - environment/bootstrap flow.
4. **Every critical flow must have E2E verification**, not just page-level tests.

---

## 1) Workstream A — Documentation and source-of-truth cleanup

## A1. Consolidate and archive contradictory docs
### Tasks
- Move stale status snapshots into `docs/archive/`.
- Keep a canonical operational runbook and this master spec as primary execution docs.
- Replace references to deprecated docs across repo.

### Acceptance criteria
- No contradictory “working vs not working” root docs remain active.
- Root-level docs list only current canonical entrypoints.

### Validation
- Run local markdown link validation (internal links).
- Verify no broken links to archived/removed files.

---

## 2) Workstream B — Toolchain, bootstrap, and CI determinism

## B1. Standardize workspace tool versions
### Tasks
- Align Vite and Vitest versions across all workspaces.
- Align plugin versions (`@vitejs/plugin-react`, etc.) to compatible single line.

### Acceptance criteria
- `npm ls vite vitest @vitejs/plugin-react` shows intended version policy with no unexpected duplicates.

## B2. Add deterministic setup/preflight
### Tasks
- Add `npm run setup` to install + preflight.
- Add `scripts/preflight.mjs` to validate:
  - node/npm version,
  - required env keys per app,
  - required CLIs available.

### Acceptance criteria
- Fresh clone -> `npm run setup` completes or fails with explicit actionable diagnostics.

## B3. CI enforcement
### Tasks
- Add CI jobs for lint, build, unit/property/integration/smoke (as applicable).
- Add docs-link check job.
- Add workspace-version-drift check.

### Acceptance criteria
- CI fails on broken links, version drift, lint/build failures.

---

## 3) Workstream C — Route topology + cross-portal connection hardening

## C1. Centralized URL builder (critical)
### Tasks
- Create shared URL utility (`packages/utils/src/url-routing.ts`) using explicit app URL envs:
  - `VITE_LANDING_APP_URL`
  - `VITE_VENUE_APP_URL`
  - `VITE_TEACHER_APP_URL`
  - `VITE_PARENT_APP_URL`
  - `VITE_SCHOOL_APP_URL`
- Replace manual `window.location.origin + '/parent/...'` and similar constructions.

### Acceptance criteria
- All cross-portal deep links are built via centralized utility.
- Venue->Teacher->Parent links resolve correctly in both:
  - gateway/path-prefix mode,
  - direct-origin/subdomain mode.

## C2. Explicit runtime mode contract
### Tasks
- Define supported runtime modes:
  1) gateway proxy mode,
  2) direct origin mode.
- Add startup assertion to detect invalid mixed mode.

### Acceptance criteria
- Local startup fails fast when configuration/mode is inconsistent.

## C3. Route contract registry
### Tasks
- Add `docs/operations/ROUTE_CONTRACTS.md` listing every externally shared route with:
  - producer portal,
  - consumer portal,
  - required token/session,
  - failure fallback.

### Acceptance criteria
- All link-generating code paths map to declared contracts.

---

## 4) Workstream D — Supabase security and data-integrity remediation (highest risk)

## D1. Remove test-era permissive policy leakage from production migration path
### Tasks
- Isolate or archive migrations that disable RLS for testing.
- Create a canonical production RLS migration set as latest authoritative state.

### Acceptance criteria
- Critical tables end with `ENABLE ROW LEVEL SECURITY` in final migration state.

## D2. Eliminate broad `USING (true)` / `WITH CHECK (true)` on sensitive tables
### Tasks
- Replace with role- and tenant-scoped predicates.
- Restrict anon policies to token-bound records only.

### Acceptance criteria
- SQL policy audit reports zero forbidden broad policies on sensitive tables.

## D3. Rebuild audit-trigger continuity
### Tasks
- Re-establish deterministic triggers for consent/payment-critical tables:
  - `permission_slips`, `payments`, `refunds`, `trips`.
- Ensure trigger definitions are present in final schema state.

### Acceptance criteria
- Insert/update/delete on critical tables produce expected audit rows.

## D4. Clarify schema source-of-truth
### Tasks
- Mark `supabase/schema.sql` as demo/legacy OR regenerate to match production migration state.
- Document migration lifecycle: active vs test-only vs archived.

### Acceptance criteria
- No ambiguity for new engineers on which schema is canonical.

---

## 5) Workstream E — Core product flow completion and simplification

## E1. Venue-first + Teacher-first dual initiation
### Tasks
- Ensure both initiation modes are implemented and tested:
  - venue invite -> teacher start,
  - teacher creates directly -> optional venue linkage.

### Acceptance criteria
- Either initiation path reaches parent consent flow without dead-ends.

## E2. Manifest gate behavior
### Tasks
- Enforce: invited guest teacher can progress without immediate signup, but manifest export/share unlock requires account completion.

### Acceptance criteria
- Guest can complete setup steps.
- Manifest actions are blocked until signup/login checkpoint, then succeed.

## E3. Optional school governance
### Tasks
- Implement explicit `school_required` policy branching in trip transition logic.

### Acceptance criteria
- If not required: no school approval gate appears.
- If required: gate is enforced before readiness progression.

---

## 6) Workstream F — Payment, notifications, and edge-function reliability

## F1. Stripe pipeline hardening
### Tasks
- Validate full chain:
  - create payment intent,
  - webhook signature verify,
  - payment status update,
  - slip status transition,
  - refund path.

### Acceptance criteria
- Deterministic integration tests for success/failure/refund branches.

## F2. Notification reliability
### Tasks
- Validate send-email/send-sms/send-notification paths with retries and failure logs.
- Ensure user-facing status is consistent with delivery outcomes.

### Acceptance criteria
- Failed deliveries are visible/retriable; no silent failures.

## F3. Dormant edge-function decisions
### Tasks
- For `generate-pdf`, `export-user-data`, `export-student-data`, cleanup/migration utilities:
  - either wire fully to product/admin flows,
  - or formally mark as deferred with ownership/date.

### Acceptance criteria
- No ambiguous “exists but unknown usage” functions remain.

---

## 7) Workstream G — Testing strategy to prove end-to-end completion

## G1. Test pyramid and required suites
### Unit
- URL builder and route-contract helpers.
- Policy utility functions and auth guards.

### Integration
- Supabase RLS behavior by actor (teacher, venue, parent, anon).
- Edge function behavior with mocked providers where needed.

### E2E (must-have)
1. Venue-first: generate teacher link -> teacher flow -> parent completion.
2. Teacher-first: trip creation -> parent link -> consent completion.
3. Guest teacher manifest gate.
4. Optional school off (no approval gate).
5. Optional school on (approval gate enforced).
6. Payment success/failure/refund transitions.

### Acceptance criteria
- All 6 E2E scenarios pass in CI.

## G2. Quality gate commands (target green)
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm run test`
- `npm run test:smoke`
- docs link check
- SQL policy assertion checks

### Acceptance criteria
- All gates green on main branch.

---

## 8) Implementation order (recommended)

### Sprint 1 (security + determinism)
- Workstreams B + D critical items.
- Goal: safe DB posture and reproducible developer/CI runs.

### Sprint 2 (connection simplicity)
- Workstream C + E core flow branching and manifest gate enforcement.
- Goal: seamless route/data handoffs and simpler operator experience.

### Sprint 3 (reliability completion)
- Workstreams F + G completion and hardening.
- Goal: production-grade trust in payments/notifications/full journey.

---

## 9) Ownership model

- **Platform/Infra**: Workstream B + CI + mode enforcement.
- **Backend/Supabase**: Workstream D + DB integration tests.
- **Frontend/App teams**: Workstreams C + E UX/route simplification.
- **Payments/Comms**: Workstream F.
- **QA/Release**: Workstream G and release-gate validation.

---

## 10) Definition of Done (program-level)

This remediation program is complete only when:
1. Supabase RLS/policy posture passes security assertions (no broad unsafe policies on sensitive tables).
2. Cross-portal links are centrally generated and mode-agnostic.
3. Teacher->Venue->Parent primary journeys pass E2E in CI.
4. Lint/build/test/smoke/docs checks are consistently green.
5. Canonical docs accurately reflect runtime truth and migration policy.

