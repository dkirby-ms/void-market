# Void Market — Project Plan

**Author:** Hal (Lead)  
**Date:** 2026-03-17  
**Status:** Active  
**Source of truth:** `docs/ARCHITECTURE.md`, `docs/GAME-SYSTEMS.md`, `docs/UX-BRIEF.md`

---

## Overview

This plan breaks Void Market into four implementation phases, starting from zero source code. Phase 0 (scaffolding) and Phase 1 (MVP trading loop) are fully decomposed into concrete tasks. Phases 2–4 are scoped at the feature level — we'll decompose them when Phase 1 ships.

**Team key:**
| Agent | Role | Owns |
|-------|------|------|
| Pemulis | Server/Systems | Colyseus rooms, game logic, data layer, schemas |
| Gately | Client | PixiJS rendering, HUD/DOM, client state, input |
| Steeply | Testing | Unit tests, integration tests, E2E |
| Marathe | DevOps/Infra | CI/CD, Docker, Azure, database setup |
| Joelle | Docs | API docs, onboarding, living docs |
| Mario | UX | Wireframes, design tokens, interaction specs |

---

## Phase 0: Scaffolding

**Goal:** Monorepo builds, lints, and runs an empty Colyseus server + PixiJS client that connect over WebSocket. CI passes. A developer can `npm install && npm run dev` and see something.

**Duration:** ~1 week

### Tasks

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P0-1 | Monorepo workspace setup | Pemulis | — | Initialize npm workspaces: `server/`, `client/`, `shared/`. Root `package.json` with workspaces config. `tsconfig.json` base + per-package extends. Strict TypeScript. ESM throughout. Node.js 22. |
| P0-2 | Shared package scaffold | Pemulis | P0-1 | `shared/` package with barrel export. Add placeholder types: `ActionType`, `MessageType`, `Commodity` enums. Colyseus Schema base classes (empty). Build produces `.js` + `.d.ts`. |
| P0-3 | Server scaffold | Pemulis | P0-2 | Colyseus server entry point (`server/src/index.ts`). Express + Colyseus `Server` instance. Placeholder `GalaxyRoom` that accepts connections and logs join/leave. Health check endpoint (`/health`). Loads port from env. |
| P0-4 | Client scaffold | Gately | P0-2 | Vite + PixiJS 8 app. `client/src/main.ts` initializes PixiJS `Application`, renders a placeholder star field. Colyseus SDK connects to server. Displays connection status on screen. |
| P0-5 | Dev environment | Marathe | P0-3, P0-4 | Root `npm run dev` starts server + client concurrently (`concurrently` or `turbo`). `.env.example` with required vars. Docker Compose for local PostgreSQL + Redis (services only, app runs native). `README.md` dev setup instructions. |
| P0-6 | CI pipeline update | Marathe | P0-1 | Update existing GitHub Actions workflows to run `npm ci && npm run build && npm run lint && npm run test` across workspaces. Ensure PR gate works on `dev` branch. |
| P0-7 | Linting & formatting | Marathe | P0-1 | ESLint flat config (root + per-workspace). Prettier config. Lint scripts in each workspace. Husky + lint-staged for pre-commit (optional). |
| P0-8 | Dockerfile | Marathe | P0-3 | Multi-stage Dockerfile: build all workspaces → production image with server + built client (static). Health check in Dockerfile. Works with existing CI/CD workflows. |
| P0-9 | Test infrastructure | Steeply | P0-1 | Vitest config (root + per-workspace). Shared test utilities in `shared/src/test-utils/`. First smoke test: `shared/` builds and exports correctly. Coverage config. |

**Phase 0 exit criteria:** `npm run dev` starts server on :2567, client on :5173, WebSocket connects, CI green.

---

## Phase 1: MVP Trading Loop

**Goal:** A playable game where multiple players log in, navigate a galaxy, trade commodities at ports, spend turns, upgrade ships, and persist progress across sessions. No combat, no planets, no federations.

**Duration:** ~4 weeks

### 1A — Shared Schemas & Types (Week 1)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-1 | Galaxy state schemas | Pemulis | P0-2 | Colyseus `Schema` classes in `shared/`: `GalaxyState`, `SectorSchema`, `PlayerSchema`, `ShipSchema`, `PortSchema`, `CargoSchema`, `CommoditySchema`. Types decorated with `@type()` for delta sync. Only MVP-relevant fields (no combat, no planets, no federation). |
| P1-2 | Shared constants & config | Pemulis | P0-2 | `shared/src/constants.ts`: turn costs (`MOVE=1`, `TRADE=2`), commodity names, port type definitions (SBB, BSB, BBS, etc.), ship type stats (Merchant, Scout), galaxy generation params (500 sectors). Configurable via env where appropriate. |
| P1-3 | Message protocol types | Pemulis | P0-2 | TypeScript interfaces for all client→server messages (`MoveMessage`, `TradeMessage`, `DockMessage`) and server→client messages (`ErrorMessage`, `TradeResultMessage`). Shared between client and server. |

### 1B — Server: Galaxy & Navigation (Week 1–2)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-4 | Galaxy generator | Pemulis | P1-1, P1-2 | Procedural galaxy graph: 500 sectors, each with 2–6 warp connections. Uses seeded RNG for reproducibility. Places ports (4 types, ~40% of sectors have ports). Outputs `GalaxyState` schema. Runs in `GalaxyRoom.onCreate()`. |
| P1-5 | GalaxyRoom core | Pemulis | P1-4, P1-3 | `GalaxyRoom` implementation: `onCreate` generates galaxy, `onJoin` spawns player in starting sector, `onLeave` marks offline. Message handlers for `move` and `dock`. Turn validation on every action. State broadcasts via Schema sync. |
| P1-6 | Navigation system | Pemulis | P1-5 | `NavigationSystem` class: validates warp connections, deducts turn cost (1 per hop), updates `player.currentSector`, updates sector `shipsPresent`. Handles edge cases: invalid sector, no warp, insufficient turns. |
| P1-7 | Turn system | Pemulis | P1-5 | `TurnSystem` class: turn regeneration (1 per 90s via Colyseus clock tick), bank cap (2000), turn deduction on actions, new player starting turns (500). Server-authoritative — client cannot set turns. |

### 1C — Server: Trading & Economy (Week 2–3)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-8 | Port & commodity system | Pemulis | P1-5, P1-2 | `TradingSystem` class: buy/sell at ports, dynamic pricing (stock-based formula from GAME-SYSTEMS.md), stock depletion on trade, restock on slow tick (10% per hour). Turn cost: 2 per trade action. Validates: player docked, port has stock, player has cargo space/credits. |
| P1-9 | Ship & cargo model | Pemulis | P1-1 | Ship types with stats (Merchant: 100 holds, slow; Scout: 25 holds, fast). Cargo management: load/unload commodities, capacity validation. Ship upgrade: spend credits at Class-0 port to switch ship type. |
| P1-10 | Economy tick | Pemulis | P1-8, P1-7 | Colyseus clock: fast tick (1s) for turn regeneration, slow tick (60s) for port restocking and price normalization. Configurable tick rates. |

### 1D — Server: Persistence (Week 2–3)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-11 | Database schema | Pemulis | P0-5 | PostgreSQL migration files: `users`, `players`, `ships`, `sectors`, `ports` tables. Use a migration tool (e.g., `node-pg-migrate` or `kysely`). Seed script for dev data. |
| P1-12 | Player persistence | Pemulis | P1-11, P1-5 | Save player state (sector, turns, credits, cargo, ship) on `onLeave` and periodic auto-save. Load on `onJoin`. Handle new vs. returning players. |
| P1-13 | Galaxy persistence | Pemulis | P1-11, P1-4 | Save generated galaxy to DB on first run. Load from DB on subsequent server starts (same galaxy persists). Port stock levels saved/restored. |
| P1-14 | Auth scaffold | Pemulis | P1-11 | Basic auth: username/password registration and login. JWT or session token. No OAuth yet — just enough to identify returning players. Password hashing (bcrypt). Login endpoint on Express. Token sent with Colyseus `joinOrCreate`. |

### 1E — Client: Galaxy Rendering (Week 2–3)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-15 | Galaxy map renderer | Gately | P0-4, P1-1 | PixiJS scene: render sectors as nodes, warp connections as lines. Color-code sectors (has port, has player, empty). Camera: pan and zoom controls. Procedural rendering — no sprite assets required yet. |
| P1-16 | Player ship rendering | Gately | P1-15 | Render player's ship at current sector. Show other players' ships as different-colored markers. Animate movement between sectors (lerp). |
| P1-17 | Colyseus state sync | Gately | P1-15, P1-5 | Connect to `GalaxyRoom`, subscribe to state changes. Update galaxy map when sectors/players change. Handle connection errors, reconnection. Optimistic movement prediction with server reconciliation. |
| P1-18 | Sector detail view | Gately | P1-15, P1-17 | Click sector → show detail panel (DOM overlay): sector ID, warp connections, ships present, port info (if any). "Move here" button (if adjacent). Breadcrumb: Galaxy Map → Sector View. |

### 1F — Client: Trading UI & HUD (Week 3–4)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-19 | HUD — turn counter & resources | Gately | P1-17 | Always-visible DOM overlay: turn counter (top-right, color-coded per UX brief: green→amber→red), credits, cargo summary. Updates in real-time from Colyseus state. |
| P1-20 | Trading interface | Gately | P1-18, P1-8 | When docked at port: DOM panel showing port inventory, prices, buy/sell controls. Shows turn cost per trade. Disables actions when insufficient turns/credits/cargo space. Confirms trade, shows result. |
| P1-21 | Ship status panel | Gately | P1-19 | Panel showing: ship type, cargo hold (used/max), current cargo breakdown (ore/organics/equipment/credits). Ship upgrade option when at Class-0 port. |
| P1-22 | Notification system | Gately | P1-19 | Toast notifications for: trade completed, turn spent, error messages, turn regeneration milestones. Queue-based, auto-dismiss. |
| P1-23 | Login/registration screen | Gately | P1-14 | Simple DOM form: username + password, login/register toggle. On success, connects to GalaxyRoom with auth token. Error display for invalid credentials. |

### 1G — UX & Design (Parallel)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-24 | Design tokens & palette | Mario | — | Define color palette (dark theme per UX brief: zinc-900 base), typography scale, spacing system, component sizing. Output as CSS custom properties + TypeScript constants for PixiJS. |
| P1-25 | Galaxy map interaction spec | Mario | P1-24 | Wireframes/specs for: galaxy map zoom levels, sector hover states, click targets, information density at each zoom. Mobile-first (375px baseline). |
| P1-26 | Trading flow wireframes | Mario | P1-24 | Wireframes for: port detail panel, buy/sell interaction, trade confirmation, cargo management. Turn cost visibility per UX brief. |

### 1H — Testing (Continuous)

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-27 | Galaxy generator tests | Steeply | P1-4 | Unit tests: generated galaxy has correct sector count, all sectors reachable (connected graph), port distribution within expected range, seeded RNG produces deterministic output. |
| P1-28 | Navigation system tests | Steeply | P1-6 | Unit tests: valid move succeeds and deducts turn, invalid warp rejected, insufficient turns rejected, player sector updated correctly, sector ship lists updated. |
| P1-29 | Trading system tests | Steeply | P1-8 | Unit tests: buy/sell updates cargo and credits correctly, dynamic pricing formula produces expected values, stock depletion works, insufficient credits/cargo space/turns rejected. Port restock over time. |
| P1-30 | Turn system tests | Steeply | P1-7 | Unit tests: turn regeneration rate correct, bank cap enforced, turn deduction on actions, new player starting turns. Time-based tests use fake timers. |
| P1-31 | GalaxyRoom integration tests | Steeply | P1-5, P1-6, P1-8 | Integration tests: player joins room, moves between sectors, trades at port, turns deducted correctly. Uses Colyseus test utilities (`@colyseus/testing`). Multiple concurrent players. |
| P1-32 | Client smoke tests | Steeply | P1-17 | Smoke tests: client connects to server, receives galaxy state, renders without errors. May use headless browser or PixiJS test utilities. |
| P1-33 | Persistence tests | Steeply | P1-12, P1-13 | Integration tests: player state survives server restart (save on leave, load on join). Galaxy persists across restarts. Uses test database. |

### 1I — Documentation

| ID | Task | Owner | Depends On | Description |
|----|------|-------|------------|-------------|
| P1-34 | API message reference | Joelle | P1-3 | Document all client↔server messages: name, payload schema, validation rules, expected responses. Living doc — update as messages change. |
| P1-35 | Dev onboarding guide | Joelle | P0-5 | Getting started guide: prerequisites, setup steps, running dev environment, project structure overview, key conventions. Update README.md. |

**Phase 1 exit criteria:** Two players can simultaneously log in, navigate the galaxy, trade at ports, spend and regenerate turns, upgrade ships, log out and back in with state preserved. CI green. Deployed to UAT.

---

## Phase 2: Conflict & Territory (High-Level)

**Goal:** Players can fight each other and colonize planets. The galaxy becomes contested.

**Features:**
- CombatRoom implementation (instanced, turn-based fighter battles)
- Combat system: attack/retreat/resolve, fighter-vs-fighter math
- Planet colonization: claim unowned planets, develop, fortify
- Deployables: mines and fighters in sectors (area denial)
- Ship expansion: Warship and Flagship types with combat stats
- Reputation system: trader vs. pirate alignment
- Client: combat UI, planet management screens, combat animations

**Key dependencies:** Requires Phase 1 complete. CombatRoom is a new Colyseus room type.

**Estimated duration:** 4–6 weeks

---

## Phase 3: Alliances & Politics (High-Level)

**Goal:** Players form alliances, share resources, coordinate, and wage formal wars.

**Features:**
- FederationRoom implementation (per-alliance persistent room)
- Alliance CRUD: create, invite, roles (Founder/Admiral/Diplomat/Officer/Member)
- Alliance chat and shared intel map annotations
- Shared resources: treasury, tax system, alliance planets
- Diplomacy: standings (-10 to +10), treaties, formal war declarations
- Federation system: 2–5 alliances form super-alliances
- Leaderboards: player and federation rankings
- Client: alliance dashboard, diplomacy UI, chat sidebar

**Key dependencies:** Requires Phase 2 (territory control drives alliance value).

**Estimated duration:** 4–6 weeks

---

## Phase 4: Depth & Endgame (High-Level)

**Goal:** Long-term retention through advanced systems and content.

**Features:**
- 10+ ship types with specialized roles
- Tech tree: research unlocks for players and alliances
- Planet movement between sectors
- Special sectors: black holes, nebulae, anomalies
- NPC factions: traders, pirates, police with AI behaviors
- Exotic Matter economy (late-game resource)
- Seasonal resets with rewards and rankings
- Mobile support (responsive or companion app)
- Queued/scheduled actions

**Key dependencies:** Requires Phase 3 (alliances provide endgame structure).

**Estimated duration:** 8+ weeks (ongoing)

---

## Dependency Graph (Phase 0 + 1)

```
Phase 0:
  P0-1 ──► P0-2 ──► P0-3 ──► P0-5
                 └──► P0-4 ──► P0-5
  P0-1 ──► P0-6
  P0-1 ──► P0-7
  P0-3 ──► P0-8
  P0-1 ──► P0-9

Phase 1 (after Phase 0):
  Schemas & Types:
    P1-1 ──► P1-4, P1-5, P1-9, P1-15
    P1-2 ──► P1-4, P1-8
    P1-3 ──► P1-5, P1-17

  Server chain:
    P1-4 ──► P1-5 ──► P1-6 ──► [tests]
                  └──► P1-7 ──► [tests]
                  └──► P1-8 ──► [tests]
    P1-5 ──► P1-12, P1-13
    P1-11 ──► P1-12, P1-13, P1-14

  Client chain:
    P1-15 ──► P1-16, P1-17, P1-18
    P1-17 ──► P1-19 ──► P1-20, P1-21, P1-22
    P1-14 ──► P1-23

  Parallel tracks:
    Mario (P1-24/25/26): No blockers, informs client work
    Steeply (P1-27–33): Tests follow their corresponding implementation tasks
    Joelle (P1-34/35): Follows schema/env completion
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Galaxy state too large for single room | High | Start with 500 sectors. Profile delta sync size. Spatial partitioning deferred to Phase 4. |
| Turn balance feels wrong | Medium | Make all turn costs configurable via constants. Instrument usage analytics from day 1. |
| Client rendering performance | Medium | Procedural rendering first (no assets). Profile with 500 sectors on low-end devices in Phase 1. |
| Schema changes break client | Medium | Shared package as single source of truth. Integration tests in CI. |
| Persistence adds latency | Low | Auto-save on interval (not every action). Async writes. Profile in Phase 1. |

---

## Principles

1. **Ship the loop first.** Phase 1 proves trading is fun. Everything else is decoration until that's true.
2. **Server is truth.** Never trust the client. Every action validated server-side.
3. **Shared types prevent drift.** All schemas and message types live in `shared/`. Client and server import from there.
4. **Defer aggressively.** Combat, planets, federations, NPCs — all deferred. If Phase 1 trading isn't fun, none of that matters.
5. **Test the systems, not the frames.** Unit test game logic (navigation, trading, turns). Don't test PixiJS rendering internals.
