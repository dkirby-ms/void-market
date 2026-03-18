# Decision: Client Build Pipeline (Gately)

**Date:** 2026-03-18
**Status:** Implemented
**Context:** Issue #6 — Client Scaffold

## Decision

The client workspace now uses Vite for building instead of `tsc --build`.

**Changes to monorepo build:**
- `client/tsconfig.json` uses `noEmit: true`, `composite: false`, `moduleResolution: "bundler"` — TypeScript is used only for type-checking, Vite handles bundling
- Root `tsconfig.json` no longer references `client/` in its `references` array (only `shared` and `server`)
- Root `package.json` build script: `tsc --build && npm run build --workspace=client`

**Changes to ESLint:**
- Switched from `projectService: true` to per-workspace `project` paths for type-aware linting
- This was required because the TypeScript project service couldn't discover non-composite tsconfigs in the monorepo

**Impact:** All agents should be aware that:
1. `npm run build` from root still builds everything (shared + server via tsc, client via Vite)
2. `npm run lint` from root still lints everything
3. Client `npm run dev` starts Vite dev server on port 5173
4. Client `npm run typecheck` runs `tsc --noEmit` for type checking without building
