import { describe, it, expect } from "vitest";
import { VERSION } from "../index.js";
import {
  createMockPlayer,
  createMockPort,
  assertDefined,
  assertInRange,
} from "../test-utils/index.js";

describe("@void-market/shared exports", () => {
  it("VERSION is defined and is a non-empty string", () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe("string");
    expect(VERSION.length).toBeGreaterThan(0);
  });

  it("VERSION matches semver pattern", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("test-utils", () => {
  describe("createMockPlayer", () => {
    it("returns a player with sensible defaults", () => {
      const player = createMockPlayer();
      expect(player.id).toBeDefined();
      expect(player.name).toBe("TestPlayer");
      expect(player.credits).toBe(1000);
      expect(player.turnsRemaining).toBe(100);
      expect(player.sectorId).toBe(1);
    });

    it("accepts overrides", () => {
      const player = createMockPlayer({ name: "Ace", credits: 9999 });
      expect(player.name).toBe("Ace");
      expect(player.credits).toBe(9999);
    });
  });

  describe("createMockPort", () => {
    it("returns a port with sensible defaults", () => {
      const port = createMockPort();
      expect(port.id).toBe(1);
      expect(port.type).toBe("BBS");
      expect(port.fuelOre).toBe(500);
    });

    it("accepts overrides", () => {
      const port = createMockPort({ type: "SSB", fuelOre: 100 });
      expect(port.type).toBe("SSB");
      expect(port.fuelOre).toBe(100);
    });
  });

  describe("assertDefined", () => {
    it("does not throw for defined values", () => {
      expect(() => assertDefined("hello")).not.toThrow();
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
    });

    it("throws for null", () => {
      expect(() => assertDefined(null)).toThrow(/Expected value to be defined/);
    });

    it("throws for undefined", () => {
      expect(() => assertDefined(undefined)).toThrow(/Expected value to be defined/);
    });

    it("throws with custom message", () => {
      expect(() => assertDefined(null, "player missing")).toThrow("player missing");
    });
  });

  describe("assertInRange", () => {
    it("does not throw for values in range", () => {
      expect(() => assertInRange(5, 1, 10)).not.toThrow();
      expect(() => assertInRange(1, 1, 10)).not.toThrow();
      expect(() => assertInRange(10, 1, 10)).not.toThrow();
    });

    it("throws for values out of range", () => {
      expect(() => assertInRange(0, 1, 10, "turns")).toThrow(
        /Expected turns to be between 1 and 10/
      );
      expect(() => assertInRange(11, 1, 10)).toThrow();
    });
  });
});
