/**
 * SectorNode — individual sector visual on the galaxy map.
 * Renders as a procedural circle with hover/selected states,
 * tooltip, and click handler for future navigation.
 */
import { Container, Graphics, Text } from "pixi.js";
import {
  Canvas,
  Semantic,
  Resource,
  Player,
  Neutral,
  Alpha,
  FontSize,
  FontFamily,
  FontWeight,
} from "@void-market/shared";
import type { SectorData } from "./mockGalaxyData.js";

const BASE_RADIUS = 6;
const PORT_RADIUS = 9;
const CURRENT_SECTOR_RADIUS = 12;
const HOVER_EXPAND = 3;
const GLOW_RADIUS_EXTRA = 8;

export type SectorClickHandler = (sectorId: number) => void;

export class SectorNode extends Container {
  private bg: Graphics;
  private glow: Graphics;
  private tooltip: Container;
  private tooltipBg: Graphics;
  private tooltipText: Text;
  private _isHovered = false;
  private sectorData: SectorData;
  private isCurrent: boolean;
  private hasLocalPlayer: boolean;
  private onClick: SectorClickHandler | undefined;

  constructor(
    sector: SectorData,
    isCurrent: boolean,
    hasLocalPlayer: boolean,
    onClick?: SectorClickHandler,
  ) {
    super();
    this.sectorData = sector;
    this.isCurrent = isCurrent;
    this.hasLocalPlayer = hasLocalPlayer;
    this.onClick = onClick;

    this.position.set(sector.x, sector.y);
    this.eventMode = "static";
    this.cursor = "pointer";

    // Glow layer (behind main circle)
    this.glow = new Graphics();
    this.glow.visible = false;
    this.addChild(this.glow);

    // Main circle
    this.bg = new Graphics();
    this.addChild(this.bg);

    // Tooltip container (hidden by default)
    this.tooltip = new Container();
    this.tooltip.visible = false;
    this.tooltipBg = new Graphics();
    this.tooltipText = new Text({
      text: "",
      style: {
        fontFamily: FontFamily.mono,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        fill: Neutral.zinc100,
      },
    });
    this.tooltip.addChild(this.tooltipBg);
    this.tooltip.addChild(this.tooltipText);
    this.addChild(this.tooltip);

    this.draw();
    this.setupInteraction();
  }

  private getRadius(): number {
    if (this.isCurrent) return CURRENT_SECTOR_RADIUS;
    if (this.sectorData.port) return PORT_RADIUS;
    return BASE_RADIUS;
  }

  private getFillColor(): number {
    if (this.isCurrent) return Semantic.primary;
    if (this.hasLocalPlayer) return Player.player1;
    if (this.sectorData.playerIds.length > 0) return Semantic.warning;
    if (this.sectorData.port) {
      return this.getPortColor(this.sectorData.port.portClass);
    }
    return Canvas.sectorNeutral;
  }

  private getPortColor(portClass: string): number {
    // Color by what the port primarily trades
    if (portClass.startsWith("S")) return Resource.fuelOre400;
    if (portClass.charAt(1) === "S") return Resource.organics400;
    return Resource.equipment400;
  }

  private draw(): void {
    const radius = this.getRadius() + (this._isHovered ? HOVER_EXPAND : 0);
    const color = this.getFillColor();

    this.bg.clear();
    this.bg.circle(0, 0, radius);
    this.bg.fill({ color });

    if (this._isHovered || this.isCurrent) {
      this.bg.circle(0, 0, radius);
      this.bg.stroke({
        color: Canvas.sectorHover,
        width: this._isHovered ? 2 : 1.5,
        alpha: Alpha.hoverBorder,
      });
    }

    // Glow for current sector and hovered
    if (this.isCurrent || this._isHovered) {
      this.glow.clear();
      this.glow.circle(0, 0, radius + GLOW_RADIUS_EXTRA);
      this.glow.fill({
        color: this.isCurrent ? Semantic.primary : Canvas.sectorHover,
        alpha: Alpha.controlledGlow,
      });
      this.glow.visible = true;
    } else {
      this.glow.visible = false;
    }

    // Expand hit area for easier clicking
    const hitRadius = Math.max(radius + 8, 14);
    const hitArea = new Graphics();
    hitArea.circle(0, 0, hitRadius);
    hitArea.fill({ color: 0x000000, alpha: 0.001 });
    this.hitArea = {
      contains: (x: number, y: number) => x * x + y * y <= hitRadius * hitRadius,
    };
  }

  private setupInteraction(): void {
    this.on("pointerover", () => { this.onPointerOver(); });
    this.on("pointerout", () => { this.onPointerOut(); });
    this.on("pointertap", () => { this.onTap(); });
  }

  private onPointerOver(): void {
    this._isHovered = true;
    this.draw();
    this.showTooltip();
  }

  private onPointerOut(): void {
    this._isHovered = false;
    this.draw();
    this.hideTooltip();
  }

  private onTap(): void {
    this.onClick?.(this.sectorData.sectorId);
  }

  private showTooltip(): void {
    const lines: string[] = [`Sector ${this.sectorData.sectorId}`];
    if (this.sectorData.port) {
      lines.push(
        `Port: ${this.sectorData.port.name} [${this.sectorData.port.portClass}]`,
      );
    }
    if (this.sectorData.playerIds.length > 0) {
      lines.push(`Players: ${this.sectorData.playerIds.length}`);
    }
    lines.push(`Warps: ${this.sectorData.warps.length}`);

    this.tooltipText.text = lines.join("\n");
    const bounds = this.tooltipText.getBounds();
    const pad = 6;

    this.tooltipBg.clear();
    this.tooltipBg.roundRect(
      -pad,
      -pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
      4,
    );
    this.tooltipBg.fill({ color: Neutral.zinc900, alpha: 0.92 });
    this.tooltipBg.stroke({ color: Neutral.zinc700, width: 1 });

    this.tooltip.position.set(
      this.getRadius() + 12,
      -bounds.height / 2,
    );
    this.tooltip.visible = true;
  }

  private hideTooltip(): void {
    this.tooltip.visible = false;
  }

  /** Update sector data and redraw (for live Colyseus updates). */
  update(
    sector: SectorData,
    isCurrent: boolean,
    hasLocalPlayer: boolean,
  ): void {
    this.sectorData = sector;
    this.isCurrent = isCurrent;
    this.hasLocalPlayer = hasLocalPlayer;
    this.draw();
  }
}
