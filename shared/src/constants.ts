/**
 * Game constants for Void Market.
 * Single source of truth for balancing values used by both client and server.
 *
 * Key values are overridable via environment variables (server-side).
 * Use the envInt / envFloat helpers to read overrides with fallbacks.
 */

import { ActionType, Commodity, PortTradeType, ShipClass } from "./enums.js";

// ── Environment Helpers ──────────────────────────────────────────────────────

function envInt(key: string, fallback: number): number {
  if (typeof process === "undefined") return fallback;
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function envFloat(key: string, fallback: number): number {
  if (typeof process === "undefined") return fallback;
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ── Turn System ──────────────────────────────────────────────────────────────

/** Milliseconds between turn regeneration ticks. */
export const TURN_REGEN_INTERVAL_MS = envInt("VM_TURN_REGEN_MS", 90_000);

/** Maximum turns a player can bank. */
export const MAX_TURN_BANK = envInt("VM_MAX_TURN_BANK", 2_000);

/** Starting turns for a new player. */
export const STARTING_TURNS = envInt("VM_STARTING_TURNS", 500);

/** Turn cost per action type. */
export const TURN_COSTS: Readonly<Record<ActionType, number>> = {
  [ActionType.Move]: 1,
  [ActionType.Trade]: 2,
  [ActionType.Dock]: 0,
  [ActionType.Undock]: 0,
  [ActionType.Scan]: 1,
  [ActionType.Attack]: 15,
  [ActionType.Retreat]: 3,
  [ActionType.Deploy]: 5,
  [ActionType.Colonize]: 50,
  [ActionType.BuildDefense]: 50,
  [ActionType.TransferCredits]: 0,
};

// ── Economy ──────────────────────────────────────────────────────────────────

/** All tradeable commodities (order matters for UI display). */
export const COMMODITIES = [
  Commodity.FuelOre,
  Commodity.Organics,
  Commodity.Equipment,
] as const;

/** Starting credits for a new player. */
export const STARTING_CREDITS = envInt("VM_STARTING_CREDITS", 10_000);

/** Base price per commodity (used as anchor for dynamic pricing). */
export const BASE_PRICES: Readonly<Record<Commodity, number>> = {
  [Commodity.FuelOre]: 20,
  [Commodity.Organics]: 35,
  [Commodity.Equipment]: 70,
};

/** Maximum stock a port can hold per commodity. */
export const MAX_PORT_STOCK = envInt("VM_MAX_PORT_STOCK", 5_000);

/** Price fluctuation range (±percentage from base price based on stock). */
export const PRICE_VARIANCE_PCT = envFloat("VM_PRICE_VARIANCE_PCT", 0.25);

/** Units restocked per economy tick per commodity. */
export const RESTOCK_RATE = envInt("VM_RESTOCK_RATE", 50);

// ── Port Class Definitions ───────────────────────────────────────────────────

/**
 * Port class trading behavior per commodity.
 * Code notation: S = port Sells to player, B = port Buys from player.
 * Order: [Fuel Ore, Organics, Equipment]
 */
export interface PortClassDef {
  /** Three-letter code: e.g. "SBB" */
  readonly code: string;
  /** Per-commodity trade direction. */
  readonly trades: Readonly<Record<Commodity, PortTradeType>>;
}

/** All port class definitions keyed by code string. */
export const PORT_CLASS_DEFS: Readonly<Record<string, PortClassDef>> = {
  SBB: {
    code: "SBB",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Selling,
      [Commodity.Organics]: PortTradeType.Buying,
      [Commodity.Equipment]: PortTradeType.Buying,
    },
  },
  BSB: {
    code: "BSB",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Buying,
      [Commodity.Organics]: PortTradeType.Selling,
      [Commodity.Equipment]: PortTradeType.Buying,
    },
  },
  BBS: {
    code: "BBS",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Buying,
      [Commodity.Organics]: PortTradeType.Buying,
      [Commodity.Equipment]: PortTradeType.Selling,
    },
  },
  SSB: {
    code: "SSB",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Selling,
      [Commodity.Organics]: PortTradeType.Selling,
      [Commodity.Equipment]: PortTradeType.Buying,
    },
  },
  SBS: {
    code: "SBS",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Selling,
      [Commodity.Organics]: PortTradeType.Buying,
      [Commodity.Equipment]: PortTradeType.Selling,
    },
  },
  BSS: {
    code: "BSS",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Buying,
      [Commodity.Organics]: PortTradeType.Selling,
      [Commodity.Equipment]: PortTradeType.Selling,
    },
  },
  BBB: {
    code: "BBB",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Buying,
      [Commodity.Organics]: PortTradeType.Buying,
      [Commodity.Equipment]: PortTradeType.Buying,
    },
  },
  SSS: {
    code: "SSS",
    trades: {
      [Commodity.FuelOre]: PortTradeType.Selling,
      [Commodity.Organics]: PortTradeType.Selling,
      [Commodity.Equipment]: PortTradeType.Selling,
    },
  },
};

/** Valid port class codes. */
export const PORT_CLASS_CODES = Object.keys(PORT_CLASS_DEFS) as readonly string[];

// ── Galaxy ───────────────────────────────────────────────────────────────────

/** Default number of sectors in a generated galaxy. */
export const DEFAULT_SECTOR_COUNT = envInt("VM_SECTOR_COUNT", 500);

/** Minimum warp connections per sector. */
export const MIN_WARPS_PER_SECTOR = 2;

/** Maximum warp connections per sector. */
export const MAX_WARPS_PER_SECTOR = 6;

/** Sector ID of the starting sector (Federation HQ / safe zone). */
export const STARTING_SECTOR_ID = 1;

/** Percentage of sectors that contain a port (0.0–1.0). */
export const PORT_DENSITY = envFloat("VM_PORT_DENSITY", 0.6);

// ── Ships ────────────────────────────────────────────────────────────────────

export interface ShipSpec {
  readonly cargoCapacity: number;
  readonly maxShields: number;
  readonly maxFighters: number;
  readonly warpSpeed: number;
  readonly cost: number;
}

/** Base ship specifications per class. */
export const SHIP_SPECS: Readonly<Record<ShipClass, ShipSpec>> = {
  [ShipClass.Scout]: {
    cargoCapacity: 25,
    maxShields: 100,
    maxFighters: 0,
    warpSpeed: 3,
    cost: 0,
  },
  [ShipClass.Merchant]: {
    cargoCapacity: 100,
    maxShields: 200,
    maxFighters: 50,
    warpSpeed: 1,
    cost: 50_000,
  },
  [ShipClass.Frigate]: {
    cargoCapacity: 150,
    maxShields: 500,
    maxFighters: 200,
    warpSpeed: 2,
    cost: 100_000,
  },
  [ShipClass.Cruiser]: {
    cargoCapacity: 200,
    maxShields: 1_000,
    maxFighters: 500,
    warpSpeed: 1,
    cost: 250_000,
  },
  [ShipClass.Dreadnought]: {
    cargoCapacity: 500,
    maxShields: 2_000,
    maxFighters: 1_000,
    warpSpeed: 1,
    cost: 500_000,
  },
};

// ── Server Tick Rates ────────────────────────────────────────────────────────

/** Fast tick interval (player actions, movement). */
export const FAST_TICK_MS = envInt("VM_FAST_TICK_MS", 1_000);

/** Slow tick interval (economy restock, NPC actions). */
export const SLOW_TICK_MS = envInt("VM_SLOW_TICK_MS", 60_000);

/** Auto-save interval for player and economy state (ms). */
export const AUTOSAVE_INTERVAL_MS = envInt("VM_AUTOSAVE_MS", 300_000);

// ── Federation / Alliance ────────────────────────────────────────────────────

/** Maximum members per alliance. */
export const MAX_ALLIANCE_MEMBERS = 50;

/** Diplomacy standing range. */
export const MIN_STANDING = -10;
export const MAX_STANDING = 10;

/** Cooldown before standings can change again (ms). */
export const STANDING_COOLDOWN_MS = 48 * 60 * 60 * 1_000; // 48 hours

/** Cost to declare war (credits). */
export const WAR_DECLARATION_COST = 100_000;

/** Minimum war duration (ms). */
export const MIN_WAR_DURATION_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days
