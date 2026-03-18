import { Schema, type } from "@colyseus/schema";

/**
 * A single cargo slot in a ship's hold.
 * Tracks commodity type and quantity carried.
 */
export class CargoSchema extends Schema {
  @type("string") commodity: string = "";
  @type("uint32") quantity: number = 0;
}
