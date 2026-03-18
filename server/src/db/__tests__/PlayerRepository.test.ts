/**
 * PlayerRepository — Unit Tests
 *
 * Mocks the pg connection pool to test save/load logic
 * without a real database.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema, ShipSchema, CargoSchema } from "@void-market/shared";

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

import { savePlayer, loadPlayer, saveAllPlayers } from "../PlayerRepository.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockClient() {
  return {
    query: mockClientQuery,
    release: mockClientRelease,
  };
}

function makePlayer(overrides?: Partial<{
  displayName: string;
  credits: number;
  turnsRemaining: number;
  currentSectorId: number;
  isDocked: boolean;
  shipClass: string;
  cargo: { commodity: string; quantity: number }[];
}>): PlayerSchema {
  const player = new PlayerSchema();
  player.playerId = "p-1";
  player.displayName = overrides?.displayName ?? "Alice";
  player.credits = overrides?.credits ?? 10000;
  player.turnsRemaining = overrides?.turnsRemaining ?? 500;
  player.turnsMax = 2000;
  player.currentSectorId = overrides?.currentSectorId ?? 1;
  player.isDocked = overrides?.isDocked ?? false;
  player.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = "ship-p-1";
  ship.shipClass = overrides?.shipClass ?? "scout";
  ship.name = "Alice's Scout";
  ship.maxCargoHolds = 25;
  ship.speed = 3;
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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PlayerRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("savePlayer", () => {
    test("saves a new player (INSERT path)", async () => {
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE players → no match
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // INSERT players
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ships
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      const player = makePlayer();
      await savePlayer(player, "user-uuid-1");

      expect(mockPoolConnect).toHaveBeenCalledOnce();
      expect(mockClientQuery).toHaveBeenCalledTimes(6);

      // Verify BEGIN
      expect(mockClientQuery.mock.calls[0][0]).toBe("BEGIN");
      // Verify COMMIT
      expect(mockClientQuery.mock.calls[5][0]).toBe("COMMIT");
      // Verify release
      expect(mockClientRelease).toHaveBeenCalledOnce();
    });

    test("updates an existing player (UPDATE path)", async () => {
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // UPDATE players → match
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ships
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined); // COMMIT

      const player = makePlayer();
      await savePlayer(player, "user-uuid-1");

      // Should not INSERT (only 5 calls: BEGIN, UPDATE, UPSERT ship, DELETE cargo, COMMIT)
      expect(mockClientQuery).toHaveBeenCalledTimes(5);
    });

    test("saves cargo entries", async () => {
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "player-uuid" }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [{ id: "ship-uuid" }] }) // UPSERT ship
        .mockResolvedValueOnce(undefined) // DELETE cargo
        .mockResolvedValueOnce(undefined) // INSERT cargo 1
        .mockResolvedValueOnce(undefined) // INSERT cargo 2
        .mockResolvedValueOnce(undefined); // COMMIT

      const player = makePlayer({
        cargo: [
          { commodity: "fuel_ore", quantity: 10 },
          { commodity: "organics", quantity: 5 },
        ],
      });
      await savePlayer(player, "user-uuid-1");

      // 7 calls: BEGIN, UPDATE, UPSERT ship, DELETE cargo, 2× INSERT cargo, COMMIT
      expect(mockClientQuery).toHaveBeenCalledTimes(7);
    });

    test("handles connection failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolConnect.mockRejectedValue(new Error("Connection refused"));

      const player = makePlayer();
      // Should not throw
      await savePlayer(player, "user-uuid-1");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PlayerRepository] Failed to save player:",
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
        .mockRejectedValueOnce(new Error("DB error")); // UPDATE fails

      const player = makePlayer();
      await savePlayer(player, "user-uuid-1");

      // Should have attempted ROLLBACK
      const rollbackCall = mockClientQuery.mock.calls.find(
        (c: unknown[]) => c[0] === "ROLLBACK",
      );
      expect(rollbackCall).toBeDefined();
      expect(mockClientRelease).toHaveBeenCalledOnce();
      consoleSpy.mockRestore();
    });
  });

  describe("loadPlayer", () => {
    test("returns player data for existing user", async () => {
      mockPoolQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: "player-uuid",
              display_name: "Alice",
              credits: "15000.50",
              turns_remaining: 400,
              turns_max: 2000,
              current_sector_id: 5,
              is_docked: true,
              ship_class: "merchant",
              ship_name: "Trading Vessel",
              cargo_holds: 10,
              max_cargo_holds: 100,
              speed: 1,
              ship_id: "ship-uuid",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { commodity: "fuel_ore", quantity: 5 },
            { commodity: "equipment", quantity: 5 },
          ],
        });

      const result = await loadPlayer("user-uuid-1");
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.displayName).toBe("Alice");
      expect(result.credits).toBeCloseTo(15000.5);
      expect(result.turnsRemaining).toBe(400);
      expect(result.currentSectorId).toBe(5);
      expect(result.isDocked).toBe(true);
      expect(result.ship.shipClass).toBe("merchant");
      expect(result.ship.maxCargoHolds).toBe(100);
      expect(result.cargo).toHaveLength(2);
      expect(result.cargo[0].commodity).toBe("fuel_ore");
    });

    test("returns null when user not found", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const result = await loadPlayer("nonexistent-uuid");
      expect(result).toBeNull();
    });

    test("returns player with empty cargo when no ship", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "player-uuid",
            display_name: "Bob",
            credits: "10000.00",
            turns_remaining: 500,
            turns_max: 2000,
            current_sector_id: 1,
            is_docked: false,
            ship_class: null,
            ship_name: null,
            cargo_holds: null,
            max_cargo_holds: null,
            speed: null,
            ship_id: null,
          },
        ],
      });

      const result = await loadPlayer("user-uuid-2");
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.ship.shipClass).toBe("scout"); // default
      expect(result.cargo).toHaveLength(0);
    });

    test("handles connection failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
      mockPoolQuery.mockRejectedValue(new Error("Connection refused"));

      const result = await loadPlayer("user-uuid-1");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[PlayerRepository] Failed to load player:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("saveAllPlayers", () => {
    test("saves multiple players sequentially", async () => {
      const client = makeMockClient();
      mockPoolConnect.mockResolvedValue(client);

      // Each savePlayer call: BEGIN, UPDATE, UPSERT ship, DELETE cargo, COMMIT
      mockClientQuery
        // Player 1
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "p1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "s1" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined) // COMMIT
        // Player 2
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "p2" }] })
        .mockResolvedValueOnce({ rows: [{ id: "s2" }] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined); // COMMIT

      await saveAllPlayers([
        { player: makePlayer({ displayName: "Alice" }), userId: "u1" },
        { player: makePlayer({ displayName: "Bob" }), userId: "u2" },
      ]);

      expect(mockPoolConnect).toHaveBeenCalledTimes(2);
    });

    test("handles empty list", async () => {
      await saveAllPlayers([]);
      expect(mockPoolConnect).not.toHaveBeenCalled();
    });
  });
});
