# Void Market

Multiplayer space strategy game inspired by TradeWars 2002. Players explore a persistent galaxy, trade commodities, build outposts, form alliances, and compete for galactic dominance — all constrained by daily turn limits.

**Stack:** TypeScript monorepo — [Colyseus](https://colyseus.io/) (authoritative multiplayer server), [PixiJS](https://pixijs.com/) (2D WebGL rendering), PostgreSQL (persistence), Redis (session/cache).

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Conventions & Style](#conventions--style)
- [Testing & Quality](#testing--quality)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## Quick Start

Get from zero to running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/dkirby-ms/void-market.git
cd void-market

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start local services (PostgreSQL + Redis)
docker compose up -d

# 5. Start dev servers (Colyseus + Vite client)
npm run dev
```

- **Game server:** http://localhost:2567
- **Web client:** http://localhost:5173
- **Hot reload:** Changes to server, client, and shared code automatically refresh

**Stop servers:** Press **Ctrl+C**

## Prerequisites

- [Node.js](https://nodejs.org/) **22+** (verify with `node --version`)
- [Docker Desktop](https://docs.docker.com/get-docker/) with Compose (for PostgreSQL & Redis)
- npm **10+** (ships with Node.js)
- [Git](https://git-scm.com/)

## Project Structure

```
void-market/
├── client/                    # PixiJS + React client (Vite)
│   ├── src/
│   │   ├── components/        # UI overlays (HUD, forms, chat)
│   │   ├── systems/           # Game state & prediction
│   │   ├── renders/           # PixiJS canvas & sprites
│   │   └── main.tsx           # Entry point
│   ├── vite.config.ts         # Vite dev server (port 5173)
│   └── package.json
│
├── server/                    # Colyseus authoritative server
│   ├── src/
│   │   ├── rooms/             # Game rooms (GalaxyRoom, CombatRoom, FederationRoom)
│   │   ├── commands/          # Player command handlers
│   │   ├── systems/           # Game logic (economy, turns, combat)
│   │   └── main.ts            # Entry point
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                    # Types & constants shared across client + server
│   ├── src/
│   │   ├── schemas/           # Colyseus @Schema types (state sync)
│   │   ├── messages/          # Command & event types
│   │   └── constants.ts       # Game constants (turn costs, commodities, etc.)
│   └── package.json
│
├── docs/                      # Design & architecture documentation
│   ├── ARCHITECTURE.md        # Server design, room structure, state management
│   ├── GAME-SYSTEMS.md        # Gameplay mechanics, economy, turns, alliances
│   └── UX-BRIEF.md            # UI/UX strategy, screen layouts, responsive design
│
├── infra/                     # Azure Infrastructure as Code (Bicep)
│   ├── main.bicep
│   └── parameters.json
│
├── .github/workflows/         # CI/CD pipelines
│   ├── test.yml               # npm ci, lint, build, test
│   └── deploy.yml             # Deploy to staging/production
│
├── docker-compose.yml         # Local PostgreSQL + Redis
├── .env.example               # Environment variable template
├── package.json               # Monorepo root (npm workspaces)
├── tsconfig.json              # Shared TypeScript config
├── eslint.config.js           # Linting rules
└── vitest.config.ts           # Test configuration
```

## Development Workflow

### Daily Workflow

**1. Start dev environment (one terminal):**
```bash
npm run dev
```
This launches the server (Colyseus, port 2567) and client (Vite, port 5173) concurrently. Both have hot reload.

**2. Database operations (as needed):**
```bash
# Start/stop PostgreSQL + Redis
docker compose up -d    # Start
docker compose down     # Stop (data persists)
docker compose logs -f  # See logs
```

**3. Make changes & test:**
- Edit TypeScript in `server/`, `client/`, or `shared/`
- See changes instantly in running dev servers
- Run tests: `npm run test`
- Check formatting: `npm run lint`

**4. Commit & push:**
```bash
# Create feature branch (see Branching below)
git checkout -b squad/{issue-number}-{slug}
git add .
git commit -m "Describe your change"
git push origin squad/{issue-number}-{slug}

# Open PR to dev via GitHub (or use `gh pr create`)
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client with hot reload |
| `npm run build` | Compile all workspaces (TypeScript + Vite) |
| `npm run test` | Run tests (Vitest) across all workspaces |
| `npm run test:coverage` | Tests with code coverage report |
| `npm run lint` | Run ESLint on all workspaces |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without changing files |
| `npm run clean` | Delete TypeScript build artifacts |

### Docker Compose Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start PostgreSQL + Redis (background) |
| `docker compose down` | Stop services (data persists) |
| `docker compose down -v` | Stop services and delete all data |
| `docker compose logs -f` | Follow real-time logs (Ctrl+C to exit) |
| `docker compose ps` | Show running services |

## Conventions & Style

### Branching Strategy

Feature branches follow the pattern `squad/{issue-number}-{slug}`:

```bash
# Example:
git checkout -b squad/48-dev-onboarding
git checkout -b squad/42-player-auth
```

- **PR target:** Always `dev` (not main/master)
- **PR description:** Reference the issue (#48)
- **Commits:** Clear, descriptive messages; include `#issue-number` if fixing an issue

### Code Style

**TypeScript:**
- Strict mode enabled (`tsconfig.json`: `strict: true`)
- No `any` types; use proper types or `unknown` with type guards
- Prefer `const` over `let`, never use `var`

**Formatting & Linting:**
- ESLint enforces style (run `npm run lint` before committing)
- Prettier auto-formats (run `npm run format` to auto-fix)
- Both run on PR (CI gate — PRs with lint errors won't merge)

**File Naming:**
- Components: PascalCase (`HUD.tsx`, `TradeForm.tsx`)
- Utilities & helpers: camelCase (`playerUtils.ts`, `calculateDistance.ts`)
- Schemas & types: PascalCase (`PlayerSchema.ts`, `TradeMessage.ts`)
- Constants: UPPER_SNAKE_CASE (`TURN_REGEN_RATE`, `FUEL_ORE_BASE_PRICE`)

### Testing

- **Framework:** Vitest (runs alongside your code, fast)
- **Coverage threshold:** 80% (enforced on CI)
- **File structure:** Tests live next to source files as `*.test.ts` or `*.test.tsx`
- **Before committing:** Run `npm run test` to verify all tests pass

**Test example:**
```typescript
// src/systems/economy.ts
export function calculatePortPrice(commodity: string, demand: number): number {
  return basePrice[commodity] * (1 + demand * 0.1);
}

// src/systems/economy.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePortPrice } from './economy';

describe('calculatePortPrice', () => {
  it('scales price by demand', () => {
    expect(calculatePortPrice('Fuel Ore', 0)).toBe(100);
    expect(calculatePortPrice('Fuel Ore', 5)).toBe(105);
  });
});
```

### Documentation

- **Architecture decisions:** Add to `docs/ARCHITECTURE.md`
- **Game mechanics:** Add to `docs/GAME-SYSTEMS.md`
- **UI/UX changes:** Reflect in `docs/UX-BRIEF.md`
- **Inline comments:** Only for non-obvious logic; prefer readable code over comments

## Testing & Quality

**Before submitting a PR:**

```bash
npm run lint      # Check for style violations
npm run test      # Run all tests
npm run build     # Verify code compiles
```

**CI runs the same checks** on every PR. If any fail, the PR won't merge.

**Common issues & fixes:**

| Issue | Fix |
|-------|-----|
| ESLint errors | Run `npm run format` to auto-fix |
| Failing tests | Run `npm run test` to see details; fix code and re-run |
| TypeScript errors | Check `npm run build` output; fix type mismatches |
| Hot reload not working | Restart dev server (`Ctrl+C` then `npm run dev`) |

## Architecture

### Authoritative Server Model

The server owns all game state. The client sends commands; the server validates, applies, and broadcasts results via Colyseus Schema delta sync. Client-side prediction is used for responsiveness, but the server always reconciles.

### Three-Room Architecture (Colyseus)

| Room | Lifecycle | Purpose |
|------|-----------|---------|
| **GalaxyRoom** | Persistent (one per server) | Galaxy graph, players, ports, planets, turn accounting |
| **CombatRoom** | Instanced (created on demand) | Turn-based combat resolution, disposed after battle ends |
| **FederationRoom** | Per-alliance | Private chat, shared intel, treaty management |

### Rendering

- **PixiJS canvas:** Galaxy map, sectors, ships, planets, animations
- **React DOM overlay:** HUD, forms, chat sidebar, menus
- **Sync point:** Player state updates broadcast from server to all clients via Colyseus

**Full details:** See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Client Rendering** | [PixiJS](https://pixijs.com/) v8 | 2D WebGL rendering for galaxy/map |
| **Client Framework** | [React](https://react.dev/) + TypeScript | UI components and state |
| **Client Build** | [Vite](https://vitejs.dev/) | Fast dev server & bundling |
| **Server Runtime** | [Node.js](https://nodejs.org/) 22+ | JavaScript runtime |
| **Server Framework** | [Colyseus](https://colyseus.io/) + Express | Multiplayer state sync & routing |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Persistent game state (accounts, galaxy) |
| **Cache/Pub-Sub** | [Redis](https://redis.io/) | Session tokens, online presence, cross-room messaging |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5.8+ | Type safety across monorepo |
| **Testing** | [Vitest](https://vitest.dev/) | Unit & integration tests |
| **Linting** | [ESLint](https://eslint.org/) | Code quality & style |
| **Formatting** | [Prettier](https://prettier.io/) | Automatic code formatting |
| **Containerization** | [Docker](https://www.docker.com/) + Compose | Local dev environment |
| **Infrastructure** | [Azure Container Apps](https://azure.microsoft.com/products/container-apps/) | Production hosting |

## Contributing

New to the project? Start here:

1. **Read:** [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow, PR process
2. **Explore:** `docs/` — architecture, game systems, UX design
3. **Setup:** Follow [Quick Start](#quick-start) above
4. **Pick an issue:** Check [GitHub Issues](https://github.com/dkirby-ms/void-market/issues) for `good first issue` label
5. **Ask questions:** Open a discussion or @ mention the team in an issue

**Questions?** Reach out in GitHub Discussions or open an issue. We're here to help new contributors succeed.

## License

ISC
