# API Message Reference

Void Market communicates using a **discriminated union message protocol** over WebSocket via [Colyseus](https://colyseus.io/). This document is the authoritative reference for all client↔server messages, validation rules, and error formats.

**Last Updated:** 2024  
**Audience:** Client developers, server maintainers, game designers  
**Related Docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [GAME-SYSTEMS.md](./GAME-SYSTEMS.md)

---

## Overview

### Communication Model

- **Protocol:** Colyseus rooms + discriminated union message passing
- **Transport:** WebSocket (real-time, bidirectional)
- **Rooms:**
  - `GalaxyRoom` — persistent galaxy state (one per server)
  - `CombatRoom` — instanced combat sessions (created on demand)
  - `FederationRoom` — per-alliance private channels (Phase 2+)
- **State Sync:** Automatic delta-compressed state patching via Colyseus Schema
- **Messages:** Explicit, typed JSON messages sent via `room.send(type, payload)`

### Message Pattern

All messages use a **discriminated union** with a `type` field:

```typescript
interface Message {
  readonly type: string;  // Discriminator (e.g., "move", "trade", "error")
  // ... payload fields
}
```

**Client sends:** `room.send(msg.type, msg)` — payload includes the `type` field  
**Server broadcasts:** `room.broadcast(msg.type, msg)` or `client.send(msg.type, msg)`

### Validation & Authorization

- **All server-side:** The server validates **every** message before execution
- **No client-side trust:** Playful clients may send invalid payloads
- **Action validation:** Before executing, server checks:
  1. Message payload shape & types ✓
  2. Authorization (is player owner of the ship/account?) ✓
  3. Game rules (enough turns? valid sector? docked for trade?) ✓
  4. Economy constraints (enough credits? port willing to trade?) ✓
- **Turn cost deduction:** Applied after validation succeeds

### Error Handling

On validation failure, server responds with an `ErrorMessage`. Clients should show error message to player and **not** assume the action succeeded.

---

## Client → Server Messages

All messages sent by client to server via `room.send(type, payload)`.

### MOVE

Request to move the player's ship to an adjacent sector via warp connection.

**Payload:**

```typescript
{
  type: "move",
  targetSectorId: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"move"` | ✓ | Discriminator |
| `targetSectorId` | number | ✓ | ID of adjacent sector; must be connected by a warp edge |

**Validation Rules:**

- `targetSectorId` must be a valid sector ID in the galaxy
- Current sector must have a warp connection to `targetSectorId` (check `Sector.warpGates`)
- Player must have ≥1 turn remaining (see [Turn System](#turn-system))
- Player must **not** be docked at a port (cannot move while docked)
- Ship must be in a navigable state (not destroyed in combat, etc.)

**Turn Cost:** 1 turn (or `TURN_COSTS.Move`)

**Expected Server Response:**

- **Success:** No explicit message; server broadcasts `SectorEnteredMessage` to all players in new sector, and updates player state via Colyseus delta (new `currentSectorId`, reduced `turnsRemaining`)
- **Failure:** `ErrorMessage` with code and details

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `INVALID_SECTOR` | `targetSectorId` does not exist | `{ targetSectorId }` |
| `NOT_CONNECTED` | No warp connection between sectors | `{ currentSectorId, targetSectorId }` |
| `INSUFFICIENT_TURNS` | Player has 0 turns remaining | `{ turnsRemaining, turnsRequired: 1 }` |
| `DOCKED` | Cannot move while docked at port | `{ currentSectorId, portId }` |
| `SHIP_DISABLED` | Ship is not in a navigable state | (varies by phase) |

---

### TRADE

Request to execute a trade transaction at the currently docked port.

**Payload:**

```typescript
{
  type: "trade",
  commodity: string,
  quantity: number,
  buying: boolean
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"trade"` | ✓ | Discriminator |
| `commodity` | string | ✓ | Commodity code: `"fuel_ore"` \| `"organics"` \| `"equipment"` |
| `quantity` | number | ✓ | Units to buy or sell (positive integer) |
| `buying` | boolean | ✓ | `true` = player buys from port; `false` = player sells to port |

**Validation Rules:**

- Player **must** be docked (`player.isDocked === true`)
- `commodity` must be one of: `"fuel_ore"`, `"organics"`, `"equipment"`
- `quantity` must be a positive integer > 0
- Player must have ≥2 turns remaining (`TURN_COSTS.Trade = 2`)
- **If buying:**
  - Player's available credits must be ≥ (quantity × current port price)
  - Port must be willing to sell (`port.portClass[commodity] === "selling"`)
  - Port must have ≥ quantity units in stock
  - Player's ship cargo must have space for quantity units (check `ship.cargoHolds + quantity ≤ ship.maxCargoHolds`)
- **If selling:**
  - Player's ship must carry ≥ quantity units of commodity
  - Port must be willing to buy (`port.portClass[commodity] === "buying"`)
  - Port must have available stock space (max stock = 5000 per commodity by default)

**Turn Cost:** 2 turns (`TURN_COSTS.Trade`)

**Expected Server Response:**

`TradeResultMessage` with trade outcome:

```typescript
{
  type: "trade_result",
  success: boolean,
  commodity: string,
  quantity: number,
  totalPrice: number,        // Total credits exchanged
  newCredits: number,        // Player's new credits balance
  newStock: number,          // Port's new stock of commodity
  error?: string             // Human-readable error if success=false
}
```

If success=false, the trade was rejected. Player state is **unchanged** (no credits/cargo change).

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `NOT_DOCKED` | Player not docked at port | `{ currentSectorId }` |
| `INVALID_COMMODITY` | Commodity not recognized | `{ commodity }` |
| `INSUFFICIENT_TURNS` | Not enough turns | `{ turnsRemaining, turnsRequired: 2 }` |
| `PORT_WONT_SELL` | Port doesn't sell this commodity | `{ commodity, portClass }` |
| `PORT_WONT_BUY` | Port doesn't buy this commodity | `{ commodity, portClass }` |
| `INSUFFICIENT_CREDITS` | Player lacks funds to buy | `{ credits, required: totalPrice }` |
| `INSUFFICIENT_STOCK` | Port or player cargo exhausted | `{ availableStock, requestedQuantity }` |
| `CARGO_FULL` | Player's cargo hold is full | `{ currentHolds, maxHolds, needed: quantity }` |
| `INVALID_QUANTITY` | Quantity ≤ 0 or invalid type | `{ quantity }` |

---

### DOCK

Request to dock at the port in the player's current sector.

**Payload:**

```typescript
{
  type: "dock"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"dock"` | ✓ | Discriminator |

**Validation Rules:**

- Player's current sector must contain a port (`sector.portId` is non-null)
- Player must **not** already be docked (`player.isDocked === false`)
- Player must not have `isDocked=true` for a different port (state consistency)

**Turn Cost:** 0 turns

**Expected Server Response:**

- **Success:** No explicit message; server updates `player.isDocked = true` via Colyseus delta
- **Failure:** `ErrorMessage` with code and details

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `NO_PORT` | Sector has no port | `{ currentSectorId }` |
| `ALREADY_DOCKED` | Player already docked | `{ portId }` |

---

### UNDOCK

Request to undock from the current port.

**Payload:**

```typescript
{
  type: "undock"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"undock"` | ✓ | Discriminator |

**Validation Rules:**

- Player **must** be docked (`player.isDocked === true`)

**Turn Cost:** 0 turns

**Expected Server Response:**

- **Success:** No explicit message; server updates `player.isDocked = false` via Colyseus delta
- **Failure:** `ErrorMessage` with code and details

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `NOT_DOCKED` | Player not docked | `{ currentSectorId }` |

---

### SECTOR_SCAN

Request sector scan information (adjacent sectors, hazards, NPC presence). Phase 1 uses this to fetch adjacent sector metadata.

**Payload:**

```typescript
{
  type: "sector_scan",
  sectorId: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"sector_scan"` | ✓ | Discriminator |
| `sectorId` | number | ✓ | ID of sector to scan; typically player's current sector or adjacent |

**Validation Rules:**

- `sectorId` must be a valid sector ID
- Sector must be within scanning range (player's current sector or adjacent via warp connection)
- Player must have ≥1 turn remaining (`TURN_COSTS.Scan = 1`)

**Turn Cost:** 1 turn

**Expected Server Response:**

- **Success:** Server responds with delta-synced `Sector` state via Colyseus (no explicit message)
  - Contains: adjacent warp connections (`warpGates`), port info, hazards, NPC ships
- **Failure:** `ErrorMessage` with code and details

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `INVALID_SECTOR` | Sector does not exist | `{ sectorId }` |
| `OUT_OF_RANGE` | Sector not within scanning range | `{ sectorId, currentSectorId }` |
| `INSUFFICIENT_TURNS` | Not enough turns | `{ turnsRemaining, turnsRequired: 1 }` |

---

### PORT_QUERY

Request detailed commodity pricing and availability for a specific port. Used to check prices before committing to a trade.

**Payload:**

```typescript
{
  type: "port_query",
  portId: string
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"port_query"` | ✓ | Discriminator |
| `portId` | string | ✓ | ID of port to query (UUID or server-assigned string) |

**Validation Rules:**

- `portId` must reference a valid port in the galaxy
- Player does **not** need to be docked to query; allows remote price checking (Phase 2 planning)

**Turn Cost:** 0 turns

**Expected Server Response:**

- **Success:** Server responds with full `Port` state via Colyseus delta (no explicit message)
  - Contains: port name, class, commodities map with prices and stock
- **Failure:** `ErrorMessage` with code and details

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| `INVALID_PORT` | Port does not exist | `{ portId }` |

---

## Server → Client Messages

All messages broadcast or sent by server to client(s).

### ERROR

Error response indicating a command failed validation or execution.

**Payload:**

```typescript
{
  type: "error",
  code: string,
  message: string,
  details?: Record<string, unknown>
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"error"` | ✓ | Discriminator |
| `code` | string | ✓ | Machine-readable error code (e.g., `"INSUFFICIENT_TURNS"`) |
| `message` | string | ✓ | Human-readable description for UI display |
| `details` | object | × | Optional context: `{ turnsRemaining, turnsRequired }`, etc. |

**When Sent:**

- Player attempts an invalid action (insufficient turns, wrong sector, etc.)
- Authorization fails (player not owner of ship, etc.)
- Game rule violated (can't dock if no port, can't trade incompatible commodity, etc.)

**Example:**

```json
{
  "type": "error",
  "code": "INSUFFICIENT_TURNS",
  "message": "Not enough turns remaining to execute this action.",
  "details": {
    "turnsRemaining": 0,
    "turnsRequired": 1,
    "actionType": "move"
  }
}
```

---

### TRADE_RESULT

Result of a completed trade transaction.

**Payload:**

```typescript
{
  type: "trade_result",
  success: boolean,
  commodity: string,
  quantity: number,
  totalPrice: number,
  newCredits: number,
  newStock: number,
  error?: string
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"trade_result"` | ✓ | Discriminator |
| `success` | boolean | ✓ | `true` if trade executed; `false` if rejected |
| `commodity` | string | ✓ | Commodity traded (echo of request) |
| `quantity` | number | ✓ | Units traded |
| `totalPrice` | number | ✓ | Total credits exchanged |
| `newCredits` | number | ✓ | Player's credits balance after trade |
| `newStock` | number | ✓ | Port's stock of commodity after trade |
| `error` | string | × | Human-readable error if `success=false` |

**When Sent:**

- Immediately after player sends a `TRADE` message (success or failure)
- **Always** sent to the client that initiated the trade (not broadcast)

**Example (Success):**

```json
{
  "type": "trade_result",
  "success": true,
  "commodity": "fuel_ore",
  "quantity": 50,
  "totalPrice": 1000,
  "newCredits": 9000,
  "newStock": 4950
}
```

**Example (Failure):**

```json
{
  "type": "trade_result",
  "success": false,
  "commodity": "equipment",
  "quantity": 100,
  "totalPrice": 0,
  "newCredits": 5000,
  "newStock": 2500,
  "error": "Port does not buy equipment"
}
```

---

### SYSTEM

System broadcast (server announcements, maintenance alerts, etc.).

**Payload:**

```typescript
{
  type: "system",
  message: string,
  severity: "info" | "warning" | "critical",
  timestamp: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"system"` | ✓ | Discriminator |
| `message` | string | ✓ | Message text for display |
| `severity` | enum | ✓ | Log level: `"info"` (routine), `"warning"` (action needed), `"critical"` (stop/restart) |
| `timestamp` | number | ✓ | Unix milliseconds (or server tick number) |

**When Sent:**

- Server maintenance scheduled
- Economy event (market crash, port explodes, etc.)
- Diplomacy event (alliance formed, war declared)
- Broadcast to **all** players

---

### PLAYER_JOINED

Notification that a new player has entered the galaxy.

**Payload:**

```typescript
{
  type: "player_joined",
  playerId: string,
  displayName: string,
  sectorId: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"player_joined"` | ✓ | Discriminator |
| `playerId` | string | ✓ | Unique player ID |
| `displayName` | string | ✓ | Player's in-game name |
| `sectorId` | number | ✓ | Starting sector (usually `STARTING_SECTOR_ID = 1`) |

**When Sent:**

- After a new player joins the galaxy (`GalaxyRoom.onJoin`)
- Broadcast to **all** online players

---

### PLAYER_LEFT

Notification that a player has left the galaxy.

**Payload:**

```typescript
{
  type: "player_left",
  playerId: string
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"player_left"` | ✓ | Discriminator |
| `playerId` | string | ✓ | ID of player who left |

**When Sent:**

- After a player disconnects or leaves (`GalaxyRoom.onLeave`)
- Broadcast to **all** remaining players

---

### SECTOR_ENTERED

Notification that a player entered your current sector.

**Payload:**

```typescript
{
  type: "sector_entered",
  playerId: string,
  displayName: string,
  sectorId: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"sector_entered"` | ✓ | Discriminator |
| `playerId` | string | ✓ | ID of player entering |
| `displayName` | string | ✓ | Player's display name |
| `sectorId` | number | ✓ | Sector ID entered |

**When Sent:**

- After a player moves to a sector via `MOVE` message
- Broadcast to **all** players already in that sector (not the moving player, they get state delta)
- Used for real-time sector activity notifications

---

### TURN_UPDATE

Turn balance update pushed after any turn-consuming action.

**Payload:**

```typescript
{
  type: "turn_update",
  turnsRemaining: number,
  turnsMax: number,
  nextRegenAt: number
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | literal `"turn_update"` | ✓ | Discriminator |
| `turnsRemaining` | number | ✓ | Turns left in player's bank (0–2000) |
| `turnsMax` | number | ✓ | Max turn capacity (always 2000 in MVP) |
| `nextRegenAt` | number | ✓ | Unix ms when next turn regenerates; client can use for UI countdown |

**When Sent:**

- **Always** after player executes a turn-consuming action (move, trade, scan)
- Sent to **that player only** (not broadcast)
- Provides explicit turn state to avoid desync with delta patching

**Note:** `turnsRemaining` and `turnsMax` are also synced via Colyseus `PlayerSchema` delta, so this message is **redundant** with schema updates but provided for explicit confirmation and UI latency hiding.

---

## State Synchronization (Colyseus Schema)

Separate from explicit messages, Colyseus automatically synchronizes game state via **delta-compressed schema patching**:

- **Root State:** `GalaxyState` (contains all sectors, players, ports)
- **Player State:** `PlayerSchema` (player ID, credits, turns, current sector, docked status, ship)
- **Ship State:** `ShipSchema` (cargo holds, cargo manifest, ship class, speed)
- **Sector State:** `SectorSchema` (warp connections, port ID, players in sector)
- **Port State:** `PortSchema` (name, class, commodity prices/stock)
- **Commodity State:** `CommoditySchema` (price, stock for a single commodity at a port)

**Sync Model:**

1. Server maintains authoritative state
2. Server patches change state as actions execute
3. Colyseus automatically encodes diffs and sends to all subscribed clients
4. Client applies diffs to local state (reconciles client prediction with server truth)
5. Client renders from reconciled state

**No hand-crafted update messages needed** — Colyseus handles it.

---

## Error Handling

### Error Response Format

All errors use the `ErrorMessage` type:

```typescript
{
  type: "error",
  code: string,
  message: string,
  details?: { [key: string]: any }
}
```

### Common Error Codes

| Code | HTTP Analog | Cause |
|------|-------------|-------|
| `INVALID_REQUEST` | 400 | Malformed message payload |
| `UNAUTHORIZED` | 401 | Player not authenticated |
| `FORBIDDEN` | 403 | Player not owner of ship/account |
| `NOT_FOUND` | 404 | Sector, port, player not found |
| `CONFLICT` | 409 | State conflict (already docked, etc.) |
| `UNPROCESSABLE_ENTITY` | 422 | Validation failed (insufficient turns, cargo full) |
| `INTERNAL_ERROR` | 500 | Server error (log for debugging) |

### Client Best Practices

1. **Expect errors:** Always handle `ErrorMessage` responses
2. **Show user feedback:** Display `message` field to player
3. **Log details:** Store `details` field for debugging
4. **Retry logic:** Only retry transient errors (connection timeouts, etc.); do **not** retry permanent failures (insufficient turns, etc.)
5. **Reconcile state:** On error, assume **no state change** — server didn't execute the action

---

## Turn System

### Turn Costs

Actions cost turns; player must have sufficient balance to execute:

| Action | Turn Cost | Notes |
|--------|-----------|-------|
| Move | 1 | Between adjacent sectors via warp |
| Trade | 2 | Buy or sell at docked port |
| Dock | 0 | Free (no turn cost) |
| Undock | 0 | Free (no turn cost) |
| Sector Scan | 1 | Query sector info |
| Port Query | 0 | Free (info-gathering) |
| Attack (Phase 2) | 15 | Combat initiation |
| Colonize (Phase 2) | 50 | Claim planet |

### Turn Regeneration

- **Regen Rate:** 1 turn per 90 seconds (configurable via `VM_TURN_REGEN_MS`)
- **Max Bank:** 2000 turns (configurable via `VM_MAX_TURN_BANK`)
- **Starting Balance:** 500 turns (new player)
- **Sync Field:** `nextRegenAt` in `TurnUpdateMessage` indicates when next regen occurs

---

## Commodity Reference

### Tradeable Commodities

| Code | Name | Base Price | Notes |
|------|------|------------|-------|
| `fuel_ore` | Fuel Ore | 20 credits | Energy source, essential for movement |
| `organics` | Organics | 35 credits | Food/resources, produced at agricultural ports |
| `equipment` | Equipment | 70 credits | Ship upgrades, high-value item |

### Dynamic Pricing

Port prices fluctuate based on stock:

- **High stock** (>3500 units) → Price decreases ~25% from base
- **Normal stock** (1500–3500) → Base price
- **Low stock** (<1500 units) → Price increases ~25% from base
- **Out of stock** → Transactions blocked

Exact formula: `adjustedPrice = basePrice × (1 + (variance × (stock / maxStock - 0.5)))`

---

## Ship Classes

### Scout (Starting Ship)

- **Cargo:** 25 units
- **Shields:** 100 hp
- **Fighters:** 0 (no combat capability)
- **Warp Speed:** 3 (fastest, covers 3 sectors per move)
- **Cost:** Free (starting ship)

### Merchant

- **Cargo:** 100 units
- **Shields:** 200 hp
- **Fighters:** 50 (light combat)
- **Warp Speed:** 1
- **Cost:** 50,000 credits

### Frigate

- **Cargo:** 150 units
- **Shields:** 500 hp
- **Fighters:** 200 (medium combat)
- **Warp Speed:** 2
- **Cost:** 100,000 credits

### Cruiser

- **Cargo:** 200 units
- **Shields:** 1,000 hp
- **Fighters:** 500 (heavy combat)
- **Warp Speed:** 1
- **Cost:** 250,000 credits

### Dreadnought

- **Cargo:** 500 units
- **Shields:** 2,000 hp
- **Fighters:** 1,000 (max combat)
- **Warp Speed:** 1
- **Cost:** 500,000 credits

---

## Port Classes

Ports buy/sell commodities based on their class code. Three letters: [Fuel Ore, Organics, Equipment].
- **S** = Port **Sells** to player
- **B** = Port **Buys** from player

| Class | FuelOre | Organics | Equipment | Example Trade Route |
|-------|---------|----------|-----------|-------------------|
| SBB | Sells | Buys | Buys | Sell FuelOre, buy Organics/Equipment |
| BSB | Buys | Sells | Buys | Sell Organics, buy FuelOre/Equipment |
| BBS | Buys | Buys | Sells | Sell Equipment, buy FuelOre/Organics |
| SSB | Sells | Sells | Buys | Trade loop with specialized ports |
| SBS | Sells | Buys | Sells | Mixed cycle |
| BSS | Buys | Sells | Sells | Mixed cycle |
| BBB | Buys | Buys | Buys | Exchange hub (all incoming) |
| SSS | Sells | Sells | Sells | Supply hub (all outgoing) |

---

## Contributing to This Document

When adding new messages or modifying existing ones:

### Checklist

- [ ] Update `shared/src/messages/ClientMessages.ts` or `shared/src/messages/ServerMessages.ts` with new type definition
- [ ] Export type in `shared/src/messages/index.ts`
- [ ] Add message handler in server room (e.g., `server/src/rooms/GalaxyRoom.ts`)
- [ ] Implement validation logic for all fields
- [ ] Add error codes to server error handler
- [ ] **Update this document** with new message section (payload, validation, error codes)
- [ ] Add integration test in `server/src/rooms/__tests__/GalaxyRoom.test.ts` covering success and failure cases
- [ ] Run `npm run test` to verify tests pass
- [ ] Run `npm run build` to ensure no TypeScript errors

### Template for New Message

```markdown
### MESSAGE_NAME

One-line description of what this message does.

**Payload:**

\`\`\`typescript
{
  type: "message_name",
  field1: type1,
  field2: type2
}
\`\`\`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| \`type\` | literal | ✓ | Discriminator |
| \`field1\` | type1 | ✓/× | Description |

**Validation Rules:**

- Rule 1
- Rule 2

**Turn Cost:** X turns

**Expected Server Response:**

- **Success:** Description
- **Failure:** Error codes

**Error Codes:**

| Code | Reason | Details |
|------|--------|---------|
| \`CODE\` | Why it failed | \`{ context }\` |
```

### Living Document Process

1. **When opening an issue:** Tag with `#47-api-docs` so reviewers know doc impact
2. **In PR description:** If your change adds/modifies messages, add a section:
   ```
   ## API Changes
   - Added: `MESSAGE_NAME` (link to doc update)
   - Modified: `MESSAGE_NAME` (list changed fields)
   - Removed: `MESSAGE_NAME` (note deprecation)
   ```
3. **In PR review:** Docs must be updated **before merge** (not after)
4. **Deprecation process:** Mark old messages as `@deprecated` in TypeScript, document timeline for removal

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial MVP Phase 1 API (6 client messages, 7 server messages) |

---

## Support & Questions

- **Bug reports:** Open issue on GitHub with `[API]` prefix
- **Design discussions:** Start GitHub discussion for new message types
- **Code review:** Tag `@void-market/maintainers` on PRs modifying messages

