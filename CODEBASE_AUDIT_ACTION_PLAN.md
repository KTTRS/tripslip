# TripSlip Full-Repository Audit (Code + Docs + Config)

_Date: 2026-03-11_

## Scope and method

I reviewed repository structure, key configs, package manifests, migrations, and documentation consistency, then ran lightweight validation commands to catch broken paths, toolchain failures, and dead-end artifacts.

Primary checks run:
- `rg --files`
- `npm run lint`
- `npm run test:smoke`
- markdown local-link validation script (excluding `node_modules`)
- dependency/version spot-checks across `package.json` files
- migration artifact scan for `.old`, `.skip`, and validation sidecars

---

## Findings

## 1) Contradictory operational docs are creating dead-end troubleshooting flows

- `APPS-NOT-WORKING-SUMMARY.md` says apps are failing due to env loading.
- `APPS-WORKING.md` says all apps are fixed and working.
- Both exist side-by-side at repo root, making operators follow conflicting instructions.
- One command in the "not working" doc is malformed (`ls -la apps/*/. env`), which is a direct dead-end.

**Impact:** Onboarding and incident response become unreliable; teams can lose time following stale guidance.

**Fix:** Consolidate both files into a single source-of-truth runbook and archive/remove stale status snapshots.

## 2) Broken documentation links indicate disconnected docs graph

Automated local-link scan found 3 broken in-repo references:
- `TASK_22_SUMMARY.md -> .github/workflows/cleanup-logs.yml`
- `packages/database/SEARCH_SERVICE.md -> ./VENUE_PROFILE_SERVICE.md`
- `packages/database/SEARCH_SERVICE.md -> ./DATABASE_SCHEMA.md`

**Impact:** Readers hit dead ends when trying to verify implementation details.

**Fix:** Replace bad links with existing targets (or add missing docs); add a CI link-check step.

## 3) Toolchain/version drift between docs and manifests

- README claims Vite 7, while manifests pin Vite 6.x.
- Vitest is mixed across workspaces (1.6.x and 2.1.x), increasing risk of inconsistent behavior and flaky CI.

**Impact:** Non-deterministic developer experience and test outcomes; docs don’t match actual runtime constraints.

**Fix:** Standardize on one Vite/Vitest line and enforce via workspace-wide version policy.

## 4) Root-level script entrypoints are fragile without verified bootstrap

- `npm run lint` failed (`turbo: not found`) before a successful dependency bootstrap.
- `npm run test:smoke` failed (`vitest: not found`) for the same reason.

**Impact:** First-run developer experience breaks quickly; CI/local parity is weak when bootstrap state is unclear.

**Fix:** Add a deterministic bootstrap (`npm ci`) guardrail in docs + optional preflight script that validates required CLIs before task execution.

## 5) Repository hygiene debt (high volume of status-summary artifacts)

- Root contains 90 files, including 70 markdown files.
- Many are phase/task completion snapshots and status variants.

**Impact:** Signal-to-noise is low; maintainers can’t easily identify canonical documentation.

**Fix:** Move historical progress artifacts under `docs/archive/` and keep only canonical docs at root.

## 6) Migration directory contains legacy/deactivated artifacts that can mislead DB workflows

- Presence of `.old`, `.skip`, and numerous `validate_*.md` files in `supabase/migrations`.

**Impact:** New engineers can misread migration execution order or mistake skipped files as active migrations.

**Fix:** Separate executable migrations from notes/archives, add explicit migration policy doc, and enforce naming/lifecycle rules.

---

## Step-by-step remediation plan

### Phase 1 — Stabilize docs and developer entrypoints (Day 1-2)
1. Pick a canonical operational status doc (`docs/operations/runbook.md`) and merge contradictory root docs into it.
2. Delete or archive stale top-level status markdown files to `docs/archive/`.
3. Fix all currently broken internal markdown links.
4. Add a lightweight docs-link CI check (markdown link validator excluding external URLs).
5. Update README toolchain versions to match actual manifests.

### Phase 2 — Standardize build/test toolchain (Day 2-3)
6. Choose one Vitest major version across all workspaces.
7. Align Vite and plugin versions at root/workspaces; remove unnecessary divergence.
8. Add a `scripts/preflight.mjs` command that verifies:
   - node/npm versions
   - required workspace CLIs available
   - required `.env` keys present
9. Add `npm run setup` script that runs deterministic install + preflight.

### Phase 3 — Clean migration and backend workflow boundaries (Day 3-4)
10. Move non-executable migration artifacts (`*.old`, `*.skip`, validation notes) into `supabase/migrations/_archive` or docs.
11. Keep only executable SQL migrations in the active folder.
12. Add `docs/deployment/database-migration-policy.md` with explicit rules (what executes, what is archived, rollback strategy).

### Phase 4 — Enforce and prevent regressions (Day 4-5)
13. Add CI jobs for:
    - docs link checks
    - workspace version drift detection
    - bootstrap sanity (`npm ci && npm run lint && npm run test:smoke`)
14. Add CODEOWNERS/review checklist item requiring updates to canonical docs when behavior changes.
15. Add quarterly repo hygiene task to archive stale status docs and remove dead references.

---

## Suggested ownership

- **Docs lead:** Phases 1 and 4 (documentation governance)
- **Frontend/platform lead:** Phase 2 (toolchain alignment)
- **Backend/DB lead:** Phase 3 (migration lifecycle)
- **DevOps/CI owner:** Phase 4 (policy enforcement)

---

## Expected outcomes after remediation

- Clear single source of truth for operations and setup
- Fewer onboarding failures and faster troubleshooting
- Reproducible lint/test runs across local and CI
- Lower risk in database migration handling
- Reduced repo clutter and better long-term maintainability


---

## Execution status update

The following remediation items have been implemented:

- ✅ Canonicalized operations guidance in `docs/operations/runbook.md` and archived root status snapshots under `docs/archive/status/`.
- ✅ Added docs governance controls via `.github/CODEOWNERS` and `.github/pull_request_template.md`.
- ✅ Added migration lifecycle policy at `docs/deployment/database-migration-policy.md`.
- ✅ Moved non-executable migration artifacts (`*.old`, `*.skip`, `validate_*.md`, `test_*.sql`) into `supabase/migrations/_archive/`.
- ✅ Updated internal documentation links to point at archived migration validation artifacts where relevant.
- ✅ Added full-gate local validation run notes (preflight/docs-links/version-check/build) and explicit environment limitation log for `npm ci` registry restrictions in `REVIEW_COMMENTS_RESOLUTION.md`.
