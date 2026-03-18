# Void Market

Multiplayer space strategy game inspired by TradeWars 2002. Players explore a persistent galaxy, trade commodities, build outposts, form alliances, and compete for galactic dominance — all constrained by daily turn limits.

**Stack:** TypeScript monorepo — [Colyseus](https://colyseus.io/) (authoritative multiplayer server), [PixiJS](https://pixijs.com/) (2D WebGL rendering), PostgreSQL (persistence), Redis (session/cache).

## Prerequisites

- [Node.js](https://nodejs.org/) **22+**
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (for local PostgreSQL & Redis)
- npm (ships with Node.js)

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/dkirby-ms/void-market.git
cd void-market

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if you need to change defaults

# 4. Start local services (PostgreSQL + Redis)
docker compose up -d

# 5. Start the dev servers
npm run dev
```

This starts both the Colyseus game server (http://localhost:2567) and the Vite client dev server (http://localhost:5173) concurrently with hot reload.

Press **Ctrl+C** to stop both servers.

## Project Structure

```
void-market/
├── client/          # PixiJS + React client (Vite)
├── server/          # Colyseus authoritative game server
├── shared/          # Types, constants, and schemas shared across client & server
├── docs/            # Architecture & design documents
├── infra/           # Azure Bicep IaC templates
└── docker-compose.yml  # Local PostgreSQL + Redis
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client concurrently with hot reload |
| `npm run build` | Build all workspaces |
| `npm run test` | Run tests across all workspaces |
| `npm run test:coverage` | Run tests with v8 coverage |
| `npm run lint` | Lint all workspaces |
| `npm run format` | Format code with Prettier |
| `npm run clean` | Clean build artifacts |

### Docker Compose

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start PostgreSQL and Redis |
| `docker compose down` | Stop services |
| `docker compose down -v` | Stop services and delete data |
| `docker compose logs -f` | Follow service logs |

## Architecture

- **Authoritative server model** — the server owns all game state; the client sends commands and renders results
- **Three-room Colyseus architecture** — GalaxyRoom (persistent), CombatRoom (instanced), FederationRoom (per-alliance)
- **Hybrid rendering** — PixiJS for the galaxy map, React DOM overlay for HUD/forms/chat

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full details.

## License

ISC
