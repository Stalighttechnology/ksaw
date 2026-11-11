---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Technology Stack

**Analysis Date:** 2026-11-11

## Languages

**Primary:**
- TypeScript 5.8.3 (`tsconfig.json`) - Strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noPropertyAccessFromIndexSignature: true`)
- TSX / React 19.2.0 - Component UI and route views (`src/routes/`, `src/components/`)

**Secondary:**
- SQL (PostgreSQL / Supabase migrations in `supabase/migrations/`)
- Node.js ESM scripts (`.mjs`, `.ts` in `scripts/` and root `check_live_saf.ts`)

## Runtime

**Environment:**
- Browser (React 19 SPA/SSR hydration) and Node.js / Nitro SSR (`src/server.ts`, `nitro` `3.0.260603-beta`)
- Package Manager: Bun (`bun.lock`, `bunfig.toml`) and npm (`package-lock.json`)

## Frameworks & Core Libraries

**Routing & Full-Stack SSR:**
- `@tanstack/react-start` `^1.168.32` - Full-stack React framework with SSR (`src/start.ts`, `src/server.ts`)
- `@tanstack/react-router` `1.170.18` - File-based routing (`src/routes/`, generated tree in `src/routeTree.gen.ts`, router instance in `src/router.tsx`)
- `@tanstack/react-query` `^5.101.1` - Data fetching, caching, and mutations (`src/routes/__root.tsx`, `src/lib/useMaintenance.ts`)

**UI & Styling:**
- Tailwind CSS `^4.2.1` via `@tailwindcss/vite` (`src/styles.css`)
- `tw-animate-css` `^1.3.4` - Animation utilities
- Radix UI primitives (`@radix-ui/react-*`) & shadcn/ui (`components.json`, `new-york` style, `src/components/ui/`)
- `lucide-react` `^0.575.0` - Icon library
- `sonner` `^2.0.7` - Toast notifications (`src/routes/__root.tsx`)
- `recharts` `^2.15.4` - Data visualization
- `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.5.0` (`src/lib/utils.ts`)

**Forms, Validation & Data:**
- `react-hook-form` `^7.71.2` + `@hookform/resolvers` `^5.2.2` + `zod` `^3.24.2`
- `xlsx` `^0.18.5` - Excel spreadsheet import/export (`src/routes/_authenticated/admin.tsx`)
- `date-fns` `^4.1.0` - Date formatting/utilities

## Build, Dev & Tooling

- Vite `8.1.5` (`vite.config.ts`) configured via `@lovable.dev/vite-tanstack-config` `^2.15.0`
- ESLint `^9.32.0` + `typescript-eslint` `^8.56.1` + `eslint-plugin-react-hooks` + `eslint-plugin-prettier` (`eslint.config.js`)
- Prettier `^3.7.3` (`.prettierrc`: `printWidth: 100`, `semi: true`, `singleQuote: false`, `trailingComma: "all"`)
- Scripts (`package.json`): `dev` (`vite dev`), `build` (`vite build`), `preview` (`vite preview`), `lint` (`eslint .`), `format` (`prettier --write .`)

## Configuration

- `vite.config.ts` - Sets `tanstackStart.server.entry = "server"` (`src/server.ts`)
- `vercel.json` - Deployment build env configuration
- `.env` - Client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) and server (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`) environment variables

*Stack analysis: 2026-11-11*
