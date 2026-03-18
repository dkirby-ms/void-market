import { Schema, type, MapSchema } from "@colyseus/schema";
import { SectorSchema } from "./SectorSchema.js";
import { PlayerSchema } from "./PlayerSchema.js";

/**
 * Root state schema for GalaxyRoom.
 * This is the top-level Colyseus state object — all synchronized
 * game state hangs off this tree.
 */
export class GalaxyState extends Schema {
  /** All sectors keyed by sector ID string. */
  @type({ map: SectorSchema }) sectors = new MapSchema<SectorSchema>();

  /** All online players keyed by player ID. */
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();

  /** Server tick counter (increments each fast tick). */
  @type("uint32") tickCount: number = 0;

  /** Server timestamp of last economy tick. */
  @type("float64") lastEconomyTick: number = 0;

  /** Total credits held by all players (recalculated each economy tick). */
  @type("float64") totalCredits: number = 0;

  /** Cumulative trade volume in credits since server start. */
  @type("float64") tradeVolume: number = 0;
}
