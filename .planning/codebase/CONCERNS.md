---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Concerns & Technical Debt

**Analysis Date:** 2026-11-11

## Large Monolithic Files

- `src/routes/_authenticated/admin.tsx` (3,945 lines) - Single route file handles table state, filtering, sorting, bulk actions, modals, batch assignment, and Excel export
- `src/routes/index.tsx` (2,154 lines) - Single route file handles multi-section registration form, validation, file uploads, edit-by-reference, and SAF linking
- `src/lib/useBatches.ts` (229 KB) and `src/lib/useBatches.ts.bak` (302 KB) - Large static/hook file with an orphaned `.bak` backup file committed in `src/lib/`

## Workspace Clutter & Artifact Accumulation

- Root directory contains numerous `.xlsx` files (`Sanctioned Data.xlsx`, `V-05.10.2026.xlsx`), data migration markdown reports (`DATA_MIGRATION_*.md`, `DATA_UPDATE_*.md`), `test.html`, and bulk data folders (`approved to dept/`, `batch/`, `bulkbatchassign2/`, `WhatsApp Unknown 2026-10-06 at 5.53.52 PM/`)
- `scripts/` contains 120+ one-off `.mjs` audit/migration scripts and JSON output files

## Security & Deployment Notes

- `vercel.json` sets `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS: "1"` in build env — indicates an older/pinned `@tanstack/react-start` build workaround that should be reviewed when upgrading TanStack Start
- `src/routes/auth.tsx` contains commented-out Google OAuth and Sign Up UI blocks; signup flow remains partially wired in code
- Supabase storage manifests (such as `manifests/maintenance/` in `src/lib/useMaintenance.ts`) allow anonymous/public manifest patterns (`supabase/migrations/20260924140000_allow_anon_write_colleges_manifest.sql`), so any future sensitive data must rely on strict table/RLS design rather than storage manifests

## Reliability & Testing Gaps

- Zero automated unit, integration, or E2E tests (`package.json` has no `test` script), leaving regressions to manual QA
- `eslint.config.js` disables `@typescript-eslint/no-unused-vars`, allowing dead code to accumulate

## Git & Lovable Constraints

- `AGENTS.md` warns that the repository syncs with Lovable — avoid rewriting published git history (no force push, rebase, or amend) and keep the connected branch in a buildable state

*Concerns analysis: 2026-11-11*
