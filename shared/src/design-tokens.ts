/**
 * Design tokens for Void Market.
 *
 * Single source of truth for visual constants consumed by PixiJS (hex numbers)
 * and any non-CSS rendering context. CSS custom properties live in
 * client/src/index.css — keep names aligned when updating either file.
 *
 * @see docs/DESIGN-TOKENS.md  — quick-reference mapping
 * @see docs/DESIGN-SYSTEM.md  — full design system specification
 */

// ── Color Palette (0xRRGGBB for PixiJS) ────────────────────────────────────

/** Core neutral palette — zinc scale used throughout the UI. */
export const Neutral = {
  zinc950: 0x0a0a0b,
  zinc900: 0x18181b,
  zinc800: 0x27272a,
  zinc700: 0x3f3f46,
  zinc600: 0x52525b,
  zinc500: 0x71717a,
  zinc400: 0xa1a1aa,
  zinc300: 0xd4d4d8,
  zinc200: 0xe4e4e7,
  zinc100: 0xf4f4f5,
  white: 0xffffff,
} as const;

/** Semantic role colors applied by context, not hue. */
export const Semantic = {
  /** Violet-500 — primary accent, links, interactive highlights. */
  primary: 0x8b5cf6,
  /** Violet-400 — lighter accent for hover/active states, canvas highlights. */
  primaryLight: 0xa78bfa,
  /** Violet-600 — darker accent for pressed states. */
  primaryDark: 0x7c3aed,

  /** Green-500 — success, online, sufficient resources. */
  success: 0x22c55e,
  /** Amber-500 — warning, caution, medium-level alerts. */
  warning: 0xf59e0b,
  /** Red-500 — danger, critical, destructive actions. */
  danger: 0xef4444,

  /** Info alias — same as primary for informational callouts. */
  info: 0x8b5cf6,
} as const;

/**
 * Commodity / resource colors.
 *
 * Each commodity gets a 400 (light) and 500 (standard) shade.
 * Hues chosen for maximum colorblind distinguishability:
 *   amber (warm) · emerald (green) · sky (cool blue)
 */
export const Resource = {
  fuelOre400: 0xfbbf24,
  fuelOre500: 0xf59e0b,
  organics400: 0x34d399,
  organics500: 0x10b981,
  equipment400: 0x38bdf8,
  equipment500: 0x0ea5e9,
  /** Credits currency — gold/yellow. */
  credits400: 0xfacc15,
  credits500: 0xeab308,
  /** Exotic Matter — late-game rare resource. */
  exotic400: 0xc084fc,
  exotic500: 0xa855f7,
} as const;

/**
 * Player / faction identification colors.
 *
 * Distinct hues pass the Coblis CVD simulator for deuteranopia,
 * protanopia, and tritanopia at ≥ 3:1 contrast on zinc-950.
 */
export const Player = {
  player1: 0xef4444, // red-500 (you / self)
  player2: 0x3b82f6, // blue-500
  player3: 0x22c55e, // green-500
  player4: 0xf59e0b, // amber-500
  player5: 0xa855f7, // purple-500
  player6: 0x06b6d4, // cyan-500
  neutral: 0x3f3f46, // zinc-700
} as const;

/** Chart / data-visualization palette (matches CSS --chart-* variables). */
export const Chart = {
  chart1: 0x8b5cf6, // violet-500
  chart2: 0x4ade80, // green-400
  chart3: 0xfacc15, // yellow-400
  chart4: 0xec4899, // pink-500
  chart5: 0xf97316, // orange-500
} as const;

/** Galaxy map canvas-specific colors. */
export const Canvas = {
  background: 0x0a0a0b,
  /** Star field point color (rendered at ~30 % alpha). */
  starfield: 0xffffff,
  /** Warp-route line color (rendered at ~20 % alpha). */
  warpRoute: 0x8b5cf6,
  /** Hovered sector stroke. */
  sectorHover: 0xa78bfa,
  /** Default sector fill (unclaimed). */
  sectorNeutral: 0x3f3f46,
  /** Homeworld planet marker. */
  homeworld: 0xf59e0b,
  /** Fleet triangle indicator. */
  fleet: 0xa78bfa,
  /** Sector label text. */
  sectorLabel: 0xffffff,
} as const;

// ── Typography ──────────────────────────────────────────────────────────────

/** Font size scale in pixels (6-tier per DESIGN-SYSTEM.md §2.2). */
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

/** Font weight values. */
export const FontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** Font family strings for PixiJS TextStyle. */
export const FontFamily = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
} as const;

/** Standard line height multiplier. */
export const LINE_HEIGHT = 1.5;

// ── Spacing (8 px grid) ────────────────────────────────────────────────────

/** Spacing scale in pixels — based on an 8 px grid with half-step extras. */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Border Radius ───────────────────────────────────────────────────────────

/** Border radius scale in pixels. */
export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  full: 9999,
} as const;

// ── Layout Dimensions ───────────────────────────────────────────────────────

/** Key layout measurements in pixels. */
export const Layout = {
  hudHeight: 64,
  sidebarWidth: 256,
  sidebarCollapsed: 64,
  chatWidth: 320,
  minTouchTarget: 44,
} as const;

// ── Z-Index Layers ──────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  sidebar: 10,
  chat: 10,
  hud: 50,
  tooltip: 50,
  modal: 50,
} as const;

// ── Effects ─────────────────────────────────────────────────────────────────

/** Default transition duration in milliseconds. */
export const TRANSITION_MS = 200;

/** Backdrop blur radius in pixels (glass-morphism). */
export const BACKDROP_BLUR_PX = 8;

/** Alpha values for common glass-morphism layers. */
export const Alpha = {
  glass: 0.8,
  starfield: 0.3,
  warpRoute: 0.2,
  controlledGlow: 0.2,
  hoverBorder: 0.5,
} as const;
