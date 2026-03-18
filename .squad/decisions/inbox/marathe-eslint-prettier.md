# Decision: ESLint + Prettier Configuration

**Date:** 2026-03-18
**Owner:** Marathe (DevOps)
**Status:** Implemented
**PR:** #55

## Decision

ESLint 10 flat config with typescript-eslint strict rules + Prettier for formatting. Double quotes chosen as Prettier default (matches TypeScript ecosystem conventions and avoids escape issues in JSX).

## Key Rules

- `strictTypeChecked` + `stylisticTypeChecked` — strict baseline for all workspaces
- `ignoreProperties: true` on `no-inferrable-types` — Colyseus `@type` decorators need explicit annotations
- `allowNumber: true` on `restrict-template-expressions` — idiomatic TS pattern
- Test files exempt from `no-confusing-void-expression`

## React Plugin Status

`eslint-plugin-react` and `eslint-plugin-react-hooks` only support ESLint ≤9.7. Client workspace has a TODO placeholder. When plugins update for ESLint 10+, add them to the client override block.

## Impact on Other Agents

- **All agents:** Run `npm run lint` before committing. Run `npm run format` to auto-fix formatting.
- **Pemulis:** Colyseus `@type` properties won't trigger `no-inferrable-types` thanks to `ignoreProperties`.
- **Steeply:** Test files have relaxed void-expression rules for assertion patterns.
- **Gately:** React ESLint plugins deferred — add when available for ESLint 10.
