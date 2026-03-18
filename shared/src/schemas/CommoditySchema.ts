import { Schema, type } from "@colyseus/schema";

/**
 * A commodity listing at a port.
 * Tracks stock levels and current buy/sell prices.
 */
export class CommoditySchema extends Schema {
  /** Commodity identifier (matches Commodity enum value). */
  @type("string") commodity: string = "";

  /** Current stock at this port. */
  @type("uint32") stock: number = 0;

  /** Maximum stock this port can hold for this commodity. */
  @type("uint32") maxStock: number = 0;

  /** Price the port charges when selling to players. 0 if port doesn't sell. */
  @type("uint32") buyPrice: number = 0;

  /** Price the port pays when buying from players. 0 if port doesn't buy. */
  @type("uint32") sellPrice: number = 0;

  /** Whether the port is buying (true) or selling (false) this commodity. */
  @type("boolean") portBuys: boolean = false;
}
