# Void Market — Design Tokens Reference

Quick-reference for every design token. Tokens are defined in two places:

| Context | File | Format |
|---------|------|--------|
| **DOM / CSS** | `client/src/index.css` | CSS custom properties (`--vm-*`) |
| **PixiJS / TypeScript** | `shared/src/design-tokens.ts` | Hex numbers (`0xRRGGBB`) |

> **Source of truth:** `docs/DESIGN-SYSTEM.md` — consult that for full rationale, component specs, and accessibility notes.

---

## Color Palette

### Neutrals (zinc scale)

| Token | Hex | CSS var | TS constant | Usage |
|-------|-----|---------|-------------|-------|
| zinc-950 | `#0A0A0B` | `--background` | `Neutral.zinc950` | Page background |
| zinc-900 | `#18181B` | `--vm-surface` | `Neutral.zinc900` | Card / panel bg |
| zinc-800 | `#27272A` | `--vm-surface-raised` | `Neutral.zinc800` | Raised surface, borders |
| zinc-700 | `#3F3F46` | `--vm-neutral` | `Neutral.zinc700` | Hover borders, neutral fills |
| zinc-600 | `#52525B` | — | `Neutral.zinc600` | Subtle dividers |
| zinc-500 | `#71717A` | — | `Neutral.zinc500` | Tertiary text, hints |
| zinc-400 | `#A1A1AA` | `--muted-foreground` | `Neutral.zinc400` | Secondary text |
| zinc-300 | `#D4D4D8` | — | `Neutral.zinc300` | Legend text |
| white | `#FFFFFF` | `--foreground` | `Neutral.white` | Primary text |

### Semantic Colors

| Role | Hex | CSS var | TS constant |
|------|-----|---------|-------------|
| Primary (violet-500) | `#8B5CF6` | `--vm-accent` | `Semantic.primary` |
| Primary light (violet-400) | `#A78BFA` | `--vm-accent-light` | `Semantic.primaryLight` |
| Primary dark (violet-600) | `#7C3AED` | `--vm-accent-dark` | `Semantic.primaryDark` |
| Success (green-500) | `#22C55E` | `--vm-success` | `Semantic.success` |
| Warning (amber-500) | `#F59E0B` | `--vm-warning` | `Semantic.warning` |
| Danger (red-500) | `#EF4444` | `--vm-danger` | `Semantic.danger` |

### Resource / Commodity Colors

| Commodity | Standard | Light | CSS vars | TS constants |
|-----------|----------|-------|----------|--------------|
| **Fuel Ore** | `#F59E0B` (amber-500) | `#FBBF24` (amber-400) | `--vm-fuel-ore`, `--vm-fuel-ore-light` | `Resource.fuelOre500`, `Resource.fuelOre400` |
| **Organics** | `#10B981` (emerald-500) | `#34D399` (emerald-400) | `--vm-organics`, `--vm-organics-light` | `Resource.organics500`, `Resource.organics400` |
| **Equipment** | `#0EA5E9` (sky-500) | `#38BDF8` (sky-400) | `--vm-equipment`, `--vm-equipment-light` | `Resource.equipment500`, `Resource.equipment400` |
| **Credits** | `#EAB308` (yellow-500) | `#FACC15` (yellow-400) | `--vm-credits`, `--vm-credits-light` | `Resource.credits500`, `Resource.credits400` |
| **Exotic Matter** | `#A855F7` (purple-500) | `#C084FC` (purple-400) | `--vm-exotic`, `--vm-exotic-light` | `Resource.exotic500`, `Resource.exotic400` |

> **Colorblind-safe:** Amber / emerald / sky are separated by > 90° hue each, distinguishable under deuteranopia, protanopia, and tritanopia.

### Player / Faction Colors

| Slot | Hex | CSS var | TS constant |
|------|-----|---------|-------------|
| Player 1 (self) | `#EF4444` | `--vm-player-1` | `Player.player1` |
| Player 2 | `#3B82F6` | `--vm-player-2` | `Player.player2` |
| Player 3 | `#22C55E` | `--vm-player-3` | `Player.player3` |
| Player 4 | `#F59E0B` | `--vm-player-4` | `Player.player4` |
| Player 5 | `#A855F7` | `--vm-player-5` | `Player.player5` |
| Player 6 | `#06B6D4` | `--vm-player-6` | `Player.player6` |
| Neutral | `#3F3F46` | `--vm-neutral` | `Player.neutral` |

### Chart Colors

| Slot | Hex | CSS var | TS constant |
|------|-----|---------|-------------|
| 1 | `#8B5CF6` (violet) | `--chart-1` | `Chart.chart1` |
| 2 | `#4ADE80` (green) | `--chart-2` | `Chart.chart2` |
| 3 | `#FACC15` (yellow) | `--chart-3` | `Chart.chart3` |
| 4 | `#EC4899` (pink) | `--chart-4` | `Chart.chart4` |
| 5 | `#F97316` (orange) | `--chart-5` | `Chart.chart5` |

### Canvas / Galaxy Map Colors

| Element | TS constant | Alpha | Notes |
|---------|-------------|-------|-------|
| Background | `Canvas.background` | 1.0 | zinc-950 |
| Star field | `Canvas.starfield` | 0.3 (`Alpha.starfield`) | White points, random size 0–1.5 px |
| Warp routes | `Canvas.warpRoute` | 0.2 (`Alpha.warpRoute`) | Violet-500, 1 px stroke |
| Sector (neutral) | `Canvas.sectorNeutral` | 1.0 | zinc-700 |
| Sector (hover) | `Canvas.sectorHover` | 1.0 | Violet-400, 2 px stroke |
| Fleet indicator | `Canvas.fleet` | 1.0 | Violet-400 triangle |
| Homeworld | `Canvas.homeworld` | 1.0 | Amber-500 |
| Sector labels | `Canvas.sectorLabel` | 1.0 | White, 12 px, visible at zoom > 0.6 |

---

## Typography

| Tier | Size | CSS var | TS constant | Usage |
|------|------|---------|-------------|-------|
| Tiny | 12 px | `--vm-font-xs` | `FontSize.xs` | Timestamps, metadata |
| Small | 14 px | `--vm-font-sm` | `FontSize.sm` | Captions, helper text |
| Base | 16 px | `--vm-font-base` | `FontSize.base` | Body, buttons, labels |
| Large | 18 px | `--vm-font-lg` | `FontSize.lg` | Sub-section headings |
| XL | 20 px | `--vm-font-xl` | `FontSize.xl` | Section headings |
| 2XL | 24 px | `--vm-font-2xl` | `FontSize.xxl` | Page titles |

**Weights:** `FontWeight.normal` (400) · `FontWeight.medium` (500) · `FontWeight.semibold` (600) · `FontWeight.bold` (700)

**Font stacks:**
- Sans: `FontFamily.sans` — system-ui, -apple-system, …
- Mono: `FontFamily.mono` — ui-monospace, SFMono-Regular, … (use for resource values, coordinates)

---

## Spacing (8 px grid)

| Token | Value | CSS var | TS constant |
|-------|-------|---------|-------------|
| xxs | 2 px | `--vm-space-1` | `Spacing.xxs` |
| xs | 4 px | `--vm-space-2` | `Spacing.xs` |
| sm | 8 px | `--vm-space-4` | `Spacing.sm` |
| md | 12 px | — | `Spacing.md` |
| lg | 16 px | `--vm-space-8` | `Spacing.lg` |
| xl | 24 px | `--vm-space-12` | `Spacing.xl` |
| xxl | 32 px | `--vm-space-16` | `Spacing.xxl` |
| xxxl | 48 px | `--vm-space-24` | `Spacing.xxxl` |

---

## Border Radius

| Token | Value | TS constant |
|-------|-------|-------------|
| sm | 6 px | `Radius.sm` |
| md | 8 px | `Radius.md` |
| lg | 10 px | `Radius.lg` |
| xl | 14 px | `Radius.xl` |
| full | 9999 px | `Radius.full` |

---

## Layout Dimensions

| Measurement | Value | TS constant |
|-------------|-------|-------------|
| HUD height | 64 px | `Layout.hudHeight` |
| Sidebar (expanded) | 256 px | `Layout.sidebarWidth` |
| Sidebar (collapsed) | 64 px | `Layout.sidebarCollapsed` |
| Chat panel | 320 px | `Layout.chatWidth` |
| Min touch target | 44 px | `Layout.minTouchTarget` |

---

## Glass-morphism Recipe

```css
background: var(--vm-glass-bg);        /* rgba(24,24,27, 0.8) */
backdrop-filter: blur(var(--vm-glass-blur)); /* 8 px */
border: 1px solid var(--vm-glass-border);    /* zinc-700 */
```

PixiJS equivalent: use `Alpha.glass` (0.8) with `Neutral.zinc900` fill, plus `BACKDROP_BLUR_PX` (8) where supported.

---

## Usage Examples

### DOM (React / Tailwind)
```tsx
<span style={{ color: 'var(--vm-fuel-ore)' }}>Fuel Ore</span>
<div className="bg-[var(--vm-surface)] border border-[var(--vm-glass-border)]" />
```

### PixiJS
```typescript
import { Resource, Canvas, FontSize, FontFamily } from '@void-market/shared';

const text = new Text({
  text: 'Fuel Ore: 1,200',
  style: {
    fill: Resource.fuelOre500,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
  },
});

const bg = new Graphics()
  .rect(0, 0, 200, 100)
  .fill({ color: Canvas.background });
```

---

**Version:** 1.0
**Last updated:** 2026-03-17
**Maintained by:** Mario (UX Consultant)
