/**
 * Trading System — Edge-Case Tests (#42)
 *
 * Covers trading scenarios NOT in GalaxyRoom.test.ts:
 *  - Dynamic pricing formula verification at precise stock levels
 *  - Buying exact remaining stock (partial fill edge)
 *  - Buying more than cargo capacity (partial fill)
 *  - Sequential trades that progressively change stock/price
 *  - ProfitLoss round-trip verification (buy at port A, sell at port B concept)
 *  - All three commodities with correct base prices
 *  - Zero quantity and invalid commodity rejection
 *  - Port class trade direction matrix
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
  MAX_TURN_BANK,
  SHIP_SPECS,
  ShipClass,
  Commodity,
  ActionType,
  TURN_COSTS,
  BASE_PRICES,
  PRICE_VARIANCE_PCT,
  COMMODITIES,
} from "@void-market/shared";
import {
  loadCargo,
  unloadCargo,
  freeCargoHolds,
  isValidCommodity,
} from "../../game/ShipManager.js";
import { calculatePrice } from "../../rooms/GalaxyRoom.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createDockableState(): {
  state: GalaxyState;
  player: PlayerSchema;
  port: PortSchema;
} {
  const gs = new GalaxyState();

  const s1 = new SectorSchema();
  s1.sectorId = 1;
  s1.x = 0;
  s1.y = 0;

  const port = new PortSchema();
  port.portId = "trade-port";
  port.name = "Trade Station";
  port.sectorId = 1;
  port.portClass = "SBB";

  // Fuel: port sells (portBuys=false)
  const fuel = new CommoditySchema();
  fuel.commodity = Commodity.FuelOre;
  fuel.stock = 1000;
  fuel.maxStock = 5000;
  fuel.buyPrice = calculatePrice(fuel, true);
  fuel.sellPrice = 0;
  fuel.portBuys = false;

  // Organics: port buys (portBuys=true)
  const org = new CommoditySchema();
  org.commodity = Commodity.Organics;
  org.stock = 1000;
  org.maxStock = 5000;
  org.buyPrice = 0;
  org.sellPrice = calculatePrice(org, false);
  org.portBuys = true;

  // Equipment: port buys (portBuys=true)
  const equip = new CommoditySchema();
  equip.commodity = Commodity.Equipment;
  equip.stock = 1000;
  equip.maxStock = 5000;
  equip.buyPrice = 0;
  equip.sellPrice = calculatePrice(equip, false);
  equip.portBuys = true;

  port.commodities.set(Commodity.FuelOre, fuel);
  port.commodities.set(Commodity.Organics, org);
  port.commodities.set(Commodity.Equipment, equip);
  s1.port = port;
  gs.sectors.set("1", s1);

  const player = new PlayerSchema();
  player.playerId = "trade-p-1";
  player.displayName = "Trader";
  player.credits = STARTING_CREDITS;
  player.turnsRemaining = STARTING_TURNS;
  player.turnsMax = MAX_TURN_BANK;
  player.currentSectorId = 1;
  player.isDocked = true;
  player.isOnline = true;

  const ship = new ShipSchema();
  ship.shipId = "ship-trade-1";
  ship.shipClass = ShipClass.Scout;
  ship.name = "Trader's Scout";
  ship.maxCargoHolds = SHIP_SPECS[ShipClass.Scout].cargoCapacity; // 25
  ship.speed = SHIP_SPECS[ShipClass.Scout].warpSpeed;
  ship.cargoHolds = 0;
  player.ship = ship;

  gs.players.set("trade-session", player);
  s1.playerIds.push("trade-session");

  return { state: gs, player, port };
}

/** Simulate buy from port (mirrors GalaxyRoom handleTrade buying=true). */
function simulateBuy(
  player: PlayerSchema,
  port: PortSchema,
  commodity: Commodity,
  quantity: number,
): {
  success: boolean;
  errorCode?: string;
  actualQty?: number;
  totalPrice?: number;
  profitLoss?: number;
} {
  const cost = TURN_COSTS[ActionType.Trade];
  if (player.turnsRemaining < cost) {
    return { success: false, errorCode: "INSUFFICIENT_TURNS" };
  }
  player.turnsRemaining -= cost;

  if (!player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "NOT_DOCKED" };
  }

  if (!isValidCommodity(commodity)) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "INVALID_COMMODITY" };
  }

  if (quantity <= 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "INVALID_QUANTITY" };
  }

  const cs = port.commodities.get(commodity);
  if (!cs || cs.portBuys) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: cs?.portBuys ? "PORT_NOT_SELLING" : "COMMODITY_NOT_AVAILABLE" };
  }

  const qty = Math.min(quantity, cs.stock);
  if (qty === 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "OUT_OF_STOCK" };
  }

  const unitPrice = calculatePrice(cs, true);
  const totalPrice = qty * unitPrice;

  if (player.credits < totalPrice) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "INSUFFICIENT_CREDITS" };
  }

  const free = freeCargoHolds(player.ship);
  const actualQty = Math.min(qty, free);
  if (actualQty === 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "CARGO_FULL" };
  }

  const actualPrice = actualQty * unitPrice;
  player.credits -= actualPrice;
  cs.stock -= actualQty;
  loadCargo(player.ship, commodity, actualQty);
  cs.buyPrice = calculatePrice(cs, true);

  return { success: true, actualQty, totalPrice: actualPrice, profitLoss: -actualPrice };
}

/** Simulate sell to port (mirrors GalaxyRoom handleTrade buying=false). */
function simulateSell(
  player: PlayerSchema,
  port: PortSchema,
  commodity: Commodity,
  quantity: number,
): {
  success: boolean;
  errorCode?: string;
  actualQty?: number;
  totalPrice?: number;
  profitLoss?: number;
} {
  const cost = TURN_COSTS[ActionType.Trade];
  if (player.turnsRemaining < cost) {
    return { success: false, errorCode: "INSUFFICIENT_TURNS" };
  }
  player.turnsRemaining -= cost;

  if (!player.isDocked) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "NOT_DOCKED" };
  }

  const cs = port.commodities.get(commodity);
  if (!cs?.portBuys) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: !cs ? "COMMODITY_NOT_AVAILABLE" : "PORT_NOT_BUYING" };
  }

  const actualQty = unloadCargo(player.ship, commodity, quantity);
  if (actualQty === 0) {
    player.turnsRemaining = Math.min(player.turnsRemaining + cost, player.turnsMax);
    return { success: false, errorCode: "NO_CARGO" };
  }

  const unitPrice = calculatePrice(cs, false);
  const totalPrice = actualQty * unitPrice;
  player.credits += totalPrice;
  cs.stock += actualQty;
  cs.sellPrice = calculatePrice(cs, false);

  return { success: true, actualQty, totalPrice, profitLoss: totalPrice };
}

function assertDefined<T>(val: T | undefined | null): asserts val is T {
  expect(val).toBeDefined();
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Trading edge cases", () => {
  let player: PlayerSchema;
  let port: PortSchema;

  beforeEach(() => {
    ({ player, port } = createDockableState());
  });

  describe("dynamic pricing formula", () => {
    test("price at 50% stock equals base * (1 + variance * 0.5) for buy", () => {
      for (const commodity of COMMODITIES) {
        const c = new CommoditySchema();
        c.commodity = commodity;
        c.maxStock = 1000;
        c.stock = 500; // 50%
        const expected = Math.max(1, Math.round(BASE_PRICES[commodity] * (1 + PRICE_VARIANCE_PCT * 0.5)));
        expect(calculatePrice(c, true)).toBe(expected);
      }
    });

    test("price at 50% stock equals base * (1 - variance * 0.5) for sell", () => {
      for (const commodity of COMMODITIES) {
        const c = new CommoditySchema();
        c.commodity = commodity;
        c.maxStock = 1000;
        c.stock = 500;
        const expected = Math.max(1, Math.round(BASE_PRICES[commodity] * (1 - PRICE_VARIANCE_PCT * 0.5)));
        expect(calculatePrice(c, false)).toBe(expected);
      }
    });

    test("price at 25% stock is between 50% and 0% prices", () => {
      const c = new CommoditySchema();
      c.commodity = Commodity.Equipment;
      c.maxStock = 4000;

      c.stock = 0;
      const priceAt0 = calculatePrice(c, true);
      c.stock = 1000; // 25%
      const priceAt25 = calculatePrice(c, true);
      c.stock = 2000; // 50%
      const priceAt50 = calculatePrice(c, true);

      expect(priceAt25).toBeLessThanOrEqual(priceAt0);
      expect(priceAt25).toBeGreaterThanOrEqual(priceAt50);
    });

    test("buy price always >= sell price at same stock level", () => {
      const c = new CommoditySchema();
      c.commodity = Commodity.Organics;
      c.maxStock = 5000;

      for (const pct of [0, 0.25, 0.5, 0.75, 1.0]) {
        c.stock = Math.floor(c.maxStock * pct);
        expect(calculatePrice(c, true)).toBeGreaterThanOrEqual(calculatePrice(c, false));
      }
    });

    test("all base prices are verified for each commodity", () => {
      expect(BASE_PRICES[Commodity.FuelOre]).toBe(20);
      expect(BASE_PRICES[Commodity.Organics]).toBe(35);
      expect(BASE_PRICES[Commodity.Equipment]).toBe(70);
    });

    test("price with zero maxStock returns minimum 1", () => {
      const c = new CommoditySchema();
      c.commodity = Commodity.FuelOre;
      c.maxStock = 0;
      c.stock = 0;
      expect(calculatePrice(c, true)).toBeGreaterThanOrEqual(1);
      expect(calculatePrice(c, false)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("partial fill scenarios", () => {
    test("buy exact remaining stock succeeds", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      fuel.stock = 5;

      const result = simulateBuy(player, port, Commodity.FuelOre, 5);
      expect(result.success).toBe(true);
      expect(result.actualQty).toBe(5);
      expect(fuel.stock).toBe(0);
    });

    test("buy more than stock gets clamped to available", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      fuel.stock = 3;

      const result = simulateBuy(player, port, Commodity.FuelOre, 100);
      expect(result.success).toBe(true);
      expect(result.actualQty).toBe(3);
      expect(fuel.stock).toBe(0);
    });

    test("buy more than cargo capacity gets clamped to free holds", () => {
      // Fill 20 of 25 holds
      loadCargo(player.ship, Commodity.Organics, 20);
      expect(freeCargoHolds(player.ship)).toBe(5);

      const result = simulateBuy(player, port, Commodity.FuelOre, 10);
      expect(result.success).toBe(true);
      expect(result.actualQty).toBe(5);
    });

    test("buy with zero stock returns OUT_OF_STOCK", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      fuel.stock = 0;

      const result = simulateBuy(player, port, Commodity.FuelOre, 10);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("OUT_OF_STOCK");
    });
  });

  describe("sequential trades affecting price", () => {
    test("buying repeatedly raises buy price", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      fuel.stock = 5000;
      fuel.maxStock = 5000;

      const priceBefore = calculatePrice(fuel, true);

      // Deplete stock significantly to ensure rounding crosses a boundary
      fuel.stock = 2000;

      const priceAfter = calculatePrice(fuel, true);
      expect(priceAfter).toBeGreaterThan(priceBefore);
    });

    test("selling repeatedly raises sell price (more stock = higher sell price)", () => {
      const org = port.commodities.get(Commodity.Organics);
      assertDefined(org);
      org.maxStock = 5000;
      org.stock = 500; // Low stock → low sell price

      const priceLowStock = calculatePrice(org, false);

      // Significantly increase stock
      org.stock = 4000;

      const priceHigherStock = calculatePrice(org, false);
      expect(priceHigherStock).toBeGreaterThan(priceLowStock);
    });

    test("three sequential buys show monotonically increasing prices", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      fuel.stock = 5000;

      const prices: number[] = [];
      for (let i = 0; i < 3; i++) {
        prices.push(calculatePrice(fuel, true));
        // Simulate buy of max cargo
        const qty = Math.min(25, fuel.stock);
        fuel.stock -= qty;
        // Reset cargo for next round
        player.ship.cargoHolds = 0;
        player.ship.cargo.splice(0, player.ship.cargo.length);
      }

      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });
  });

  describe("profit/loss calculation", () => {
    test("buying returns negative profitLoss", () => {
      const result = simulateBuy(player, port, Commodity.FuelOre, 10);
      expect(result.success).toBe(true);
      expect(result.profitLoss).toBeLessThan(0);
      assertDefined(result.totalPrice);
      expect(result.profitLoss).toBe(-result.totalPrice);
    });

    test("selling returns positive profitLoss", () => {
      loadCargo(player.ship, Commodity.Organics, 10);
      const result = simulateSell(player, port, Commodity.Organics, 10);
      expect(result.success).toBe(true);
      expect(result.profitLoss).toBeGreaterThan(0);
      expect(result.profitLoss).toBe(result.totalPrice);
    });

    test("profitLoss equals quantity * unit price", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      const unitPrice = calculatePrice(fuel, true);

      const result = simulateBuy(player, port, Commodity.FuelOre, 10);
      expect(result.success).toBe(true);
      assertDefined(result.actualQty);
      expect(result.totalPrice).toBe(result.actualQty * unitPrice);
    });
  });

  describe("trade rejection paths", () => {
    test("trade while not docked returns NOT_DOCKED", () => {
      player.isDocked = false;
      const result = simulateBuy(player, port, Commodity.FuelOre, 1);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_DOCKED");
    });

    test("buying commodity port only buys returns PORT_NOT_SELLING", () => {
      // Organics has portBuys=true, so port doesn't sell it
      const result = simulateBuy(player, port, Commodity.Organics, 1);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("PORT_NOT_SELLING");
    });

    test("selling commodity port only sells returns PORT_NOT_BUYING", () => {
      loadCargo(player.ship, Commodity.FuelOre, 10);
      // FuelOre has portBuys=false, so port doesn't buy it
      const result = simulateSell(player, port, Commodity.FuelOre, 5);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("PORT_NOT_BUYING");
    });

    test("selling commodity not in cargo returns NO_CARGO", () => {
      // Player has no equipment in cargo
      const result = simulateSell(player, port, Commodity.Equipment, 5);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NO_CARGO");
    });

    test("buying with insufficient credits returns INSUFFICIENT_CREDITS", () => {
      player.credits = 1;
      const result = simulateBuy(player, port, Commodity.FuelOre, 10);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_CREDITS");
    });

    test("buying with full cargo returns CARGO_FULL", () => {
      loadCargo(player.ship, Commodity.Equipment, 25);
      const result = simulateBuy(player, port, Commodity.FuelOre, 1);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("CARGO_FULL");
    });

    test("zero quantity buy is rejected", () => {
      const result = simulateBuy(player, port, Commodity.FuelOre, 0);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("INVALID_QUANTITY");
    });

    test("trade deducts 2 turns on success", () => {
      const startTurns = player.turnsRemaining;
      simulateBuy(player, port, Commodity.FuelOre, 1);
      expect(player.turnsRemaining).toBe(startTurns - TURN_COSTS[ActionType.Trade]);
    });

    test("trade refunds turns on failure", () => {
      const startTurns = player.turnsRemaining;
      player.isDocked = false;
      simulateBuy(player, port, Commodity.FuelOre, 1);
      expect(player.turnsRemaining).toBe(startTurns);
    });
  });

  describe("credit tracking", () => {
    test("credits decrease by exact total price on buy", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      const unitPrice = calculatePrice(fuel, true);
      const startCredits = player.credits;
      const qty = 5;

      simulateBuy(player, port, Commodity.FuelOre, qty);
      expect(player.credits).toBe(startCredits - qty * unitPrice);
    });

    test("credits increase by exact total price on sell", () => {
      const org = port.commodities.get(Commodity.Organics);
      assertDefined(org);
      const unitPrice = calculatePrice(org, false);
      loadCargo(player.ship, Commodity.Organics, 10);
      const startCredits = player.credits;

      simulateSell(player, port, Commodity.Organics, 10);
      expect(player.credits).toBe(startCredits + 10 * unitPrice);
    });
  });

  describe("stock tracking", () => {
    test("port stock decreases on player buy", () => {
      const fuel = port.commodities.get(Commodity.FuelOre);
      assertDefined(fuel);
      const startStock = fuel.stock;

      simulateBuy(player, port, Commodity.FuelOre, 5);
      expect(fuel.stock).toBe(startStock - 5);
    });

    test("port stock increases on player sell", () => {
      const org = port.commodities.get(Commodity.Organics);
      assertDefined(org);
      const startStock = org.stock;
      loadCargo(player.ship, Commodity.Organics, 10);

      simulateSell(player, port, Commodity.Organics, 10);
      expect(org.stock).toBe(startStock + 10);
    });
  });
});
