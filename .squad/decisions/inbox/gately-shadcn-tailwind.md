# Tailwind CSS 4 + shadcn/ui Component Library Setup

**Date:** 2026-03-18  
**Author:** Gately  
**Issue:** #7  
**PR:** #62  
**Status:** Implemented

## Decision

Set up Tailwind CSS 4 with the `@tailwindcss/vite` plugin and established the shadcn/ui component pattern with 5 initial components. All 38 theme variables from DESIGN-SYSTEM.md are mapped as CSS custom properties with Tailwind `@theme inline` bindings.

## Key Details

- **Tailwind integration:** `@tailwindcss/vite` plugin (not postcss) — must be listed before `@vitejs/plugin-react` in Vite config
- **Dark mode:** Class-based via `@custom-variant dark` and `class="dark"` on `<html>`
- **Component path:** `client/src/components/ui/` — standard shadcn/ui copy-paste pattern
- **Utility function:** `cn()` at `client/src/lib/utils.ts` (clsx + tailwind-merge)
- **Initial components:** Button, Card, Badge, Input, Label — proves the pattern
- **Radix UI:** 20 primitives pre-installed for future component additions

## Impact on Team

- **All agents:** `npm run build && npm run lint` verified passing with new deps
- **Gately (future):** Add more shadcn/ui components by copying to `client/src/components/ui/` as needed. Use `cn()` for conditional class merging.
- **Mario:** Dark theme CSS vars match DESIGN-SYSTEM.md exactly — no drift
- **Steeply:** Component tests can import from `client/src/components/ui/`
