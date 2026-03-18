/**
 * Programmatic migration runner for Void Market.
 * Usage:
 *   tsx server/src/db/migrate.ts up      — apply all pending migrations
 *   tsx server/src/db/migrate.ts down     — revert last migration
 */

import { runner } from "node-pg-migrate";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "migrations");

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/voidmarket";

const directionArg = process.argv[2] ?? "up";

if (directionArg !== "up" && directionArg !== "down") {
  console.error(`Usage: migrate.ts [up|down]`);
  process.exit(1);
}

const direction: "up" | "down" = directionArg;

async function main(): Promise<void> {
  console.log(`Running migrations ${direction}…`);
  await runner({
    databaseUrl: DATABASE_URL,
    dir: migrationsDir,
    direction,
    migrationsTable: "pgmigrations",
    count: direction === "down" ? 1 : Infinity,
    log: console.log.bind(console),
  });
  console.log(`Migrations ${direction} complete.`);
}

main().catch((err: unknown) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
