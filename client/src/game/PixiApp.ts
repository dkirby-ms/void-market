/**
 * PixiApp — application entry point.
 * Initializes PixiJS 8, galaxy viewport, and the data-driven
 * galaxy renderer. Currently uses mock data (replaced by Colyseus
 * state sync in issue #31).
 */
import { Application } from "pixi.js";
import { Canvas } from "@void-market/shared";
import { GalaxyRenderer } from "./GalaxyRenderer.js";
import { createGalaxyViewport, resizeViewport } from "./GalaxyViewport.js";
import { generateMockGalaxy, generateMockShips } from "./mockGalaxyData.js";

export async function initPixiApp(
  container: HTMLElement,
): Promise<Application> {
  const app = new Application();

  await app.init({
    background: Canvas.background,
    resizeTo: container,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(app.canvas);

  // Generate mock galaxy data (temporary — issue #31 replaces with Colyseus)
  const galaxyData = generateMockGalaxy();

  // Build the galaxy renderer
  const galaxyRenderer = new GalaxyRenderer((sectorId) => {
    console.log(`[GalaxyMap] Sector ${sectorId} clicked`);
  });
  galaxyRenderer.setGalaxyData(galaxyData);

  // Add mock ships for visual testing
  const mockShips = generateMockShips(galaxyData);
  galaxyRenderer.addShips(mockShips);

  // Drive ship animations on each frame
  app.ticker.add((ticker) => {
    galaxyRenderer.update(ticker.deltaMS / 1000);
  });

  // Demo: animate the local player's ship between sectors every 3 seconds
  let moveIndex = 0;
  const demoSectors = [1, 42, 100, 250, 1];
  setInterval(() => {
    moveIndex = (moveIndex + 1) % demoSectors.length;
    const nextSector = demoSectors[moveIndex];
    galaxyRenderer.shipManager.moveShip("local-player", nextSector);
    console.log(`[ShipDemo] Moving local player to sector ${nextSector}`);
  }, 3000);

  // Compute galaxy extent for viewport sizing
  const extent = galaxyRenderer.getGalaxyExtent();
  const worldWidth = extent.maxX - extent.minX;
  const worldHeight = extent.maxY - extent.minY;

  // Find starting sector position for initial camera center
  const startSector = galaxyData.sectors.get(galaxyData.currentSectorId);
  const centerX = startSector?.x ?? 0;
  const centerY = startSector?.y ?? 0;

  // Create the pixi-viewport for pan/zoom camera
  const viewport = createGalaxyViewport(app, {
    worldWidth,
    worldHeight,
    centerX,
    centerY,
  });

  viewport.addChild(galaxyRenderer);
  app.stage.addChild(viewport);

  // Handle container resize
  const resizeObserver = new ResizeObserver(() => {
    resizeViewport(viewport, app.screen.width, app.screen.height);
  });
  resizeObserver.observe(container);

  return app;
}
