# Supabase Database Integration Audit (Schema, RLS, RPC, and Flow Integrity)

_Date: 2026-03-12_

## Purpose

This report is a dedicated deep-dive into the Supabase layer (not just frontend routes/docs).
It evaluates whether database structures, access controls, functions, and event wiring are sufficient for a seamless and safe Venue -> Teacher -> Parent process.

Status legend:
- **✅ Healthy**: implementation is coherent and suitable for production behavior.
- **🟡 Partial**: implemented but with notable gaps/risk.
- **🔴 Critical**: currently unsafe, inconsistent, or likely to break core expectations.

---

## 1) Database footprint and architecture depth

## What exists
- Migration set contains a broad domain model (54 created tables across trips, slips, bookings, approvals, media, payments, notifications, logs).
- Core entities for current GTM model exist: `trips`, `permission_slips`, `students`, `parents`, `student_parents`, `experiences`, `venues`, `payments`, `refunds`.
- Supporting entities for future/extended scope also exist: approvals, venue claims, reviews, tags/categories, audit/logging, drafts, messaging.

## Status: ✅ Strong breadth, 🟡 mixed operational integrity
- Breadth is not the problem; consistency and policy hardening are.

---

## 2) RLS posture (most important finding)

## Critical result from migration-state analysis
Final RLS operations across migrations indicate some sensitive tables still end in `DISABLE ROW LEVEL SECURITY`, including:
- `approval_chains`
- `approval_chain_steps`
- `trip_approval_routing`
- `approval_conversations`
- `approval_delegations`
- `data_sharing_consents`
- `venue_reviews`
- `venue_tags`
- `venue_tag_assignments`

### Status: 🔴 Critical
Even if this was introduced for testing, these are in timestamped migration history and can produce unsafe production state if applied as-is.

## Over-permissive policy patterns found
Multiple migration files create policies with `USING (true)` / `WITH CHECK (true)` patterns (including anon policies in newer “fix” migrations).

### High-risk examples
- `slips_anon_select` and `slips_anon_update` set to unrestricted `true` checks in `20250306000014_fix_teacher_insert_policies.sql`.
- `students_anon_select`, `trips_anon_select`, `venues_anon_select`, `experiences_anon_select`, and similar broad anon reads in `20250306000013_anon_student_access.sql`.
- `permission_slips_anon_insert` with `WITH CHECK (true)` in `20250306000016_trip_link_anon_access.sql`.

### Status: 🔴 Critical
Current policy direction favors permissiveness over least-privilege. This directly threatens data isolation and can create accidental cross-tenant exposure.

---

## 3) Schema source-of-truth mismatch risk

## Observed mismatch
- `supabase/schema.sql` is a simplified 6-table permissive schema with allow-all policies.
- migration history defines a much larger production-like schema (54 tables, many RLS files, policy patch migrations).

### Status: 🔴 Critical documentation/runtime drift
This duality makes onboarding and recovery dangerous:
- Engineers can apply/inspect the wrong schema representation.
- Security posture appears radically different depending on which file is treated as canonical.

---

## 4) Trigger/audit integrity

## What is present
- Audit/logging tables and trigger functions exist.
- `audit_log_trigger()` and `create_notification()` are defined in supporting migrations.

## Integrity concerns
- Several migrations explicitly drop permission-slip audit triggers/functions and do not clearly re-establish an equivalent final trigger chain in the same migration family.
- A migration exists that drops all non-internal triggers on `permission_slips`.

### Status: 🟡 Partial trending to 🔴 for compliance-sensitive flows
For consent/payment records, audit continuity is mandatory. Trigger churn without a clear final state contract creates compliance and forensic gaps.

---

## 5) RPC/function contract health

## Positive
- Utility functions for ownership scopes exist (`get_my_roster_ids`, `get_my_trip_ids`, `get_my_student_ids_as_parent`) and are used by some later policies.
- Cleanup/logging functions and webhook event tables exist.

## Risks
- `run-migration` edge function executes arbitrary SQL via `exec_sql` RPC path (admin-only intent, but very high blast radius).
- Token-based access patterns rely on `current_setting('app.magic_link_token')` / `current_setting('app.direct_link_token')` in some older policies while newer migrations add broad anon policies, creating conflicting security models.

### Status: 🟡 Partial
Functionality exists, but model consistency (strict token-scoped access vs broad anon access) is unresolved.

---

## 6) Venue -> Teacher -> Parent data-flow validation through DB layer

## A) Venue creates/publishes and shares links
- Data primitives exist (`experiences`, `trips`, `direct_link_token`).
- Link token indexing exists.

**DB status:** ✅ Core model exists, 🟡 security controls inconsistent.

## B) Teacher trip + roster + slip generation
- Teacher-owned trip and roster joins are represented.
- Slip uniqueness `(trip_id, student_id)` helps avoid duplicates.

**DB status:** ✅ Structural support is solid.

## C) Parent consent and payment updates
- Slip status, form payload, signature, signed-by-parent, and payment rows are modeled.
- Payment/refund tables plus webhook event capture exist.

**DB status:** 🟡 Partial
- Works structurally, but permissive anon policies and audit-trigger uncertainty reduce trust and traceability.

## D) Optional school approvals
- Approval schema exists in depth.

**DB status:** 🟡 Partial / 🔴 risk
- Several approval-related tables appear to end with RLS disabled in migration sequence, which is not acceptable for production governance workflows.

---

## 7) What is truly “not enough information” in prior audits (now addressed)

This database-specific audit adds the missing layer:
1. Explicit RLS final-state findings (including tables ending disabled).
2. Explicit detection of broad anon/auth `true` policies.
3. Explicit schema source-of-truth conflict between `schema.sql` and migration reality.
4. Explicit audit-trigger continuity risk on `permission_slips`.
5. Explicit mapping of DB trust gaps to user-facing flow reliability and safety.

---

## 8) Supabase-specific remediation plan (ordered)

## Phase 1 — Lock down security posture immediately
1. Remove or quarantine all test-only RLS-disabling migrations from production migration path.
2. Replace `USING (true)` / `WITH CHECK (true)` policies with scoped predicates per actor and tenant.
3. Restrict anon access to token-bound rows only (no global anon reads on core entities).

## Phase 2 — Rebuild canonical policy model
4. Produce one canonical “final RLS policy set” migration per core table family.
5. Add SQL assertions in CI that fail if critical tables are not RLS-enabled.
6. Add SQL assertions that fail if forbidden broad policies (`USING (true)` on sensitive tables) are present.

## Phase 3 — Restore audit continuity guarantees
7. Recreate deterministic audit trigger chain for `permission_slips`, `payments`, `refunds`, `trips`.
8. Add migration tests asserting trigger existence and insert/update/delete audit behavior.

## Phase 4 — Remove schema ambiguity
9. Replace/annotate `supabase/schema.sql` so it cannot be mistaken for production canonical schema.
10. Document migration execution contract: active vs archived vs test-only.

## Phase 5 — Validate end-to-end with database truth checks
11. Add integration tests that execute full Venue -> Teacher -> Parent flow and assert:
    - row-level visibility by actor,
    - correct status transitions,
    - audit rows emitted,
    - no unauthorized anon reads/writes.

---

## 9) Bottom line

The Supabase layer is **feature-rich but security/integrity inconsistent** in its current migration state.

- **Process capability exists** (trip, slip, payment, messaging structures are there).
- **Seamless/safe execution is not yet guaranteed** because RLS and policy strictness are currently mixed between secure intent and broad test-era permissiveness.

Until RLS/policy hardening and audit-trigger continuity are finalized, the platform should be treated as **🟡 partial integration with 🔴 security/compliance blockers** at the database layer.

