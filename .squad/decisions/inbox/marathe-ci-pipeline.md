# Decision: CI Coverage Thresholds Non-Blocking

**Date:** 2026-03-17  
**Owner:** Marathe (DevOps)  
**Status:** Proposed

## Context

The vitest coverage config in `vitest.config.ts` sets 80% thresholds for statements/branches/functions/lines. During Phase 0 scaffolding, the codebase sits at ~79.6% statements due to Colyseus Schema boilerplate in `shared/src/schemas.ts`.

## Decision

Coverage reports are generated in CI but thresholds **do not gate** the build. The `npm run test` step (without `--coverage`) is the merge gate. Coverage artifacts are uploaded for visibility.

## Rationale

- Phase 0 scaffolding code (schemas, enums) has low test coverage by design — it's declarative boilerplate
- Blocking merges on coverage during early development creates false failures
- Coverage artifacts still provide trend visibility without blocking velocity
- Thresholds can be enforced once Phase 1 game logic establishes meaningful test targets

## Revisit

Re-evaluate after Phase 1 MVP ships. Consider enforcing thresholds once active game logic raises coverage naturally.
