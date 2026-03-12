# Database Migration Policy

## Purpose
Define the canonical lifecycle for Supabase migrations so deployment behavior is deterministic and audit-friendly.

## Active migration directory
- Executable migrations must live in `supabase/migrations/` and be `.sql` files with sortable timestamp prefixes.
- Only files intended to run in Supabase migration order belong in the active directory.

## Archive directory
- Non-executable artifacts must live in `supabase/migrations/_archive/`:
  - `*.old`
  - `*.skip`
  - validation notes (`validate_*.md`)
  - ad hoc test scripts (`test_*.sql`)

## Naming requirements
- Use `YYYYMMDDHHMMSS_description.sql` where practical (or existing project timestamp convention).
- Avoid duplicate timestamps.
- Use concise, specific descriptions.

## Authoring rules
1. Migration must be forward-only and idempotent where feasible.
2. Include RLS/policy updates in same migration set when schema changes affect access.
3. Document destructive changes in PR description and rollback notes.
4. Prefer additive changes first, removal later after backfill/verification.

## Validation workflow
1. Apply migration in local Supabase environment.
2. Run repository quality checks:
   - `node scripts/preflight.mjs`
   - `npm run check:docs-links`
   - `npm run check:versions`
   - `npm run build`
3. If special DB validation notes are needed, place them under `_archive/` with links from docs.

## Rollback strategy
- Migrations are append-only; do not edit applied historical files.
- Roll forward with corrective migrations when failures occur.
- For emergency rollback, restore from database backup and document incident in operations runbook.

## Ownership
- Backend/DB owner reviews all migration PRs.
- Changes to this policy require platform and backend approval.
