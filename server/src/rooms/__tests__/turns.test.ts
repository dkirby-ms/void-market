/**
 * Turn System — Edge-Case Tests (#43)
 *
 * Covers turn scenarios NOT in GalaxyRoom.test.ts:
 *  - Turn costs verified for every ActionType
 *  - Turn bank cap during regeneration (edge of cap)
 *  - Turn deduction + refund cycle preserves total
 *  - Zero-turn rejection for each action type (move, trade)
 *  - Multiple action types in sequence depleting turns
 *  - Exact boundary: turns == cost succeeds, turns == cost-1 fails
 *  - Regeneration skips players already at max
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  PlayerSchema,
  ShipSchema,
  STARTING_TURNS,
  STARTING_CREDITS,
  MAX_TURN_BANK,
  SHIP_SPECS,
  ShipClass,
  ActionType,
  TURN_COSTS,
} from "@void-market/shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createPlayer(): PlayerSchema {
  const p = new PlayerSchema();
  p.playerId = "turn-p-1";
  p.displayName = "Turner";
  p.credits = STARTING_CREDITS;
  p.turnsRemaining = STARTING_TURNS;
  p.turnsMax = MAX_TURN_BANK;
  p.currentSectorId = 1;
  p.isDocked = false;
  p.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = "ship-turn-1";
  ship.shipClass = ShipClass.Scout;
  ship.name = "Turner's Scout";
  ship.maxCargoHolds = SHIP_SPECS[ShipClass.Scout].cargoCapacity;
  ship.speed = SHIP_SPECS[ShipClass.Scout].warpSpeed;
  ship.cargoHolds = 0;
  p.ship = ship;

  return p;
}

/** Mirrors GalaxyRoom.deductTurns */
function deductTurns(player: PlayerSchema, cost: number): boolean {
  if (player.turnsRemaining < cost) return false;
  player.turnsRemaining -= cost;
  return true;
}

/** Mirrors GalaxyRoom.refundTurns */
function refundTurns(player: PlayerSchema, cost: number): void {
  player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
}

/** Mirrors GalaxyRoom.regenTurns for a single player */
function regenTurn(player: PlayerSchema): void {
  if (!player.isOnline) return;
  if (player.turnsRemaining >= player.turnsMax) return;
  player.turnsRemaining = Math.min(player.turnsRemaining + 1, player.turnsMax);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Turn system edge cases", () => {
  let player: PlayerSchema;

  beforeEach(() => {
    player = createPlayer();
  });

  describe("initial state", () => {
    test("new player starts with STARTING_TURNS (500)", () => {
      expect(player.turnsRemaining).toBe(500);
      expect(player.turnsRemaining).toBe(STARTING_TURNS);
    });

    test("new player has turnsMax equal to MAX_TURN_BANK (2000)", () => {
      expect(player.turnsMax).toBe(2000);
      expect(player.turnsMax).toBe(MAX_TURN_BANK);
    });
  });

  describe("turn costs per action type", () => {
    test("Move costs 1 turn", () => {
      expect(TURN_COSTS[ActionType.Move]).toBe(1);
    });

    test("Trade costs 2 turns", () => {
      expect(TURN_COSTS[ActionType.Trade]).toBe(2);
    });

    test("Dock costs 0 turns", () => {
      expect(TURN_COSTS[ActionType.Dock]).toBe(0);
    });

    test("Undock costs 0 turns", () => {
      expect(TURN_COSTS[ActionType.Undock]).toBe(0);
    });

    test("Scan costs 1 turn", () => {
      expect(TURN_COSTS[ActionType.Scan]).toBe(1);
    });

    test("Attack costs 15 turns", () => {
      expect(TURN_COSTS[ActionType.Attack]).toBe(15);
    });

    test("Retreat costs 3 turns", () => {
      expect(TURN_COSTS[ActionType.Retreat]).toBe(3);
    });

    test("Deploy costs 5 turns", () => {
      expect(TURN_COSTS[ActionType.Deploy]).toBe(5);
    });

    test("Colonize costs 50 turns", () => {
      expect(TURN_COSTS[ActionType.Colonize]).toBe(50);
    });

    test("BuildDefense costs 50 turns", () => {
      expect(TURN_COSTS[ActionType.BuildDefense]).toBe(50);
    });

    test("TransferCredits costs 0 turns", () => {
      expect(TURN_COSTS[ActionType.TransferCredits]).toBe(0);
    });
  });

  describe("deduction mechanics", () => {
    test("deducting move cost succeeds and reduces turns by 1", () => {
      const start = player.turnsRemaining;
      expect(deductTurns(player, TURN_COSTS[ActionType.Move])).toBe(true);
      expect(player.turnsRemaining).toBe(start - 1);
    });

    test("deducting trade cost succeeds and reduces turns by 2", () => {
      const start = player.turnsRemaining;
      expect(deductTurns(player, TURN_COSTS[ActionType.Trade])).toBe(true);
      expect(player.turnsRemaining).toBe(start - 2);
    });

    test("deducting with exactly enough turns succeeds", () => {
      player.turnsRemaining = 15;
      expect(deductTurns(player, TURN_COSTS[ActionType.Attack])).toBe(true);
      expect(player.turnsRemaining).toBe(0);
    });

    test("deducting with one less than cost fails", () => {
      player.turnsRemaining = 14;
      expect(deductTurns(player, TURN_COSTS[ActionType.Attack])).toBe(false);
      expect(player.turnsRemaining).toBe(14); // unchanged
    });

    test("deducting with zero turns fails for move", () => {
      player.turnsRemaining = 0;
      expect(deductTurns(player, TURN_COSTS[ActionType.Move])).toBe(false);
    });

    test("deducting with zero turns fails for trade", () => {
      player.turnsRemaining = 0;
      expect(deductTurns(player, TURN_COSTS[ActionType.Trade])).toBe(false);
    });

    test("deducting with 1 turn fails for trade (needs 2)", () => {
      player.turnsRemaining = 1;
      expect(deductTurns(player, TURN_COSTS[ActionType.Trade])).toBe(false);
      expect(player.turnsRemaining).toBe(1); // unchanged
    });

    test("zero-cost actions always succeed", () => {
      player.turnsRemaining = 0;
      expect(deductTurns(player, TURN_COSTS[ActionType.Dock])).toBe(true);
      expect(player.turnsRemaining).toBe(0);
    });
  });

  describe("refund mechanics", () => {
    test("refund restores exact cost", () => {
      const start = player.turnsRemaining;
      const cost = TURN_COSTS[ActionType.Trade];
      deductTurns(player, cost);
      refundTurns(player, cost);
      expect(player.turnsRemaining).toBe(start);
    });

    test("refund caps at turnsMax", () => {
      player.turnsRemaining = MAX_TURN_BANK - 1;
      refundTurns(player, 5);
      expect(player.turnsRemaining).toBe(MAX_TURN_BANK);
    });

    test("refund at max stays at max", () => {
      player.turnsRemaining = MAX_TURN_BANK;
      refundTurns(player, 10);
      expect(player.turnsRemaining).toBe(MAX_TURN_BANK);
    });
  });

  describe("turn bank cap enforcement", () => {
    test("regeneration caps at MAX_TURN_BANK", () => {
      player.turnsRemaining = MAX_TURN_BANK - 1;
      regenTurn(player);
      expect(player.turnsRemaining).toBe(MAX_TURN_BANK);

      // Second regen should not exceed
      regenTurn(player);
      expect(player.turnsRemaining).toBe(MAX_TURN_BANK);
    });

    test("regeneration does nothing at max", () => {
      player.turnsRemaining = MAX_TURN_BANK;
      regenTurn(player);
      expect(player.turnsRemaining).toBe(MAX_TURN_BANK);
    });

    test("regeneration increments by 1 below max", () => {
      player.turnsRemaining = 100;
      regenTurn(player);
      expect(player.turnsRemaining).toBe(101);
    });

    test("offline player does not regenerate", () => {
      player.isOnline = false;
      player.turnsRemaining = 100;
      regenTurn(player);
      expect(player.turnsRemaining).toBe(100);
    });

    test("multiple regeneration ticks from 0 to N", () => {
      player.turnsRemaining = 0;
      for (let i = 0; i < 10; i++) {
        regenTurn(player);
      }
      expect(player.turnsRemaining).toBe(10);
    });
  });

  describe("multi-action sequences", () => {
    test("move + trade consumes 3 turns total", () => {
      const start = player.turnsRemaining;
      deductTurns(player, TURN_COSTS[ActionType.Move]);
      deductTurns(player, TURN_COSTS[ActionType.Trade]);
      expect(player.turnsRemaining).toBe(start - 3);
    });

    test("10 moves consume 10 turns", () => {
      const start = player.turnsRemaining;
      for (let i = 0; i < 10; i++) {
        expect(deductTurns(player, TURN_COSTS[ActionType.Move])).toBe(true);
      }
      expect(player.turnsRemaining).toBe(start - 10);
    });

    test("exhaust all turns with trades", () => {
      player.turnsRemaining = 10;
      const tradeCost = TURN_COSTS[ActionType.Trade]; // 2
      let trades = 0;
      while (deductTurns(player, tradeCost)) {
        trades++;
      }
      expect(trades).toBe(5);
      expect(player.turnsRemaining).toBe(0);
    });

    test("mixed actions: move, trade, move leaves correct remainder", () => {
      player.turnsRemaining = 100;
      deductTurns(player, TURN_COSTS[ActionType.Move]);   // -1 → 99
      deductTurns(player, TURN_COSTS[ActionType.Trade]);   // -2 → 97
      deductTurns(player, TURN_COSTS[ActionType.Move]);    // -1 → 96
      expect(player.turnsRemaining).toBe(96);
    });

    test("failed deduction leaves turns unchanged", () => {
      player.turnsRemaining = 10;
      const result = deductTurns(player, 50); // Colonize costs 50
      expect(result).toBe(false);
      expect(player.turnsRemaining).toBe(10);
    });
  });

  describe("edge boundaries", () => {
    test("turnsRemaining can reach exactly 0", () => {
      player.turnsRemaining = 1;
      deductTurns(player, 1);
      expect(player.turnsRemaining).toBe(0);
    });

    test("turnsRemaining never goes negative via deductTurns", () => {
      player.turnsRemaining = 1;
      deductTurns(player, 2);
      // Deduction failed, so stays at 1
      expect(player.turnsRemaining).toBe(1);
      expect(player.turnsRemaining).toBeGreaterThanOrEqual(0);
    });

    test("regeneration from 0 goes to 1", () => {
      player.turnsRemaining = 0;
      regenTurn(player);
      expect(player.turnsRemaining).toBe(1);
    });
  });
});
