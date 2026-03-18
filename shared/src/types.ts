/**
 * TypeScript interfaces and type aliases for Void Market.
 * Pure types — no runtime code, no Colyseus dependency.
 */

import type {
  ActionType,
  Commodity,
  PortClass,
  PortTradeType,
  ShipClass,
} from "./enums.js";

// ── Spatial ──────────────────────────────────────────────────────────────────

/** 2D position for rendering (not game-logic authoritative). */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** A directional warp connection between two sectors. */
export interface WarpRoute {
  readonly fromSectorId: number;
  readonly toSectorId: number;
}

// ── Trading ──────────────────────────────────────────────────────────────────

/** Client → server trade request payload. */
export interface TradeOffer {
  readonly portId: string;
  readonly commodity: Commodity;
  readonly quantity: number;
  /** True = player is buying from port; false = player is selling to port. */
  readonly buying: boolean;
}

/** Server → client response to a trade request. */
export interface TradeResult {
  readonly success: boolean;
  readonly commodity: Commodity;
  readonly quantity: number;
  readonly totalPrice: number;
  readonly newCredits: number;
  readonly error?: string;
}

/** Snapshot of a port's current commodity offering. */
export interface PortListing {
  readonly commodity: Commodity;
  readonly tradeType: PortTradeType;
  readonly stock: number;
  readonly price: number;
}

// ── Port ─────────────────────────────────────────────────────────────────────

/** Lightweight port info visible during sector scan. */
export interface PortInfo {
  readonly portId: string;
  readonly sectorId: number;
  readonly name: string;
  readonly portClass: PortClass;
  readonly listings: readonly PortListing[];
}

// ── Player / Ship ────────────────────────────────────────────────────────────

/** Player action message payload. */
export interface PlayerAction {
  readonly type: ActionType;
  readonly payload?: Record<string, unknown>;
}

/** Cargo hold contents. */
export type CargoHold = Readonly<Record<Commodity, number>>;

/** Ship state visible to its owner. */
export interface ShipInfo {
  readonly shipId: string;
  readonly shipClass: ShipClass;
  readonly name: string;
  readonly cargoCapacity: number;
  readonly cargo: CargoHold;
  readonly shields: number;
  readonly maxShields: number;
  readonly fighters: number;
}

/** Public player profile (visible to others). */
export interface PlayerProfile {
  readonly playerId: string;
  readonly displayName: string;
  readonly shipClass: ShipClass;
  readonly sectorId: number;
  readonly allianceId?: string;
}

// ── Galaxy / Sector ──────────────────────────────────────────────────────────

/** Sector data as seen by a player (may be fog-of-war filtered). */
export interface SectorInfo {
  readonly sectorId: number;
  readonly position: Position;
  readonly warps: readonly number[];
  readonly hasPort: boolean;
  readonly players: readonly PlayerProfile[];
  readonly portInfo?: PortInfo;
}

/** Lightweight sector node for galaxy map rendering. */
export interface SectorNode {
  readonly sectorId: number;
  readonly position: Position;
  readonly warps: readonly number[];
  readonly hasPort: boolean;
}

// ── Turns ────────────────────────────────────────────────────────────────────

/** Turn state pushed to client on every change. */
export interface TurnStatus {
  readonly turnsRemaining: number;
  readonly maxTurns: number;
  readonly regenRateMs: number;
  readonly nextRegenAt: number;
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Structured error sent from server to client. */
export interface GameError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
