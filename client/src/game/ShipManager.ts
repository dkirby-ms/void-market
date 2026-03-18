/**
 * ShipManager — manages all ship sprites on the galaxy map.
 * Handles adding/removing ships as players join/leave, positioning
 * ships at their sector coordinates, and lerp-animated movement.
 */
import { Container } from "pixi.js";
import { ShipSprite } from "./ShipSprite.js";
import type { GalaxyData } from "./mockGalaxyData.js";

const LERP_DURATION_SECONDS = 0.6;

interface ShipEntry {
  sprite: ShipSprite;
  sectorId: number;
  // Lerp animation state
  animating: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  elapsed: number;
  duration: number;
}

export interface ShipData {
  playerId: string;
  displayName: string;
  sectorId: number;
  isLocal: boolean;
}

export class ShipManager {
  /** Ship sprites container — add to GalaxyRenderer as a layer. */
  readonly container: Container;

  private ships = new Map<string, ShipEntry>();
  private galaxyData: GalaxyData | undefined;
  private colorCounter = 0;

  constructor() {
    this.container = new Container();
    this.container.label = "ships";
  }

  /** Provide galaxy data so the manager can resolve sector positions. */
  setGalaxyData(data: GalaxyData): void {
    this.galaxyData = data;
  }

  /** Add a ship to the map. */
  addShip(data: ShipData): void {
    if (this.ships.has(data.playerId)) return;

    const sprite = new ShipSprite({
      playerId: data.playerId,
      displayName: data.displayName,
      isLocal: data.isLocal,
      colorIndex: data.isLocal ? undefined : this.colorCounter++,
    });

    const pos = this.getSectorPosition(data.sectorId);
    sprite.position.set(pos.x, pos.y);

    const entry: ShipEntry = {
      sprite,
      sectorId: data.sectorId,
      animating: false,
      fromX: pos.x,
      fromY: pos.y,
      toX: pos.x,
      toY: pos.y,
      elapsed: 0,
      duration: LERP_DURATION_SECONDS,
    };

    this.ships.set(data.playerId, entry);
    this.container.addChild(sprite);
  }

  /** Remove a ship when a player leaves. */
  removeShip(playerId: string): void {
    const entry = this.ships.get(playerId);
    if (!entry) return;

    this.container.removeChild(entry.sprite);
    entry.sprite.destroy({ children: true });
    this.ships.delete(playerId);
  }

  /**
   * Move a ship to a new sector with lerp animation.
   * If the ship is already animating, the new target replaces
   * the current one from wherever the ship currently is.
   */
  moveShip(playerId: string, toSectorId: number): void {
    const entry = this.ships.get(playerId);
    if (!entry) return;

    const dest = this.getSectorPosition(toSectorId);
    const currentX = entry.sprite.position.x;
    const currentY = entry.sprite.position.y;

    entry.fromX = currentX;
    entry.fromY = currentY;
    entry.toX = dest.x;
    entry.toY = dest.y;
    entry.elapsed = 0;
    entry.duration = LERP_DURATION_SECONDS;
    entry.animating = true;
    entry.sectorId = toSectorId;
  }

  /**
   * Per-frame update — advances lerp animations and pulsing glow.
   * @param dtSeconds - delta time in seconds since last frame.
   */
  update(dtSeconds: number): void {
    for (const entry of this.ships.values()) {
      // Advance glow pulse
      entry.sprite.tick(dtSeconds);

      // Advance lerp animation
      if (entry.animating) {
        entry.elapsed += dtSeconds;
        const t = Math.min(entry.elapsed / entry.duration, 1);
        const eased = easeOutCubic(t);

        entry.sprite.position.set(
          lerp(entry.fromX, entry.toX, eased),
          lerp(entry.fromY, entry.toY, eased),
        );

        if (t >= 1) {
          entry.animating = false;
          entry.sprite.position.set(entry.toX, entry.toY);
        }
      }
    }
  }

  /** Teleport a ship instantly (no animation). */
  snapShip(playerId: string, sectorId: number): void {
    const entry = this.ships.get(playerId);
    if (!entry) return;

    const pos = this.getSectorPosition(sectorId);
    entry.sprite.position.set(pos.x, pos.y);
    entry.sectorId = sectorId;
    entry.animating = false;
  }

  /** Look up current sector id for a ship. */
  getShipSector(playerId: string): number | undefined {
    return this.ships.get(playerId)?.sectorId;
  }

  private getSectorPosition(sectorId: number): { x: number; y: number } {
    const sector = this.galaxyData?.sectors.get(sectorId);
    return { x: sector?.x ?? 0, y: sector?.y ?? 0 };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
