---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Testing

**Analysis Date:** 2026-11-11

## Test Framework Status

- **Automated Test Runner:** None configured in `package.json` (no `vitest`, `jest`, `playwright`, or `cypress` dependencies or `test` npm script)
- **Test Files:** Zero `*.test.*` or `*.spec.*` files exist in `src/` or `supabase/`

## Available Quality Checks

- **Type-checking:** `npx tsc --noEmit` (uses `tsconfig.json` strict settings)
- **Linting:** `npm run lint` / `bun run lint` (`eslint .`, includes Prettier formatting rules)
- **Formatting:** `npm run format` / `bun run format` (`prettier --write .`)
- **Production Build Verification:** `npm run build` / `bun run build` (`vite build`)

## Operational & Data Verification Scripts

While there is no automated unit/E2E suite, ad-hoc verification and data audit scripts exist outside `src/`:
- `check_live_saf.ts` - Root-level verification script for SAF records
- `scripts/*.mjs` - Audit and migration verification scripts (e.g., `scripts/audit_all_12_files.mjs`, `scripts/audit_compare_fields.mjs`)

## Testing Gaps & Recommendations

- **New Routes & Client State:** New standalone routes (such as `/assessment`) and client persistence logic (timer calculations, `localStorage` recovery across reload/close) have no existing test harness; manual browser verification or adding Vitest for pure timer/state utilities is recommended when introducing complex stateful flows.
- **Pre-commit / CI Gate:** Rely on `npx tsc --noEmit`, `npm run lint`, and `npm run build` to verify type safety, TanStack Router route generation (`src/routeTree.gen.ts`), and SSR bundling before shipping changes.

*Testing analysis: 2026-11-11*
