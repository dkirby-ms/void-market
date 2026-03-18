/**
 * GalaxyRenderer — data-driven galaxy map renderer.
 * Accepts GalaxyData, renders sectors as interactive nodes and
 * warp connections as lines. Designed for 60 FPS at 500 sectors
 * using container culling.
 */
import { Container, Graphics } from "pixi.js";
import { Canvas, Alpha } from "@void-market/shared";
import { SectorNode, type SectorClickHandler } from "./SectorNode.js";
import type { GalaxyData, SectorData } from "./mockGalaxyData.js";

export class GalaxyRenderer extends Container {
  private warpGraphics: Graphics;
  private sectorNodes = new Map<number, SectorNode>();
  private galaxyData: GalaxyData | undefined;
  private onSectorClick: SectorClickHandler | undefined;

  constructor(onSectorClick?: SectorClickHandler) {
    super();
    this.onSectorClick = onSectorClick;

    // Warp lines layer (drawn behind sector nodes)
    this.warpGraphics = new Graphics();
    this.addChild(this.warpGraphics);

    // Enable culling so off-screen children skip rendering
    this.cullable = true;
    this.cullableChildren = true;
  }

  /** Render or re-render the full galaxy from data. */
  setGalaxyData(data: GalaxyData): void {
    this.galaxyData = data;
    this.rebuildAll();
  }

  /** Full rebuild — clears and redraws everything. */
  private rebuildAll(): void {
    if (!this.galaxyData) return;

    // Clear existing sector nodes
    for (const node of this.sectorNodes.values()) {
      node.destroy({ children: true });
    }
    this.sectorNodes.clear();

    // Draw warp connections
    this.drawWarps(this.galaxyData.sectors);

    // Create sector nodes
    for (const sector of this.galaxyData.sectors.values()) {
      this.addSectorNode(sector);
    }
  }

  private drawWarps(sectors: Map<number, SectorData>): void {
    this.warpGraphics.clear();

    // Track drawn edges to avoid duplicate lines
    const drawn = new Set<string>();

    for (const sector of sectors.values()) {
      for (const targetId of sector.warps) {
        const edgeKey = `${Math.min(sector.sectorId, targetId)}-${Math.max(sector.sectorId, targetId)}`;
        if (drawn.has(edgeKey)) continue;
        drawn.add(edgeKey);

        const target = sectors.get(targetId);
        if (!target) continue;

        this.warpGraphics.moveTo(sector.x, sector.y);
        this.warpGraphics.lineTo(target.x, target.y);
      }
    }

    this.warpGraphics.stroke({
      color: Canvas.warpRoute,
      width: 1,
      alpha: Alpha.warpRoute,
    });
  }

  private addSectorNode(sector: SectorData): void {
    if (!this.galaxyData) return;

    const isCurrent = sector.sectorId === this.galaxyData.currentSectorId;
    const hasLocalPlayer = sector.playerIds.includes(
      this.galaxyData.currentPlayerId,
    );

    const node = new SectorNode(
      sector,
      isCurrent,
      hasLocalPlayer,
      this.onSectorClick,
    );
    node.cullable = true;
    this.sectorNodes.set(sector.sectorId, node);
    this.addChild(node);
  }

  /** Update a single sector in-place (for Colyseus delta updates). */
  updateSector(sector: SectorData): void {
    if (!this.galaxyData) return;

    const existing = this.sectorNodes.get(sector.sectorId);
    if (existing) {
      const isCurrent = sector.sectorId === this.galaxyData.currentSectorId;
      const hasLocalPlayer = sector.playerIds.includes(
        this.galaxyData.currentPlayerId,
      );
      existing.update(sector, isCurrent, hasLocalPlayer);
    }
  }

  /** Update which sector is the current player's location. */
  setCurrentSector(sectorId: number): void {
    if (!this.galaxyData) return;
    const prevId = this.galaxyData.currentSectorId;
    this.galaxyData.currentSectorId = sectorId;

    // Refresh old and new current sector nodes
    const prevSector = this.galaxyData.sectors.get(prevId);
    const newSector = this.galaxyData.sectors.get(sectorId);
    if (prevSector) this.updateSector(prevSector);
    if (newSector) this.updateSector(newSector);
  }

  /** Get the bounds extent of the galaxy (for viewport sizing). */
  getGalaxyExtent(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (!this.galaxyData) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const s of this.galaxyData.sectors.values()) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }

    const padding = 200;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    };
  }
}
