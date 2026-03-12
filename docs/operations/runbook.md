# TripSlip Operations Runbook

This is the canonical operations runbook for troubleshooting and recovery.

- Primary runbook: [`docs/runbook.md`](../runbook.md)
- Archived historical app-status snapshots: [`docs/archive/status/`](../archive/status/)

## Local app startup verification (source of truth)

1. Bootstrap dependencies:
   ```bash
   npm run setup
   ```
2. Start local apps:
   ```bash
   npm run dev
   ```
3. Validate routing endpoints:
   - Landing: `http://localhost:3000`
   - Venue: `http://localhost:3001`
   - School: `http://localhost:3002`
   - Teacher: `http://localhost:3003`
   - Parent: `http://localhost:3004`

If local apps fail to load environment variables, restart dev servers and verify `.env` values documented in the root README.

## Governance

- Keep operational guidance here and in `docs/runbook.md`.
- Do not add new top-level status markdown files at repository root.
- Place one-off incident summaries under `docs/archive/status/`.
