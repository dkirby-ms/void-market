/**
 * PixiApp — application entry point.
 * Initializes PixiJS 8, galaxy viewport, and the data-driven
 * galaxy renderer. The renderer starts empty — StateSync populates
 * it once the Colyseus room state arrives.
 */
import { Application } from "pixi.js";
import { Canvas } from "@void-market/shared";
import { GalaxyRenderer } from "./GalaxyRenderer.js";
import { createGalaxyViewport, resizeViewport } from "./GalaxyViewport.js";
import type { Viewport } from "pixi-viewport";
import type { SectorClickHandler } from "./SectorNode.js";

/** Handle returned by initPixiApp for external wiring. */
export interface PixiAppHandle {
  app: Application;
  galaxyRenderer: GalaxyRenderer;
  /** Replace the sector-click callback (used to wire OptimisticMovement). */
  setSectorClickHandler: (handler: SectorClickHandler) => void;
  /** Re-center the viewport camera on the given world coordinates. */
  recenterViewport: (cx: number, cy: number) => void;
  /** Access the underlying viewport for resizing. */
  viewport: Viewport;
}

const DEFAULT_WORLD_SIZE = 10_000;

export async function initPixiApp(
  container: HTMLElement,
): Promise<PixiAppHandle> {
  const app = new Application();

  await app.init({
    background: Canvas.background,
    resizeTo: container,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(app.canvas);

  // Mutable click handler — updated after OptimisticMovement is created
  let sectorClickHandler: SectorClickHandler | undefined;

  const galaxyRenderer = new GalaxyRenderer((sectorId) => {
    sectorClickHandler?.(sectorId);
  });

  // Drive ship animations each frame
  app.ticker.add((ticker) => {
    galaxyRenderer.update(ticker.deltaMS / 1000);
  });

  // Create viewport with generous defaults (resized when galaxy data arrives)
  const viewport = createGalaxyViewport(app, {
    worldWidth: DEFAULT_WORLD_SIZE,
    worldHeight: DEFAULT_WORLD_SIZE,
    centerX: 0,
    centerY: 0,
  });

  viewport.addChild(galaxyRenderer);
  app.stage.addChild(viewport);

  const resizeObserver = new ResizeObserver(() => {
    resizeViewport(viewport, app.screen.width, app.screen.height);
  });
  resizeObserver.observe(container);

  return {
    app,
    galaxyRenderer,
    setSectorClickHandler: (handler) => {
      sectorClickHandler = handler;
    },
    recenterViewport: (cx, cy) => {
      viewport.moveCenter(cx, cy);
    },
    viewport,
  };
}
