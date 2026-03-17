# Decision: Project Phasing & Task Breakdown

**Author:** Hal (Lead)  
**Date:** 2026-03-17  
**Status:** Proposed  
**Artifact:** `docs/PROJECT-PLAN.md`

---

## Decision

Void Market is broken into four implementation phases. Phase 0 and Phase 1 are fully decomposed into 35 concrete tasks with owners, dependencies, and clear scope. Phases 2–4 are scoped at feature level — we decompose them when Phase 1 ships.

## Key Phasing Decisions

### 1. Phase 0 exists (scaffolding before gameplay)
We start from zero source code. Before any game logic, we need: monorepo workspaces, build system, dev environment, CI, Docker, test infra. This is ~9 tasks, ~1 week. No game logic in Phase 0 — just "can we build and run."

### 2. Phase 1 = trading loop only (35 tasks, ~4 weeks)
Aligned with ARCHITECTURE.md MVP scope. Features: galaxy generation, navigation, port trading, turn system, ship progression, persistence, basic auth, PixiJS rendering, HUD. No combat, no planets, no federations. Exit criteria: two players trade simultaneously with persistent state.

### 3. Server and client tracks run in parallel
After shared schemas land (P1-1/2/3), Pemulis builds server systems while Gately builds client rendering. Mario runs fully parallel on design. Steeply follows implementation. This maximizes throughput.

### 4. Persistence is Phase 1, not Phase 0
Database schema, player save/load, and galaxy persistence are MVP-critical. Players must survive server restarts. Deferred to mid-Phase 1 (not scaffolding) because it depends on game schemas.

### 5. Auth is minimal in Phase 1
Username/password + JWT. No OAuth, no social login. Just enough to identify returning players and protect state. Full auth is a Phase 2+ concern.

### 6. Phases 2–4 are NOT decomposed yet
Combat (Phase 2), Alliances (Phase 3), Endgame (Phase 4) are listed at feature level only. We'll decompose when Phase 1 ships and we've learned from the MVP. Premature decomposition of later phases wastes planning effort.

## Dependencies That Matter

- **Shared schemas (P1-1/2/3) gate everything.** Both server and client depend on them. Pemulis owns these and should land them first.
- **GalaxyRoom (P1-5) is the server critical path.** Navigation, trading, turn system all hang off it.
- **Galaxy map renderer (P1-15) is the client critical path.** All other client UI depends on having a rendered galaxy.
- **Database (P1-11) gates persistence.** Without it, no save/load, no auth. Marathe provides Docker Compose for local Postgres in P0-5.

## Team Impact

- **Pemulis:** Heaviest load in Phase 1 (14 server tasks). Schemas → GalaxyRoom → systems → persistence.
- **Gately:** 9 client tasks. Blocked on schemas + Colyseus state sync before meaningful rendering.
- **Steeply:** 7 test tasks. Tests follow implementation — no test-first mandate, but tests are required before Phase 1 exit.
- **Marathe:** 4 infra tasks in Phase 0, lighter in Phase 1 (support role).
- **Mario:** 3 UX tasks, fully parallel, no blockers.
- **Joelle:** 2 doc tasks, follows schema and env completion.
