/**
 * Shared test utilities for @void-market workspaces.
 *
 * Import from "@void-market/shared/test-utils" or directly in shared/ tests.
 */

/**
 * Create a stub player object for testing.
 */
export function createMockPlayer(overrides: Partial<MockPlayer> = {}): MockPlayer {
  return {
    id: overrides.id ?? `player-${Math.random().toString(36).slice(2, 8)}`,
    name: overrides.name ?? "TestPlayer",
    credits: overrides.credits ?? 1000,
    turnsRemaining: overrides.turnsRemaining ?? 100,
    sectorId: overrides.sectorId ?? 1,
    ...overrides,
  };
}

export interface MockPlayer {
  id: string;
  name: string;
  credits: number;
  turnsRemaining: number;
  sectorId: number;
}

/**
 * Create a stub port for trade testing.
 */
export function createMockPort(overrides: Partial<MockPort> = {}): MockPort {
  return {
    id: overrides.id ?? 1,
    sectorId: overrides.sectorId ?? 1,
    type: overrides.type ?? "BBS",
    fuelOre: overrides.fuelOre ?? 500,
    organics: overrides.organics ?? 500,
    equipment: overrides.equipment ?? 500,
    ...overrides,
  };
}

export interface MockPort {
  id: number;
  sectorId: number;
  type: string;
  fuelOre: number;
  organics: number;
  equipment: number;
}

/**
 * Assert that a value is defined (not null or undefined).
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? `Expected value to be defined, got ${String(value)}`);
  }
}

/**
 * Assert that a numeric value is within a range (inclusive).
 */
export function assertInRange(value: number, min: number, max: number, label = "value"): void {
  if (value < min || value > max) {
    throw new Error(`Expected ${label} to be between ${min} and ${max}, got ${value}`);
  }
}
