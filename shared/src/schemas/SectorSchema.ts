import { Schema, type, ArraySchema } from "@colyseus/schema";
import { PortSchema } from "./PortSchema.js";

/**
 * Sector state synchronized via Colyseus delta patching.
 * Each sector is a node in the galaxy graph with warp connections.
 */
export class SectorSchema extends Schema {
  @type("uint16") sectorId: number = 0;

  /** X coordinate for galaxy map rendering. */
  @type("float32") x: number = 0;

  /** Y coordinate for galaxy map rendering. */
  @type("float32") y: number = 0;

  /** Warp connections — sector IDs reachable from here. */
  @type(["uint16"]) warps = new ArraySchema<number>();

  /** Port in this sector (null if no port). */
  @type(PortSchema) port: PortSchema | undefined;

  /** Player IDs currently in this sector. */
  @type(["string"]) playerIds = new ArraySchema<string>();
}
