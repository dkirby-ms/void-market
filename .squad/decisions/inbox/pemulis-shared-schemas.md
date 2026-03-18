# Schema Design Decisions — Pemulis (#13, #14, #15)

**Date:** 2026-03-18  
**PR:** #64  
**Status:** Proposed (in PR)

## Decisions Made

### 1. Port class uses string codes, not numeric enum
**Choice:** `PortSchema.portClass` is a `string` ("SBB", "BSB", etc.) rather than numeric `PortClass` enum.  
**Rationale:** Self-documenting, maps directly to `PORT_CLASS_DEFS`, easier to debug in network traces. The numeric `PortClass` enum remains in `enums.ts` for any code that needs it, but the schema wire format is string.

### 2. Nested ShipSchema on PlayerSchema
**Choice:** `PlayerSchema.ship` is a nested `ShipSchema` instance, not a separate MapSchema reference.  
**Rationale:** Colyseus delta-syncs nested schemas automatically. This means ship state changes (cargo, holds) propagate to the client without extra message handling. Trade-off: each player always syncs their full ship state, but for MVP that's fine.

### 3. Commodity tracking via MapSchema<CommoditySchema>
**Choice:** `PortSchema.commodities` is `MapSchema<CommoditySchema>` keyed by commodity name string.  
**Rationale:** More extensible than flat fields (stockFuelOre, etc.). When Exotic Matter is added in Phase 2+, just add a new key — no schema migration needed. Also gives per-commodity buy/sell price tracking that the old flat fields lacked.

### 4. Sector playerIds as ArraySchema<string> vs nested players
**Choice:** `SectorSchema.playerIds` stores string IDs, not nested `PlayerSchema`.  
**Rationale:** Avoids double-syncing player data (already in `GalaxyState.players`). The sector just needs to know who's present for rendering, not their full state.

### 5. Ship specs: Scout 25 holds / Merchant 100 holds
**Choice:** Corrected from placeholder values (50/300) to decision-doc values (25/100).  
**Rationale:** Scout = fast + light (25 holds, speed 3), Merchant = slow + heavy (100 holds, speed 1). This creates meaningful ship progression and trade-offs.

### 6. Environment overrides with VM_ prefix
**Choice:** Key balancing values (sector count, turn regen, starting credits, tick rates, etc.) are overridable via `VM_*` env vars.  
**Rationale:** Allows tuning in staging/prod without code changes. Browser-safe: `typeof process === "undefined"` guard returns fallback on client.

## Open Questions
- Should `CommoditySchema.buyPrice`/`sellPrice` naming be from the **player's** perspective or the **port's** perspective? Currently named from player perspective (buyPrice = what player pays). Server team should confirm.
- Port in `SectorSchema` is optional (`PortSchema | undefined`). Colyseus handles this, but we should verify delta sync behavior when port is null.
