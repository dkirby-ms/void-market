/**
 * Player persistence — save/load player state to PostgreSQL.
 *
 * All methods handle connection failures gracefully (try/catch with logging).
 * The room should never crash due to a DB outage.
 */

import { pool } from "./connection.js";
import type { PlayerSchema } from "@void-market/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlayerData {
  displayName: string;
  credits: number;
  turnsRemaining: number;
  turnsMax: number;
  currentSectorId: number;
  isDocked: boolean;
  ship: {
    shipClass: string;
    name: string;
    cargoHolds: number;
    maxCargoHolds: number;
    speed: number;
  };
  cargo: { commodity: string; quantity: number }[];
}

// ── Row types for pg queries ─────────────────────────────────────────────────

interface PlayerRow {
  id: string;
  display_name: string;
  credits: string; // numeric(15,2) returns as string
  turns_remaining: number;
  turns_max: number;
  current_sector_id: number;
  is_docked: boolean;
  ship_class: string | null;
  ship_name: string | null;
  cargo_holds: number | null;
  max_cargo_holds: number | null;
  speed: number | null;
  ship_id: string | null;
}

interface CargoRow {
  commodity: string;
  quantity: number;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Upsert a single player's state (player + ship + cargo) in a transaction. */
export async function savePlayer(
  player: PlayerSchema,
  userId: string,
): Promise<void> {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Upsert player (try UPDATE first, INSERT if no match)
    const updateResult = await client.query<{ id: string }>(
      `UPDATE players SET
         display_name = $2, credits = $3, turns_remaining = $4, turns_max = $5,
         current_sector_id = $6, is_docked = $7, is_online = $8, updated_at = NOW()
       WHERE user_id = $1
       RETURNING id`,
      [
        userId,
        player.displayName,
        player.credits,
        player.turnsRemaining,
        player.turnsMax,
        player.currentSectorId,
        player.isDocked,
        player.isOnline,
      ],
    );

    let playerId: string;
    if (updateResult.rows.length > 0) {
      playerId = updateResult.rows[0].id;
    } else {
      const insertResult = await client.query<{ id: string }>(
        `INSERT INTO players (user_id, display_name, credits, turns_remaining, turns_max, current_sector_id, is_docked, is_online)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          player.displayName,
          player.credits,
          player.turnsRemaining,
          player.turnsMax,
          player.currentSectorId,
          player.isDocked,
          player.isOnline,
        ],
      );
      playerId = insertResult.rows[0].id;
    }

    // Upsert ship (ships.player_id has UNIQUE constraint)
    const shipResult = await client.query<{ id: string }>(
      `INSERT INTO ships (player_id, ship_class, name, cargo_holds, max_cargo_holds, speed, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (player_id) DO UPDATE SET
         ship_class = EXCLUDED.ship_class,
         name = EXCLUDED.name,
         cargo_holds = EXCLUDED.cargo_holds,
         max_cargo_holds = EXCLUDED.max_cargo_holds,
         speed = EXCLUDED.speed,
         updated_at = NOW()
       RETURNING id`,
      [
        playerId,
        player.ship.shipClass,
        player.ship.name,
        player.ship.cargoHolds,
        player.ship.maxCargoHolds,
        player.ship.speed,
      ],
    );
    const shipId = shipResult.rows[0].id;

    // Replace cargo (delete + re-insert)
    await client.query("DELETE FROM cargo WHERE ship_id = $1", [shipId]);
    for (const entry of player.ship.cargo) {
      if (entry.quantity > 0) {
        await client.query(
          "INSERT INTO cargo (ship_id, commodity, quantity) VALUES ($1, $2, $3)",
          [shipId, entry.commodity, entry.quantity],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore rollback errors */
      }
    }
    console.error("[PlayerRepository] Failed to save player:", err);
  } finally {
    if (client) client.release();
  }
}

/** Load a player's saved state by user ID. Returns null if not found or on error. */
export async function loadPlayer(userId: string): Promise<PlayerData | null> {
  try {
    const result = await pool.query<PlayerRow>(
      `SELECT p.id, p.display_name, p.credits, p.turns_remaining, p.turns_max,
              p.current_sector_id, p.is_docked,
              s.ship_class, s.name AS ship_name, s.cargo_holds, s.max_cargo_holds,
              s.speed, s.id AS ship_id
       FROM players p
       LEFT JOIN ships s ON s.player_id = p.id
       WHERE p.user_id = $1
       LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const cargo: { commodity: string; quantity: number }[] = [];

    if (row.ship_id) {
      const cargoResult = await pool.query<CargoRow>(
        "SELECT commodity, quantity FROM cargo WHERE ship_id = $1",
        [row.ship_id],
      );
      for (const c of cargoResult.rows) {
        cargo.push({ commodity: c.commodity, quantity: c.quantity });
      }
    }

    return {
      displayName: row.display_name,
      credits: parseFloat(row.credits),
      turnsRemaining: row.turns_remaining,
      turnsMax: row.turns_max,
      currentSectorId: row.current_sector_id,
      isDocked: row.is_docked,
      ship: {
        shipClass: row.ship_class ?? "scout",
        name: row.ship_name ?? "Starter Ship",
        cargoHolds: row.cargo_holds ?? 0,
        maxCargoHolds: row.max_cargo_holds ?? 25,
        speed: row.speed ?? 3,
      },
      cargo,
    };
  } catch (err) {
    console.error("[PlayerRepository] Failed to load player:", err);
    return null;
  }
}

/** Batch-save multiple players (sequential to avoid connection pool exhaustion). */
export async function saveAllPlayers(
  entries: { player: PlayerSchema; userId: string }[],
): Promise<void> {
  for (const entry of entries) {
    await savePlayer(entry.player, entry.userId);
  }
}
