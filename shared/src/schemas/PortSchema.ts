import { Schema, type, MapSchema } from "@colyseus/schema";
import { CommoditySchema } from "./CommoditySchema.js";

/**
 * Port state synchronized via Colyseus delta patching.
 * Each port belongs to a sector and trades commodities based on its class.
 */
export class PortSchema extends Schema {
  @type("string") portId: string = "";
  @type("string") name: string = "";
  @type("uint16") sectorId: number = 0;

  /** Port class code string: e.g. "SBB", "BSB" (S=sells, B=buys for Fuel/Org/Equip). */
  @type("string") portClass: string = "BBS";

  /** Commodity listings keyed by commodity name (fuel_ore, organics, equipment). */
  @type({ map: CommoditySchema }) commodities = new MapSchema<CommoditySchema>();

  /** Timestamp of last economy restock tick. */
  @type("float64") lastRestock: number = 0;
}
