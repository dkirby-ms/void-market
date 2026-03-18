/**
 * Server → Client message types.
 * Sent from server to client via Colyseus room.send() or broadcast().
 * Uses discriminated union pattern with `type` field.
 */

// ── Message Type Constants ───────────────────────────────────────────────────

export const SERVER_MSG = {
  ERROR: "error",
  TRADE_RESULT: "trade_result",
  SYSTEM: "system",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  SECTOR_ENTERED: "sector_entered",
  TURN_UPDATE: "turn_update",
} as const;

export type ServerMessageType = (typeof SERVER_MSG)[keyof typeof SERVER_MSG];

// ── Message Payloads ─────────────────────────────────────────────────────────

/** Error response from server. */
export interface ErrorMessage {
  readonly type: typeof SERVER_MSG.ERROR;
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/** Result of a completed trade transaction. */
export interface TradeResultMessage {
  readonly type: typeof SERVER_MSG.TRADE_RESULT;
  readonly success: boolean;
  readonly commodity: string;
  readonly quantity: number;
  readonly totalPrice: number;
  readonly newCredits: number;
  readonly newStock: number;
  readonly error?: string;
}

/** System broadcast (server announcements, maintenance, etc.). */
export interface SystemMessage {
  readonly type: typeof SERVER_MSG.SYSTEM;
  readonly message: string;
  readonly severity: "info" | "warning" | "critical";
  readonly timestamp: number;
}

/** Notification that a player has joined the galaxy. */
export interface PlayerJoinedMessage {
  readonly type: typeof SERVER_MSG.PLAYER_JOINED;
  readonly playerId: string;
  readonly displayName: string;
  readonly sectorId: number;
}

/** Notification that a player has left the galaxy. */
export interface PlayerLeftMessage {
  readonly type: typeof SERVER_MSG.PLAYER_LEFT;
  readonly playerId: string;
}

/** Notification that a player entered the current sector. */
export interface SectorEnteredMessage {
  readonly type: typeof SERVER_MSG.SECTOR_ENTERED;
  readonly playerId: string;
  readonly displayName: string;
  readonly sectorId: number;
}

/** Turn balance update pushed after any turn-consuming action. */
export interface TurnUpdateMessage {
  readonly type: typeof SERVER_MSG.TURN_UPDATE;
  readonly turnsRemaining: number;
  readonly turnsMax: number;
  readonly nextRegenAt: number;
}

// ── Discriminated Union ──────────────────────────────────────────────────────

/** Union of all server→client messages. */
export type ServerMessage =
  | ErrorMessage
  | TradeResultMessage
  | SystemMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | SectorEnteredMessage
  | TurnUpdateMessage;
