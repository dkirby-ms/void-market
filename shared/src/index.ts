/**
 * @void-market/shared — Types, constants, and schemas shared across client and server.
 */
export const VERSION = "0.0.2";

// Enums
export {
  ActionType,
  MessageType,
  Commodity,
  PortTradeType,
  PortClass,
  ShipClass,
} from "./enums.js";

// Constants
export {
  TURN_REGEN_INTERVAL_MS,
  MAX_TURN_BANK,
  STARTING_TURNS,
  TURN_COSTS,
  COMMODITIES,
  STARTING_CREDITS,
  BASE_PRICES,
  MAX_PORT_STOCK,
  DEFAULT_SECTOR_COUNT,
  MAX_WARPS_PER_SECTOR,
  STARTING_SECTOR_ID,
  SHIP_SPECS,
  FAST_TICK_MS,
  SLOW_TICK_MS,
  MAX_ALLIANCE_MEMBERS,
  MIN_STANDING,
  MAX_STANDING,
  STANDING_COOLDOWN_MS,
  WAR_DECLARATION_COST,
  MIN_WAR_DURATION_MS,
} from "./constants.js";
export type { ShipSpec } from "./constants.js";

// Types (pure interfaces — no runtime)
export type {
  Position,
  WarpRoute,
  TradeOffer,
  TradeResult,
  PortListing,
  PortInfo,
  PlayerAction,
  CargoHold,
  ShipInfo,
  PlayerProfile,
  SectorInfo,
  SectorNode,
  TurnStatus,
  GameError,
} from "./types.js";

// Colyseus Schema classes
export {
  PlayerSchema,
  ShipSchema,
  PortSchema,
  SectorSchema,
  GalaxyState,
} from "./schemas.js";
