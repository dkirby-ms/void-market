/**
 * Ship & cargo management utilities.
 * All logic is server-authoritative — the client never modifies ship state directly.
 */

import {
  ShipSchema,
  CargoSchema,
  PlayerSchema,
  ShipClass,
  SHIP_SPECS,
  Commodity,
  type ShipSpec,
} from "@void-market/shared";

// ── Cargo helpers ────────────────────────────────────────────────────────────

/** Returns the total number of cargo units currently on board. */
export function usedCargoHolds(ship: ShipSchema): number {
  let total = 0;
  for (const entry of ship.cargo) {
    total += entry.quantity;
  }
  return total;
}

/** Returns the remaining free cargo capacity. */
export function freeCargoHolds(ship: ShipSchema): number {
  return ship.maxCargoHolds - usedCargoHolds(ship);
}

/**
 * Find an existing cargo entry for a commodity, or `undefined` if not carried.
 */
export function findCargoEntry(
  ship: ShipSchema,
  commodity: string,
): CargoSchema | undefined {
  for (const entry of ship.cargo) {
    if (entry.commodity === commodity) return entry;
  }
  return undefined;
}

/**
 * Load cargo onto a ship. Returns the quantity actually loaded (may be less
 * than requested if capacity is insufficient).
 *
 * Mutates `ship.cargo` and `ship.cargoHolds` in-place so Colyseus can
 * delta-sync the changes.
 */
export function loadCargo(
  ship: ShipSchema,
  commodity: string,
  quantity: number,
): number {
  if (quantity <= 0) return 0;

  const available = freeCargoHolds(ship);
  const toLoad = Math.min(quantity, available);
  if (toLoad === 0) return 0;

  const existing = findCargoEntry(ship, commodity);
  if (existing) {
    existing.quantity += toLoad;
  } else {
    const entry = new CargoSchema();
    entry.commodity = commodity;
    entry.quantity = toLoad;
    ship.cargo.push(entry);
  }

  ship.cargoHolds += toLoad;
  return toLoad;
}

/**
 * Unload cargo from a ship. Returns the quantity actually unloaded (may be
 * less than requested if the player carries fewer units).
 *
 * Removes the cargo entry entirely when the quantity reaches 0 to keep the
 * array clean.
 */
export function unloadCargo(
  ship: ShipSchema,
  commodity: string,
  quantity: number,
): number {
  if (quantity <= 0) return 0;

  const existing = findCargoEntry(ship, commodity);
  if (!existing) return 0;

  const toUnload = Math.min(quantity, existing.quantity);
  existing.quantity -= toUnload;
  ship.cargoHolds -= toUnload;

  // Remove empty entries to keep state tidy
  if (existing.quantity === 0) {
    const idx = ship.cargo.indexOf(existing);
    if (idx !== -1) ship.cargo.splice(idx, 1);
  }

  return toUnload;
}

/** Drop all cargo from the ship (e.g. during ship upgrade). */
export function jettison(ship: ShipSchema): void {
  ship.cargo.splice(0, ship.cargo.length);
  ship.cargoHolds = 0;
}

// ── Ship upgrade ─────────────────────────────────────────────────────────────

export interface UpgradeResult {
  success: boolean;
  error?: string;
  cost?: number;
}

/**
 * Validate and apply a ship class upgrade for a player.
 *
 * Rules:
 *  - Player must be docked at a port.
 *  - Player must have enough credits to pay the *difference* between the
 *    target ship cost and the trade-in value of the current ship (50% of
 *    current ship cost).
 *  - Cannot "upgrade" to the same ship class.
 *  - All cargo is jettisoned on upgrade (holds may change size).
 */
export function upgradeShip(
  player: PlayerSchema,
  targetClass: ShipClass,
): UpgradeResult {
  if (!player.isDocked) {
    return { success: false, error: "Must be docked to upgrade ship" };
  }

  const currentClass = player.ship.shipClass as ShipClass;
  if (currentClass === targetClass) {
    return { success: false, error: "Already flying that ship class" };
  }

  const currentSpec = SHIP_SPECS[currentClass] as ShipSpec | undefined;
  const targetSpec = SHIP_SPECS[targetClass] as ShipSpec | undefined;
  if (!targetSpec) {
    return { success: false, error: "Unknown ship class" };
  }

  // Trade-in value = 50% of current ship cost
  const tradeInValue = currentSpec ? Math.floor(currentSpec.cost / 2) : 0;
  const upgradeCost = Math.max(0, targetSpec.cost - tradeInValue);

  if (player.credits < upgradeCost) {
    return {
      success: false,
      error: `Insufficient credits (need ${upgradeCost}, have ${Math.floor(player.credits)})`,
    };
  }

  // Apply upgrade
  player.credits -= upgradeCost;
  jettison(player.ship);

  player.ship.shipClass = targetClass;
  player.ship.maxCargoHolds = targetSpec.cargoCapacity;
  player.ship.speed = targetSpec.warpSpeed;

  return { success: true, cost: upgradeCost };
}

// ── Validation helpers ───────────────────────────────────────────────────────

/** Check whether a commodity string is a valid tradeable commodity. */
export function isValidCommodity(value: string): value is Commodity {
  return (
    value === (Commodity.FuelOre as string) ||
    value === (Commodity.Organics as string) ||
    value === (Commodity.Equipment as string)
  );
}

/** Get the spec for a ship class, or undefined if unknown. */
export function getShipSpec(shipClass: string): ShipSpec | undefined {
  return SHIP_SPECS[shipClass as ShipClass];
}
