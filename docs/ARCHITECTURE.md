# Void Market — Architecture Proposal

**Project:** Modern multiplayer space strategy game  
**Inspired by:** TradeWars 2002 (BBS classic)  
**Stack:** Colyseus, PixiJS, TypeScript  
**Status:** Design phase  
**Author:** Hal  
**Date:** 2025-03-16

---

## Executive Summary

Void Market is a turn-based multiplayer space strategy game combining TradeWars 2002's addictive trade-and-conquer loop with modern real-time multiplayer architecture. Players explore a persistent galaxy, build trade routes, form alliances, and compete for galactic dominance—all within daily turn limits that balance casual and hardcore play.

**Core pillars:**
1. **Daily turn limits** — Strategic resource that prevents runaway leaders
2. **Persistent galaxy** — Shared universe that evolves with player actions
3. **Alliance/Federation system** — Organic player coalitions drive emergent gameplay
4. **Trade-based economy** — Core loop of profit, upgrade, expand

**Architecture approach:** Authoritative server model using Colyseus rooms, with PixiJS client for rendering. Clear separation: server owns truth, client predicts and renders.

---

## Research Summary

### TradeWars 2002 — Core Mechanics

**What made it work:**

1. **Turn System** — Players get 250-1000 turns/day. Every action costs turns:
   - Moving between sectors: 1 turn
   - Trading at ports: 1 turn
   - Attacking: variable turns
   - Deploying mines/fighters: turns
   
   This creates a strategic economy: turns are your daily currency. Once exhausted, you wait until tomorrow. Prevents 24/7 grinding, balances casual vs. hardcore.

2. **Sector Navigation** — Galaxy is a graph of 1000+ interconnected sectors (nodes). Travel via "warps" (edges). Sectors contain ports, planets, ships, minefields, or nothing. Mastery = learning efficient trade routes.

3. **Port Trading** — Three commodities (Ore, Organics, Equipment). 8 port types: some buy, some sell. Core loop:
   - Find buying port for X
   - Find nearby selling port for X
   - Buy low → sell high
   - Repeat until ports deplete
   - Use profit to upgrade ship
   
   "Trading pairs" (adjacent complementary ports) are gold.

4. **Ship Progression** — Start in basic ship, upgrade to specialized vessels:
   - Merchant ships (big cargo, weak combat)
   - Warships (strong fighters, small cargo)
   - Corporate Flagships (transwarp drives for CEOs)
   - Each has trade-offs: holds, speed, combat, special abilities

5. **Combat** — Ships carry fighters (defense), can deploy mines (traps). Combat is fighter-vs-fighter with shields. Planets can be heavily fortified with citadels.

6. **Planets** — Colonize, develop, fortify. Generate passive income/resources. Can be moved between sectors (late game). Attacked/defended by other players.

7. **Corporations** — Player-formed alliances with formal structure (CEO, officers). Share intelligence, coordinate attacks, pool resources. Endgame dominated by large corps, but solo traders can survive with cleverness.

8. **Alignment System** — Actions shift you toward trader or pirate. Affects NPC faction relations.

**Why it was addictive:**
- **Daily ritual** — Log in, spend turns optimally, plan tomorrow
- **Asymmetric gameplay** — Traders, pirates, warriors, diplomats all viable
- **Social metagame** — Corps, betrayals, negotiations happened outside the game
- **Incremental progression** — Steady ship upgrades and wealth accumulation
- **Emergent stories** — Rivalries, alliances, heists created memorable moments

### Modern Space Strategy Lessons

**Neptune's Pride (2010):**
- Real-time with hourly "ticks" creates semi-turn-based feel
- Diplomacy is core mechanic — success = negotiation + timing + trust
- Strategic patience: decisions play out over hours/days
- Defensive play rewarded: force attackers to spend resources on every star

**Lessons:**
- Slow pace enables social layer
- Long-term planning beats micro-optimization
- Visible move times let players coordinate/counter
- Diplomacy tools must be first-class (messaging, treaties, shared intel)

**OGame (2002):**
- Asynchronous timers (build queues, fleet movement)
- Must plan around real-life schedule
- Raiding/defense asymmetry: offline = vulnerable
- Progression in discrete steps

**Lessons:**
- Timer-based actions structure gameplay into sessions
- Protection mechanisms for offline players critical
- Clear visual feedback on queued actions
- Balance raiding rewards vs. defender frustration

**EVE Online (2003):**
- Player-driven economy and politics
- Long setup for major events (weeks of planning)
- Emergent narratives from player conflict

**Lessons:**
- Deep systems enable specialist roles
- Player agency > designed content
- Transparency builds trust (combat logs, market data)
- Support out-of-game coordination (APIs, tools)

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PixiJS Rendering Layer                             │   │
│  │  - Galaxy map view                                   │   │
│  │  - Sector detail view                                │   │
│  │  - Ship/planet sprites                               │   │
│  │  - UI overlays (HUD, menus, chat)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Client State Management                             │   │
│  │  - Colyseus SDK connection                           │   │
│  │  - State sync from server                            │   │
│  │  - Client-side prediction (movement, trades)         │   │
│  │  - Input handling & command sending                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ WebSocket (Schema sync)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER TIER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Colyseus Server (Authoritative)                     │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  GalaxyRoom (persistent world)                │  │   │
│  │  │  - Galaxy graph (sectors, warps)              │  │   │
│  │  │  - Active players & ships                     │  │   │
│  │  │  - Ports, planets, static entities            │  │   │
│  │  │  - Turn accounting per player                 │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  CombatRoom (instanced combat)                │  │   │
│  │  │  - Created on-demand for battles              │  │   │
│  │  │  - Fighter-vs-fighter resolution              │  │   │
│  │  │  - Results written back to GalaxyRoom         │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  FederationRoom (alliance coordination)       │  │   │
│  │  │  - Private channels for corps/alliances       │  │   │
│  │  │  - Shared intel, messaging                    │  │   │
│  │  │  - Treaty management                          │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Game Systems (business logic)                       │   │
│  │  - NavigationSystem: sector travel, turn costs      │   │
│  │  - TradingSystem: port interactions, prices         │   │
│  │  - CombatSystem: fighter battles, outcomes          │   │
│  │  - PlanetSystem: colonization, production           │   │
│  │  - FederationSystem: corp management, alliances     │   │
│  │  - TurnSystem: daily resets, action validation      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data Layer                                          │   │
│  │  - PostgreSQL: player accounts, galaxy state        │   │
│  │  - Redis: session state, caching, pub/sub           │   │
│  │  - Colyseus Presence: room discovery                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Colyseus Room Architecture

**Room Design Philosophy:**
- One persistent `GalaxyRoom` per server instance (or sharded by region)
- Instanced `CombatRoom` for turn-based battles
- Per-federation `FederationRoom` for private alliance coordination

#### GalaxyRoom (Persistent World)

**Responsibility:** The source of truth for the entire galaxy state.

**State Schema:**
```typescript
class GalaxyState extends Schema {
  @type({ map: Sector }) sectors = new MapSchema<Sector>();
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Port }) ports = new MapSchema<Port>();
  @type({ map: Planet }) planets = new MapSchema<Planet>();
  @type("number") gameTick = 0;
}

class Sector extends Schema {
  @type("number") id: number;
  @type(["number"]) warpConnections: number[] = [];
  @type("string") contents: string; // "empty", "port", "planet", "minefield"
  @type(["string"]) shipsPresent: string[] = []; // player IDs
}

class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") currentSector: number;
  @type("number") turnsRemaining: number;
  @type("number") credits: number;
  @type(Ship) ship: Ship;
  @type("string") federationId: string | null;
}

class Ship extends Schema {
  @type("string") type: string; // "merchant", "warship", "flagship"
  @type("number") holds: number;
  @type("number") maxHolds: number;
  @type(Cargo) cargo: Cargo;
  @type("number") fighters: number;
  @type("number") shields: number;
}

class Port extends Schema {
  @type("number") sectorId: number;
  @type("string") portType: string; // "class-0" (upgrades) or "buy-ore", "sell-equipment", etc.
  @type({ map: Commodity }) commodities = new MapSchema<Commodity>();
}

class Planet extends Schema {
  @type("number") sectorId: number;
  @type("string") ownerId: string | null;
  @type("number") fighters: number;
  @type("number") citadelLevel: number;
  @type("number") population: number;
}
```

**Key Operations:**
- `move(sectorId)` — Validate turn cost, update player location, check for encounters
- `trade(portId, commodity, amount)` — Validate port availability, update cargo/credits, consume turn
- `attackPlanet(planetId)` — Spawn CombatRoom, freeze turns until resolution
- `deployFighters(count)` — Place fighters in current sector, consume turns
- `colonizePlanet()` — Claim unowned planet in sector, consume turns

**Lifecycle:**
- `onCreate()` — Load galaxy from DB or generate procedurally
- `onJoin(client)` — Load player state, place in last sector, broadcast presence
- `onLeave(client)` — Mark offline, persist state to DB
- `onTick()` — Process queued actions, update port restocks, handle NPC movements

**Turn Validation:**
Every command checks `player.turnsRemaining > 0` before execution. On success, decrement turns and broadcast state change.

#### CombatRoom (Instanced Battles)

**Responsibility:** Resolve turn-based combat between players or player-vs-planet.

**Lifecycle:**
1. Triggered from GalaxyRoom when combat initiated
2. Players moved to CombatRoom, state frozen in GalaxyRoom
3. Turn-based: attacker acts, defender responds, repeat until victory/retreat
4. Results sent back to GalaxyRoom (casualties, loot, ownership changes)
5. Room disposed

**State Schema:**
```typescript
class CombatState extends Schema {
  @type(Combatant) attacker: Combatant;
  @type(Combatant) defender: Combatant;
  @type("string") phase: string; // "attacker-turn", "defender-turn", "resolved"
  @type(["string"]) log: string[] = [];
}

class Combatant extends Schema {
  @type("string") id: string;
  @type("number") fighters: number;
  @type("number") shields: number;
  @type("string") shipType: string;
}
```

**Key Operations:**
- `attack()` — Roll for hits based on fighter count and ship stats
- `retreat()` — Flee combat, return to GalaxyRoom with losses
- `resolveTurn()` — Calculate damage, update fighter counts, check for victory

#### FederationRoom (Alliance Coordination)

**Responsibility:** Private communication and shared intelligence for player alliances.

**State Schema:**
```typescript
class FederationState extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type(["string"]) memberIds: string[] = [];
  @type({ map: string }) roles = new MapSchema<string>(); // playerId -> role
  @type(["Message"]) messages: Message[] = [];
  @type({ map: SectorIntel }) sharedIntel = new MapSchema<SectorIntel>();
}

class SectorIntel extends Schema {
  @type("number") sectorId: number;
  @type("string") notes: string;
  @type("number") lastUpdated: number;
}
```

**Key Operations:**
- `sendMessage(text)` — Broadcast to all members
- `shareIntel(sectorId, notes)` — Update shared sector knowledge
- `inviteMember(playerId)` — Add player (requires CEO permission)
- `setRole(playerId, role)` — Assign permissions (CEO, officer, member)

---

## Client/Server Responsibility Split

### Server Owns:
- **All game state** — Sectors, players, ports, planets
- **Turn accounting** — Remaining turns, daily resets
- **Action validation** — Legal moves, sufficient resources, turn costs
- **Combat resolution** — Damage rolls, victory conditions
- **Economy** — Port prices, restocking, planet production
- **Persistence** — Save/load to database

### Client Owns:
- **Rendering** — PixiJS scene graph, sprites, animations
- **Input handling** — Mouse/keyboard, UI interactions
- **Prediction** — Optimistic updates for responsiveness
- **Presentation logic** — HUD, menus, tooltips, effects
- **Camera control** — Pan, zoom, focus on sectors

### Sync Strategy:
- **Authoritative server model** — Client sends commands, server validates and broadcasts results
- **Delta compression** — Colyseus Schema sends only changed fields
- **Client prediction** — Show immediate feedback, reconcile on server response
- **Event-driven updates** — State changes trigger animations/effects on client

**Example Flow (player moves):**
1. Client: User clicks adjacent sector → send `move(sectorId)` command
2. Client: Optimistically render ship moving (with visual indicator)
3. Server: Validate turn cost and warp connection → decrement turns → update `player.currentSector`
4. Server: Broadcast state delta via Schema sync
5. Client: Receive delta → reconcile (if prediction wrong, snap to truth) → clear indicator

---

## Data Model Overview

### Core Entities

#### Player
- **Persistent:** Account ID, name, federation membership, lifetime stats
- **Session:** Current sector, turns remaining, credits, cargo, ship config
- **Progression:** Ship upgrades, tech unlocks, reputation

#### Sector
- **Static:** ID, warp connections (edges in graph)
- **Dynamic:** Ships present, ownership (if claimed), deployables (mines, fighters)
- **Special:** Port/planet reference (if present)

#### Port
- **Type:** Class 0-8 (determines buy/sell profile)
- **Inventory:** Commodity quantities and prices (dynamic)
- **Restock:** Timer for regeneration

#### Planet
- **Ownership:** Player/federation claim
- **Development:** Population, citadel level, production rate
- **Defense:** Fighter garrison, shields
- **Location:** Current sector (can be moved)

#### Ship
- **Type:** Determines base stats (holds, fighters, shields, speed)
- **Cargo:** Ore, organics, equipment quantities
- **Upgrades:** Purchased equipment (scanners, cloaking, transwarp)

#### Federation
- **Metadata:** Name, founded date, member count
- **Structure:** CEO, officers, members (role hierarchy)
- **Resources:** Shared credits, planets, intel
- **Relations:** Treaties with other federations

### Key Relationships

```
Player 1:1 Ship
Player N:1 Federation
Player N:M Sector (current location)
Sector 1:N Warp (connections)
Sector 1:1? Port
Sector 1:N Planet
Planet N:1 Player (owner)
Federation 1:N Planet (shared ownership)
```

### Database Schema (PostgreSQL)

**Tables:**
- `users` — Account credentials, email, created_at
- `players` — Game profile per user (can have multiple per server)
- `ships` — Current ship state per player
- `sectors` — Static galaxy graph structure
- `ports` — Location and type (state in memory, persisted periodically)
- `planets` — All planet instances with ownership and stats
- `federations` — Alliance metadata
- `federation_members` — Join table with roles
- `turn_history` — Audit log of actions (for analytics/replays)

**Redis Usage:**
- Session tokens
- Player online status (presence)
- Port price cache (hot data)
- Pub/sub for cross-room events (e.g., federation alerts)

---

## Turn System Design

### Daily Turn Allocation

**Core mechanic:** Each player receives a fixed number of turns at daily reset (e.g., 500 turns).

**Reset Timing:**
- Server time-based (e.g., midnight UTC)
- All players reset simultaneously
- Database transaction ensures atomicity

**Turn Costs (tentative):**
- **Movement:** 1 turn per sector hop
- **Trading:** 1 turn per port transaction
- **Planet colonization:** 10 turns
- **Deploy fighters:** 1 turn per 10 fighters
- **Deploy mines:** 1 turn per 5 mines
- **Attack player:** 5 turns to initiate (combat resolution separate)
- **Attack planet:** 10 turns to initiate

**Turn Banking:**
- Unused turns do **not** carry over (use it or lose it)
- Encourages daily engagement
- Prevents hoarding for massive one-day campaigns

**Turn Display:**
- Persistent HUD indicator: `Turns: 342/500`
- Warning at < 50 turns
- Grayed-out actions when insufficient turns
- Estimated turn cost shown on hover

### Turn Validation Flow

```typescript
// Server-side (GalaxyRoom)
onMessage("move", (client, { targetSector }) => {
  const player = this.state.players.get(client.sessionId);
  
  if (player.turnsRemaining < 1) {
    client.send("error", { message: "Insufficient turns" });
    return;
  }
  
  if (!this.isValidWarp(player.currentSector, targetSector)) {
    client.send("error", { message: "No warp connection" });
    return;
  }
  
  player.turnsRemaining -= 1;
  player.currentSector = targetSector;
  
  // Check for encounters (ports, planets, other players)
  this.handleSectorEncounters(player);
});
```

### Special Cases

**New Players:**
- Start with 100 "tutorial" turns (doesn't reset)
- Unlocks full turn allocation after reaching certain milestone

**Premium/VIP:**
- Could offer +10% turn bonus (e.g., 550 instead of 500)
- Controversial but common monetization

**Federation Pooling:**
- Advanced mechanic: members can donate turns to federation bank
- CEO allocates to coordinated operations
- Requires robust permission system

---

## Alliance/Federation System Design

### Structure

**Three-Tier Hierarchy:**
1. **CEO** — Founder, full control, can disband
2. **Officer** — Limited admin (invite, kick members, manage shared assets)
3. **Member** — Basic participation (chat, view intel, contribute resources)

**Formation:**
- Any player can found a federation (cost: 10,000 credits)
- CEO names federation, sets initial policies
- Invite-only membership (prevents griefing)

### Shared Resources

**Federation Treasury:**
- Members contribute credits voluntarily
- Officers allocate funds (e.g., buy shared planet defenses)
- Transaction log for transparency

**Shared Planets:**
- Planets can be "donated" to federation
- All members can dock, resupply
- Only officers can fortify or modify
- Defense triggers alert all members

**Intelligence Network:**
- Members tag sectors with notes ("Enemy corp HQ", "Safe trade route")
- Annotations visible only to federation
- Real-time updates when member scouts new area

### Communication

**Federation Chat:**
- Persistent room (FederationRoom)
- Message history stored
- Offline members see backlog on login

**Alerts:**
- Push notifications for critical events:
  - Federation planet under attack
  - Member killed by enemy
  - New intel shared
  - CEO announcement

**Diplomacy:**
- CEOs can propose treaties (non-aggression, mutual defense, trade agreement)
- Voting system for major decisions (if democratic structure)
- Public declaration of war/peace

### Metagame

**Reputation:**
- Federation has aggregate reputation (sum of member actions)
- Affects NPC faction relations
- Can be targeted by "bounty hunters" if pirate-aligned

**Ranking:**
- Leaderboard of federations (by members, planets owned, wealth)
- Drives competition
- "Season" resets (optional) to prevent stagnation

**Betrayal Mechanics:**
- Members can leave freely (cooldown period)
- Officers can be demoted/kicked by CEO
- If CEO is inactive, automatic succession to most senior officer
- Stolen resources on leaving (risk/reward for spies)

---

## MVP Scope Recommendation

### Phase 1: Core Loop (MVP)
**Goal:** Prove the turn-based trade loop is fun.

**Features:**
- ✅ Basic galaxy generation (500 sectors, static graph)
- ✅ Player login, spawn in starting sector
- ✅ Sector navigation (move command, turn cost)
- ✅ Port trading (3 commodities, 4 port types)
- ✅ Ship progression (2 ship types: Merchant, Scout)
- ✅ Turn system (daily reset, validation)
- ✅ Client rendering (PixiJS galaxy map, sector view)
- ✅ Persistence (save player state on logout)

**Defer:**
- ❌ Combat
- ❌ Planets
- ❌ Federations
- ❌ NPCs

**Success Criteria:**
- 10 concurrent players trade for 7 days
- Average session length > 15 minutes
- 70%+ return rate after turn reset

### Phase 2: Conflict & Territory
**Goal:** Add meaningful player interaction.

**Features:**
- ✅ Combat system (fighter-vs-fighter)
- ✅ Planet colonization (claim, fortify, produce)
- ✅ Ship types (add Warship, Flagship)
- ✅ Deployables (mines, fighters in sectors)
- ✅ Basic reputation (trader vs. pirate)

**Defer:**
- ❌ Federations (just 1v1 conflict)
- ❌ Complex tech trees
- ❌ Planet movement

**Success Criteria:**
- 50 concurrent players
- 20% engage in combat weekly
- 50%+ claim at least one planet

### Phase 3: Alliances & Politics
**Goal:** Enable emergent social gameplay.

**Features:**
- ✅ Federation creation
- ✅ Federation chat & intel sharing
- ✅ Shared resources (treasury, planets)
- ✅ Diplomacy (treaties, war declarations)
- ✅ Leaderboards (player, federation)

**Success Criteria:**
- 100 concurrent players
- 60%+ join a federation
- Top 10 federations control 70%+ of planets

### Phase 4: Depth & Endgame
**Goal:** Retain long-term players.

**Features:**
- ✅ Advanced ships (10+ types)
- ✅ Tech tree (research unlocks)
- ✅ Planet movement
- ✅ Special sectors (black holes, nebulae)
- ✅ NPC factions (traders, pirates, police)
- ✅ Seasonal resets with rewards
- ✅ Mobile app (read-only or basic commands)

**Success Criteria:**
- 500 concurrent players
- 30-day retention > 40%
- 10%+ conversion to premium

---

## Technology Stack Details

### Server

**Framework:** Colyseus 0.15+
- TypeScript-first
- Built-in state synchronization
- Horizontal scaling with Redis

**Runtime:** Node.js 20+
- Stable LTS
- Native ESM support

**Database:** PostgreSQL 16+
- JSONB for flexible schemas (player configs)
- PostGIS for spatial queries (if needed)
- Connection pooling (pg-pool)

**Cache/Pub-Sub:** Redis 7+
- Session storage
- Room presence
- Leaderboard caching

**Hosting:** Docker containers on AWS ECS or DigitalOcean App Platform
- Auto-scaling based on load
- Load balancer for WebSocket connections

### Client

**Framework:** PixiJS 8+
- WebGL rendering
- Sprite batching
- Texture atlases

**State Management:** Colyseus SDK + reactive bindings
- Schema subscriptions
- Optimistic updates with reconciliation

**Build:** Vite
- Fast dev server
- Tree-shaking
- Code splitting

**Hosting:** Vercel or Netlify
- CDN distribution
- Automatic HTTPS
- Preview deployments

### DevOps

**CI/CD:** GitHub Actions
- Lint, test, build on PR
- Auto-deploy to staging
- Manual production gate

**Monitoring:** Sentry (errors) + Datadog (metrics)
- Client errors tracked
- Server latency, room count, player count
- Alerts for anomalies

**Logging:** Winston (server) + structured JSON
- Query logs in CloudWatch or Datadog

---

## Open Questions & Risks

### Technical Risks

**1. Galaxy Size vs. Performance**
- **Risk:** 1000+ sectors in single room state = large payload
- **Mitigation:** Spatial partitioning (only sync nearby sectors), lazy loading, or shard galaxy into regions

**2. Turn Reset Spike**
- **Risk:** All players logging in at midnight causes thundering herd
- **Mitigation:** Stagger resets by time zone, pre-allocate turns in background job

**3. Cheat Prevention**
- **Risk:** Client can send invalid commands if server validation is weak
- **Mitigation:** Double-check all actions server-side, rate limiting, audit logs

**4. State Bloat**
- **Risk:** As galaxy grows (more planets, deployables), state size explodes
- **Mitigation:** Separate "cold" state (planets not near players) from "hot" state (active sectors)

### Design Risks

**1. Turn Economy Balance**
- **Risk:** Too few turns = frustration, too many = grind
- **Mitigation:** Playtesting with analytics, adjustable config per server

**2. Griefing**
- **Risk:** High-level players camping low-level areas
- **Mitigation:** Safe zones, reputation penalties, sector police NPCs

**3. Endgame Stagnation**
- **Risk:** Dominant federation locks down galaxy, new players quit
- **Mitigation:** Seasonal resets, asymmetric mechanics (small groups can disrupt), diminishing returns on territory

**4. Social Dynamics**
- **Risk:** Toxic players ruin federation experience
- **Mitigation:** Moderation tools, kick/ban, player reporting, CEO oversight

---

## Next Steps

### Immediate (Week 1)
1. **Prototype galaxy generation** — Procedural sector graph with warp connections
2. **Implement GalaxyRoom** — Basic schema with sectors, players, turns
3. **Spike PixiJS rendering** — Draw sectors, player ship, connections
4. **Test state sync** — Move player between sectors, verify delta updates

### Short-Term (Month 1)
1. **Build MVP trading loop** — Ports, commodities, buy/sell, ship cargo
2. **Implement turn system** — Daily reset, validation, HUD display
3. **Client UX** — Sector detail panel, port interaction, trade UI
4. **Persistence layer** — Save/load player state, galaxy snapshot

### Medium-Term (Month 2-3)
1. **Combat prototype** — CombatRoom, fighter battles, outcomes
2. **Planet system** — Colonization, defense, production
3. **Expanded ship types** — Merchant, Scout, Warship with unique stats
4. **Playtesting** — Closed alpha with 10-20 users

### Long-Term (Month 4+)
1. **Federation system** — Creation, chat, shared resources
2. **Diplomacy mechanics** — Treaties, wars, reputation
3. **Endgame content** — Advanced ships, tech tree, seasonal events
4. **Public beta** — Marketing, scaling, community building

---

## References & Inspiration

### TradeWars 2002
- [TradeWars Museum](https://wiki.classictw.com) — Game guides, community
- [TW2002 Bible](http://penismightier.com/clme/Trade_Wars/Trade_Wars_2002_Bible.htm) — Comprehensive strategy guide
- [BBS Wiki - TradeWars](https://breakintochat.com/wiki/TradeWars_2002) — History and mechanics

### Modern Games
- **Neptune's Pride** — Diplomacy-focused 4X, slow-burn strategy
- **OGame** — Empire building with asynchronous timers
- **EVE Online** — Player-driven economy and emergent stories

### Technical Resources
- [Colyseus Docs](https://docs.colyseus.io) — Official framework documentation
- [PixiJS Guides](https://pixijs.com/guides) — Rendering and architecture
- [Multiplayer Game Architecture (Colyseus + PixiJS)](https://arnauld-alex.com/guiding-the-flock-building-a-realtime-multiplayer-game-architecture-in-typescript) — Detailed tutorial

---

## Appendix: Alternative Architectures Considered

### Pure Real-Time (Rejected)
- **Approach:** No turns, continuous movement and actions (like EVE)
- **Why rejected:** Favors 24/7 players, destroys work-life balance, loses strategic pacing

### Fully Instanced (Rejected)
- **Approach:** Each player in separate room, galaxy is abstract
- **Why rejected:** Kills social interaction, no persistent world, loses TradeWars essence

### Tick-Based Hybrid (Considered)
- **Approach:** Like Neptune's Pride — actions queue, resolve on hourly ticks
- **Why deferred:** More complex to implement, MVP should prove core loop first
- **Future option:** Could add queued actions in Phase 4 (e.g., "move to sector X when turns reset")

---

**End of Document**

*This architecture is a living document. As we prototype and playtest, we'll refine systems, adjust scope, and discover new patterns. The goal is to ship fast, learn fast, and iterate toward a game that captures TradeWars' magic in a modern multiplayer context.*
