import { Application, Graphics } from "pixi.js";

const STAR_COUNT = 200;
const BG_COLOR = 0x09090b; // zinc-950

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

function generateStars(width: number, height: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.7 + 0.3,
  }));
}

export async function initPixiApp(container: HTMLElement): Promise<Application> {
  const app = new Application();

  await app.init({
    background: BG_COLOR,
    resizeTo: container,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(app.canvas);

  const stars = generateStars(app.screen.width, app.screen.height);
  const starGraphics = new Graphics();
  drawStars(starGraphics, stars);
  app.stage.addChild(starGraphics);

  // Subtle twinkle animation
  let elapsed = 0;
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaTime * 0.02;
    starGraphics.clear();
    for (const star of stars) {
      const flicker = 0.5 + 0.5 * Math.sin(elapsed + star.x * 0.01 + star.y * 0.01);
      const alpha = star.alpha * (0.6 + 0.4 * flicker);
      starGraphics.circle(star.x, star.y, star.radius);
      starGraphics.fill({ color: 0xfafafa, alpha });
    }
  });

  return app;
}

function drawStars(graphics: Graphics, stars: Star[]): void {
  for (const star of stars) {
    graphics.circle(star.x, star.y, star.radius);
    graphics.fill({ color: 0xfafafa, alpha: star.alpha });
  }
}
