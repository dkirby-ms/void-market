/**
 * useGameState — React hook bridging Colyseus room state into React.
 *
 * Subscribes to room lifecycle and player/sector schema changes,
 * returning plain-data snapshots that trigger React re-renders.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import type { Room } from "colyseus.js";
import type {
  GalaxyState,
  PlayerSchema,
  SectorSchema,
  PortSchema,
  CommoditySchema,
} from "@void-market/shared";
import {
  subscribeToRoom,
  subscribeToStatus,
  type ConnectionStatus,
} from "../network/client.js";
import type { SectorData, PortData } from "../game/mockGalaxyData.js";

// ── Plain data snapshots for React ──────────────────────────────────────────

export interface PlayerSnapshot {
  playerId: string;
  displayName: string;
  credits: number;
  turnsRemaining: number;
  turnsMax: number;
  currentSectorId: number;
  isDocked: boolean;
  cargoHolds: number;
  maxCargoHolds: number;
}

export interface CommoditySnapshot {
  commodity: string;
  stock: number;
  maxStock: number;
  buyPrice: number;
  sellPrice: number;
  portBuys: boolean;
}

export interface PortSnapshot extends PortData {
  sectorId: number;
  commodities: CommoditySnapshot[];
}

export interface SectorSnapshot extends SectorData {
  portDetail: PortSnapshot | undefined;
}

export interface GameState {
  currentPlayer: PlayerSnapshot | null;
  currentSector: SectorSnapshot | null;
  sectors: Map<number, SectorSnapshot>;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
}

// ── Schema → snapshot converters ────────────────────────────────────────────

function playerToSnapshot(p: PlayerSchema): PlayerSnapshot {
  return {
    playerId: p.playerId,
    displayName: p.displayName,
    credits: p.credits,
    turnsRemaining: p.turnsRemaining,
    turnsMax: p.turnsMax,
    currentSectorId: p.currentSectorId,
    isDocked: p.isDocked,
    cargoHolds: p.ship.cargoHolds,
    maxCargoHolds: p.ship.maxCargoHolds,
  };
}

function portToSnapshot(port: PortSchema): PortSnapshot {
  const commodities: CommoditySnapshot[] = [];
  (
    port.commodities as unknown as {
      forEach(cb: (v: CommoditySchema, k: string) => void): void;
    }
  ).forEach((c: CommoditySchema) => {
    commodities.push({
      commodity: c.commodity,
      stock: c.stock,
      maxStock: c.maxStock,
      buyPrice: c.buyPrice,
      sellPrice: c.sellPrice,
      portBuys: c.portBuys,
    });
  });
  return {
    portId: port.portId,
    name: port.name,
    portClass: port.portClass,
    sectorId: port.sectorId,
    commodities,
  };
}

function sectorToSnapshot(sector: SectorSchema): SectorSnapshot {
  return {
    sectorId: sector.sectorId,
    x: sector.x,
    y: sector.y,
    warps: [...sector.warps],
    port: sector.port
      ? {
          portId: sector.port.portId,
          name: sector.port.name,
          portClass: sector.port.portClass,
        }
      : undefined,
    playerIds: [...sector.playerIds],
    portDetail: sector.port ? portToSnapshot(sector.port) : undefined,
  };
}

// ── Minimal typed wrappers for Colyseus MapSchema ───────────────────────────

interface SchemaMap<V> {
  onAdd(
    cb: (item: V, key: string) => void,
    triggerAll?: boolean,
  ): () => boolean;
  onRemove(cb: (item: V, key: string) => void): () => boolean;
  onChange(cb: (item: V, key: string) => void): () => boolean;
  get(key: string): V | undefined;
  forEach(cb: (item: V, key: string) => void): void;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useGameState(): GameState {
  const [state, setState] = useState<GameState>({
    currentPlayer: null,
    currentSector: null,
    sectors: new Map(),
    isConnected: false,
    connectionStatus: "disconnected",
    sessionId: null,
  });

  // Mutable ref to avoid stale closures in Colyseus callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback(
    (patch: Partial<GameState>) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  useEffect(() => {
    const detach: (() => void)[] = [];

    // Connection status subscription
    detach.push(
      subscribeToStatus((status) => {
        update({
          isConnected: status === "connected",
          connectionStatus: status,
        });
      }),
    );

    // Room subscription — fires when room is (re)established
    detach.push(
      subscribeToRoom((room: Room<GalaxyState>) => {
        const sectors =
          room.state.sectors as unknown as SchemaMap<SectorSchema>;
        const players =
          room.state.players as unknown as SchemaMap<PlayerSchema>;

        const sectorMap = new Map<number, SectorSnapshot>();

        /** Re-derive currentSector / currentPlayer from latest data */
        const refresh = () => {
          const localPlayer = players.get(room.sessionId);
          const playerSnap = localPlayer
            ? playerToSnapshot(localPlayer)
            : null;
          const currentSector = playerSnap
            ? sectorMap.get(playerSnap.currentSectorId) ?? null
            : null;

          update({
            currentPlayer: playerSnap,
            currentSector: currentSector,
            sectors: new Map(sectorMap),
            sessionId: room.sessionId,
          });
        };

        // Sectors
        const detachSectorAdd = sectors.onAdd((sector) => {
          sectorMap.set(sector.sectorId, sectorToSnapshot(sector));
          refresh();
        }, true);
        detach.push(detachSectorAdd as unknown as () => void);

        const detachSectorChange = sectors.onChange((sector) => {
          sectorMap.set(sector.sectorId, sectorToSnapshot(sector));
          refresh();
        });
        detach.push(detachSectorChange as unknown as () => void);

        const detachSectorRemove = sectors.onRemove((_s, key) => {
          sectorMap.delete(Number(key));
          refresh();
        });
        detach.push(detachSectorRemove as unknown as () => void);

        // Players
        const detachPlayerAdd = players.onAdd(() => {
          refresh();
        });
        detach.push(detachPlayerAdd as unknown as () => void);

        const detachPlayerChange = players.onChange(() => {
          refresh();
        });
        detach.push(detachPlayerChange as unknown as () => void);

        const detachPlayerRemove = players.onRemove(() => {
          refresh();
        });
        detach.push(detachPlayerRemove as unknown as () => void);

        // Initial hydration
        refresh();
      }),
    );

    return () => {
      for (const d of detach) d();
    };
  }, [update]);

  return state;
}
