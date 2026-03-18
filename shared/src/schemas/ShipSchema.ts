import { Schema, type, ArraySchema } from "@colyseus/schema";
import { CargoSchema } from "./CargoSchema.js";

/**
 * Ship state synchronized via Colyseus delta patching.
 * MVP fields only — no combat stats (shields, fighters) until Phase 2.
 */
export class ShipSchema extends Schema {
  @type("string") shipId: string = "";
  @type("string") shipClass: string = "scout";
  @type("string") name: string = "";

  /** Current number of filled cargo holds. */
  @type("uint16") cargoHolds: number = 0;

  /** Maximum cargo hold capacity for this ship class. */
  @type("uint16") maxCargoHolds: number = 25;

  /** Warp speed (sectors per turn). */
  @type("uint8") speed: number = 3;

  /** Cargo manifest — one entry per commodity type carried. */
  @type([CargoSchema]) cargo = new ArraySchema<CargoSchema>();
}
