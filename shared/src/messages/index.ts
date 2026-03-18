/**
 * Message protocol barrel export.
 * All client↔server message types for Colyseus room communication.
 */

// Client → Server
export {
  CLIENT_MSG,
  type ClientMessageType,
  type MoveMessage,
  type TradeMessage,
  type DockMessage,
  type UndockMessage,
  type SectorScanMessage,
  type PortQueryMessage,
  type ClientMessage,
} from "./ClientMessages.js";

// Server → Client
export {
  SERVER_MSG,
  type ServerMessageType,
  type ErrorMessage,
  type TradeResultMessage,
  type SystemMessage,
  type PlayerJoinedMessage,
  type PlayerLeftMessage,
  type SectorEnteredMessage,
  type TurnUpdateMessage,
  type ServerMessage,
} from "./ServerMessages.js";
