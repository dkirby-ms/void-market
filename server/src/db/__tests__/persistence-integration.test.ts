/**
 * Persistence Integration Tests
 *
 * Tests the full lifecycle of player and galaxy persistence:
 * save → load → verify round-trip consistency.
 * Mocks the pg connection pool — no real PostgreSQL needed.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  PlayerSchema,
  ShipSchema,
  CargoSchema,
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

import { savePlayer, loadPlayer } from "../PlayerRepository.js";
import {
  saveGalaxy,
  loadGalaxy,
  savePortCommodities,
} from "../GalaxyRepository.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockClient() {
  return {
    query: mockClientQuery,
    release: mockClientRelease,
  };
}

function makePlayer(
  overrides?: Partial<{
    displayName: string;
    credits: number;
    turnsRemaining: number;
    turnsMax: number;
    currentSectorId: number;
    isDocked: boolean;
    shipClass: string;
    shipName: string;
    maxCargoHolds: number;
    speed: number;
    cargo: { commodity: string; quantity: number }[];
  }>,
): PlayerSchema {
  const player = new PlayerSchema();
  player.playerId = "p-1";
  player.displayName = overrides?.displayName ?? "TestPlayer";
  player.credits = overrides?.credits ?? 10000;
  player.turnsRemaining = overrides?.turnsRemaining ?? 500;
  player.turnsMax = overrides?.turnsMax ?? 2000;
  player.currentSectorId = overrides?.currentSectorId ?? 1;
  player.isDocked = overrides?.isDocked ?? false;
  player.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = "ship-p-1";
  ship.shipClass = overrides?.shipClass ?? "scout";
  ship.name = overrides?.shipName ?? "Test Ship";
  ship.maxCargoHolds = overrides?.maxCargoHolds ?? 25;
  ship.speed = overrides?.speed ?? 3;
  ship.cargoHolds = 0;

  if (overrides?.cargo) {
    for (const c of overrides.cargo) {
      const cs = new CargoSchema();
      cs.commodity = c.commodity;
      cs.quantity = c.quantity;
      ship.cargo.push(cs);
      ship.cargoHolds += c.quantity;
    }
  }

  player.ship = ship;
  return player;
}

function makeGalaxyState(): GalaxyState {
  const state = new GalaxyState();

  // Sector 1 (with port)
  const s1 = new SectorSchema();
  s1.sectorId = 1;
  s1.x = 100;
  s1.y = 200;
  s1.warps.push(2);

  const port1 = new PortSchema();
  port1.portId = "port-1";
  port1.name = "Port Alpha";
  port1.sectorId = 1;
  port1.portClass = "SBB";

  const fuel = new CommoditySchema();
  fuel.commodity = "fuel_ore";
  fuel.stock = 2500;
  fuel.maxStock = 5000;
  fuel.buyPrice = 22;
  fuel.sellPrice = 0;
  fuel.portBuys = false;
  port1.commodities.set("fuel_ore", fuel);

  const org = new CommoditySchema();
  org.commodity = "organics";
  org.stock = 3000;
  org.maxStock = 5000;
  org.buyPrice = 0;
  org.sellPrice = 30;
  org.portBuys = true;
  port1.commodities.set("organics", org);

  s1.port = port1;
  state.sectors.set("1", s1);

  // Sector 2 (no port)
  const s2 = new SectorSchema();
  s2.sectorId = 2;
  s2.x = 300;
  s2.y = 400;
  s2.warps.push(1);
  s2.warps.push(3);
  state.sectors.set("2", s2);

  // Sector 3 (no port)
  const s3 = new SectorSchema();
  s3.sectorId = 3;
  s3.x = 500;
  s3.y = 600;
  s3.warps.push(2);
  state.sectors.set("3", s3);

  return state;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Persistence Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Player lifecycle ────────────────────────────────────────────────────

  describe("Player lifecycle", () => {
    test("save → load round trip preserves all fields", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      const original = makePlayer({
        displayName: "SpaceTrader",
        credits: 25000,
        turnsRemaining: 750,
        turnsMax: 2000,
        currentSectorId: 42,
        isDocked: true,
        shipClass: "merchant",
        shipName: "Heavy Hauler",
        maxCargoHolds: 100,
        speed: 2,
        cargo: [
          { commodity: "fuel_ore", quantity: 15 },
          { commodity: "organics", quantity: 10 },
        ],
      });

      // ── Save phase ──────────────────────────────────────────────────
      mockPoolConnect.mockResolvedValue(makeMockClient());
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined) // INSERT cargo (fuel_ore)
        .mockResolvedValueOnce(undefined) // INSERT cargo (organics)
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(original, "user-1");

      // Verify save captured the right values
      const updateParams = mockClientQuery.mock.calls[1][1] as unknown[];
      expect(updateParams[0]).toBe("user-1");
      expect(updateParams[1]).toBe("SpaceTrader");
      expect(updateParams[2]).toBe(25000);
      expect(updateParams[3]).toBe(750);
      expect(updateParams[5]).toBe(42);
      expect(updateParams[6]).toBe(true); // isDocked

      // ── Load phase ──────────────────────────────────────────────────
      vi.clearAllMocks();
      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "player-uuid",
              display_name: "SpaceTrader",
              credits: "25000.00",
              turns_remaining: 750,
              turns_max: 2000,
              current_sector_id: 42,
              is_docked: true,
              ship_class: "merchant",
              ship_name: "Heavy Hauler",
              cargo_holds: 25,
              max_cargo_holds: 100,
              speed: 2,
              ship_id: "ship-uuid",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { commodity: "fuel_ore", quantity: 15 },
            { commodity: "organics", quantity: 10 },
          ],
        });

      const loaded = await loadPlayer("user-1");

      // ── Verify round-trip ───────────────────────────────────────────
      expect(loaded).not.toBeNull();
      if (!loaded) return;

      expect(loaded.displayName).toBe(original.displayName);
      expect(loaded.credits).toBe(original.credits);
      expect(loaded.turnsRemaining).toBe(original.turnsRemaining);
      expect(loaded.turnsMax).toBe(original.turnsMax);
      expect(loaded.currentSectorId).toBe(original.currentSectorId);
      expect(loaded.isDocked).toBe(original.isDocked);
      expect(loaded.ship.shipClass).toBe(original.ship.shipClass);
      expect(loaded.ship.name).toBe(original.ship.name);
      expect(loaded.ship.maxCargoHolds).toBe(original.ship.maxCargoHolds);
      expect(loaded.ship.speed).toBe(original.ship.speed);
      expect(loaded.cargo).toHaveLength(2);
      expect(loaded.cargo[0]).toEqual({ commodity: "fuel_ore", quantity: 15 });
      expect(loaded.cargo[1]).toEqual({ commodity: "organics", quantity: 10 });

      consoleSpy.mockRestore();
    });

    test("returning player gets restored state", async () => {
      // Simulate a returning player: save initial state, then load it back
      // as if the player reconnected

      // ── First session: save player state ────────────────────────────
      const player = makePlayer({
        displayName: "ReturningPlayer",
        credits: 50000,
        turnsRemaining: 300,
        currentSectorId: 15,
        isDocked: false,
        shipClass: "merchant",
        cargo: [{ commodity: "equipment", quantity: 20 }],
      });

      mockPoolConnect.mockResolvedValue(makeMockClient());
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined) // INSERT cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(player, "returning-user");
      expect(mockPoolConnect).toHaveBeenCalledOnce();

      // ── Second session: load saved state ────────────────────────────
      vi.clearAllMocks();
      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "player-uuid",
              display_name: "ReturningPlayer",
              credits: "50000.00",
              turns_remaining: 300,
              turns_max: 2000,
              current_sector_id: 15,
              is_docked: false,
              ship_class: "merchant",
              ship_name: "Test Ship",
              cargo_holds: 20,
              max_cargo_holds: 25,
              speed: 3,
              ship_id: "ship-uuid",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ commodity: "equipment", quantity: 20 }],
        });

      const restored = await loadPlayer("returning-user");

      expect(restored).not.toBeNull();
      if (!restored) return;

      expect(restored.displayName).toBe("ReturningPlayer");
      expect(restored.credits).toBe(50000);
      expect(restored.turnsRemaining).toBe(300);
      expect(restored.currentSectorId).toBe(15);
      expect(restored.isDocked).toBe(false);
      expect(restored.cargo).toEqual([{ commodity: "equipment", quantity: 20 }]);
    });

    test("player with no cargo round-trips correctly", async () => {
      const player = makePlayer({ cargo: [] });

      mockPoolConnect.mockResolvedValue(makeMockClient());
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(player, "empty-cargo-user");

      // No INSERT cargo calls (only 5 queries)
      expect(mockClientQuery).toHaveBeenCalledTimes(5);

      // Load back
      vi.clearAllMocks();
      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "player-uuid",
              display_name: "TestPlayer",
              credits: "10000.00",
              turns_remaining: 500,
              turns_max: 2000,
              current_sector_id: 1,
              is_docked: false,
              ship_class: "scout",
              ship_name: "Test Ship",
              cargo_holds: 0,
              max_cargo_holds: 25,
              speed: 3,
              ship_id: "ship-uuid",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const loaded = await loadPlayer("empty-cargo-user");
      expect(loaded).not.toBeNull();
      if (!loaded) return;
      expect(loaded.cargo).toHaveLength(0);
    });
  });

  // ── Galaxy lifecycle ────────────────────────────────────────────────────

  describe("Galaxy lifecycle", () => {
    test("save → load round trip preserves sectors, warps, and ports", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      const original = makeGalaxyState();

      // ── Save phase ──────────────────────────────────────────────────
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);
      mockClientQuery.mockResolvedValue({ rows: [{ id: "port-uuid-1" }] });

      await saveGalaxy(original);

      // Verify transaction boundaries
      expect(mockClientQuery.mock.calls[0][0]).toBe("BEGIN");
      const lastCallArgs = mockClientQuery.mock.calls[
        mockClientQuery.mock.calls.length - 1
      ] as unknown[];
      expect(lastCallArgs[0]).toBe("COMMIT");
      expect(mockClientRelease).toHaveBeenCalledOnce();

      // ── Load phase ──────────────────────────────────────────────────
      vi.clearAllMocks();
      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            { id: 1, x: 100, y: 200 },
            { id: 2, x: 300, y: 400 },
            { id: 3, x: 500, y: 600 },
          ],
        }) // sectors
        .mockResolvedValueOnce({
          rows: [
            { sector_from_id: 1, sector_to_id: 2 },
            { sector_from_id: 2, sector_to_id: 1 },
            { sector_from_id: 2, sector_to_id: 3 },
            { sector_from_id: 3, sector_to_id: 2 },
          ],
        }) // warps
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

      const loaded = new GalaxyState();
      const success = await loadGalaxy(loaded);

      // ── Verify round-trip ───────────────────────────────────────────
      expect(success).toBe(true);
      expect(loaded.sectors.size).toBe(3);

      // Sector 1
      const s1 = loaded.sectors.get("1");
      expect(s1).toBeDefined();
      if (!s1) return;
      expect(s1.x).toBe(100);
      expect(s1.y).toBe(200);
      expect(s1.warps.length).toBe(1);
      expect(s1.warps[0]).toBe(2);
      expect(s1.port).toBeDefined();
      if (!s1.port) return;
      expect(s1.port.name).toBe("Port Alpha");
      expect(s1.port.portClass).toBe("SBB");
      expect(s1.port.commodities.size).toBe(2);

      // Verify commodity values
      const fuel = s1.port.commodities.get("fuel_ore");
      expect(fuel).toBeDefined();
      if (!fuel) return;
      expect(fuel.stock).toBe(2500);
      expect(fuel.maxStock).toBe(5000);
      expect(fuel.portBuys).toBe(false);

      const organics = s1.port.commodities.get("organics");
      expect(organics).toBeDefined();
      if (!organics) return;
      expect(organics.stock).toBe(3000);
      expect(organics.portBuys).toBe(true);

      // Sector 2 (no port, multiple warps)
      const s2 = loaded.sectors.get("2");
      expect(s2).toBeDefined();
      if (!s2) return;
      expect(s2.warps.length).toBe(2);
      expect(s2.warps).toContain(1);
      expect(s2.warps).toContain(3);
      expect(s2.port).toBeUndefined();

      // Sector 3
      const s3 = loaded.sectors.get("3");
      expect(s3).toBeDefined();
      if (!s3) return;
      expect(s3.warps[0]).toBe(2);

      consoleSpy.mockRestore();
    });

    test("port stock levels persist via savePortCommodities", async () => {
      const state = makeGalaxyState();

      // Modify stock levels (simulating trades)
      const sector1 = state.sectors.get("1");
      expect(sector1?.port).toBeDefined();
      if (!sector1?.port) return;
      const fuel = sector1.port.commodities.get("fuel_ore");
      if (!fuel) return;
      fuel.stock = 2000; // was 2500
      fuel.buyPrice = 25; // price changed
      const org = sector1.port.commodities.get("organics");
      if (!org) return;
      org.stock = 3500; // was 3000
      org.sellPrice = 28; // price changed

      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);
      mockClientQuery.mockResolvedValue(undefined);

      await savePortCommodities(state);

      // BEGIN + 2 commodity updates + COMMIT = 4
      expect(mockClientQuery).toHaveBeenCalledTimes(4);
      expect(mockClientQuery.mock.calls[0][0]).toBe("BEGIN");
      expect(mockClientQuery.mock.calls[3][0]).toBe("COMMIT");

      // Verify the update parameters contain the modified values
      const fuelUpdateParams = mockClientQuery.mock.calls[1][1] as unknown[];
      expect(fuelUpdateParams).toContain(2000); // updated stock
      expect(fuelUpdateParams).toContain(25); // updated buyPrice

      const orgUpdateParams = mockClientQuery.mock.calls[2][1] as unknown[];
      expect(orgUpdateParams).toContain(3500); // updated stock
      expect(orgUpdateParams).toContain(28); // updated sellPrice

      expect(mockClientRelease).toHaveBeenCalledOnce();
    });

    test("empty galaxy load returns false", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const state = new GalaxyState();
      expect(await loadGalaxy(state)).toBe(false);
      expect(state.sectors.size).toBe(0);
    });
  });

  // ── SQL verification ────────────────────────────────────────────────────

  describe("SQL verification", () => {
    test("savePlayer issues UPDATE before INSERT for upsert", async () => {
      mockPoolConnect.mockResolvedValue(makeMockClient());
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE → no match
        .mockResolvedValueOnce({ rows: [{ id: "new-id" }] }) // INSERT
        .mockResolvedValueOnce({ rows: [{ id: "ship-id" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(makePlayer(), "new-user");

      const updateSQL = mockClientQuery.mock.calls[1][0] as string;
      const insertSQL = mockClientQuery.mock.calls[2][0] as string;

      expect(updateSQL).toContain("UPDATE players");
      expect(insertSQL).toContain("INSERT INTO players");
    });

    test("savePlayer uses ON CONFLICT for ship upsert", async () => {
      mockPoolConnect.mockResolvedValue(makeMockClient());
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "p-id" }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: "s-id" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(makePlayer(), "user-1");

      const shipSQL = mockClientQuery.mock.calls[2][0] as string;
      expect(shipSQL).toContain("INSERT INTO ships");
      expect(shipSQL).toContain("ON CONFLICT");
    });

    test("loadPlayer JOINs players with ships", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      await loadPlayer("user-1");

      const loadSQL = mockPoolQuery.mock.calls[0][0] as string;
      expect(loadSQL).toContain("FROM players");
      expect(loadSQL).toContain("JOIN ships");
    });

    test("saveGalaxy clears dependent tables before inserting", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);
      mockClientQuery.mockResolvedValue({ rows: [{ id: "port-uuid" }] });

      await saveGalaxy(makeGalaxyState());

      const sqls = mockClientQuery.mock.calls.map((c: unknown[]) =>
        typeof c[0] === "string" ? c[0].trim() : "",
      );

      // Should delete in FK-safe order: port_commodities, ports, warps
      const deletePortComm = sqls.findIndex((s: string) =>
        s.includes("DELETE FROM port_commodities"),
      );
      const deletePorts = sqls.findIndex((s: string) =>
        s.includes("DELETE FROM ports"),
      );
      const deleteWarps = sqls.findIndex((s: string) =>
        s.includes("DELETE FROM warps"),
      );

      expect(deletePortComm).toBeGreaterThan(0); // after BEGIN
      expect(deletePorts).toBeGreaterThan(deletePortComm);
      expect(deleteWarps).toBeGreaterThan(deletePorts);

      consoleSpy.mockRestore();
    });

    test("savePlayer releases client on success and failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      // Success path
      const client1 = makeMockClient();
      mockPoolConnect.mockResolvedValue(client1);
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "p" }] })
        .mockResolvedValueOnce({ rows: [{ id: "s" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined); // COMMIT

      await savePlayer(makePlayer(), "u1");
      expect(client1.release).toHaveBeenCalledOnce();

      // Failure path
      vi.clearAllMocks();
      const client2 = makeMockClient();
      mockPoolConnect.mockResolvedValue(client2);
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error("DB crash"));

      await savePlayer(makePlayer(), "u2");
      expect(client2.release).toHaveBeenCalledOnce();

      consoleSpy.mockRestore();
    });
  });
});
