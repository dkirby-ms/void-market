/**
 * STUB — Galaxy generator placeholder.
 *
 * This file will be replaced by the real implementation from PR #18
 * (Pemulis). It exists solely so that the galaxy generator tests (#40)
 * can compile and run against the expected public contract.
 */

import { GalaxyState } from "@void-market/shared";

/**
 * Generate a galaxy with the given seed and sector count.
 * @param seed  Deterministic RNG seed.
 * @param sectorCount  Number of sectors (defaults to DEFAULT_SECTOR_COUNT).
 * @returns Fully populated GalaxyState.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub params; real impl in PR #18
export function generateGalaxy(seed: number, sectorCount?: number): GalaxyState {
  throw new Error(
    "GalaxyGenerator stub — not yet implemented. Awaiting PR #18.",
  );
}
