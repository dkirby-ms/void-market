/**
 * Client → Server message types.
 * Sent from client to server via Colyseus room.send().
 * Uses discriminated union pattern with `type` field.
 */

// ── Message Type Constants ───────────────────────────────────────────────────

export const CLIENT_MSG = {
  MOVE: "move",
  TRADE: "trade",
  DOCK: "dock",
  UNDOCK: "undock",
  SECTOR_SCAN: "sector_scan",
  PORT_QUERY: "port_query",
  UPGRADE_SHIP: "upgrade_ship",
} as const;

export type ClientMessageType = (typeof CLIENT_MSG)[keyof typeof CLIENT_MSG];

// ── Message Payloads ─────────────────────────────────────────────────────────

/** Request to move to an adjacent sector via warp connection. */
export interface MoveMessage {
  readonly type: typeof CLIENT_MSG.MOVE;
  readonly targetSectorId: number;
}

/** Request to execute a trade at the currently docked port. */
export interface TradeMessage {
  readonly type: typeof CLIENT_MSG.TRADE;
  readonly commodity: string;
  readonly quantity: number;
  /** True = player buys from port; false = player sells to port. */
  readonly buying: boolean;
}

/** Request to dock at the port in the player's current sector. */
export interface DockMessage {
  readonly type: typeof CLIENT_MSG.DOCK;
}

/** Request to undock from the current port. */
export interface UndockMessage {
  readonly type: typeof CLIENT_MSG.UNDOCK;
}

/** Request sector scan information. */
export interface SectorScanMessage {
  readonly type: typeof CLIENT_MSG.SECTOR_SCAN;
  readonly sectorId: number;
}

/** Request port commodity details. */
export interface PortQueryMessage {
  readonly type: typeof CLIENT_MSG.PORT_QUERY;
  readonly portId: string;
}

/** Request to upgrade the player's ship to a new class. */
export interface UpgradeShipMessage {
  readonly type: typeof CLIENT_MSG.UPGRADE_SHIP;
  readonly targetShipClass: string;
}

// ── Discriminated Union ──────────────────────────────────────────────────────

/** Union of all client→server messages. */
export type ClientMessage =
  | MoveMessage
  | TradeMessage
  | DockMessage
  | UndockMessage
  | SectorScanMessage
  | PortQueryMessage
  | UpgradeShipMessage;
