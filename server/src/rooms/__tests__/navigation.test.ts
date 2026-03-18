/**
 * Navigation System — Edge-Case Tests (#41)
 *
 * Covers warp validation scenarios NOT in GalaxyRoom.test.ts:
 *  - Multi-hop sequential movement through 3+ sectors
 *  - Bidirectional warp symmetry
 *  - Boundary sector navigation (first / last sector)
 *  - Generated galaxy connectivity guarantee
 *  - Turn accumulation across multiple moves
 *  - Moving immediately after undocking
 *  - Error message content for all rejection paths
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  GalaxyState,
  PlayerSchema,
  ShipSchema,
  SectorSchema,
  PortSchema,
  STARTING_TURNS,
  STARTING_CREDITS,
  MAX_TURN_BANK,
  SHIP_SPECS,
  ShipClass,
  ActionType,
  TURN_COSTS,
  DEFAULT_SECTOR_COUNT,
  MIN_WARPS_PER_SECTOR,
} from "@void-market/shared";
import { generateGalaxy } from "../../galaxy/GalaxyGenerator.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function assertDefined<T>(val: T | undefined | null): asserts val is T {
  expect(val).toBeDefined();
}

function createPlayer(sectorId = 1): PlayerSchema {
  const p = new PlayerSchema();
  p.playerId = "nav-p-1";
  p.displayName = "Navigator";
  p.credits = STARTING_CREDITS;
  p.turnsRemaining = STARTING_TURNS;
  p.turnsMax = MAX_TURN_BANK;
  p.currentSectorId = sectorId;
  p.isDocked = false;
  p.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = "ship-nav-1";
  ship.shipClass = ShipClass.Scout;
  ship.name = "Navigator's Scout";
  ship.maxCargoHolds = SHIP_SPECS[ShipClass.Scout].cargoCapacity;
  ship.speed = SHIP_SPECS[ShipClass.Scout].warpSpeed;
  ship.cargoHolds = 0;
  p.ship = ship;

  return p;
}

/** Build a linear 4-sector chain: 1↔2↔3↔4 */
function buildLinearGalaxy(): GalaxyState {
  const gs = new GalaxyState();
  for (let id = 1; id <= 4; id++) {
    const s = new SectorSchema();
    s.sectorId = id;
    s.x = id * 100;
    s.y = 0;
    if (id > 1) s.warps.push(id - 1);
    if (id < 4) s.warps.push(id + 1);
    gs.sectors.set(String(id), s);
  }
  return gs;
}

/** Simulate the move handler logic (mirrors GalaxyRoom.handleMove). */
function simulateMove(
  state: GalaxyState,
  sessionId: string,
  player: PlayerSchema,
  targetSectorId: number,
): { success: boolean; errorCode?: string; errorMessage?: string } {
  const cost = TURN_COSTS[ActionType.Move];

  if (player.turnsRemaining < cost) {
    return {
      success: false,
      errorCode: "INSUFFICIENT_TURNS",
      errorMessage: `Not enough turns for move (need ${cost}, have ${player.turnsRemaining})`,
    };
  }
  player.turnsRemaining -= cost;

  if (player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "CANNOT_MOVE_DOCKED", errorMessage: "Undock before moving" };
  }

  const currentSector = state.sectors.get(String(player.currentSectorId));
  if (!currentSector) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "INVALID_SECTOR", errorMessage: "Current sector not found" };
  }

  if (!currentSector.warps.includes(targetSectorId)) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return {
      success: false,
      errorCode: "NO_WARP",
      errorMessage: `No warp connection from sector ${player.currentSectorId} to ${targetSectorId}`,
    };
  }

  const targetSector = state.sectors.get(String(targetSectorId));
  if (!targetSector) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "INVALID_SECTOR", errorMessage: "Target sector not found" };
  }

  // Execute move
  const idx = currentSector.playerIds.indexOf(sessionId);
  if (idx !== -1) currentSector.playerIds.splice(idx, 1);
  player.currentSectorId = targetSectorId;
  targetSector.playerIds.push(sessionId);

  return { success: true };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Navigation edge cases", () => {
  let state: GalaxyState;
  let player: PlayerSchema;
  const sessionId = "nav-session-1";

  beforeEach(() => {
    state = buildLinearGalaxy();
    player = createPlayer(1);
    state.players.set(sessionId, player);
    const startSector = state.sectors.get("1");
    assertDefined(startSector);
    startSector.playerIds.push(sessionId);
  });

  describe("multi-hop sequential movement", () => {
    test("player traverses 1→2→3→4 in three moves", () => {
      const startTurns = player.turnsRemaining;

      expect(simulateMove(state, sessionId, player, 2).success).toBe(true);
      expect(player.currentSectorId).toBe(2);

      expect(simulateMove(state, sessionId, player, 3).success).toBe(true);
      expect(player.currentSectorId).toBe(3);

      expect(simulateMove(state, sessionId, player, 4).success).toBe(true);
      expect(player.currentSectorId).toBe(4);

      expect(player.turnsRemaining).toBe(startTurns - 3 * TURN_COSTS[ActionType.Move]);
    });

    test("player cannot skip sectors (1→3 is invalid)", () => {
      const result = simulateMove(state, sessionId, player, 3);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NO_WARP");
      // Turns refunded
      expect(player.turnsRemaining).toBe(STARTING_TURNS);
    });

    test("player can backtrack (1→2→1)", () => {
      simulateMove(state, sessionId, player, 2);
      const result = simulateMove(state, sessionId, player, 1);
      expect(result.success).toBe(true);
      expect(player.currentSectorId).toBe(1);
    });

    test("sector playerIds updated at each hop", () => {
      const s1 = state.sectors.get("1");
      const s2 = state.sectors.get("2");
      const s3 = state.sectors.get("3");
      assertDefined(s1);
      assertDefined(s2);
      assertDefined(s3);

      simulateMove(state, sessionId, player, 2);
      expect(s1.playerIds.includes(sessionId)).toBe(false);
      expect(s2.playerIds.includes(sessionId)).toBe(true);

      simulateMove(state, sessionId, player, 3);
      expect(s2.playerIds.includes(sessionId)).toBe(false);
      expect(s3.playerIds.includes(sessionId)).toBe(true);
    });
  });

  describe("bidirectional warp symmetry", () => {
    test("every warp in linear galaxy is bidirectional", () => {
      state.sectors.forEach((sector) => {
        for (const targetId of sector.warps) {
          const target = state.sectors.get(String(targetId));
          assertDefined(target);
          expect(target.warps.includes(sector.sectorId)).toBe(true);
        }
      });
    });

    test("generated galaxy has bidirectional warps", () => {
      const galaxy = generateGalaxy(42);
      galaxy.sectors.forEach((sector) => {
        for (const targetId of sector.warps) {
          const target = galaxy.sectors.get(String(targetId));
          assertDefined(target);
          expect(target.warps.includes(sector.sectorId)).toBe(true);
        }
      });
    });
  });

  describe("boundary sectors", () => {
    test("first sector (1) has at least one warp", () => {
      const galaxy = generateGalaxy(99);
      const sector1 = galaxy.sectors.get("1");
      assertDefined(sector1);
      expect(sector1.warps.length).toBeGreaterThanOrEqual(1);
    });

    test("last sector has at least MIN_WARPS_PER_SECTOR warps", () => {
      const galaxy = generateGalaxy(99);
      const lastSector = galaxy.sectors.get(String(DEFAULT_SECTOR_COUNT));
      assertDefined(lastSector);
      expect(lastSector.warps.length).toBeGreaterThanOrEqual(MIN_WARPS_PER_SECTOR);
    });

    test("terminal sector in linear chain has exactly one warp", () => {
      const s1 = state.sectors.get("1");
      const s4 = state.sectors.get("4");
      assertDefined(s1);
      assertDefined(s4);
      expect(s1.warps.length).toBe(1);
      expect(s4.warps.length).toBe(1);
    });
  });

  describe("generated galaxy connectivity", () => {
    test("all sectors reachable from sector 1 via BFS", () => {
      const galaxy = generateGalaxy(7);
      const visited = new Set<string>();
      const queue = ["1"];
      visited.add("1");

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        const sector = galaxy.sectors.get(current);
        if (!sector) continue;
        for (const warpId of sector.warps) {
          const key = String(warpId);
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(key);
          }
        }
      }

      expect(visited.size).toBe(galaxy.sectors.size);
    });

    test("every sector has at least MIN_WARPS_PER_SECTOR connections", () => {
      const galaxy = generateGalaxy(12);
      galaxy.sectors.forEach((sector) => {
        expect(sector.warps.length).toBeGreaterThanOrEqual(MIN_WARPS_PER_SECTOR);
      });
    });

    test("no sector has a warp to itself", () => {
      const galaxy = generateGalaxy(55);
      galaxy.sectors.forEach((sector) => {
        expect(sector.warps.includes(sector.sectorId)).toBe(false);
      });
    });

    test("no duplicate warps in any sector", () => {
      const galaxy = generateGalaxy(55);
      galaxy.sectors.forEach((sector) => {
        const unique = new Set(sector.warps.toArray());
        expect(unique.size).toBe(sector.warps.length);
      });
    });
  });

  describe("move rejection error messages", () => {
    test("NO_WARP error includes both sector IDs", () => {
      const result = simulateMove(state, sessionId, player, 99);
      expect(result.errorCode).toBe("NO_WARP");
      expect(result.errorMessage).toContain("1");
      expect(result.errorMessage).toContain("99");
    });

    test("INSUFFICIENT_TURNS error includes cost and remaining", () => {
      player.turnsRemaining = 0;
      const result = simulateMove(state, sessionId, player, 2);
      expect(result.errorCode).toBe("INSUFFICIENT_TURNS");
      expect(result.errorMessage).toContain(String(TURN_COSTS[ActionType.Move]));
      expect(result.errorMessage).toContain("0");
    });

    test("CANNOT_MOVE_DOCKED error when docked", () => {
      player.isDocked = true;
      const result = simulateMove(state, sessionId, player, 2);
      expect(result.errorCode).toBe("CANNOT_MOVE_DOCKED");
      expect(result.errorMessage).toMatch(/undock/i);
    });

    test("move to non-existent sector returns INVALID_SECTOR", () => {
      // Add a fake warp to a sector that doesn't exist in state
      const sector1 = state.sectors.get("1");
      assertDefined(sector1);
      sector1.warps.push(999);
      const result = simulateMove(state, sessionId, player, 999);
      expect(result.errorCode).toBe("INVALID_SECTOR");
    });
  });

  describe("move after undock", () => {
    test("player can move immediately after undocking", () => {
      // Add a port to sector 1 so docking makes sense
      const port = new PortSchema();
      port.portId = "port-nav-1";
      port.sectorId = 1;
      const navSector = state.sectors.get("1");
      assertDefined(navSector);
      navSector.port = port;

      player.isDocked = true;
      // Undock
      player.isDocked = false;

      const result = simulateMove(state, sessionId, player, 2);
      expect(result.success).toBe(true);
      expect(player.currentSectorId).toBe(2);
    });
  });

  describe("turn accumulation across moves", () => {
    test("turns deplete correctly over many moves", () => {
      player.turnsRemaining = 5;
      const cost = TURN_COSTS[ActionType.Move]; // 1

      // Move back and forth to consume turns
      for (let i = 0; i < 5; i++) {
        const target = i % 2 === 0 ? 2 : 1;
        const result = simulateMove(state, sessionId, player, target);
        expect(result.success).toBe(true);
      }

      expect(player.turnsRemaining).toBe(5 - 5 * cost);

      // 6th move should fail
      const result = simulateMove(state, sessionId, player, 2);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_TURNS");
    });

    test("exactly enough turns for one move succeeds", () => {
      player.turnsRemaining = TURN_COSTS[ActionType.Move];
      const result = simulateMove(state, sessionId, player, 2);
      expect(result.success).toBe(true);
      expect(player.turnsRemaining).toBe(0);
    });
  });
});
