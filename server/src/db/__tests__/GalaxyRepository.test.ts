/**
 * GalaxyRepository — Unit Tests
 *
 * Mocks the pg connection pool to test galaxy save/load logic
 * without a real database.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  GalaxyState,
  SectorSchema,
  PortSchema,
  CommoditySchema,
} from "@void-market/shared";

// ── Mock the connection module ───────────────────────────────────────────────

const mockPoolQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();
const mockPoolConnect = vi.fn();

vi.mock("../connection.js", () => ({
  pool: {
    query: (...args: unknown[]): unknown => mockPoolQuery(...args),
    connect: (...args: unknown[]): unknown => mockPoolConnect(...args),
  },
}));

import {
  galaxyExists,
  loadGalaxy,
  saveGalaxy,
  savePortCommodities,
} from "../GalaxyRepository.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockClient() {
  return {
    query: mockClientQuery,
    release: mockClientRelease,
  };
}

function makeSmallGalaxy(): GalaxyState {
  const state = new GalaxyState();

  // Sector 1 (no port)
  const s1 = new SectorSchema();
  s1.sectorId = 1;
  s1.x = 100;
  s1.y = 200;
  s1.warps.push(2);
  state.sectors.set("1", s1);

  // Sector 2 (with port)
  const s2 = new SectorSchema();
  s2.sectorId = 2;
  s2.x = 300;
  s2.y = 400;
  s2.warps.push(1);

  const port = new PortSchema();
  port.portId = "port-2";
  port.name = "Port 2";
  port.sectorId = 2;
  port.portClass = "SBB";

  const fuel = new CommoditySchema();
  fuel.commodity = "fuel_ore";
  fuel.stock = 1000;
  fuel.maxStock = 5000;
  fuel.buyPrice = 22;
  fuel.sellPrice = 0;
  fuel.portBuys = false;
  port.commodities.set("fuel_ore", fuel);

  s2.port = port;
  state.sectors.set("2", s2);

  return state;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GalaxyRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("galaxyExists", () => {
    test("returns true when sectors exist", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: "500" }] });
      expect(await galaxyExists()).toBe(true);
    });

    test("returns false when no sectors", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: "0" }] });
      expect(await galaxyExists()).toBe(false);
    });

    test("returns false on connection error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolQuery.mockRejectedValue(new Error("Connection refused"));

      expect(await galaxyExists()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[GalaxyRepository] Failed to check galaxy existence:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("loadGalaxy", () => {
    test("returns false when no sectors in DB", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const state = new GalaxyState();
      expect(await loadGalaxy(state)).toBe(false);
      expect(state.sectors.size).toBe(0);
    });

    test("loads sectors and warps", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 1, x: 100, y: 200 },
            { id: 2, x: 300, y: 400 },
          ],
        }) // sectors
        .mockResolvedValueOnce({
          rows: [
            { sector_from_id: 1, sector_to_id: 2 },
            { sector_from_id: 2, sector_to_id: 1 },
          ],
        }) // warps
        .mockResolvedValueOnce({ rows: [] }) // ports
        .mockResolvedValueOnce({ rows: [] }); // commodities

      const state = new GalaxyState();
      expect(await loadGalaxy(state)).toBe(true);

      expect(state.sectors.size).toBe(2);
      const s1 = state.sectors.get("1");
      expect(s1).toBeDefined();
      if (!s1) return;
      expect(s1.x).toBe(100);
      expect(s1.y).toBe(200);
      expect(s1.warps.length).toBe(1);
      expect(s1.warps[0]).toBe(2);

      consoleSpy.mockRestore();
    });

    test("loads ports with commodities", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, x: 0, y: 0 }],
        }) // sectors
        .mockResolvedValueOnce({ rows: [] }) // warps
        .mockResolvedValueOnce({
          rows: [
            {
              id: "port-uuid-1",
              sector_id: 1,
              name: "Port Alpha",
              port_class: "SBB",
              last_restock: "2024-01-01T00:00:00Z",
            },
          ],
        }) // ports
        .mockResolvedValueOnce({
          rows: [
            {
              port_id: "port-uuid-1",
              commodity: "fuel_ore",
              stock: 2500,
              max_stock: 5000,
              buy_price: 22,
              sell_price: 0,
              port_buys: false,
            },
            {
              port_id: "port-uuid-1",
              commodity: "organics",
              stock: 3000,
              max_stock: 5000,
              buy_price: 0,
              sell_price: 30,
              port_buys: true,
            },
          ],
        }); // commodities

      const state = new GalaxyState();
      expect(await loadGalaxy(state)).toBe(true);

      const sector = state.sectors.get("1");
      if (!sector?.port) {
        expect(sector?.port).toBeDefined();
        return;
      }
      expect(sector.port.name).toBe("Port Alpha");
      expect(sector.port.portClass).toBe("SBB");
      expect(sector.port.commodities.size).toBe(2);

      const fuel = sector.port.commodities.get("fuel_ore");
      if (!fuel) { expect(fuel).toBeDefined(); return; }
      expect(fuel.stock).toBe(2500);
      expect(fuel.portBuys).toBe(false);

      const org = sector.port.commodities.get("organics");
      if (!org) { expect(org).toBeDefined(); return; }
      expect(org.portBuys).toBe(true);

      consoleSpy.mockRestore();
    });

    test("returns false on connection error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolQuery.mockRejectedValue(new Error("Connection refused"));

      const state = new GalaxyState();
      expect(await loadGalaxy(state)).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("saveGalaxy", () => {
    test("saves sectors, warps, and ports in a transaction", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      // All queries resolve successfully
      mockClientQuery.mockResolvedValue({ rows: [{ id: "port-uuid" }] });

      const state = makeSmallGalaxy();
      await saveGalaxy(state);

      // Verify transaction lifecycle
      const calls = mockClientQuery.mock.calls.map((c: unknown[]) => {
        const sql = c[0];
        return typeof sql === "string" ? sql.trim().substring(0, 20) : sql;
      });
      expect(calls[0]).toBe("BEGIN");
      expect(calls[calls.length - 1]).toBe("COMMIT");

      // Verify release
      expect(mockClientRelease).toHaveBeenCalledOnce();
      consoleSpy.mockRestore();
    });

    test("handles connection failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolConnect.mockRejectedValue(new Error("Connection refused"));

      const state = makeSmallGalaxy();
      // Should not throw
      await saveGalaxy(state);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[GalaxyRepository] Failed to save galaxy:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    test("rolls back on mid-transaction error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // DELETE port_commodities
        .mockRejectedValueOnce(new Error("DB error")); // DELETE ports fails

      const state = makeSmallGalaxy();
      await saveGalaxy(state);

      const rollbackCall = mockClientQuery.mock.calls.find(
        (c: unknown[]) => c[0] === "ROLLBACK",
      );
      expect(rollbackCall).toBeDefined();
      expect(mockClientRelease).toHaveBeenCalledOnce();
      consoleSpy.mockRestore();
    });
  });

  describe("savePortCommodities", () => {
    test("updates port commodities in a transaction", async () => {
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);
      mockClientQuery.mockResolvedValue(undefined);

      const state = makeSmallGalaxy();
      await savePortCommodities(state);

      // BEGIN + 1 commodity update + COMMIT = 3
      expect(mockClientQuery).toHaveBeenCalledTimes(3);
      expect(mockClientQuery.mock.calls[0][0]).toBe("BEGIN");
      expect(mockClientQuery.mock.calls[2][0]).toBe("COMMIT");
      expect(mockClientRelease).toHaveBeenCalledOnce();
    });

    test("skips when no ports have commodities", async () => {
      const state = new GalaxyState();
      const s = new SectorSchema();
      s.sectorId = 1;
      state.sectors.set("1", s);

      await savePortCommodities(state);

      // Should not even connect
      expect(mockPoolConnect).not.toHaveBeenCalled();
    });

    test("handles connection failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolConnect.mockRejectedValue(new Error("Connection refused"));

      const state = makeSmallGalaxy();
      await savePortCommodities(state);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[GalaxyRepository] Failed to save port commodities:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
