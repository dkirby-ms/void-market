/**
 * GalaxyViewport — pixi-viewport wrapper for galaxy map camera.
 * Provides drag-to-pan, scroll-to-zoom, zoom limits, and
 * smooth zoom animation.
 */
import { Application } from "pixi.js";
import { Viewport } from "pixi-viewport";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 3;
const INITIAL_ZOOM = 0.15;

export interface ViewportOptions {
  /** World width in pixels (galaxy extent). */
  worldWidth: number;
  /** World height in pixels (galaxy extent). */
  worldHeight: number;
  /** Initial center x coordinate. */
  centerX?: number;
  /** Initial center y coordinate. */
  centerY?: number;
}

export function createGalaxyViewport(
  app: Application,
  options: ViewportOptions,
): Viewport {
  const viewport = new Viewport({
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    worldWidth: options.worldWidth,
    worldHeight: options.worldHeight,
    events: app.renderer.events,
  });

  viewport
    .drag()
    .pinch()
    .wheel({ smooth: 5 })
    .decelerate({ friction: 0.92 })
    .clampZoom({ minScale: MIN_ZOOM, maxScale: MAX_ZOOM });

  // Set initial zoom and center
  viewport.setZoom(INITIAL_ZOOM, true);

  const cx = options.centerX ?? 0;
  const cy = options.centerY ?? 0;
  viewport.moveCenter(cx, cy);

  return viewport;
}

/** Update viewport screen size on container resize. */
export function resizeViewport(
  viewport: Viewport,
  width: number,
  height: number,
): void {
  viewport.resize(width, height);
}
