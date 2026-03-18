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
  PRICE_VARIANCE_PCT,
  RESTOCK_RATE,
  PORT_CLASS_DEFS,
  PORT_CLASS_CODES,
  DEFAULT_SECTOR_COUNT,
  MIN_WARPS_PER_SECTOR,
  MAX_WARPS_PER_SECTOR,
  STARTING_SECTOR_ID,
  PORT_DENSITY,
  SHIP_SPECS,
  FAST_TICK_MS,
  SLOW_TICK_MS,
  AUTOSAVE_INTERVAL_MS,
  MAX_ALLIANCE_MEMBERS,
  MIN_STANDING,
  MAX_STANDING,
  STANDING_COOLDOWN_MS,
  WAR_DECLARATION_COST,
  MIN_WAR_DURATION_MS,
} from "./constants.js";
export type { ShipSpec, PortClassDef } from "./constants.js";

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
  CargoSchema,
  CommoditySchema,
  ShipSchema,
  PortSchema,
  PlayerSchema,
  SectorSchema,
  GalaxyState,
} from "./schemas/index.js";

// Message protocol types
export {
  CLIENT_MSG,
  SERVER_MSG,
} from "./messages/index.js";
export type {
  ClientMessageType,
  MoveMessage,
  TradeMessage,
  DockMessage,
  UndockMessage,
  SectorScanMessage,
  PortQueryMessage,
  ClientMessage,
  ServerMessageType,
  ErrorMessage,
  TradeResultMessage,
  SystemMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  SectorEnteredMessage,
  TurnUpdateMessage,
  ServerMessage,
} from "./messages/index.js";

// Design Tokens
export {
  Neutral,
  Semantic,
  Resource,
  Player,
  Chart,
  Canvas,
  FontSize,
  FontWeight,
  FontFamily,
  LINE_HEIGHT,
  Spacing,
  Radius,
  Layout,
  ZIndex,
  TRANSITION_MS,
  BACKDROP_BLUR_PX,
  Alpha,
} from "./design-tokens.js";
