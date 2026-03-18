/**
 * Dev seed script — populates the database with a small test galaxy and sample players.
 * Idempotent: safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Usage: tsx server/src/db/seed.ts
 */

import {
  STARTING_CREDITS,
  STARTING_TURNS,
  MAX_TURN_BANK,
  STARTING_SECTOR_ID,
  PORT_CLASS_CODES,
  COMMODITIES,
  BASE_PRICES,
  MAX_PORT_STOCK,
  PORT_CLASS_DEFS,
  type Commodity,
  PortTradeType,
} from "@void-market/shared";
import { pool, closePool } from "./connection.js";

// ── Configuration ────────────────────────────────────────────────────────────

const SEED_SECTOR_COUNT = 50;
const SEED_PORT_DENSITY = 0.6;
const MIN_WARPS = 2;
const MAX_WARPS = 4;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1));
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Seed Functions ───────────────────────────────────────────────────────────

async function seedSectors(): Promise<void> {
  console.log(`  Seeding ${SEED_SECTOR_COUNT} sectors…`);
  const values: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (let i = 1; i <= SEED_SECTOR_COUNT; i++) {
    const x = randomFloat(-500, 500);
    const y = randomFloat(-500, 500);
    values.push(`($${idx++}, $${idx++}, $${idx++})`);
    params.push(i, x, y);
  }

  await pool.query(
    `INSERT INTO sectors (id, x, y) VALUES ${values.join(", ")}
     ON CONFLICT (id) DO NOTHING`,
    params,
  );
}

async function seedWarps(): Promise<void> {
  console.log("  Seeding warp connections…");
  const edges = new Set<string>();
  const inserts: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (let from = 1; from <= SEED_SECTOR_COUNT; from++) {
    const warpCount = randomInt(MIN_WARPS, MAX_WARPS);
    for (let w = 0; w < warpCount; w++) {
      let to = randomInt(1, SEED_SECTOR_COUNT);
      if (to === from) to = (to % SEED_SECTOR_COUNT) + 1;
      const key = `${from}-${to}`;
      if (edges.has(key)) continue;
      edges.add(key);
      // Bidirectional warps
      const reverseKey = `${to}-${from}`;
      edges.add(reverseKey);
      inserts.push(`($${idx++}, $${idx++})`);
      params.push(from, to);
      inserts.push(`($${idx++}, $${idx++})`);
      params.push(to, from);
    }
  }

  await pool.query(
    `INSERT INTO warps (sector_from_id, sector_to_id) VALUES ${inserts.join(", ")}
     ON CONFLICT DO NOTHING`,
    params,
  );
}

async function seedPorts(): Promise<void> {
  console.log("  Seeding ports…");

  for (let sectorId = 2; sectorId <= SEED_SECTOR_COUNT; sectorId++) {
    if (Math.random() > SEED_PORT_DENSITY) continue;

    const portClass = pickRandom(PORT_CLASS_CODES);
    const portName = `Port ${sectorId}-${portClass}`;

    const portResult = await pool.query<{ id: string }>(
      `INSERT INTO ports (sector_id, name, port_class)
       VALUES ($1, $2, $3)
       ON CONFLICT (sector_id) DO NOTHING
       RETURNING id`,
      [sectorId, portName, portClass],
    );

    if (portResult.rows.length === 0) continue;
    const portId = portResult.rows[0].id;

    const classDef = PORT_CLASS_DEFS[portClass];
    for (const commodity of COMMODITIES) {
      const buys = classDef.trades[commodity] === PortTradeType.Buying;
      const basePrice = BASE_PRICES[commodity as Commodity];
      const stock = randomInt(500, MAX_PORT_STOCK);
      const buyPrice = buys ? 0 : Math.round(basePrice * 1.1);
      const sellPrice = buys ? Math.round(basePrice * 0.9) : 0;

      await pool.query(
        `INSERT INTO port_commodities (port_id, commodity, stock, max_stock, buy_price, sell_price, port_buys)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (port_id, commodity) DO NOTHING`,
        [portId, commodity, stock, MAX_PORT_STOCK, buyPrice, sellPrice, buys],
      );
    }
  }
}

async function seedPlayers(): Promise<void> {
  console.log("  Seeding sample players…");

  const samplePlayers = [
    { username: "alice", email: "alice@void.market", displayName: "Alice" },
    { username: "bob", email: "bob@void.market", displayName: "Bob" },
  ];

  for (const p of samplePlayers) {
    // Dummy password hash — never used in production
    const dummyHash = "dev_seed_not_a_real_hash";

    const userResult = await pool.query<{ id: string }>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [p.username, p.email, dummyHash],
    );

    if (userResult.rows.length === 0) continue;
    const userId = userResult.rows[0].id;

    const playerResult = await pool.query<{ id: string }>(
      `INSERT INTO players (user_id, display_name, credits, turns_remaining, turns_max, current_sector_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        p.displayName,
        STARTING_CREDITS,
        STARTING_TURNS,
        MAX_TURN_BANK,
        STARTING_SECTOR_ID,
      ],
    );

    const playerId = playerResult.rows[0].id;

    await pool.query(
      `INSERT INTO ships (player_id, ship_class, name, cargo_holds, max_cargo_holds, speed)
       VALUES ($1, 'scout', 'Starter Ship', 0, 25, 3)`,
      [playerId],
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🌌 Seeding Void Market database…");
  await seedSectors();
  await seedWarps();
  await seedPorts();
  await seedPlayers();
  console.log("✅ Seed complete.");
  await closePool();
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
