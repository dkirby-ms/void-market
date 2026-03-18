/**
 * Procedural galaxy generator for Void Market.
 *
 * Produces a deterministic galaxy graph from a seed: N sectors with 2–6
 * bidirectional warp connections, ~PORT_DENSITY ports distributed across
 * port classes, and 2D positions for map rendering.
 *
 * Algorithm:
 *  1. Grid-with-jitter positions (normalized to 0–10 000)
 *  2. Random spanning tree → guaranteed connectivity
 *  3. Augment edges to satisfy MIN/MAX warp constraints
 *  4. BFS safety check for full reachability
 *  5. Place ports with commodity stocks/prices from constants
 */

import {
  GalaxyState,
  SectorSchema,
  PortSchema,
  CommoditySchema,
  DEFAULT_SECTOR_COUNT,
  MIN_WARPS_PER_SECTOR,
  MAX_WARPS_PER_SECTOR,
  PORT_DENSITY,
  PORT_CLASS_DEFS,
  PORT_CLASS_CODES,
  COMMODITIES,
  BASE_PRICES,
  MAX_PORT_STOCK,
  PRICE_VARIANCE_PCT,
  PortTradeType,
} from "@void-market/shared";

// ── Seeded PRNG (Mulberry32) ────────────────────────────────────────────────

function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Types ───────────────────────────────────────────────────────────────────

interface SectorPos {
  id: number;
  x: number;
  y: number;
}

// Adjacency and neighbor data indexed by sector ID (1-based; index 0 unused).
type AdjList = Set<number>[];
type NeighborList = number[][];

// ── Position Generation ─────────────────────────────────────────────────────

function generatePositions(rng: () => number, count: number): SectorPos[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const xSpacing = cols > 1 ? 10_000 / (cols - 1) : 0;
  const ySpacing = rows > 1 ? 10_000 / (rows - 1) : 0;
  const jitter = Math.min(xSpacing, ySpacing) * 0.3;

  const positions: SectorPos[] = [];
  let id = 1;

  for (let row = 0; row < rows && id <= count; row++) {
    for (let col = 0; col < cols && id <= count; col++) {
      positions.push({
        id,
        x: col * xSpacing + (rng() - 0.5) * jitter * 2,
        y: row * ySpacing + (rng() - 0.5) * jitter * 2,
      });
      id++;
    }
  }

  return positions;
}

// ── Nearest-Neighbor Index ──────────────────────────────────────────────────

function computeSortedNeighbors(positions: SectorPos[]): NeighborList {
  const n = positions.length;
  // Index 0 is unused; sectors are 1-based.
  const result: NeighborList = new Array(n + 1) as NeighborList;

  for (const p of positions) {
    const dists: { id: number; distSq: number }[] = [];
    for (const q of positions) {
      if (p.id === q.id) continue;
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      dists.push({ id: q.id, distSq: dx * dx + dy * dy });
    }
    dists.sort((a, b) => a.distSq - b.distSq);
    result[p.id] = dists.map((d) => d.id);
  }

  return result;
}

// ── Warp Graph ──────────────────────────────────────────────────────────────

function initAdj(count: number): AdjList {
  const adj: AdjList = new Array(count + 1) as AdjList;
  for (let i = 1; i <= count; i++) adj[i] = new Set();
  return adj;
}

/** Add bidirectional edge if both endpoints have room. */
function tryAddEdge(adj: AdjList, a: number, b: number): boolean {
  if (a === b) return false;
  const aSet = adj[a];
  const bSet = adj[b];
  if (aSet.has(b)) return false;
  if (aSet.size >= MAX_WARPS_PER_SECTOR) return false;
  if (bSet.size >= MAX_WARPS_PER_SECTOR) return false;
  aSet.add(b);
  bSet.add(a);
  return true;
}

/**
 * Phase 1 — random spanning tree.
 * Sectors are processed in shuffled order; each connects to its nearest
 * already-visited sector that hasn't reached MAX_WARPS.
 */
function buildSpanningTree(
  rng: () => number,
  positions: SectorPos[],
  neighbors: NeighborList,
  adj: AdjList,
): void {
  const visited = new Set<number>([1]);
  const remaining = shuffle(
    rng,
    positions.filter((p) => p.id !== 1).map((p) => p.id),
  );

  for (const id of remaining) {
    const nearest = neighbors[id];
    let connected = false;

    for (const cand of nearest) {
      if (visited.has(cand) && adj[cand].size < MAX_WARPS_PER_SECTOR) {
        tryAddEdge(adj, id, cand);
        connected = true;
        break;
      }
    }

    // Fallback: scan all visited sectors if nearest-neighbors all maxed
    if (!connected) {
      for (const v of visited) {
        if (adj[v].size < MAX_WARPS_PER_SECTOR) {
          tryAddEdge(adj, id, v);
          break;
        }
      }
    }

    visited.add(id);
  }
}

/** Phase 2 — bring every sector up to MIN_WARPS_PER_SECTOR. */
function enforceMinWarps(
  positions: SectorPos[],
  neighbors: NeighborList,
  adj: AdjList,
): void {
  for (const p of positions) {
    while (adj[p.id].size < MIN_WARPS_PER_SECTOR) {
      const nearest = neighbors[p.id];
      let added = false;
      for (const cand of nearest) {
        if (tryAddEdge(adj, p.id, cand)) {
          added = true;
          break;
        }
      }
      if (!added) break;
    }
  }
}

/** Phase 3 — add extra edges for gameplay variety (random target per sector). */
function addVarietyEdges(
  rng: () => number,
  positions: SectorPos[],
  neighbors: NeighborList,
  adj: AdjList,
): void {
  const order = shuffle(
    rng,
    positions.map((p) => p.id),
  );

  for (const id of order) {
    const target = randInt(rng, MIN_WARPS_PER_SECTOR, MAX_WARPS_PER_SECTOR);
    if (adj[id].size >= target) continue;

    const nearest = neighbors[id];
    for (const cand of nearest) {
      if (adj[id].size >= target) break;
      tryAddEdge(adj, id, cand);
    }
  }
}

/** Phase 4 — BFS safety net: bridge any disconnected components. */
function repairConnectivity(
  sectorCount: number,
  neighbors: NeighborList,
  adj: AdjList,
): void {
  for (;;) {
    const visited = new Set<number>();
    const queue = [1];
    visited.add(1);

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === undefined) break;
      for (const nb of adj[cur]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }

    if (visited.size === sectorCount) return;

    // Find first disconnected sector and bridge it
    for (let id = 1; id <= sectorCount; id++) {
      if (visited.has(id)) continue;
      const nearest = neighbors[id];
      for (const cand of nearest) {
        if (visited.has(cand)) {
          adj[id].add(cand);
          adj[cand].add(id);
          break;
        }
      }
      break;
    }
  }
}

function buildWarpGraph(
  rng: () => number,
  positions: SectorPos[],
  neighbors: NeighborList,
): AdjList {
  const adj = initAdj(positions.length);

  buildSpanningTree(rng, positions, neighbors, adj);
  enforceMinWarps(positions, neighbors, adj);
  addVarietyEdges(rng, positions, neighbors, adj);
  repairConnectivity(positions.length, neighbors, adj);

  return adj;
}

// ── Port Placement ──────────────────────────────────────────────────────────

const PRIMARY_PORT_TYPES = ["SBB", "BSB", "BBS", "SSB"];

function placePorts(
  rng: () => number,
  sectorCount: number,
): Map<number, string> {
  const portMap = new Map<number, string>();

  const portSectors: number[] = [];
  for (let id = 1; id <= sectorCount; id++) {
    if (rng() < PORT_DENSITY) portSectors.push(id);
  }

  // Guarantee at least one of each primary type
  const shuffled = shuffle(rng, [...portSectors]);
  for (
    let i = 0;
    i < Math.min(PRIMARY_PORT_TYPES.length, shuffled.length);
    i++
  ) {
    portMap.set(shuffled[i], PRIMARY_PORT_TYPES[i]);
  }

  for (const id of portSectors) {
    if (portMap.has(id)) continue;

    if (rng() < 0.8) {
      portMap.set(
        id,
        PRIMARY_PORT_TYPES[randInt(rng, 0, PRIMARY_PORT_TYPES.length - 1)],
      );
    } else {
      portMap.set(
        id,
        PORT_CLASS_CODES[randInt(rng, 0, PORT_CLASS_CODES.length - 1)],
      );
    }
  }

  return portMap;
}

// ── Port + Commodity Initialization ─────────────────────────────────────────

function createPort(
  rng: () => number,
  sectorId: number,
  portClassCode: string,
): PortSchema {
  const port = new PortSchema();
  port.portId = `port-${sectorId}`;
  port.name = `Port ${sectorId}`;
  port.sectorId = sectorId;
  port.portClass = portClassCode;
  port.lastRestock = 0;

  const classDef = PORT_CLASS_DEFS[portClassCode];

  for (const commodity of COMMODITIES) {
    const cs = new CommoditySchema();
    cs.commodity = commodity;
    cs.maxStock = MAX_PORT_STOCK;

    const isBuying = classDef.trades[commodity] === PortTradeType.Buying;
    cs.portBuys = isBuying;
    cs.stock = Math.floor(MAX_PORT_STOCK * (0.3 + rng() * 0.5));

    const basePrice = BASE_PRICES[commodity];
    const variance = (rng() - 0.5) * 2 * PRICE_VARIANCE_PCT;
    const price = Math.max(1, Math.round(basePrice * (1 + variance)));

    if (isBuying) {
      cs.sellPrice = price;
      cs.buyPrice = 0;
    } else {
      cs.buyPrice = price;
      cs.sellPrice = 0;
    }

    port.commodities.set(commodity, cs);
  }

  return port;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a galaxy with the given seed and sector count.
 * @param seed  Deterministic RNG seed.
 * @param sectorCount  Number of sectors (defaults to DEFAULT_SECTOR_COUNT).
 * @returns Fully populated GalaxyState.
 */
export function generateGalaxy(
  seed: number,
  sectorCount: number = DEFAULT_SECTOR_COUNT,
): GalaxyState {
  const rng = createRng(seed);
  const state = new GalaxyState();

  const positions = generatePositions(rng, sectorCount);
  const neighbors = computeSortedNeighbors(positions);
  const adjacency = buildWarpGraph(rng, positions, neighbors);
  const portMap = placePorts(rng, sectorCount);

  for (const pos of positions) {
    const sector = new SectorSchema();
    sector.sectorId = pos.id;
    sector.x = pos.x;
    sector.y = pos.y;

    const warps = Array.from(adjacency[pos.id]).sort((a, b) => a - b);
    for (const w of warps) {
      sector.warps.push(w);
    }

    const portClass = portMap.get(pos.id);
    if (portClass) {
      sector.port = createPort(rng, pos.id, portClass);
    }

    state.sectors.set(String(pos.id), sector);
  }

  return state;
}
