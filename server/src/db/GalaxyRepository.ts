/**
 * Galaxy persistence — save/load galaxy structure to PostgreSQL.
 *
 * All methods handle connection failures gracefully (try/catch with logging).
 * The room should never crash due to a DB outage.
 */

import { pool } from "./connection.js";
import {
  type GalaxyState,
  SectorSchema,
  PortSchema,
  CommoditySchema,
} from "@void-market/shared";

// ── Row types for pg queries ─────────────────────────────────────────────────

interface SectorRow {
  id: number;
  x: number;
  y: number;
}

interface WarpRow {
  sector_from_id: number;
  sector_to_id: number;
}

interface PortRow {
  id: string;
  sector_id: number;
  name: string;
  port_class: string;
  last_restock: string;
}

interface CommodityRow {
  port_id: string;
  commodity: string;
  stock: number;
  max_stock: number;
  buy_price: number;
  sell_price: number;
  port_buys: boolean;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Check whether a galaxy has been persisted to the database. */
export async function galaxyExists(): Promise<boolean> {
  try {
    const result = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM sectors",
    );
    return parseInt(result.rows[0].count, 10) > 0;
  } catch (err) {
    console.error("[GalaxyRepository] Failed to check galaxy existence:", err);
    return false;
  }
}

/** Save the full galaxy state (sectors, warps, ports, commodities) in a transaction. */
export async function saveGalaxy(state: GalaxyState): Promise<void> {
  // ── Collect data synchronously from Colyseus schemas ───────────────────

  const sectorData: { id: number; x: number; y: number }[] = [];
  const warpData: [number, number][] = [];
  const portData: {
    sectorId: number;
    name: string;
    portClass: string;
    commodities: {
      commodity: string;
      stock: number;
      maxStock: number;
      buyPrice: number;
      sellPrice: number;
      portBuys: boolean;
    }[];
  }[] = [];

  state.sectors.forEach((sector) => {
    sectorData.push({ id: sector.sectorId, x: sector.x, y: sector.y });

    for (const targetId of sector.warps) {
      warpData.push([sector.sectorId, targetId]);
    }

    if (sector.port) {
      const comms: (typeof portData)[number]["commodities"] = [];
      sector.port.commodities.forEach((cs) => {
        comms.push({
          commodity: cs.commodity,
          stock: cs.stock,
          maxStock: cs.maxStock,
          buyPrice: cs.buyPrice,
          sellPrice: cs.sellPrice,
          portBuys: cs.portBuys,
        });
      });
      portData.push({
        sectorId: sector.sectorId,
        name: sector.port.name,
        portClass: sector.port.portClass,
        commodities: comms,
      });
    }
  });

  // ── Execute in a single transaction ────────────────────────────────────

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Clear dependent tables (order matters for FK constraints)
    await client.query("DELETE FROM port_commodities");
    await client.query("DELETE FROM ports");
    await client.query("DELETE FROM warps");

    // Upsert sectors (players may reference them via FK)
    if (sectorData.length > 0) {
      const vals: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      for (const s of sectorData) {
        vals.push(`($${idx++}, $${idx++}, $${idx++})`);
        params.push(s.id, s.x, s.y);
      }
      await client.query(
        `INSERT INTO sectors (id, x, y) VALUES ${vals.join(", ")}
         ON CONFLICT (id) DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y`,
        params,
      );
    }

    // Insert warps
    if (warpData.length > 0) {
      const vals: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      for (const [from, to] of warpData) {
        vals.push(`($${idx++}, $${idx++})`);
        params.push(from, to);
      }
      await client.query(
        `INSERT INTO warps (sector_from_id, sector_to_id) VALUES ${vals.join(", ")}
         ON CONFLICT DO NOTHING`,
        params,
      );
    }

    // Insert ports + commodities
    for (const p of portData) {
      const portResult = await client.query<{ id: string }>(
        `INSERT INTO ports (sector_id, name, port_class, last_restock)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (sector_id) DO UPDATE SET
           name = EXCLUDED.name,
           port_class = EXCLUDED.port_class,
           last_restock = EXCLUDED.last_restock
         RETURNING id`,
        [p.sectorId, p.name, p.portClass],
      );
      const portId = portResult.rows[0].id;

      for (const c of p.commodities) {
        await client.query(
          `INSERT INTO port_commodities (port_id, commodity, stock, max_stock, buy_price, sell_price, port_buys)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (port_id, commodity) DO UPDATE SET
             stock = EXCLUDED.stock,
             max_stock = EXCLUDED.max_stock,
             buy_price = EXCLUDED.buy_price,
             sell_price = EXCLUDED.sell_price,
             port_buys = EXCLUDED.port_buys`,
          [
            portId,
            c.commodity,
            c.stock,
            c.maxStock,
            c.buyPrice,
            c.sellPrice,
            c.portBuys,
          ],
        );
      }
    }

    await client.query("COMMIT");
    console.log(
      `[GalaxyRepository] Galaxy saved (${sectorData.length} sectors, ${portData.length} ports)`,
    );
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore rollback errors */
      }
    }
    console.error("[GalaxyRepository] Failed to save galaxy:", err);
  } finally {
    if (client) client.release();
  }
}

/**
 * Load persisted galaxy into the provided GalaxyState.
 * Returns true if a galaxy was found, false otherwise (or on error).
 */
export async function loadGalaxy(state: GalaxyState): Promise<boolean> {
  try {
    // Load sectors
    const sectorResult = await pool.query<SectorRow>(
      "SELECT id, x, y FROM sectors ORDER BY id",
    );
    if (sectorResult.rows.length === 0) return false;

    for (const row of sectorResult.rows) {
      const sector = new SectorSchema();
      sector.sectorId = row.id;
      sector.x = row.x;
      sector.y = row.y;
      state.sectors.set(String(row.id), sector);
    }

    // Load warps
    const warpResult = await pool.query<WarpRow>(
      "SELECT sector_from_id, sector_to_id FROM warps",
    );
    for (const row of warpResult.rows) {
      const sector = state.sectors.get(String(row.sector_from_id));
      if (sector) sector.warps.push(row.sector_to_id);
    }

    // Load ports
    const portResult = await pool.query<PortRow>(
      "SELECT id, sector_id, name, port_class, last_restock FROM ports",
    );
    const portMap = new Map<string, { sectorId: number; port: PortSchema }>();
    for (const row of portResult.rows) {
      const port = new PortSchema();
      port.portId = `port-${row.sector_id}`;
      port.name = row.name;
      port.sectorId = row.sector_id;
      port.portClass = row.port_class;
      port.lastRestock = new Date(row.last_restock).getTime();
      portMap.set(row.id, { sectorId: row.sector_id, port });
    }

    // Load commodities
    const commResult = await pool.query<CommodityRow>(
      "SELECT port_id, commodity, stock, max_stock, buy_price, sell_price, port_buys FROM port_commodities",
    );
    for (const row of commResult.rows) {
      const entry = portMap.get(row.port_id);
      if (!entry) continue;
      const cs = new CommoditySchema();
      cs.commodity = row.commodity;
      cs.stock = row.stock;
      cs.maxStock = row.max_stock;
      cs.buyPrice = row.buy_price;
      cs.sellPrice = row.sell_price;
      cs.portBuys = row.port_buys;
      entry.port.commodities.set(row.commodity, cs);
    }

    // Assign ports to sectors
    for (const { sectorId, port } of portMap.values()) {
      const sector = state.sectors.get(String(sectorId));
      if (sector) sector.port = port;
    }

    console.log(
      `[GalaxyRepository] Galaxy loaded (${sectorResult.rows.length} sectors, ${portResult.rows.length} ports)`,
    );
    return true;
  } catch (err) {
    console.error("[GalaxyRepository] Failed to load galaxy:", err);
    return false;
  }
}

/** Persist current port commodity states (stock, prices) without full galaxy save. */
export async function savePortCommodities(state: GalaxyState): Promise<void> {
  const updates: {
    sectorId: number;
    commodity: string;
    stock: number;
    buyPrice: number;
    sellPrice: number;
  }[] = [];

  state.sectors.forEach((sector) => {
    if (!sector.port) return;
    sector.port.commodities.forEach((cs) => {
      updates.push({
        sectorId: sector.sectorId,
        commodity: cs.commodity,
        stock: cs.stock,
        buyPrice: cs.buyPrice,
        sellPrice: cs.sellPrice,
      });
    });
  });

  if (updates.length === 0) return;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    for (const u of updates) {
      await client.query(
        `UPDATE port_commodities SET stock = $3, buy_price = $4, sell_price = $5
         FROM ports WHERE port_commodities.port_id = ports.id
         AND ports.sector_id = $1 AND port_commodities.commodity = $2`,
        [u.sectorId, u.commodity, u.stock, u.buyPrice, u.sellPrice],
      );
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
    console.error("[GalaxyRepository] Failed to save port commodities:", err);
  } finally {
    if (client) client.release();
  }
}
