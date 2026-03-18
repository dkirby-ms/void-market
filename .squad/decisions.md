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

### 2026-03-17: Figma Design System Conversion Strategy (Hal)
**Status:** Proposed  
**Owner:** Hal (Lead)  
**Artifact:** `docs/FIGMA-CONVERSION-STRATEGY.md`

**Decision:** Adopt React 18 for DOM overlays in Void Market instead of rewriting to vanilla TypeScript.

**Rationale:**
- Figma Make export provides production-ready React + Tailwind + shadcn/ui implementation (6 screens, 48 components, ~3,000 lines)
- Vanilla TS rewrite costs 3-4 weeks for negligible benefit (~35KB bundle savings)
- Architecture never mandated vanilla TS—only requires PixiJS for galaxy map and "DOM overlay" for UI (framework-agnostic)
- React adoption accelerates Phase 1 by ~5.5 days (4 weeks → 3.5 weeks), saves ~15 days of component/form/accessibility work

**Hybrid Rendering Model:**
- **PixiJS 8 (WebGL):** Galaxy map (500+ sectors, camera controls, warp routes)
- **React 18 (DOM):** HUD, trading panels, chat, alliance management, planet/fleet views
- **Colyseus:** State sync (server authoritative)

**Component Mapping:**
- Keep as-is: GameLayout, HUD, Sidebar, AllianceChat, TradingView, SectorView, PlanetView, FleetView, AllianceView (DOM React)
- Rewrite: GalaxyMap.tsx → PixiJS renderer (2-3 days)
- Copy: 48 shadcn/ui components (0 effort)

**Dependencies to Adopt:** React 18.3.1, React Router 7.13.0, Radix UI (20 packages), Tailwind 4.1.12, lucide-react 0.487.0  
**Dependencies to Add:** pixi.js 8.0.0, pixi-viewport 5.0.0, colyseus.js 0.16.0  
**Bundle Size:** ~260KB (acceptable for game client)

**Success Criteria:** Phase 1 ships on time, 60 FPS desktop/30 FPS mobile, < 500KB bundle, Colyseus state sync works, UI accessible, team productive.

**Next Steps:** Gately executes P0-4.1 (React + Tailwind setup). Pemulis uses Figma gameState.ts for Colyseus schemas. Mario reviews Figma theme vs UX-BRIEF.md.

---

### 2026-03-17: Design System Reference (Mario)
**Status:** Complete  
**Owner:** Mario (UX Consultant)  
**Artifact:** `docs/DESIGN-SYSTEM.md`

**Decision:** Extract all design decisions from Figma Make export into a framework-agnostic design system reference.

**Why:** 
- Figma export is production-ready but tied to React implementation
- Team may implement UI in PixiJS (canvas), React (DOM), or hybrid
- Design system document decouples visual language from implementation framework
- Enables single source of truth preventing UI drift between design and implementation

**What Was Extracted (21 sections, 867 lines):**
1. Color System: 38 theme variables (dark theme, semantic colors, resource colors, player colors, chart colors, OKLCH + hex mappings)
2. Typography: 6-tier size scale, 4 weights, monospace for numeric data
3. Spacing System: 8px Tailwind grid, common patterns
4. Border Radius: 4 sizes (6px–12px)
5. Effects & Motion: Glass-morphism, transitions, focus rings
6. Button Variants: 6 variants, 4 sizes
7. Form Elements: Input, Select, Textarea, Checkbox, Radio, Switch (full specs)
8. Data Visualization: Progress bars, resource bars, status indicators, badges
9. Component Inventory: 48 shadcn/ui primitives + 10 game-specific screens
10. Layout Architecture: HUD (64px), Sidebar (256px desktop → 64px mobile), Chat (320px desktop → bottom sheet mobile)
11. Iconography: Lucide React 30+ icons (5 sizes, 2px stroke)
12. Canvas/Map Rendering: PixiJS implementation guidance (colors, hover states, overlays, legend)
13. Accessibility: WCAG AA compliance (4.5:1 contrast, keyboard nav, screen readers, color independence)
14. Responsive Design: Mobile-first (375px), breakpoint strategy, grid patterns
15. Card/Panel Patterns: Standard card, stat card, glass panel, tooltip/popover
16. Navigation Patterns: Breadcrumb, sidebar nav, tabs
17. Implementation Notes: PixiJS hex mappings, Tailwind CSS 4 integration, Radix usage
18. Design Tokens Summary: Quick-reference TypeScript object
19. Component State Matrix: Button/Input/Card/Nav/Badge/Checkbox/Switch states

**Key Design Decisions:**
- Dark-first strategy (zinc-950 background)
- Glass-morphism aesthetic (semi-transparent overlays)
- Violet (not blue) as primary accent
- Monospace for all numeric data
- Touch targets ≥44px (WCAG 2.1)
- No custom fonts (system font stack)

**Impact:** Gately can implement PixiJS galaxy renderer (Section 15). Pemulis understands UI data requirements. Steeply can validate accessibility/responsiveness. All agents align to single source of truth.

**Next Steps:** Gately uses Design System Section 15 for PixiJS galaxy implementation. Steeply audits UI against spec. Design changes update both Figma and this document.

---

### 2026-03-17: Track Project Plan as GitHub Issues (Hal)
**Status:** Implemented  
**Owner:** Hal (Lead)

Project plan tasks from `docs/PROJECT-PLAN.md` are now tracked as GitHub issues in `dkirby-ms/void-market`, with modifications from `docs/FIGMA-CONVERSION-STRATEGY.md` applied.

**Structure:**
- Issues #3–#12: Phase 0 (10 scaffolding tasks)
- Issues #13–#48: Phase 1 (36 MVP trading loop tasks)
- Issues #49–#51: Phase 2–4 epic placeholders
- 5 milestones (1 per phase)
- 18 labels: phase (5), squad (7), priority (2), type (4)

**Label Taxonomy:**
| Category | Labels | Purpose |
|----------|--------|---------|
| Phase | `phase:0-scaffold` through `phase:4-polish` | Group by implementation phase |
| Squad | `squad:hal`, `squad:gately`, `squad:pemulis`, `squad:steeply`, `squad:marathe`, `squad:joelle`, `squad:mario` | Owner assignment |
| Priority | `priority:critical-path`, `priority:normal` | Identifies blocking tasks |
| Type | `type:feature`, `type:infrastructure`, `type:docs` | Work category |

**Conventions:**
- Every issue includes: description, acceptance criteria, dependencies, owner, effort estimate
- Figma strategy modifications noted inline in affected issues
- Phase 2–4 are epic-level only—decompose when prior phase ships
- Dependencies expressed as `Depends on #N` in issue bodies

**Impact:** All squad members reference GitHub issue numbers when creating branches and PRs. The issue board is now the canonical view of project status.

---

### 2026-03-17: User Directive — Figma Design Alignment (Copilot)
**Status:** Captured  
**Context:** Design system extraction + conversion strategy

User directive: Align all UI implementation to the Figma Make design export (`docs/void-market.zip`), not the UX brief. The Figma export is React/Tailwind/Radix/shadcn—this needs conversion to the project's PixiJS + DOM overlay architecture.

**Action:** Hal and Mario have completed the analysis and extraction. Decisions above provide the conversion strategy and design system reference.

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

### 2026-03-18: ESLint + Prettier Configuration (Marathe)
**Status:** Implemented  
**Owner:** Marathe (DevOps)  
**PR:** #55

ESLint 10 flat config with typescript-eslint strict rules + Prettier for formatting. Double quotes chosen as Prettier default (matches TypeScript ecosystem conventions and avoids escape issues in JSX).

**Key Rules:**
- `strictTypeChecked` + `stylisticTypeChecked` — strict baseline for all workspaces
- `ignoreProperties: true` on `no-inferrable-types` — Colyseus `@type` decorators need explicit annotations
- `allowNumber: true` on `restrict-template-expressions` — idiomatic TS pattern
- Test files exempt from `no-confusing-void-expression`

**React Plugin Status:**
`eslint-plugin-react` and `eslint-plugin-react-hooks` only support ESLint ≤9.7. Client workspace has a TODO placeholder. When plugins update for ESLint 10+, add them to the client override block.

**Impact on Other Agents:**
- **All agents:** Run `npm run lint` before committing. Run `npm run format` to auto-fix formatting.
- **Pemulis:** Colyseus `@type` properties won't trigger `no-inferrable-types` thanks to `ignoreProperties`.
- **Steeply:** Test files have relaxed void-expression rules for assertion patterns.
- **Gately:** React ESLint plugins deferred — add when available for ESLint 10.

**Related:** `.squad/orchestration-log/2026-03-18T000500Z-marathe-eslint.md`

---

### 2026-03-18: Vitest Test Infrastructure (Steeply)
**Status:** Implemented  
**Owner:** Steeply (Tester)  
**Issue:** #12  
**PR:** #53

Vitest 4 with v8 coverage as the test framework for all workspaces.

**Key Details:**
- **Root config** (`vitest.config.ts`): Uses `test.projects` to discover per-workspace configs
- **Per-workspace configs**: Each workspace has `vitest.config.ts` using `defineProject()`
- **Coverage**: v8 provider, 80% threshold floors (statements, branches, functions, lines)
- **Scripts**: `test` and `test:watch` in each workspace, `test:coverage` at root
- **Shared test utils**: `shared/src/test-utils/index.ts` — import in any workspace

**Conventions:**
- Test files go in `src/__tests__/*.test.ts` or colocated as `src/**/*.test.ts`
- Workspaces with no tests use `passWithNoTests: true` — no CI failures
- Coverage reports to `./coverage/` (gitignored)
- `npm run test` from root runs all workspace tests via `--workspaces --if-present`
- `npm run test:coverage` from root runs Vitest with v8 coverage across all projects

**Related:** `.squad/orchestration-log/2026-03-18T000500Z-steeply-test.md`

---

### 2026-03-18: Shared Package Scaffold (Pemulis)
**Status:** Implemented  
**Owner:** Pemulis (Systems Dev)  
**Issue:** #4  
**PR:** #54

Added enums, constants, interfaces, Colyseus Schema base classes to @void-market/shared.

**Key Additions:**
- Game enums: Commodities, ResourceTypes, EntityTypes, AllianceStates, PortTypes, ShipClasses
- Game constants: TURN_REGEN_RATE, TURN_BANK_CAP, TRADE_COST, MOVE_COST, COMBAT_COST, FORMATION_COST
- TypeScript interfaces: IPlayer, IPort, IPlanet, IShip, IAlliancePlayer, IFederation
- Colyseus Schema base classes: GameState, PlayerSchema, PortSchema, PlanetSchema, ShipSchema, AllianceSchema

**Conventions:**
- Shared schemas use Colyseus `@type` decorators with explicit type annotations
- Interfaces serve as source-of-truth for TS type safety across client/server boundary
- Constants centralized — no magic numbers in game logic
- Enums prevent string-based state bugs in room logic

**Impact:**
- Gately can reference schema definitions when building client renderers
- Steeply has typed interfaces for test fixtures
- Marathe can validate serialization in CI

**Related:** `.squad/orchestration-log/2026-03-18T000500Z-pemulis-shared.md`

---

### 2026-03-18: Colyseus 0.17 Server Pattern (Pemulis)
**Status:** Implemented  
**Owner:** Pemulis (Systems Dev)  
**Issue:** #5  
**PR:** #58

Use Colyseus 0.17's `defineServer`/`defineRoom` declarative API. Install only `@colyseus/core` + `@colyseus/ws-transport` (minimal deps). All future rooms use `defineRoom(RoomClass)` pattern registered in `server/src/index.ts`.

**Rationale:** `defineServer` is the recommended 0.17 API; minimal deps keep server lean until redis/auth/monitoring actually needed in later phases.

**Impact:** All agents should use `defineRoom` for room definitions. Express routes go in the `express` callback.

---

### 2026-03-18: Client Build Pipeline (Gately)
**Status:** Implemented  
**Owner:** Gately (Client Dev)  
**Issue:** #6  
**PR:** #59

Client workspace uses Vite for bundling. TypeScript configured with `noEmit: true` (type-checking only). Root `tsconfig.json` no longer references `client/` in `references` (only `shared`, `server`).

**Key Changes:**
- `client/tsconfig.json` — `noEmit: true`, `composite: false`, `moduleResolution: "bundler"`
- Root build: `tsc --build && npm run build --workspace=client`
- ESLint switched from `projectService: true` to per-workspace `project` paths (project service incompatible with non-composite tsconfigs)

**Impact:** All agents aware that `npm run build` builds everything (shared + server via tsc, client via Vite). Client `npm run dev` starts Vite on :5173 with full HMR.

---

### 2026-03-18: CI Coverage Thresholds Non-Blocking (Marathe)
**Status:** Approved  
**Owner:** Marathe (DevOps)

Coverage thresholds set to 80% but **do not gate** builds during Phase 0. Coverage reports generated and uploaded for visibility; only `npm run test` (without `--coverage`) gates merges.

**Rationale:** Phase 0 scaffolding (schemas, enums) has low test coverage by design. Blocking on thresholds creates false failures. Revisit after Phase 1 ships.

---

### 2026-03-18: Tailwind CSS 4 + shadcn/ui Components (Gately)
**Status:** Implemented  
**Owner:** Gately (Client Dev)  
**Issue:** #7  
**PR:** #62

Tailwind CSS 4 with `@tailwindcss/vite` plugin (listed before `@vitejs/plugin-react`). All 38 design system variables from DESIGN-SYSTEM.md mapped as CSS custom properties. 5 initial shadcn/ui components (Button, Card, Badge, Input, Label). Dark mode class-based (`class="dark"` on `<html>`).

**Key Details:**
- `@theme inline` bindings for 38 CSS variables
- `cn()` utility at `client/src/lib/utils.ts` (clsx + tailwind-merge)
- Radix UI primitives (20 packages) pre-installed
- Components copy-paste pattern to `client/src/components/ui/`

**Impact:** Design tokens accessible via CSS custom properties. Future components added by copying to `client/src/components/ui/`. React ESLint plugins deferred (ESLint 10 support pending).

---

### 2026-03-18: Dev Environment — Concurrent & Docker Compose (Marathe)
**Status:** Implemented  
**Owner:** Marathe (DevOps)  
**Issue:** #8  
**PR:** #61

`npm run dev` starts Colyseus (:2567) + Vite (:5173) via `concurrently` with `-k` for clean shutdown. Docker Compose provides PostgreSQL 16-alpine + Redis 7-alpine with persistent named volumes. App runs natively (not containerized) for HMR performance.

**Workflow:**
- `docker compose up -d` — Start backing services
- `npm run dev` — Start app with hot reload
- `.env.example` documents `DATABASE_URL`, `REDIS_URL`, `PORT`

**Impact:** Local dev is fast and convenient. Database/Redis ready for Phase 1 persistence code.

---

### 2026-03-18: Dockerfile Production Image (Marathe)
**Status:** Implemented  
**Owner:** Marathe (DevOps)  
**Issue:** #11  
**PR:** #60

Multi-stage Dockerfile using `node:22-slim` (Debian-based, not Alpine). Production stage installs all workspace production deps via `npm ci --omit=dev`. Image includes curl (~5MB) for HEALTHCHECK.

**Rationale:** npm workspaces + native modules more reliable on Debian (Alpine musl causes sporadic build failures). Full prod deps avoids fragile selective installs. curl required for Azure Container Apps health probes.

**Critical Follow-Up:** Server must serve `client/dist/` as static files via Express. Add Express static middleware before Phase 1 production deploy.

**Impact:** Container compatible with existing CI workflows and Azure Container Apps deployments.

---

## Decision Merge History

**2026-03-17:** Merged inbox decisions to canonical decisions.md. Deduplicated overlapping entries. Active decisions now consolidated in single source of truth.

**2026-03-18:** Merged Wave 3 + Wave 4 Phase 0 decisions. Added 6 new decisions (Colyseus pattern, client build, coverage thresholds, Tailwind, dev environment, Dockerfile). Inbox files ready for deletion.

**Inbox sources merged:**
- `hal-galaxy-wars-architecture.md` → "Void Market Architecture Decisions"
- `pemulis-game-systems.md` → "Core Game Systems Design"
- `mario-uux-design-brief.md` → "UX Design Brief for Void Market"
- `marathe-branching-strategy.md` → "Branching Strategy and CI/CD"
- `hal-rename-void-market.md` → "Rename to Void Market"
- `pemulis-server-scaffold.md` → "Colyseus 0.17 Server Pattern"
- `gately-client-scaffold.md` → "Client Build Pipeline"
- `marathe-ci-pipeline.md` → "CI Coverage Thresholds Non-Blocking"
- `gately-shadcn-tailwind.md` → "Tailwind CSS 4 + shadcn/ui Components"
- `marathe-dev-environment.md` → "Dev Environment — Concurrent & Docker Compose"
- `marathe-dockerfile.md` → "Dockerfile Production Image"

---

## Related Documents

- `.squad/log/2026-03-18T001000Z-phase0-complete.md` — Phase 0 completion session log
- `.squad/orchestration-log/` — Agent work logs (Wave 3 + Wave 4)
- `docs/ARCHITECTURE.md` — Server architecture (Colyseus, rooms, database)
- `docs/GAME-SYSTEMS.md` — Gameplay mechanics (turns, economy, alliances)
- `docs/UX-BRIEF.md` — UI/UX design strategy
- `docs/DESIGN-SYSTEM.md` — Design tokens and component library
- `.github/workflows/` — CI/CD implementation

