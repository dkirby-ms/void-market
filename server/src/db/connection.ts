/**
 * PostgreSQL connection pool for Void Market.
 * Uses DATABASE_URL env var or falls back to local Docker Compose defaults.
 */

import pg from "pg";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/voidmarket";

const connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export const pool = new pg.Pool({ connectionString });

/** Run a single parameterized query. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/** Gracefully shut down the pool. */
export async function closePool(): Promise<void> {
  await pool.end();
}
