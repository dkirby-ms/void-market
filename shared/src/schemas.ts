/**
 * Colyseus Schema base classes for Void Market.
 *
 * These are minimal scaffolds that prove the decorator pattern works.
 * They will be fleshed out as game systems are implemented in Phase 1.
 *
 * Schema classes are the authoritative state objects synchronized
 * from server → client via Colyseus delta compression.
 */

import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

// ── Player ───────────────────────────────────────────────────────────────────

export class PlayerSchema extends Schema {
  @type("string") playerId: string = "";
  @type("string") displayName: string = "";
  @type("number") sectorId: number = 1;
  @type("number") credits: number = 0;
  @type("number") turnsRemaining: number = 0;
  @type("string") shipClass: string = "scout";
}

// ── Ship ─────────────────────────────────────────────────────────────────────

export class ShipSchema extends Schema {
  @type("string") shipId: string = "";
  @type("string") shipClass: string = "scout";
  @type("string") name: string = "";
  @type("number") shields: number = 0;
  @type("number") fighters: number = 0;
  @type("number") cargoFuelOre: number = 0;
  @type("number") cargoOrganics: number = 0;
  @type("number") cargoEquipment: number = 0;
}

// ── Port ─────────────────────────────────────────────────────────────────────

export class PortSchema extends Schema {
  @type("string") portId: string = "";
  @type("string") name: string = "";
  @type("number") sectorId: number = 0;
  @type("uint8") portClass: number = 1;
  @type("number") stockFuelOre: number = 0;
  @type("number") stockOrganics: number = 0;
  @type("number") stockEquipment: number = 0;
}

// ── Sector ───────────────────────────────────────────────────────────────────

export class SectorSchema extends Schema {
  @type("number") sectorId: number = 0;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("boolean") hasPort: boolean = false;
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>();
}

// ── Galaxy State (GalaxyRoom root state) ─────────────────────────────────────

export class GalaxyState extends Schema {
  @type({ map: SectorSchema }) sectors = new MapSchema<SectorSchema>();
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: PortSchema }) ports = new MapSchema<PortSchema>();
  @type("number") tickCount: number = 0;
}
