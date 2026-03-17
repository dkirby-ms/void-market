# Decisions

## Active Decisions

### 2026-03-17: Branching Strategy and CI/CD (Marathe)
**Status:** Approved  
**Owner:** Marathe (DevOps)

Three-tier branching model with automated CI/CD:
- **`dev`** — Primary development, PR gate, auto-patch version bumps
- **`uat`** — Staging environment, auto-deploy on push
- **`prod`** — Production, deploy via v* tags
- **Feature branches:** `squad/{issue-number}-{slug}`

All workflows use Azure OIDC + GitHub environments for env-specific secrets. Workflows include Discord notifications, concurrency control, and health checks. See `.github/workflows/` and `.squad/orchestration-log/2026-03-17T00-26-00Z-marathe.md` for full details.

---

### 2026-03-17: Rename to Void Market (Hal)
**Status:** Implemented  
**Owner:** Hal (Lead)

Game renamed from "Galaxy Wars" to "Void Market" per user request to avoid conflict with existing game. Rename applied consistently across:
- Documentation (docs/, README.md)
- Configuration (package.json, Dockerfile, .github/workflows/)
- Team/squad files (.squad/agents/, .squad/team.md)
- Issue templates and code comments

Repo directory preserved as `galaxy-wars` for git/CI stability. See `.squad/orchestration-log/2026-03-17T00-27-00Z-hal.md` for full implementation details.

---

### 2026-03-17: Project Phasing & Task Breakdown (Hal)
**Status:** Approved  
**Owner:** Hal (Lead)
**Artifact:** `docs/PROJECT-PLAN.md`

**Phase Structure:**
- **Phase 0:** 9 scaffolding tasks (~1 week) — Monorepo, build, CI, Docker, test infra
- **Phase 1:** 35 trading-loop tasks (~4 weeks) — Galaxy gen, navigation, trading, turns, ships, persistence, basic auth, PixiJS, HUD
- **Phases 2–4:** Feature-level scope — Combat, Alliances, Endgame. Decomposed when Phase 1 ships.

**Key Decisions:**
1. Phase 0 exists (scaffolding before gameplay)
2. Persistence in Phase 1 (not Phase 0) — depends on game schemas
3. Auth is minimal (JWT, no OAuth until Phase 2+)
4. Server and client tracks run in parallel (after shared schemas)
5. Critical path: Shared schemas → GalaxyRoom (server) & Galaxy renderer (client) → Database (persistence)

**Team Load:**
- Pemulis: 14 server tasks (critical path)
- Gately: 9 client tasks (blocked on schemas)
- Steeply: 7 test tasks
- Marathe: 4 Phase 0 + support
- Mario: 3 UX tasks (parallel)
- Joelle: 2 doc tasks

**Related:** `.squad/orchestration-log/2026-03-17T01-00-00Z-hal.md`

---

### 2026-03-16: Void Market Architecture Decisions (Hal)
**Status:** Approved  
**Context:** Initial architecture design

**Core Decisions:**
1. **Authoritative Server Model** — Colyseus with room-based architecture; prevents cheating in persistent MMO
2. **Three-Room Architecture** — GalaxyRoom (persistent), CombatRoom (instanced), FederationRoom (per-alliance)
3. **Daily Turn Limits (Non-Carrying)** — Players get fixed turns/day, no carry-over; enforces strategic play
4. **Persistent Galaxy** — Procedurally generated on server start, shared by all players
5. **PixiJS for Rendering** — 2D WebGL engine for galaxy map and sprites
6. **PostgreSQL + Redis** — Persistent state in Postgres, hot data in Redis for scaling
7. **MVP Scope** — Phase 1: trading loop only (navigation + trading + turns, no combat/planets/federations)
8. **TypeScript Monorepo** — Single repo with `/server`, `/client`, `/shared`; type safety across boundary

**Open Decisions (TBD):**
- Combat resolution mechanics (Phase 2)
- Monetization model (Phase 3)
- Galaxy sharding strategy (when >1000 concurrent)
- Mobile support approach (Phase 4)

**Review Schedule:** Post-MVP launch, post-Phase 2, 6 months post-launch. See `docs/ARCHITECTURE.md` for full context.

---

### 2026-03-16: Core Game Systems Design (Pemulis)
**Status:** Approved  
**Context:** Gameplay mechanics and economy

**Core Decisions:**
1. **Hybrid Turn System** — Gradual regeneration (1 turn per 90 seconds) vs. daily reset; balances accessibility and scarcity
2. **Turn Cost Structure** — Tiered costs: move (1), trade (2), combat (15–25), build (50+)
3. **Three-Commodity Economy** — Fuel Ore, Organics, Equipment; plus Credits (currency) and Exotic Matter (late-game)
4. **Dynamic Pricing** — Stock-based for NPC ports (intuitive, prevents infinite arbitrage); player-driven for alliance markets
5. **Alliance Size Cap** — 50 members max; Federations (2–5 alliances) prevent mega-blob dominance
6. **Alliance Diplomacy** — EVE-inspired standings (-10 to +10) with 48-hour cooldown for stability
7. **War Mechanics** — Formal declarations (100k credits, 24hr notice) with objectives; 7-day minimum duration
8. **Colyseus State Management** — Server-authoritative Schema with delta patching; fast (1s) and slow (60s) ticks

**Success Metrics:** 60–80% daily turn usage, 30%+ of players trading actively, 70%+ in alliances, 2–5 wars/week.

**Open Questions:** Turn cost balance, economy inflation, alliance betrayal cooldown, federation adoption, mobile accessibility.

See `.squad/decisions/inbox/pemulis-game-systems.md` for full decision document.

---

### 2026-03-17: UX Design Brief for Void Market (Mario)
**Status:** Accepted  
**Owner:** Mario (UX Consultant)

**Problem:** Dense information flows, turn scarcity, multi-layer screens risk player confusion and abandonment.

**Solution: Five-Pillar Design Strategy**
1. **Turn Economy as Pacemaker** — Always-visible turn counter (top-right), color-coded, audio/visual cues at thresholds
2. **Adaptive Information Density** — Three fidelity levels (New Player, Standard, Expert) manage complexity
3. **Hybrid Canvas/DOM Architecture** — PixiJS for galaxy map/animations, DOM overlay for HUD/forms/chat
4. **Alliance/Social Integration** — Chat sidebar, inline trading proposals, shared intelligence overlays (not bolted-on)
5. **Mobile-First Responsive Design** — 375px baseline, 44px touch targets, full-screen detail views on mobile

**Core Screens:** Galaxy Map, Sector View, Planet/Outpost, Fleet Management, Trading Interface, Alliance Dashboard, Player Status HUD.

**Success Metrics:** New player first turn <2min, expert 10 actions <3min, 95% remember turn counter, 60 FPS desktop / 30 FPS mobile, 50% day-1→day-2 retention.

**Implementation Roadmap:** 12 weeks, 6 phases (foundation → core screens → economy → alliance → optimization → polish).

See `.squad/decisions/inbox/mario-uux-design-brief.md` for full design brief.

---

## Decision Merge History

**2026-03-17:** Merged inbox decisions to canonical decisions.md. Deduplicated overlapping entries. Active decisions now consolidated in single source of truth.

**Inbox sources merged:**
- `hal-galaxy-wars-architecture.md` → "Void Market Architecture Decisions"
- `pemulis-game-systems.md` → "Core Game Systems Design"
- `mario-uux-design-brief.md` → "UX Design Brief for Void Market"
- `marathe-branching-strategy.md` → "Branching Strategy and CI/CD"
- `hal-rename-void-market.md` → "Rename to Void Market"

---

## Related Documents

- `.squad/log/2026-03-17-branching-and-rename.md` — Session summary
- `.squad/orchestration-log/` — Agent work logs
- `docs/ARCHITECTURE.md` — Server architecture (Colyseus, rooms, database)
- `docs/GAME-SYSTEMS.md` — Gameplay mechanics (turns, economy, alliances)
- `docs/UX-BRIEF.md` — UI/UX design strategy
- `.github/workflows/` — CI/CD implementation
