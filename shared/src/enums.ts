/**
 * Core enumerations for Void Market.
 * These define the vocabulary for client↔server communication and game state.
 */

/** Player actions that consume turns. */
export enum ActionType {
  Move = "move",
  Trade = "trade",
  Dock = "dock",
  Undock = "undock",
  Scan = "scan",
  Attack = "attack",
  Retreat = "retreat",
  Deploy = "deploy",
  Colonize = "colonize",
  BuildDefense = "build_defense",
  TransferCredits = "transfer_credits",
}

/** Wire-protocol message types for Colyseus room communication. */
export enum MessageType {
  // Galaxy room — navigation
  JoinGalaxy = "join_galaxy",
  LeaveGalaxy = "leave_galaxy",
  PlayerMove = "player_move",
  SectorScan = "sector_scan",

  // Galaxy room — trading
  TradeRequest = "trade_request",
  TradeConfirm = "trade_confirm",
  TradeCancel = "trade_cancel",

  // Galaxy room — docking
  DockRequest = "dock_request",
  UndockRequest = "undock_request",

  // Galaxy room — information
  PortQuery = "port_query",
  PlayerStatus = "player_status",

  // Combat room
  CombatStart = "combat_start",
  CombatAction = "combat_action",
  CombatEnd = "combat_end",

  // Federation room
  FederationChat = "federation_chat",
  FederationInvite = "federation_invite",
  FederationKick = "federation_kick",

  // Server → client push
  TurnUpdate = "turn_update",
  ErrorMessage = "error_message",
}

/** Tradeable commodities in the three-commodity economy. */
export enum Commodity {
  FuelOre = "fuel_ore",
  Organics = "organics",
  Equipment = "equipment",
}

/** Port trading behavior for a given commodity. */
export enum PortTradeType {
  Buying = "buying",
  Selling = "selling",
}

/** Classification of port types by what they buy/sell. */
export enum PortClass {
  /** Buys Fuel Ore, Sells Organics & Equipment */
  Class1 = 1,
  /** Buys Organics, Sells Fuel Ore & Equipment */
  Class2 = 2,
  /** Buys Equipment, Sells Fuel Ore & Organics */
  Class3 = 3,
  /** Buys Fuel Ore & Organics, Sells Equipment */
  Class4 = 4,
  /** Buys Fuel Ore & Equipment, Sells Organics */
  Class5 = 5,
  /** Buys Organics & Equipment, Sells Fuel Ore */
  Class6 = 6,
  /** Special — Buys Exotic Matter (late-game) */
  Class0 = 0,
}

/** Ship classes available for progression. */
export enum ShipClass {
  Scout = "scout",
  Merchant = "merchant",
  Frigate = "frigate",
  Cruiser = "cruiser",
  Dreadnought = "dreadnought",
}
