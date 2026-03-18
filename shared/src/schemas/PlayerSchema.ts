import { Schema, type } from "@colyseus/schema";
import { ShipSchema } from "./ShipSchema.js";

/**
 * Player state synchronized via Colyseus delta patching.
 * MVP fields only — no alliance/federation membership until Phase 2+.
 */
export class PlayerSchema extends Schema {
  @type("string") playerId: string = "";
  @type("string") displayName: string = "";

  /** Current credits balance. */
  @type("float64") credits: number = 0;

  /** Turns remaining in the player's bank. */
  @type("uint16") turnsRemaining: number = 0;

  /** Maximum turn bank capacity. */
  @type("uint16") turnsMax: number = 2000;

  /** Sector the player currently occupies. */
  @type("uint16") currentSectorId: number = 1;

  /** Whether the player is currently docked at a port. */
  @type("boolean") isDocked: boolean = false;

  /** Whether the player is currently online. */
  @type("boolean") isOnline: boolean = false;

  /** The player's ship (nested schema for delta sync). */
  @type(ShipSchema) ship: ShipSchema = new ShipSchema();
}
