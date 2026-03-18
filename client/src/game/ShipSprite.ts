/**
 * ShipSprite — individual player ship visual on the galaxy map.
 * Renders a triangular marker with color coding and optional pulsing
 * glow for the local player's ship.
 */
import { Container, Graphics, Text } from "pixi.js";
import {
  Player,
  Semantic,
  Canvas,
  Neutral,
  Alpha,
  FontFamily,
  FontSize,
  FontWeight,
} from "@void-market/shared";

const OWN_SHIP_SIZE = 10;
const OTHER_SHIP_SIZE = 7;
const GLOW_EXTRA = 10;
const GLOW_PULSE_SPEED = 2.5;
const GLOW_MIN_ALPHA = 0.08;
const GLOW_MAX_ALPHA = 0.28;

/** Ordered palette for assigning colors to other players. */
const PLAYER_COLORS: readonly number[] = [
  Player.player2,
  Player.player3,
  Player.player4,
  Player.player5,
  Player.player6,
];

export interface ShipSpriteOptions {
  playerId: string;
  displayName: string;
  isLocal: boolean;
  /** Index used to pick a color for non-local players. */
  colorIndex?: number;
}

export class ShipSprite extends Container {
  readonly playerId: string;
  readonly isLocal: boolean;

  private body: Graphics;
  private glow: Graphics;
  private label: Text;
  private glowElapsed = 0;

  constructor(options: ShipSpriteOptions) {
    super();
    this.playerId = options.playerId;
    this.isLocal = options.isLocal;
    this.cullable = true;

    // Glow layer behind the ship marker
    this.glow = new Graphics();
    this.glow.visible = options.isLocal;
    this.addChild(this.glow);

    // Ship body
    this.body = new Graphics();
    this.addChild(this.body);

    // Name label
    this.label = new Text({
      text: options.displayName,
      style: {
        fontFamily: FontFamily.mono,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        fill: Neutral.zinc300,
      },
    });
    this.label.anchor.set(0.5, 0);
    this.addChild(this.label);

    const color = this.pickColor(options);
    this.drawBody(color);
    this.drawGlow(color);
    this.positionLabel();
  }

  private pickColor(options: ShipSpriteOptions): number {
    if (options.isLocal) return Semantic.primary;
    const idx = (options.colorIndex ?? 0) % PLAYER_COLORS.length;
    return PLAYER_COLORS[idx];
  }

  /** Draw the triangular ship marker. */
  private drawBody(color: number): void {
    const s = this.isLocal ? OWN_SHIP_SIZE : OTHER_SHIP_SIZE;
    this.body.clear();

    // Upward-pointing triangle
    this.body.moveTo(0, -s);
    this.body.lineTo(s * 0.7, s * 0.6);
    this.body.lineTo(-s * 0.7, s * 0.6);
    this.body.closePath();
    this.body.fill({ color });

    this.body.moveTo(0, -s);
    this.body.lineTo(s * 0.7, s * 0.6);
    this.body.lineTo(-s * 0.7, s * 0.6);
    this.body.closePath();
    this.body.stroke({
      color: Canvas.sectorHover,
      width: this.isLocal ? 1.5 : 0.8,
      alpha: Alpha.hoverBorder,
    });
  }

  /** Draw the pulsing glow circle (local ship only). */
  private drawGlow(color: number): void {
    if (!this.isLocal) return;
    const glowR = OWN_SHIP_SIZE + GLOW_EXTRA;
    this.glow.clear();
    this.glow.circle(0, 0, glowR);
    this.glow.fill({ color, alpha: Alpha.controlledGlow });
  }

  private positionLabel(): void {
    const offset = (this.isLocal ? OWN_SHIP_SIZE : OTHER_SHIP_SIZE) + 8;
    this.label.position.set(0, offset);
  }

  /**
   * Tick update — drives the pulsing glow animation.
   * Call every frame with delta time in seconds.
   */
  tick(dtSeconds: number): void {
    if (!this.isLocal) return;

    this.glowElapsed += dtSeconds;
    const t = (Math.sin(this.glowElapsed * GLOW_PULSE_SPEED) + 1) / 2;
    this.glow.alpha = GLOW_MIN_ALPHA + t * (GLOW_MAX_ALPHA - GLOW_MIN_ALPHA);
  }
}
