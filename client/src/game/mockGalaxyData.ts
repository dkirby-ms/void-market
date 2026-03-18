/**
 * Temporary mock galaxy data generator.
 * Produces 500 sectors with random positions, warps, and ports
 * for client-side development. Will be replaced by Colyseus state
 * sync from GalaxyRoom (issue #31).
 */

/** Plain data interface mirroring SectorSchema for rendering. */
export interface SectorData {
  sectorId: number;
  x: number;
  y: number;
  warps: number[];
  port: PortData | undefined;
  playerIds: string[];
}

export interface PortData {
  portId: string;
  name: string;
  portClass: string;
}

export interface GalaxyData {
  sectors: Map<number, SectorData>;
  currentPlayerId: string;
  currentSectorId: number;
}

/** Ship placement data used by ShipManager. */
export interface MockShipData {
  playerId: string;
  displayName: string;
  sectorId: number;
  isLocal: boolean;
}

const SECTOR_COUNT = 500;
const PORT_PROBABILITY = 0.4;
const MIN_WARPS = 1;
const MAX_WARPS = 4;
const GALAXY_RADIUS = 4000;
const PORT_CLASSES = ["BBS", "BSB", "SBB", "SSB", "SBS", "BSS", "SSS", "BBB"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate 500 sectors in a spiral galaxy layout. */
export function generateMockGalaxy(): GalaxyData {
  const rng = seededRandom(42);
  const sectors = new Map<number, SectorData>();

  // Place sectors in a loose spiral / disc formation
  for (let i = 1; i <= SECTOR_COUNT; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = Math.sqrt(rng()) * GALAXY_RADIUS;
    const jitterX = (rng() - 0.5) * 120;
    const jitterY = (rng() - 0.5) * 120;

    const hasPort = rng() < PORT_PROBABILITY;
    const portClass = PORT_CLASSES[Math.floor(rng() * PORT_CLASSES.length)];

    sectors.set(i, {
      sectorId: i,
      x: Math.cos(angle) * dist + jitterX,
      y: Math.sin(angle) * dist + jitterY,
      warps: [],
      port: hasPort
        ? { portId: `port-${i}`, name: `Port ${i}`, portClass }
        : undefined,
      playerIds: [],
    });
  }

  // Build warp connections using nearest-neighbor + random links
  const sectorList = [...sectors.values()];
  for (const sector of sectorList) {
    if (sector.warps.length >= MAX_WARPS) continue;

    // Sort others by distance, pick nearest few
    const others = sectorList
      .filter((s) => s.sectorId !== sector.sectorId)
      .map((s) => ({
        id: s.sectorId,
        dist: Math.hypot(s.x - sector.x, s.y - sector.y),
      }))
      .sort((a, b) => a.dist - b.dist);

    const warpCount =
      MIN_WARPS + Math.floor(rng() * (MAX_WARPS - MIN_WARPS + 1));
    const targetCount = Math.min(warpCount, others.length);

    for (let w = 0; w < targetCount; w++) {
      const target = others[w];
      if (
        !sector.warps.includes(target.id) &&
        sector.warps.length < MAX_WARPS
      ) {
        sector.warps.push(target.id);
        // Bidirectional
        const targetSector = sectors.get(target.id);
        if (!targetSector) continue;
        if (
          !targetSector.warps.includes(sector.sectorId) &&
          targetSector.warps.length < MAX_WARPS
        ) {
          targetSector.warps.push(sector.sectorId);
        }
      }
    }
  }

  // Place a mock player in sector 1
  const startSector = sectors.get(1);
  if (startSector) {
    startSector.playerIds.push("local-player");
  }

  // Scatter a few other players for visual testing
  const otherPlayers = [42, 100, 250, 400];
  for (const sid of otherPlayers) {
    const s = sectors.get(sid);
    if (s) s.playerIds.push(`npc-${sid}`);
  }

  return {
    sectors,
    currentPlayerId: "local-player",
    currentSectorId: 1,
  };
}

/**
 * Generate mock ship placements matching the players scattered
 * through the mock galaxy. Returns data consumed by ShipManager.
 */
export function generateMockShips(galaxyData: GalaxyData): MockShipData[] {
  return [
    {
      playerId: "local-player",
      displayName: "You",
      sectorId: galaxyData.currentSectorId,
      isLocal: true,
    },
    {
      playerId: "npc-42",
      displayName: "Trader Zara",
      sectorId: 42,
      isLocal: false,
    },
    {
      playerId: "npc-100",
      displayName: "Capt. Orion",
      sectorId: 100,
      isLocal: false,
    },
    {
      playerId: "npc-250",
      displayName: "Drifter Rex",
      sectorId: 250,
      isLocal: false,
    },
    {
      playerId: "npc-400",
      displayName: "Smuggler Kai",
      sectorId: 400,
      isLocal: false,
    },
  ];
}
