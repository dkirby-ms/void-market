/**
 * Galaxy Generator — Contract Tests
 *
 * Validates generateGalaxy() against the requirements from issue #18:
 * deterministic seeded generation, graph connectivity, warp constraints,
 * port density, and port type distribution.
 */

import { describe, test, expect, beforeAll } from "vitest";
import { GalaxyState, SectorSchema } from "@void-market/shared";
import {
  DEFAULT_SECTOR_COUNT,
  MIN_WARPS_PER_SECTOR,
  MAX_WARPS_PER_SECTOR,
  PORT_DENSITY,
  PORT_CLASS_CODES,
} from "@void-market/shared";
import { generateGalaxy } from "../GalaxyGenerator.js";

// ── Test helpers ─────────────────────────────────────────────────────────────

function bfsReachable(
  sectors: Map<string, SectorSchema>,
  startId: number,
): Set<number> {
  const visited = new Set<number>();
  const queue: number[] = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    const sector = sectors.get(String(current));
    if (!sector) continue;

    for (const neighborId of sector.warps) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  return visited;
}

function toMap(state: GalaxyState): Map<string, SectorSchema> {
  const map = new Map<string, SectorSchema>();
  state.sectors.forEach((sector, key) => map.set(key, sector));
  return map;
}

const STAT_TOLERANCE = 0.1; // ±10 percentage-point tolerance

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GalaxyGenerator", () => {
  const TEST_SEED = 42;
  let galaxy: GalaxyState;
  let sectors: Map<string, SectorSchema>;

  beforeAll(() => {
    galaxy = generateGalaxy(TEST_SEED);
    sectors = toMap(galaxy);
  });

  test("generates exactly DEFAULT_SECTOR_COUNT sectors", () => {
    expect(sectors.size).toBe(DEFAULT_SECTOR_COUNT);
  });

  test("all sectors are reachable from sector 1 (BFS)", () => {
    const reachable = bfsReachable(sectors, 1);
    expect(reachable.size).toBe(sectors.size);
  });

  test("each sector has between MIN_WARPS and MAX_WARPS connections", () => {
    const violations: string[] = [];
    sectors.forEach((sector) => {
      const warpCount = sector.warps.length;
      if (
        warpCount < MIN_WARPS_PER_SECTOR ||
        warpCount > MAX_WARPS_PER_SECTOR
      ) {
        violations.push(
          `Sector ${sector.sectorId}: ${warpCount} warps (expected ${MIN_WARPS_PER_SECTOR}-${MAX_WARPS_PER_SECTOR})`,
        );
      }
    });
    expect(violations).toEqual([]);
  });

  test("warp connections are bidirectional", () => {
    const violations: string[] = [];
    sectors.forEach((sector) => {
      for (const neighborId of sector.warps) {
        const neighbor = sectors.get(String(neighborId));
        if (!neighbor) {
          violations.push(
            `Sector ${sector.sectorId} → ${neighborId}: neighbor does not exist`,
          );
          continue;
        }
        const backLink = neighbor.warps.toArray
          ? neighbor.warps.toArray().includes(sector.sectorId)
          : Array.from(neighbor.warps).includes(sector.sectorId);
        if (!backLink) {
          violations.push(
            `Sector ${sector.sectorId} → ${neighborId}: no return warp`,
          );
        }
      }
    });
    expect(violations).toEqual([]);
  });

  test("no sector has a warp to itself", () => {
    const selfWarps: number[] = [];
    sectors.forEach((sector) => {
      const warpsArray = sector.warps.toArray
        ? sector.warps.toArray()
        : Array.from(sector.warps);
      if (warpsArray.includes(sector.sectorId)) {
        selfWarps.push(sector.sectorId);
      }
    });
    expect(selfWarps).toEqual([]);
  });

  test("no sector has duplicate warp connections", () => {
    const dupes: string[] = [];
    sectors.forEach((sector) => {
      const warpsArray = sector.warps.toArray
        ? sector.warps.toArray()
        : Array.from(sector.warps);
      const unique = new Set(warpsArray);
      if (unique.size !== warpsArray.length) {
        dupes.push(`Sector ${sector.sectorId}: has duplicate warps`);
      }
    });
    expect(dupes).toEqual([]);
  });

  test(`~${PORT_DENSITY * 100}% of sectors have ports (within ±${STAT_TOLERANCE * 100}% tolerance)`, () => {
    let portCount = 0;
    sectors.forEach((sector) => {
      if (sector.port) portCount++;
    });
    const actualDensity = portCount / sectors.size;
    expect(actualDensity).toBeGreaterThanOrEqual(PORT_DENSITY - STAT_TOLERANCE);
    expect(actualDensity).toBeLessThanOrEqual(PORT_DENSITY + STAT_TOLERANCE);
  });

  test("port types are distributed across SBB, BSB, BBS, SSB", () => {
    const requiredTypes = ["SBB", "BSB", "BBS", "SSB"];
    const typeCounts = new Map<string, number>();
    sectors.forEach((sector) => {
      if (sector.port) {
        const cls = sector.port.portClass;
        typeCounts.set(cls, (typeCounts.get(cls) ?? 0) + 1);
      }
    });
    for (const portType of requiredTypes) {
      expect(
        typeCounts.get(portType),
        `Expected at least one port of type ${portType}`,
      ).toBeGreaterThan(0);
    }
  });

  test("all port classes are valid", () => {
    const invalid: string[] = [];
    sectors.forEach((sector) => {
      if (sector.port && !PORT_CLASS_CODES.includes(sector.port.portClass)) {
        invalid.push(
          `Sector ${sector.sectorId}: invalid port class "${sector.port.portClass}"`,
        );
      }
    });
    expect(invalid).toEqual([]);
  });

  test("port commodity stocks are initialized", () => {
    const uninitialised: string[] = [];
    sectors.forEach((sector) => {
      if (sector.port) {
        let hasCommodities = false;
        sector.port.commodities.forEach(() => {
          hasCommodities = true;
        });
        if (!hasCommodities) {
          uninitialised.push(
            `Port in sector ${sector.sectorId} has no commodity entries`,
          );
        }
      }
    });
    expect(uninitialised).toEqual([]);
  });

  test("sector positions have x,y coordinates", () => {
    sectors.forEach((sector) => {
      expect(sector.x, `Sector ${sector.sectorId} missing x`).toBeDefined();
      expect(sector.y, `Sector ${sector.sectorId} missing y`).toBeDefined();
      expect(typeof sector.x).toBe("number");
      expect(typeof sector.y).toBe("number");
    });
  });

  test("same seed produces identical galaxy", () => {
    const galaxy2 = generateGalaxy(TEST_SEED);
    const sectors2 = toMap(galaxy2);

    expect(sectors2.size).toBe(sectors.size);

    sectors.forEach((sector, key) => {
      const other = sectors2.get(key);
      expect(other, `Missing sector ${key} in second galaxy`).toBeDefined();
      if (!other) return;

      const warpsA = sector.warps.toArray
        ? sector.warps.toArray()
        : Array.from(sector.warps);
      const warpsB = other.warps.toArray
        ? other.warps.toArray()
        : Array.from(other.warps);
      expect(warpsA).toEqual(warpsB);

      expect(sector.x).toBe(other.x);
      expect(sector.y).toBe(other.y);

      if (sector.port) {
        expect(other.port).toBeDefined();
        expect(sector.port.portClass).toBe(other.port?.portClass);
      } else {
        expect(other.port).toBeUndefined();
      }
    });
  });

  test("different seeds produce different galaxies", () => {
    const galaxyA = generateGalaxy(123);
    const galaxyB = generateGalaxy(456);
    const sectorsA = toMap(galaxyA);
    const sectorsB = toMap(galaxyB);

    let differences = 0;
    sectorsA.forEach((sectorA, key) => {
      const sectorB = sectorsB.get(key);
      if (!sectorB) {
        differences++;
        return;
      }
      const warpsA = sectorA.warps.toArray
        ? sectorA.warps.toArray()
        : Array.from(sectorA.warps);
      const warpsB = sectorB.warps.toArray
        ? sectorB.warps.toArray()
        : Array.from(sectorB.warps);
      if (JSON.stringify(warpsA) !== JSON.stringify(warpsB)) {
        differences++;
      }
    });
    expect(differences).toBeGreaterThan(0);
  });

  test("sector IDs are sequential starting from 1", () => {
    for (let i = 1; i <= DEFAULT_SECTOR_COUNT; i++) {
      expect(sectors.has(String(i)), `Missing sector ID ${i}`).toBe(true);
    }
  });

  test("returns a GalaxyState instance", () => {
    expect(galaxy).toBeInstanceOf(GalaxyState);
  });
});
