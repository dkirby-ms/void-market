/**
 * StateSync — bridges Colyseus room state → PixiJS galaxy renderer.
 *
 * Subscribes to schema collection callbacks (sectors, players) and
 * converts Colyseus Schema objects into the plain-data interfaces
 * consumed by GalaxyRenderer and ShipManager.
 */
import type { Room } from "colyseus.js";
import type { GalaxyState, SectorSchema, PlayerSchema } from "@void-market/shared";
import type { GalaxyRenderer } from "../game/GalaxyRenderer.js";
import type { GalaxyData, SectorData, PortData } from "../game/mockGalaxyData.js";
import type { OptimisticMovement } from "./OptimisticMovement.js";

/**
 * Minimal typed interface for Colyseus MapSchema collections.
 * Needed because colyseus.js bundles @colyseus/schema v3 while the
 * shared package uses v4 — TypeScript can't reconcile the two, so we
 * define a small structural type that matches the runtime API.
 */
interface SchemaMap<V> {
  onAdd(cb: (item: V, key: string) => void, triggerAll?: boolean): () => boolean;
  onRemove(cb: (item: V, key: string) => void): () => boolean;
  onChange(cb: (item: V, key: string) => void): () => boolean;
  get(key: string): V | undefined;
  forEach(cb: (item: V, key: string) => void): void;
}

/** Push a schema listener's disposer (returns boolean) into our void-typed array. */
function pushDetach(arr: (() => void)[], detach: () => boolean): void {
  arr.push(detach as unknown as () => void);
}

export class StateSync {
  private room: Room<GalaxyState>;
  private renderer: GalaxyRenderer;
  private galaxyData: GalaxyData;
  private playerSectors = new Map<string, number>();
  private detachCallbacks: (() => void)[] = [];
  private initialized = false;
  private optimisticMovement: OptimisticMovement | null = null;
  private onInitialRender: (() => void) | null = null;

  constructor(
    room: Room<GalaxyState>,
    renderer: GalaxyRenderer,
    onInitialRender?: () => void,
  ) {
    this.room = room;
    this.renderer = renderer;
    this.onInitialRender = onInitialRender ?? null;

    this.galaxyData = {
      sectors: new Map(),
      currentPlayerId: room.sessionId,
      currentSectorId: 1,
    };

    this.setupListeners();
    this.performInitialRender();
    this.initialized = true;
  }

  /** Attach OptimisticMovement for move confirmation/rejection. */
  setOptimisticMovement(om: OptimisticMovement): void {
    this.optimisticMovement = om;
  }

  // ── Listener setup ───────────────────────────────────────────────────────

  private setupListeners(): void {
    const sectors = this.room.state.sectors as unknown as SchemaMap<SectorSchema>;
    const players = this.room.state.players as unknown as SchemaMap<PlayerSchema>;

    // Sector collection callbacks
    pushDetach(
      this.detachCallbacks,
      sectors.onAdd((sector: SectorSchema) => {
        const data = sectorToData(sector);
        this.galaxyData.sectors.set(sector.sectorId, data);
        if (this.initialized) {
          this.renderer.updateSector(data);
        }
      }, true), // triggerAll: process existing sectors immediately
    );

    pushDetach(
      this.detachCallbacks,
      sectors.onRemove((_sector: SectorSchema, key: string) => {
        this.galaxyData.sectors.delete(Number(key));
      }),
    );

    pushDetach(
      this.detachCallbacks,
      sectors.onChange((sector: SectorSchema) => {
        const data = sectorToData(sector);
        this.galaxyData.sectors.set(sector.sectorId, data);
        if (this.initialized) {
          this.renderer.updateSector(data);
        }
      }),
    );

    // Player collection callbacks (no triggerAll — handled in performInitialRender)
    pushDetach(
      this.detachCallbacks,
      players.onAdd((player: PlayerSchema, sessionId: string) => {
        if (!this.initialized) return;
        this.addPlayerShip(player, sessionId);
      }),
    );

    pushDetach(
      this.detachCallbacks,
      players.onRemove((_player: PlayerSchema, sessionId: string) => {
        this.renderer.shipManager.removeShip(sessionId);
        this.playerSectors.delete(sessionId);
      }),
    );

    pushDetach(
      this.detachCallbacks,
      players.onChange((player: PlayerSchema, sessionId: string) => {
        if (!this.initialized) return;
        this.handlePlayerChange(player, sessionId);
      }),
    );
  }

  // ── Initial render ───────────────────────────────────────────────────────

  private performInitialRender(): void {
    const players = this.room.state.players as unknown as SchemaMap<PlayerSchema>;
    const localPlayer = players.get(this.room.sessionId);
    if (localPlayer) {
      this.galaxyData.currentSectorId = localPlayer.currentSectorId;
    }

    this.renderer.setGalaxyData(this.galaxyData);

    // Add ship sprites for all existing players
    players.forEach((player: PlayerSchema, sessionId: string) => {
      this.addPlayerShip(player, sessionId);
    });

    this.onInitialRender?.();
  }

  // ── Player change handling ───────────────────────────────────────────────

  private addPlayerShip(player: PlayerSchema, sessionId: string): void {
    const isLocal = sessionId === this.room.sessionId;
    this.renderer.shipManager.addShip({
      playerId: sessionId,
      displayName: player.displayName,
      sectorId: player.currentSectorId,
      isLocal,
    });
    this.playerSectors.set(sessionId, player.currentSectorId);
  }

  private handlePlayerChange(player: PlayerSchema, sessionId: string): void {
    const prevSector = this.playerSectors.get(sessionId);
    if (prevSector === undefined || prevSector === player.currentSectorId) {
      return; // No movement — ignore other property changes
    }

    const isLocal = sessionId === this.room.sessionId;

    // Optimistic movement reconciliation for the local player
    if (isLocal && this.optimisticMovement?.confirmMove(player.currentSectorId)) {
      // Prediction was correct — ship already animating, just update bookkeeping
      this.playerSectors.set(sessionId, player.currentSectorId);
      this.renderer.setCurrentSector(player.currentSectorId);
      this.galaxyData.currentSectorId = player.currentSectorId;
      return;
    }

    // Standard (non-optimistic) movement
    if (isLocal) {
      this.renderer.setCurrentSector(player.currentSectorId);
      this.galaxyData.currentSectorId = player.currentSectorId;
    }

    this.renderer.shipManager.moveShip(sessionId, player.currentSectorId);
    this.playerSectors.set(sessionId, player.currentSectorId);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  dispose(): void {
    for (const detach of this.detachCallbacks) {
      detach();
    }
    this.detachCallbacks = [];
    this.optimisticMovement = null;
  }
}

// ── Schema → plain data conversion ──────────────────────────────────────────

function sectorToData(sector: SectorSchema): SectorData {
  const port: PortData | undefined = sector.port
    ? {
        portId: sector.port.portId,
        name: sector.port.name,
        portClass: sector.port.portClass,
      }
    : undefined;

  return {
    sectorId: sector.sectorId,
    x: sector.x,
    y: sector.y,
    warps: [...sector.warps],
    port,
    playerIds: [...sector.playerIds],
  };
}
