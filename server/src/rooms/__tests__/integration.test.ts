/**
 * GalaxyRoom Integration Tests (#44)
 *
 * Multi-player scenarios and full gameplay loops NOT in GalaxyRoom.test.ts:
 *  - Multiple players joining the same galaxy
 *  - Full loop: join → move → dock → trade → undock → move
 *  - Concurrent players in different sectors
 *  - State consistency after many operations
 *  - Player leave while others remain active
 *  - Two players trading at the same port affecting shared stock
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  GalaxyState,
  PlayerSchema,
  ShipSchema,
  SectorSchema,
  PortSchema,
  CommoditySchema,
  STARTING_TURNS,
  STARTING_CREDITS,
  STARTING_SECTOR_ID,
  MAX_TURN_BANK,
  SHIP_SPECS,
  ShipClass,
  Commodity,
  ActionType,
  TURN_COSTS,
} from "@void-market/shared";
import { loadCargo, unloadCargo, freeCargoHolds } from "../../game/ShipManager.js";
import { calculatePrice } from "../../rooms/GalaxyRoom.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a 3-sector galaxy: 1↔2↔3, port in sector 1 and sector 3. */
function buildMultiPlayerGalaxy(): GalaxyState {
  const gs = new GalaxyState();

  // Sector 1: SBB port (sells fuel, buys org + equip)
  const s1 = new SectorSchema();
  s1.sectorId = 1;
  s1.x = 0;
  s1.y = 0;
  s1.warps.push(2);
  s1.port = createPort("port-1", 1, "SBB");
  gs.sectors.set("1", s1);

  // Sector 2: no port, hub connecting 1 and 3
  const s2 = new SectorSchema();
  s2.sectorId = 2;
  s2.x = 100;
  s2.y = 0;
  s2.warps.push(1);
  s2.warps.push(3);
  gs.sectors.set("2", s2);

  // Sector 3: BSB port (sells org, buys fuel + equip)
  const s3 = new SectorSchema();
  s3.sectorId = 3;
  s3.x = 200;
  s3.y = 0;
  s3.warps.push(2);
  s3.port = createPort("port-3", 3, "BSB");
  gs.sectors.set("3", s3);

  return gs;
}

function createPort(portId: string, sectorId: number, portClass: string): PortSchema {
  const port = new PortSchema();
  port.portId = portId;
  port.name = `Station-${portId}`;
  port.sectorId = sectorId;
  port.portClass = portClass;

  const isSBB = portClass === "SBB";
  // SBB: S=fuel(sells), B=org(buys), B=equip(buys)
  // BSB: B=fuel(buys), S=org(sells), B=equip(buys)

  const fuel = new CommoditySchema();
  fuel.commodity = Commodity.FuelOre;
  fuel.stock = 1000;
  fuel.maxStock = 5000;
  fuel.portBuys = isSBB ? false : true;
  fuel.buyPrice = fuel.portBuys ? 0 : calculatePrice(fuel, true);
  fuel.sellPrice = fuel.portBuys ? calculatePrice(fuel, false) : 0;

  const org = new CommoditySchema();
  org.commodity = Commodity.Organics;
  org.stock = 1000;
  org.maxStock = 5000;
  org.portBuys = isSBB ? true : false;
  org.buyPrice = org.portBuys ? 0 : calculatePrice(org, true);
  org.sellPrice = org.portBuys ? calculatePrice(org, false) : 0;

  const equip = new CommoditySchema();
  equip.commodity = Commodity.Equipment;
  equip.stock = 1000;
  equip.maxStock = 5000;
  equip.portBuys = true; // both port classes buy equipment
  equip.buyPrice = 0;
  equip.sellPrice = calculatePrice(equip, false);

  port.commodities.set(Commodity.FuelOre, fuel);
  port.commodities.set(Commodity.Organics, org);
  port.commodities.set(Commodity.Equipment, equip);
  return port;
}

function spawnPlayer(
  state: GalaxyState,
  sessionId: string,
  name: string,
  sectorId: number = STARTING_SECTOR_ID,
): PlayerSchema {
  const p = new PlayerSchema();
  p.playerId = sessionId;
  p.displayName = name;
  p.credits = STARTING_CREDITS;
  p.turnsRemaining = STARTING_TURNS;
  p.turnsMax = MAX_TURN_BANK;
  p.currentSectorId = sectorId;
  p.isDocked = false;
  p.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = `ship-${sessionId}`;
  ship.shipClass = ShipClass.Scout;
  ship.name = `${name}'s Scout`;
  ship.maxCargoHolds = SHIP_SPECS[ShipClass.Scout].cargoCapacity;
  ship.speed = SHIP_SPECS[ShipClass.Scout].warpSpeed;
  ship.cargoHolds = 0;
  p.ship = ship;

  state.players.set(sessionId, p);
  const sector = state.sectors.get(String(sectorId));
  sector?.playerIds.push(sessionId);

  return p;
}

// Action simulators (mirror GalaxyRoom handler logic)

function doMove(
  state: GalaxyState,
  sessionId: string,
  player: PlayerSchema,
  targetSectorId: number,
): boolean {
  const cost = TURN_COSTS[ActionType.Move];
  if (player.turnsRemaining < cost) return false;
  player.turnsRemaining -= cost;

  if (player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return false;
  }

  const current = state.sectors.get(String(player.currentSectorId));
  if (!current?.warps.includes(targetSectorId)) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return false;
  }

  const target = state.sectors.get(String(targetSectorId));
  if (!target) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return false;
  }

  const idx = current.playerIds.indexOf(sessionId);
  if (idx !== -1) current.playerIds.splice(idx, 1);
  player.currentSectorId = targetSectorId;
  target.playerIds.push(sessionId);
  return true;
}

function doDock(state: GalaxyState, player: PlayerSchema): boolean {
  if (player.isDocked) return false;
  const sector = state.sectors.get(String(player.currentSectorId));
  if (!sector?.port) return false;
  player.isDocked = true;
  return true;
}

function doUndock(player: PlayerSchema): boolean {
  if (!player.isDocked) return false;
  player.isDocked = false;
  return true;
}

function doBuy(
  player: PlayerSchema,
  port: PortSchema,
  commodity: Commodity,
  quantity: number,
): { success: boolean; spent: number } {
  const cost = TURN_COSTS[ActionType.Trade];
  if (player.turnsRemaining < cost) return { success: false, spent: 0 };
  player.turnsRemaining -= cost;

  if (!player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, spent: 0 };
  }

  const cs = port.commodities.get(commodity);
  if (!cs || cs.portBuys) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, spent: 0 };
  }

  const qty = Math.min(quantity, cs.stock, freeCargoHolds(player.ship));
  if (qty === 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, spent: 0 };
  }

  const unitPrice = calculatePrice(cs, true);
  const total = qty * unitPrice;
  if (player.credits < total) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, spent: 0 };
  }

  player.credits -= total;
  cs.stock -= qty;
  loadCargo(player.ship, commodity, qty);
  cs.buyPrice = calculatePrice(cs, true);
  return { success: true, spent: total };
}

function doSell(
  player: PlayerSchema,
  port: PortSchema,
  commodity: Commodity,
  quantity: number,
): { success: boolean; earned: number } {
  const cost = TURN_COSTS[ActionType.Trade];
  if (player.turnsRemaining < cost) return { success: false, earned: 0 };
  player.turnsRemaining -= cost;

  if (!player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, earned: 0 };
  }

  const cs = port.commodities.get(commodity);
  if (!cs?.portBuys) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, earned: 0 };
  }

  const qty = unloadCargo(player.ship, commodity, quantity);
  if (qty === 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, earned: 0 };
  }

  const unitPrice = calculatePrice(cs, false);
  const total = qty * unitPrice;
  player.credits += total;
  cs.stock += qty;
  cs.sellPrice = calculatePrice(cs, false);
  return { success: true, earned: total };
}

function doLeave(state: GalaxyState, sessionId: string): void {
  const player = state.players.get(sessionId);
  if (!player) return;
  player.isOnline = false;
  const sector = state.sectors.get(String(player.currentSectorId));
  if (sector) {
    const idx = sector.playerIds.indexOf(sessionId);
    if (idx !== -1) sector.playerIds.splice(idx, 1);
  }
}

function assertDefined<T>(val: T | undefined | null): asserts val is T {
  expect(val).toBeDefined();
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Integration: multi-player galaxy", () => {
  let state: GalaxyState;

  beforeEach(() => {
    state = buildMultiPlayerGalaxy();
  });

  describe("player join and initial state", () => {
    test("first player receives galaxy with sectors", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      expect(state.players.size).toBe(1);
      expect(state.sectors.size).toBe(3);
      expect(p1.currentSectorId).toBe(STARTING_SECTOR_ID);
    });

    test("second player joins same galaxy and starting sector", () => {
      spawnPlayer(state, "s1", "Alpha");
      spawnPlayer(state, "s2", "Beta");

      expect(state.players.size).toBe(2);
      const sector1 = state.sectors.get("1");
      assertDefined(sector1);
      expect(sector1.playerIds.includes("s1")).toBe(true);
      expect(sector1.playerIds.includes("s2")).toBe(true);
    });

    test("three players in starting sector", () => {
      spawnPlayer(state, "s1", "Alpha");
      spawnPlayer(state, "s2", "Beta");
      spawnPlayer(state, "s3", "Gamma");

      const sector1 = state.sectors.get("1");
      assertDefined(sector1);
      expect(sector1.playerIds.length).toBe(3);
      expect(state.players.size).toBe(3);
    });
  });

  describe("full gameplay loop", () => {
    test("join → move → dock → buy → undock → move → dock → sell", () => {
      const p = spawnPlayer(state, "loop", "Looper");
      const startCredits = p.credits;

      // Buy fuel at port 1 (SBB: sells fuel)
      expect(doDock(state, p)).toBe(true);
      const sec1 = state.sectors.get("1");
      assertDefined(sec1);
      assertDefined(sec1.port);
      const port1 = sec1.port;
      const buyResult = doBuy(p, port1, Commodity.FuelOre, 10);
      expect(buyResult.success).toBe(true);
      expect(p.ship.cargoHolds).toBe(10);
      expect(doUndock(p)).toBe(true);

      // Move 1→2→3
      expect(doMove(state, "loop", p, 2)).toBe(true);
      expect(doMove(state, "loop", p, 3)).toBe(true);
      expect(p.currentSectorId).toBe(3);

      // Sell fuel at port 3 (BSB: buys fuel)
      expect(doDock(state, p)).toBe(true);
      const sec3 = state.sectors.get("3");
      assertDefined(sec3);
      assertDefined(sec3.port);
      const port3 = sec3.port;
      const sellResult = doSell(p, port3, Commodity.FuelOre, 10);
      expect(sellResult.success).toBe(true);
      expect(p.ship.cargoHolds).toBe(0);
      expect(sellResult.earned).toBeGreaterThan(0);

      // Credits changed: spent on buy, earned on sell
      expect(p.credits).toBe(startCredits - buyResult.spent + sellResult.earned);

      // Turns consumed: 2 trades (2 each) + 2 moves (1 each) = 6
      const expectedTurns = STARTING_TURNS - 2 * TURN_COSTS[ActionType.Trade] - 2 * TURN_COSTS[ActionType.Move];
      expect(p.turnsRemaining).toBe(expectedTurns);
    });
  });

  describe("concurrent player actions", () => {
    test("two players move to different sectors independently", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");

      // P1 moves to sector 2
      expect(doMove(state, "s1", p1, 2)).toBe(true);
      // P2 stays in sector 1
      expect(p1.currentSectorId).toBe(2);
      expect(p2.currentSectorId).toBe(1);

      const sector1 = state.sectors.get("1");
      const sector2 = state.sectors.get("2");
      assertDefined(sector1);
      assertDefined(sector2);
      expect(sector1.playerIds.includes("s1")).toBe(false);
      expect(sector1.playerIds.includes("s2")).toBe(true);
      expect(sector2.playerIds.includes("s1")).toBe(true);
    });

    test("two players trade at same port, affecting shared stock", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");
      const tradeSec = state.sectors.get("1");
      assertDefined(tradeSec);
      assertDefined(tradeSec.port);
      const port = tradeSec.port;
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      const initialStock = fuel.stock;

      doDock(state, p1);
      doDock(state, p2);

      // P1 buys 10 fuel
      doBuy(p1, port, Commodity.FuelOre, 10);
      expect(fuel.stock).toBe(initialStock - 10);

      // P2 buys 10 fuel — stock is now further reduced
      doBuy(p2, port, Commodity.FuelOre, 10);
      expect(fuel.stock).toBe(initialStock - 20);
    });

    test("two players trading causes price to shift", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");
      p1.credits = 1_000_000;
      p2.credits = 1_000_000;
      // Give both players large cargo capacity
      p1.ship.shipClass = ShipClass.Dreadnought;
      p1.ship.maxCargoHolds = SHIP_SPECS[ShipClass.Dreadnought].cargoCapacity;
      p2.ship.shipClass = ShipClass.Dreadnought;
      p2.ship.maxCargoHolds = SHIP_SPECS[ShipClass.Dreadnought].cargoCapacity;

      const priceSec = state.sectors.get("1");
      assertDefined(priceSec);
      assertDefined(priceSec.port);
      const port = priceSec.port;
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);

      doDock(state, p1);
      doDock(state, p2);

      const priceBeforeTrades = calculatePrice(fuel, true);

      // Both players buy large amounts, significantly depleting stock
      doBuy(p1, port, Commodity.FuelOre, 400);
      doBuy(p2, port, Commodity.FuelOre, 400);

      const priceAfterTrades = calculatePrice(fuel, true);
      expect(priceAfterTrades).toBeGreaterThan(priceBeforeTrades);
    });
  });

  describe("player leave", () => {
    test("leaving player is removed from sector but remains in players map", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      spawnPlayer(state, "s2", "Beta");

      doLeave(state, "s1");

      expect(p1.isOnline).toBe(false);
      const leaveSec = state.sectors.get("1");
      assertDefined(leaveSec);
      expect(leaveSec.playerIds.includes("s1")).toBe(false);
      // Player still in map (persistence)
      expect(state.players.has("s1")).toBe(true);
    });

    test("remaining player unaffected by other leaving", () => {
      spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");

      doLeave(state, "s1");

      expect(p2.isOnline).toBe(true);
      expect(p2.turnsRemaining).toBe(STARTING_TURNS);
      const remainSec = state.sectors.get("1");
      assertDefined(remainSec);
      expect(remainSec.playerIds.includes("s2")).toBe(true);
    });

    test("player leaving mid-move preserves other player sectors", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      spawnPlayer(state, "s2", "Beta");

      doMove(state, "s1", p1, 2);
      doLeave(state, "s2");

      const midSec2 = state.sectors.get("2");
      const midSec1 = state.sectors.get("1");
      assertDefined(midSec2);
      assertDefined(midSec1);
      expect(midSec2.playerIds.includes("s1")).toBe(true);
      expect(midSec1.playerIds.includes("s2")).toBe(false);
    });
  });

  describe("state consistency", () => {
    test("player count in sectors matches total online players", () => {
      spawnPlayer(state, "s1", "Alpha");
      spawnPlayer(state, "s2", "Beta");
      const p3 = spawnPlayer(state, "s3", "Gamma");

      doMove(state, "s3", p3, 2);

      // Count all playerIds across sectors
      let totalInSectors = 0;
      state.sectors.forEach((sector) => {
        totalInSectors += sector.playerIds.length;
      });

      const onlinePlayers = Array.from(state.players.values()).filter((p) => p.isOnline).length;
      expect(totalInSectors).toBe(onlinePlayers);
    });

    test("no duplicate playerIds in any sector after many moves", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");

      // Move back and forth many times
      for (let i = 0; i < 10; i++) {
        doMove(state, "s1", p1, 2);
        doMove(state, "s1", p1, 1);
      }

      state.sectors.forEach((sector) => {
        const unique = new Set(sector.playerIds.toArray());
        expect(unique.size).toBe(sector.playerIds.length);
      });
    });

    test("credits + cargo value is trackable across full trade loop", () => {
      const p = spawnPlayer(state, "loop", "Looper");
      const initialCredits = p.credits;

      // Dock and buy fuel at port 1
      doDock(state, p);
      const cSec1 = state.sectors.get("1");
      assertDefined(cSec1);
      assertDefined(cSec1.port);
      const port1 = cSec1.port;
      const fuel1 = port1.commodities.get(Commodity.FuelOre);
      assertDefined(fuel1);
      const buyUnitPrice = calculatePrice(fuel1, true);
      const buyResult = doBuy(p, port1, Commodity.FuelOre, 10);
      expect(buyResult.success).toBe(true);

      // Credits decreased by exact amount
      expect(p.credits).toBe(initialCredits - buyResult.spent);
      expect(buyResult.spent).toBe(10 * buyUnitPrice);

      // Cargo holds match
      expect(p.ship.cargoHolds).toBe(10);
    });

    test("turns are consistently tracked across mixed actions", () => {
      const p = spawnPlayer(state, "s1", "Alpha");
      const initialTurns = p.turnsRemaining;
      let expectedTurns = initialTurns;

      // Move: -1
      doMove(state, "s1", p, 2);
      expectedTurns -= TURN_COSTS[ActionType.Move];
      expect(p.turnsRemaining).toBe(expectedTurns);

      // Move back: -1
      doMove(state, "s1", p, 1);
      expectedTurns -= TURN_COSTS[ActionType.Move];
      expect(p.turnsRemaining).toBe(expectedTurns);

      // Dock (free): -0
      doDock(state, p);
      expect(p.turnsRemaining).toBe(expectedTurns);

      // Trade: -2
      const turnSec = state.sectors.get("1");
      assertDefined(turnSec);
      assertDefined(turnSec.port);
      const port = turnSec.port;
      doBuy(p, port, Commodity.FuelOre, 5);
      expectedTurns -= TURN_COSTS[ActionType.Trade];
      expect(p.turnsRemaining).toBe(expectedTurns);

      // Undock (free): -0
      doUndock(p);
      expect(p.turnsRemaining).toBe(expectedTurns);
    });

    test("multiple players have independent turn pools", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");

      // P1 spends turns moving
      doMove(state, "s1", p1, 2);
      doMove(state, "s1", p1, 1);

      // P2 hasn't done anything
      expect(p1.turnsRemaining).toBe(STARTING_TURNS - 2);
      expect(p2.turnsRemaining).toBe(STARTING_TURNS);
    });

    test("multiple players have independent credit pools", () => {
      const p1 = spawnPlayer(state, "s1", "Alpha");
      const p2 = spawnPlayer(state, "s2", "Beta");

      doDock(state, p1);
      const creditSec = state.sectors.get("1");
      assertDefined(creditSec);
      assertDefined(creditSec.port);
      const port = creditSec.port;
      doBuy(p1, port, Commodity.FuelOre, 5);

      // P2 credits untouched
      expect(p2.credits).toBe(STARTING_CREDITS);
      expect(p1.credits).toBeLessThan(STARTING_CREDITS);
    });
  });
});
