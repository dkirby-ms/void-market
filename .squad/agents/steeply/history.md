📌 Imported from squad-export on 2026-03-16T23:54:49.470Z. Portable knowledge carried over; project learnings from previous project preserved below.

# steeply — History

## Project Context
- **Project:** playgrid
- **Description:** Play classic games with friends
- **Studio:** eschaton-studio
- **Created:** 2026-03-14T01:09:23Z

## Cross-Agent Update — PR #122 Final Fix & Approval (2026-03-16)

**Lockout Protocol Escalation:** Gately → Pemulis → Steeply

- **Issue:** Pemulis's lifecycle fix did not cover the `handleReconnectionTimeout` cleanup path
- **Fix:** Ensured `finalizeParticipantDeparture` is called, which properly triggers `releaseControllerOwnedParticipants`
- **Regression Test:** Added coverage in `BaseGameRoom.test.ts` confirming synthetic player removal and draw outcome (not forfeit)
- **Build:** Passed
- **Re-review:** Hal approved (third review cycle)
- **Status:** PR #122 merged to `dev` ✅

---

## Cross-Agent Update — 2026-03-17: React Adoption & Design System Alignment

**From:** Squad Scribe (Hal + Mario session)  
**Event:** Figma design analysis complete; React adoption decision + design system reference

**What Changed:**
- **Hal Decision:** Adopt React 18 for DOM overlays (hybrid PixiJS + React model)
  - Figma export: 6 screens, 48 shadcn/ui components, ~3,000 lines React code
  - Cost-benefit: 3-4 week vanilla TS rewrite vs. ~5.5 day Phase 1 acceleration
  - React integration accelerates Phase 1 (4 weeks → 3.5 weeks)

- **Mario Decision:** Design system reference extracted and documented
  - Framework-agnostic reference (colors, typography, spacing, 58 components, layout, accessibility)
  - Single source of truth preventing UI drift
  - Section 16: Accessibility (WCAG AA compliance, keyboard nav, screen readers)

**Your Task (Design Validation):**
- Test coverage for UI accessibility (WCAG AA compliance)
  - Contrast ratios: all text ≥ 4.5:1
  - Keyboard navigation: focus management, arrow keys, Tab/Shift+Tab
  - Screen reader support: semantic HTML, ARIA labels
  - Color independence: status colors paired with text/icons, not color-only
- Responsive testing: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)
- Touch targets: ≥44px height per WCAG 2.1 (mobile), ≥36px (desktop)
- PixiJS canvas rendering: 60 FPS desktop, 30 FPS mobile
- State sync: no Colyseus desyncs, 50-100ms latency acceptable

**Related Decisions:**
- `.squad/decisions.md` — "Figma Design System Conversion Strategy" (Hal)
- `.squad/decisions.md` — "Design System Reference" (Mario)
- `docs/DESIGN-SYSTEM.md` — Section 16 (Accessibility)

**Coordination:**
- Gately: Implementing React + Tailwind CSS 4 setup (P0-4.1)
- Pemulis: Using Figma gameState.ts for Colyseus schemas (P1-1)
- Phase 1 acceleration: 4 weeks → 3.5 weeks

---

## Learnings
- Lobby gameType coverage lives in `server/src/__tests__/lobby-pregame.test.ts`; the useful seams are the mocked `gameRegistry` responses plus `GAME_LIST`/`GAME_UPDATED` payload assertions to verify type propagation and player-limit clamping.
- Checkers Playwright coverage has to follow the current lobby UI, not the old table flow: open `#create-game-modal`, scope joins to the unique `.active-game-card`, and assert the visible lobby shell as "Board Game Lounge" before using the `?e2e=1` harness for in-game state.
- Checkers browser E2E is most stable when tests drive real lobby UI but send in-game moves through the actual browser room objects exposed by `client/src/index.ts` behind the `?e2e=1` harness; root Playwright runs against the server-served app on port 2567 and the deterministic 31-move sequence in `e2e/checkers.spec.ts` covers promotion, king back-move, and a no-valid-moves win.
- Lobby browser E2E can reliably assert against `#lobby-overlay` / `#waiting-room-overlay`, `input[name="player-name"]`, `input[name="game-name"]`, and `.waiting-room-player-name` while driving multiple isolated browser contexts against `npm run dev`.
- The root Playwright run (`npx playwright test`) shares one server process across `e2e/checkers.spec.ts` and `e2e/lobby.spec.ts`, so lobby tests must key off their unique game row in `e2e/lobby.spec.ts` instead of assuming the table starts empty after earlier specs leave in-progress sessions visible.
- `client/src/Application.ts` must import `ConnectionManager`/`ConnectionState` from `client/src/networking/index.ts`; if that wiring is missing, the browser dies at startup before `#lobby-overlay` ever renders and the E2E suite collapses immediately.
- `server/src/__tests__/BaseGameRoom.test.ts` is the right seam for reconnection behavior: instantiate the room off the prototype, stub `allowReconnection`, and assert outcomes through lifecycle hooks plus room state instead of poking private helpers.
- `server/src/__tests__/lobby-pregame.test.ts` already exposes the waiting-room seams needed for disconnect coverage (`waitingPlayers`, `sessions`, `currentGameId`), so lobby reconnection tests should stay there and assert membership preservation/removal behavior directly.
- There is no real client-side `PlaygridApp` harness yet; for startup/sessionStorage reconnect work, Vitest `.todo()` coverage is the safe placeholder until Gately lands the application-side session persistence flow and a controllable `ConnectionManager` seam.
- Issue #91 lobby E2E failures came from stale selectors and brittle assumptions: the suite still targeted the old table UI (`.lobby-table`, `Save Name`) and assumed an empty lobby, while the current UI uses header blur-to-save, a create-game modal, active-game cards, and exact button labels that collide unless selectors are scoped. The reliable pattern is: save names by blurring `input[name="player-name"]`, create unique games through `#create-game-modal`, assert only against the unique `.active-game-card` for that test, and use exact/scoped button locators so shared server state from earlier specs cannot poison lobby assertions.
- CPU opponent E2E tests only need ONE browser context (single human player). The CPU is a synthetic server-side player with session ID `"cpu-opponent"`. CPU games auto-start after the host clicks "Start Game" since the CPU is pre-set to `isReady: true`. The `controllerSessionId` field links the CPU to the human player. CPU turn delay is 200ms — use `expect.poll()` with 10s timeout to wait for CPU responses.
- For stochastic games like Backgammon vs CPU, dynamic move finding is necessary since dice are random. Scan the board in `page.evaluate()` to find valid sources and destinations. For Checkers, compute valid moves by checking piece positions and diagonal offsets (+/-7, +/-9 for moves, +/-14, +/-18 for captures).

## Cross-Agent Update — Issue #1 Closed, PR #47 Open (2026-03-14)

**From:** Joelle (Community/DevRel)  
**Event:** Repo hygiene complete (issue templates, README refresh, CONTRIBUTING guide)

- **Issue #1:** Now closed. Repo hygiene work merged to dev branch.
- **PR #47:** Created (dev→prod) — "Core design: architecture docs, backlog, repo hygiene"
- **Available to you:** Issue templates (bug-report.yml, feature-request.yml, chore.yml), CONTRIBUTING.md, updated README.md
- **Impact:** All agents can now use structured issue templates and refer to CONTRIBUTING.md for contributor guidance.


## Work Complete — Issue #37: Lobby GameType Test Coverage (2026-03-14)

- Added comprehensive test cases for `gameType` field validation in `server/src/__tests__/lobby-pregame.test.ts`.
- Test cases cover: default validation, invalid gameType handling, passthrough behavior, clamping logic, and broadcast coverage.
- All 82/82 tests passing.
- PR #56 merged (squad/37-lobby-tests-gametype).
- **Cross-Agent Impact:** Gately can now rely on stable gameType behavior in client-side implementation. TestNet fully exercised.

## Cross-Agent Update — Issue #54 Complete, PR #55 Merged (2026-03-14)

**From:** Gately (Game Dev)  
**Event:** Room status HUD cleanup complete

- **Issue #54:** Complete. Room undefined status overlay fixed.
- **PR #55:** Merged (squad/54-fix-room-undefined-overlay) — "Fix: room.id undefined in status text, HUD repositioning"
- **Changes:** room.roomId fallback, top-left HUD toast with auto-hide for info states.
- **Impact:** Connection status no longer obstructs gameplay. Room identifiers resolved safely.


## Project Learnings (from import — squad-export)

## Session: E2E Test Suites (Lobby & Checkers) (2026-03-14)

**Status:** ✅ Complete  
**PRs Merged:** #57 (E2E Lobby tests), #58 (E2E Checkers tests)  
**Issues Closed:** #52, #53  
**Session Log:** `.squad/log/2026-03-14T18-10-00Z-e2e-tests.md`

**Work Completed:**
- **PR #57:** E2E Playwright tests for Lobby (14 files, +442/-10)
  - Dedicated `playwright.lobby.config.ts` config
  - Tests cover game list, player join, waiting room, player limits, gameType propagation
  - Approved by Hal, merged to dev
  
- **PR #58:** E2E Playwright tests for Checkers (3 files, +524)
  - Grey Box E2E pattern: UI via DOM, moves via `window.__PLAYGRID_E2E__.app.gameRoom` harness
  - 31-move deterministic sequence covers promotion, king movement, win detection
  - Approved by Hal, merged to dev

**Conflict Resolution:**
- Both PRs and PR #55 modified `client/src/Application.ts`
- Coordinator combined room status HUD (from #55) + E2E harness (from #57)
- Both PRs rebased and merged without issues

**Key Learnings (captured in history):**
1. Lobby gameType coverage lives in `server/src/__tests__/lobby-pregame.test.ts`
2. Useful seams: mocked `gameRegistry`, `GAME_LIST`/`GAME_UPDATED` payload assertions
3. Browser E2E selectors: `#lobby-overlay`, `#waiting-room-overlay`, `input[name="player-name"]`, `.waiting-room-player-name`
4. Checkers E2E stable with deterministic 31-move sequence covering promotion, king movement, no-valid-moves win

**Pattern Approved (Hal):**
- **Grey Box E2E** is canonical for all game plugins (Backgammon, Dominoes, Poker, etc.)
- Template: Use Playwright for UI, harness for game moves, assertions on server state

**Cross-Agent Impact:**
- **Gately:** Checkers E2E now gates game rendering; PR #55 tests pass
- **Pemulis:** Plugin system design should reference Grey Box pattern; each plugin must expose `window.__PLAYGRID_E2E__.app.gameRoom`
- **Future Game Authors:** Refer to PR #58 (Checkers E2E) as template for all game plugin E2E

## Session: E2E Test Suite Fix & ConnectionManager Import (2026-03-14)

**Agents:** Steeply (lead), Gately (support), Hal (review + merge)

### What Happened

Full E2E suite was failing because lobby tests made order-dependent assertions. When checkers E2E ran first, it left sessions in the lobby. Lobby E2E then failed because it expected an empty lobby.

**Steeply's Fix:**
1. Made lobby assertions row-scoped: assert only on game row created by the test, not entire lobby
2. Used unique game names (`Test Game ${timestamp}`) to avoid collisions
3. Tests now pass in any order

**Side Discovery (Gately):**
- ConnectionManager was missing its import in Application.ts
- ConnectionManager property was never initialized
- Without it, connection lifecycle wasn't managed
- Fixed in same PR

**Review & Merge (Hal):**
- Approved PR #78
- Rebased on dev: one automatic conflict resolution (Gately's earlier fix)
- Squash-merged as c740333
- Closed issue #77
- 189 tests passing

**Decision Recorded:**
- Lobby E2E best practice: use unique names + row-scoped assertions
- Prevents test coupling and enables order-independent suites
- Recorded in decisions.md

## Work Complete — Issue #46: Backgammon Logic and Plugin Tests (2026-03-14)

- Created comprehensive test suite for Backgammon plugin with 83 tests covering:
  - **Pure logic functions**: board initialization, dice management, move validation
  - **Movement rules**: valid/invalid moves, direction, distance, blocked points, capturing
  - **Bar re-entry**: forced re-entry, entry point validation, blocked entry
  - **Bearing off**: home board requirement, exact dice, higher dice usage, piece placement rules
  - **Integration**: game initialization, turn progression, action validation, win detection
  - **Edge cases**: forced pass (no valid moves), initial board correctness, player disconnection
- Test file: `server/src/__tests__/backgammon.test.ts`
- All 83 backgammon tests passing
- Follows existing test patterns from Checkers E2E tests
- PR #69 created (draft) — squad/46-backgammon-tests

---

## 2026-03-15: Session Resilience — Two-Layer Test Coverage

**From:** Squad Scribe  
**Event:** Session completed — Reconnection test strategy landed

**What Changed:**
- 4 concrete server-side behavioral tests (green)
- 14 named .todo() contract stubs (client + cross-agent)
- Full reconnection matrix contracts pinned in CI

**Coordination Notes:**
- **Pemulis (Server):** Server-side tests passing for 30s window, cleanup, forfeit scenarios
- **Gately (Client):** Client seams available now; contracts ready for conversion from .todo() to executable tests

**Test Coverage Strategy:**
1. **Server layer (green now):** allowReconnection window, consented leave, timeout forfeits, lobby cleanup
2. **Client layer (pinned as contracts):** sessionStorage persistence, startup reconnect, reconnecting UI, edge cases

**Action for Future Work:**
Finishing agent should convert .todo() stubs to executable tests using Pemulis/Gately seams now available.

**Status:** ✅ Tests pass. Contracts visible in CI without brittle timing dependencies.

## Work Complete — Issue #80: Risk Game Test Suite (2026-03-15)

- Created comprehensive test suite with 64 tests covering Risk game mechanics
- 16 tests passing immediately (territory map, reinforcements, card trade-ins, initial armies)
- 48 tests structured as `.todo()` awaiting Pemulis's plugin action implementations
- Test file: `server/src/__tests__/risk.test.ts`
- Follows Backgammon test pattern (root `__tests__` directory)
- Uses actual imports from Pemulis's implementation (RiskPlugin, riskLogic, territoryData)

**Coverage Areas:**
1. **Territory & Map:** 42-territory validation, adjacency symmetry, continent bonuses
2. **Setup Phase:** Initial army allocation (2-6 players), territory selection
3. **Reinforce Phase:** Territory-based reinforcements, continent bonuses, card trade-ins
4. **Attack Phase:** Validation, dice mechanics, combat resolution, territory capture
5. **Fortify Phase:** Path validation, army movement constraints
6. **Win Conditions:** Territory control, elimination, card transfer
7. **Edge Cases:** Multi-player games, no valid moves, forced trades, disconnection

**Key Learnings:**
- Risk tests follow Backgammon pattern: root `__tests__` directory, not game-specific subdirectory
- Pemulis delivered clean separation: `territoryData.ts` (static map), `riskLogic.ts` (pure functions), `RiskPlugin.ts` (actions)
- Test strategy: validate pure logic functions first (passing), defer plugin integration tests to `.todo()` until actions complete
- Used actual TERRITORIES, CONTINENTS, and logic functions rather than mocks—enables immediate validation
- Combat resolution needs deterministic testing approach (stochastic dice currently uses Math.random)

**Coordination:**
- Pemulis has core logic functions ready: `calculateReinforcements`, `getCardTradeInValue`, `checkWinCondition`, attack/fortify validators
- Plugin action handlers still in progress—48 integration tests remain as `.todo()`
- Tests ready for incremental conversion as Pemulis completes action implementations

---

## 2026-03-15: Cross-Agent Update — PR #83 Revision Complete (Lockout Protocol)

**From:** Scribe (on behalf of Marathe)  
**Event:** PR #83 blockers resolved; lockout protocol applied per Hal's re-review requirement

**Situation:**
- Hal identified three critical blockers in PR #83 (Risk Game Plugin): incomplete test implementation (~48 `it.todo()` placeholders), territory data duplication (server/client drift risk), missing Phase 1 scope documentation.
- Original PR authors (Pemulis, you, Gately) were locked out per protocol — revision could not proceed with original team.

**Resolution:**
- Marathe (DevOps) completed full revision: 60 executable tests, shared territory data refactored to `shared/src/games/risk/`, Phase 1 limitations documented in RiskPlugin.
- All blockers verified: `npm run build` ✅, `npm run lint` ✅, `npm run test` ✅ (60/60 passing).
- Commits: `816332c` (fix), `2692e8a` (docs).

**Impact on Your Work:**
- Your test suite structure remains the baseline; Marathe filled in the `.todo()` placeholders with real test implementations.
- Architectural standard captured in `.squad/decisions.md`: "Test Implementation: PR descriptions must accurately reflect test coverage. `it.todo()` placeholders do not count as implemented tests. Critical game logic must be tested before merge."

**Next Step:** Hal will re-review revised PR #83. Ready for merge once approved.


## Checkers E2E Tests — Full Suite (2026-03-15)

**Session:** Built comprehensive E2E test suite for Checkers game

**Outcome:** ✅ COMPLETED

**Artifacts:**
- File: `e2e/checkers.spec.ts`
- Tests: Modal-based game creation, card-based joining, lobby flow integration
- Status: All passing
- PR: #93 (opened)

**Design Approach:**
- Follows patterns established in PR #92 (lobby E2E fix)
- Uses current UI seams: modal selectors, game card targeting
- Tests order-independent and compatible with shared-server Playwright runs
- Scoped button locators to prevent label collisions

**Dependencies:**
- Depends on PR #92 (merged) for lobby E2E foundation patterns
- Awaiting review before merge

---

## Cross-Agent Update — Lobby E2E Standardization (2026-03-15)

**From:** Hal (Lead)

**Event:** PR #92 (Lobby E2E fix) approved and merged

- **Review outcome:** ✅ APPROVED — fix properly addresses test isolation root cause
- **Standard established:** Lobby E2E tests must use current UI seams and target unique test-created sessions
- **Impact:** Your Checkers E2E suite correctly implements this standard (PR #93)
- **Next step:** Hal will review PR #93


---

## Session 2026-03-16: E2E Coverage Expansion & Testing Leadership

**Role:** E2E test architect, issue filer, test implementation lead  
**Output:** 5 issues filed (#126-129, #131), 5 PRs submitted (#133-138), all merged  

**Summary:**
- Conducted E2E coverage audit → identified 5 critical gaps
- Filed issues #126-129 and #131 with clear acceptance criteria
- Proposed E2E strategy: action pipeline verification for non-deterministic games (Backgammon)
- Implemented Backgammon E2E tests (PR #133): roll → move → turn advance → state sync
  - Random dice adaptation: tests don't attempt deterministic full-game replay
  - Invalid action rejection verified
  - Game-end outcome listener confirmed
  - PR #133 → Hal approved & merged
- Implemented Risk E2E tests (PR #135): 5-move deterministic game replay
  - PR #135 → Hal found Promise.race flakiness
  - Locked out for concurrent changes; Pemulis applied deterministic waiting fix
  - PR #135 re-merged (under Pemulis name)
- Implemented Reconnection E2E tests (PR #134): disconnect → reconnect → 30s timeout
  - State recovery, spectator behavior
  - PR #134 → Hal approved & merged
- Implemented Spectator E2E tests (PR #137): join without slot, read-only sync, spectator → player transition
  - PR #137 → Hal approved & merged
- Implemented CPU Opponent E2E tests (PR #138): human vs CPU for all 3 games, action validation, turn progression, game-end handling
  - PR #138 → Hal approved & merged

**Key Achievement:** Led E2E coverage expansion from ~20% to near-complete. Established action-pipeline verification pattern for random games. All 5 test PRs merged successfully.

**Directives:**
- E2E strategy for non-deterministic games: verify action pipeline, not game logic (game logic covered by unit tests)
- Deterministic waits (page.waitForFunction) are more reliable than Promise.race for E2E test sequencing

**Output:**
- 5 issues filed (#126-129, #131)
- 5 PRs merged (#133-134, #137-138, plus #135 merged under Pemulis)
- 6 issues closed total
- E2E coverage: Checkers ✓, Risk ✓, Backgammon ✓, Reconnection ✓, Spectator ✓, CPU opponents ✓
- All 289 tests passing, 0 flakiness in final merged state

## Fix: E2E getSnapshot() playerColorText reads from sidebar DOM (2026-03-16)

**Root Cause:** Phase 4 visual redesign (commit `4eddedf`) removed the `playerColorText` PixiJS Text property from `CheckersRenderer` and `RiskRenderer`, moving the color label into the HTML sidebar. E2E `getSnapshot()` functions still read `renderer.playerColorText.text`, returning `null` for Checkers/Risk renderers. This caused `startMatch()` to fail with "Expected exactly one black player and one red player" in every test using that helper.

**Fix:** Updated `playerColorText` extraction in `getSnapshot()` across 5 spec files to use an IIFE that tries the PixiJS renderer property first (backward compat for BackgammonRenderer), then falls back to reading `.sidebar-note` elements from the DOM.

**Files Changed:**
- `e2e/checkers.spec.ts`
- `e2e/spectator.spec.ts`
- `e2e/cpu-opponent.spec.ts` (two getSnapshot functions: Checkers + Backgammon)
- `e2e/reconnection.spec.ts`
- `e2e/backgammon.spec.ts`

**Not Changed:** `e2e/risk.spec.ts` — does not use `playerColorText` at all.

**Verification:** All `playerColorText` assertions pass. Remaining E2E failures are unrelated (statusText also removed from PixiJS, controllerSessionId issues, stochastic game logic timing).

**Learnings:**
- When the client UI moves text from PixiJS canvas to HTML DOM, E2E `page.evaluate()` snapshots must read from DOM selectors instead of renderer properties.
- The sidebar `.sidebar-note` class is the reliable selector for player color labels across all game renderers.
- BackgammonRenderer still exposes `playerColorText` as a PixiJS Text property; Checkers and Risk do not (post Phase 4 redesign).

## Fix: E2E getSnapshot() statusText reads from getHUDStatus() (2026-03-16)

**Root Cause:** Phase 4 visual redesign removed the `statusText` PixiJS Text property from `CheckersRenderer`. E2E `getSnapshot()` functions read `renderer.statusText.text`, returning `null` for Checkers. This broke assertions like `expect(statusText).toBe("Your turn")`.

**Investigation:**
- RiskRenderer: still has `statusText` and `phaseText` as functional PixiJS Text objects (added to HUD layer, actively updated) → no fix needed
- BackgammonRenderer: still has `statusText` as PixiJS Text → no fix needed
- CheckersRenderer: no `statusText` property, but exposes `getHUDStatus(state)` which returns `{ text: "Your turn", ... }`

**Fix:** Updated `statusText` extraction in `getSnapshot()` across 4 spec files to use an IIFE that tries the PixiJS renderer property first (backward compat for Backgammon/Risk), then falls back to `renderer.getHUDStatus(state).text`.

**Files Changed:**
- `e2e/checkers.spec.ts`
- `e2e/cpu-opponent.spec.ts` (getCheckersSnapshot only)
- `e2e/reconnection.spec.ts`
- `e2e/spectator.spec.ts`

**Not Changed:**
- `e2e/risk.spec.ts` — RiskRenderer still has both `statusText` and `phaseText` as PixiJS Text
- `e2e/backgammon.spec.ts` — BackgammonRenderer still has `statusText` as PixiJS Text

**Verification:** `npm run build` ✅, `npm run lint` ✅, `npm run test` (292 passing) ✅, `npx playwright test e2e/checkers.spec.ts` (3/3 passing) ✅

**Learnings:**
- `getHUDStatus(state)` is the universal fallback for status text across all renderers that have moved away from PixiJS Text. It returns `{ label, text, detail, accentColor }`.
- BackgammonRenderer does NOT implement `getHUDStatus()` — it's the only renderer that still relies entirely on PixiJS Text for status display.
- The IIFE-with-fallback pattern (try PixiJS → try HUD → return null) is now the standard for E2E snapshot extraction when renderer properties may or may not exist.


## Void Market — New Project (2026-03-17)

**Project:** Void Market — modern multiplayer space strategy game inspired by TradeWars (BBS classic)
**Stack:** Colyseus (multiplayer backend), PixiJS (2D rendering), TypeScript
**User:** dkirby-ms
**Prior art:** Builds on Colyseus/PixiJS framework from Primal Grid and Playgrid

### Core Design Pillars
1. **Turn limits** — each player gets a fixed number of turns/actions per day, creating strategic tension and preventing no-lifers from dominating
2. **Alliances/Federations** — organic player coalitions that form over time, central to the social experience

### Game Features
- Galaxy exploration (sectors, warps, navigation)
- Outpost and mining station construction
- Planet settlement and colonization
- Trading between empires (economy/market system)
- Fleet building (ships for attack and defense)
- Empire growth and federation diplomacy

## Cross-Agent Context (2026-03-17)

**From:** Squad Orchestration  
**Work:** Branching strategy and rename complete

**Impact on Steeply (QA/Test):**
- Game renamed "Galaxy Wars" → "Void Market" across all project files
- Branching strategy live: feature branches follow `squad/{issue-number}-{slug}` pattern targeting `dev`
- CI workflow includes build, test, lint gates on all PRs and dev pushes
- Ready to establish test strategy and E2E coverage patterns for Void Market (coordinate with team)

**Test infrastructure from Playgrid available:**
- CI test execution pattern proven and working
- Can adapt test structure and tooling from previous Colyseus project
- E2E test patterns (grey-box) established from Playgrid work

**Next steps:**
- Review Hal's architecture and Pemulis's game systems for test strategy scope
- Establish test coverage targets for trading loop MVP
- Coordinate with Gately on PixiJS rendering testability and canvas mocking strategies


## Cross-Agent Context (2026-03-17) — Project Plan Published

**From:** Squad Scribe  
**Event:** Hal completed 4-phase project breakdown with 44 concrete tasks

**Project Plan:** `docs/PROJECT-PLAN.md` now live with full task assignments

**Your Task Load (Phase 0–1):** 7 test tasks  
- **P0 (1 task):** Jest/Vitest scaffold with coverage config
- **P1 (6 tasks):** Unit tests (schemas, room logic, economy), integration tests (trading, persistence), client canvas mocking, E2E trading scenarios

**Test-First Approach:** Tests follow implementation (no mandate for TDD), but required before Phase 1 exit. Canvas rendering mocking (Gately) and Colyseus state sync (Pemulis) are key blockers.

**Key Dependencies:**
- Pemulis stability before you test server logic
- Gately's canvas architecture before you mock PixiJS
- Marathe's CI/CD in place (P0-7) before you set coverage gates

**Read:** `docs/PROJECT-PLAN.md` for full task breakdown, sizing, and dependencies.

## Cross-Agent Update (2026-03-17) — Project Tasks as GitHub Issues

**From:** Squad Scribe  
**Event:** Hal created GitHub issues from PROJECT-PLAN.md

**Update:** All 44 project plan tasks are now tracked as GitHub issues #3–#51 with squad:{member} labels.

**Your Issues:** Filter `squad:steeply` in GitHub issues. Phase 0–1 test tasks are assigned with dependencies and acceptance criteria.

**Branching:** Use `squad/{issue-number}-{slug}` convention when creating feature branches. Links commits to issues for traceability.

**Impact:** Project status is now visible in GitHub issues board. Milestones track phase progress. Dependency graph shows blocking relationships.

**Reference:** `.squad/decisions.md` → "Track Project Plan as GitHub Issues" for label taxonomy and conventions.
