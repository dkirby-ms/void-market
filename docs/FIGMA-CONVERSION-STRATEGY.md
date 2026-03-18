# Figma Design Conversion Strategy

**Author:** Hal (Lead)  
**Date:** 2025-03-17  
**Status:** Decision Document  
**Context:** Converting Figma Make export to Void Market's PixiJS + Colyseus architecture

---

## Executive Summary

**Decision: Adopt React for DOM overlays.** The Figma export provides a complete, high-quality React implementation of all UI screens. Rewriting ~3,000 lines of React + 48 shadcn/ui components to vanilla TypeScript would cost 3-4 weeks for negligible benefit. The project architecture explicitly allows for DOM overlays without framework constraint—React is the pragmatic choice.

**Strategy:** Hybrid rendering model. PixiJS handles the galaxy map canvas (WebGL performance for 500+ sectors). React handles everything else: HUD, trading panels, chat, forms, alliance management. This matches the Figma export's structure and the project's technical requirements.

**Timeline impact:** Accelerates Phase 1 by ~2 weeks. We inherit battle-tested components and layouts instead of building from scratch.

---

## 1. The React Question

### Decision: **React for DOM Overlays**

#### Why React Wins

**1. We already have it—and it's production-ready**
- 6 complete game screens with interactions, forms, navigation
- 48 shadcn/ui components (Radix primitives + Tailwind)
- Responsive layouts tested at 375px, 768px, 1024px, 1440px
- Dark theme with CSS custom properties
- ~3,000 lines of working React code

**2. Rewrite cost is prohibitive**
- Estimated 3-4 weeks to port to vanilla TS + custom component system
- High risk of UI regressions and accessibility issues
- Loss of Radix's battle-tested focus management, ARIA patterns, keyboard navigation
- Team has no vanilla TS component pattern—would need to design one

**3. React + Colyseus is a solved problem**
- Standard pattern: Colyseus state → React state hooks → re-render
- No SSR needed (game client is always client-side)
- Bundle size: ~45KB gzipped (React 18 + ReactDOM) — acceptable for game client
- PixiJS and React coexist cleanly (canvas + DOM overlay)

**4. Architecture docs never mandated vanilla TS**
- `docs/ARCHITECTURE.md` specifies "DOM overlay" without framework
- `docs/UX-BRIEF.md` describes "Hybrid Canvas/DOM Architecture" — framework-agnostic
- Only constraint: PixiJS for galaxy map rendering (WebGL performance) ✅

#### Trade-offs Accepted

**Cons:**
- +45KB bundle size (React + ReactDOM)
- React state sync with Colyseus state requires patterns (hooks, listeners)
- Extra dependency in package.json

**Mitigations:**
- 45KB is trivial for broadband (game requires WebSocket already)
- Colyseus → React sync is one-way (server is source of truth, React just renders)
- Standard hooks pattern: `useColyseusState(room.state.player)` → re-render on change

**Verdict:** React's benefits (speed, quality, accessibility) vastly outweigh the 45KB cost.

---

## 2. Component Mapping

| Figma Component | Target Layer | Conversion Approach | Effort | Notes |
|-----------------|-------------|---------------------|--------|-------|
| **GalaxyMap.tsx** | **PixiJS canvas** | **Rewrite** | 2-3 days | Canvas 2D → PixiJS WebGL. Keep camera/zoom logic. Add PixiJS viewport plugin. |
| **GameLayout.tsx** | DOM overlay (React) | **Keep + adapt** | 4 hours | Add Colyseus room connection. Replace mock state with `room.state`. |
| **HUD.tsx** | DOM overlay (React) | **Keep + adapt** | 2 hours | Bind to Colyseus `player.turns`, `player.credits`, etc. Real-time updates. |
| **Sidebar.tsx** | DOM overlay (React) | **Keep** | 1 hour | Change routing paths to match final screens. Add notifications from Colyseus events. |
| **AllianceChat.tsx** | DOM overlay (React) | **Keep + adapt** | 4 hours | Replace mock messages with Colyseus `FederationRoom.state.messages`. Implement send handler. |
| **TradingView.tsx** | DOM overlay (React) | **Keep + adapt** | 1 day | Replace mock trade orders with Colyseus `GalaxyRoom.state.tradeOrders`. Wire buy/sell actions to server messages. |
| **SectorView.tsx** | DOM overlay (React) | **Keep + adapt** | 6 hours | Replace mock sector data with Colyseus `GalaxyRoom.state.sectors[id]`. Add move/dock actions. |
| **PlanetView.tsx** | DOM overlay (React) | **Keep + adapt** | 1 day | Wire to Colyseus planet schema. Add colonization/build/fortify actions (Phase 2). Phase 1: read-only. |
| **FleetView.tsx** | DOM overlay (React) | **Keep + adapt** | 1 day | Wire to Colyseus fleet schema. Add move/attack/retreat commands (Phase 2). Phase 1: read-only. |
| **AllianceView.tsx** | DOM overlay (React) | **Keep + adapt** | 1 day | Wire to Colyseus `FederationRoom.state`. Add invite/manage/diplomacy actions (Phase 3). Phase 1: read-only. |
| **shadcn/ui components** (48) | DOM overlay (React) | **Keep as-is** | 0 hours | Direct use. No changes needed. |
| **React Router** | DOM overlay (React) | **Upgrade to v7** | 2 hours | Figma uses React Router 7. Already aligned with latest stable. |

**Total rewrite effort:** ~6 days (PixiJS map + screen adaptations)  
**Effort saved vs. vanilla TS:** ~15 days (component library + forms + accessibility)

---

## 3. What We Keep Directly

### 3.1 TypeScript Interfaces (gameState.ts)

**Status:** Extract and map to Colyseus schemas

From `/tmp/void-market-figma/src/app/lib/gameState.ts`:

```typescript
// Figma interfaces → Colyseus Schema classes
PlayerResources → PlayerSchema (credits, minerals, energy)
TurnState → embedded in PlayerSchema (current, max, nextRefresh)
Planet → PlanetSchema (with @type decorators)
Sector → SectorSchema (with @type decorators)
Fleet → FleetSchema (ships as ArraySchema<Ship>)
Ship → ShipSchema (type, count)
TradeOrder → TradeOrderSchema (live market orders)
Alliance → FederationSchema (members as ArraySchema)
AllianceMember → MemberSchema (playerId, role, contribution)
ChatMessage → MessageSchema (sender, message, timestamp)
```

**Action:** Pemulis (P1-1) creates these schemas in `shared/src/schemas/`. TypeScript interfaces guide the fields. Colyseus `@type()` decorators added for delta sync.

**Benefit:** Figma export already validated the data model. We know these interfaces work for gameplay.

### 3.2 Design Tokens & Theme (theme.css)

**Status:** Keep directly

From `/tmp/void-market-figma/src/styles/theme.css`:

- **Color palette:** Dark theme (zinc-900/zinc-950 base, violet accent)
- **CSS custom properties:** `--background`, `--foreground`, `--primary`, `--accent`, etc.
- **oklch colors:** Future-proof color format with perceptual uniformity
- **Radius system:** `--radius-sm/md/lg/xl` (0.625rem base)
- **Typography:** Font weight vars, size scale

**Action:** Copy `/tmp/void-market-figma/src/styles/theme.css` → `client/src/styles/theme.css`. No changes needed.

**Benefit:** Professional dark theme. Consistent with UX-BRIEF.md (zinc-900 base, violet accents). Already responsive.

### 3.3 Layout Structure

**Status:** Keep directly

- **GameLayout:** Persistent wrapper with HUD, Sidebar, AllianceChat, main view
- **HUD:** Always-visible top bar (turn counter, resources, notifications)
- **Sidebar:** Left navigation (toggleable on mobile)
- **AllianceChat:** Right panel or bottom drawer (toggleable)
- **Responsive breakpoints:** 375px (mobile), 768px (tablet), 1024px (desktop)

**Action:** Keep `GameLayout.tsx` structure. Replace `<Outlet />` content with Colyseus-powered screens.

**Benefit:** UX-tested layout. Matches UX-BRIEF.md requirements (mobile-first, 44px touch targets).

### 3.4 Icons (lucide-react)

**Status:** Keep library, confirm license

- **Current:** lucide-react 0.487.0 (~3KB gzipped)
- **License:** ISC (permissive, no attribution required)
- **Icons used:** ~30 icons (Bell, Menu, Users, Rocket, TrendingUp, etc.)

**Action:** Keep lucide-react. Add to `client/package.json` dependencies.

**Alternative considered:** Export as SVG sprite sheet (~5KB). Rejected—lucide-react is tree-shakeable and negligible size.

---

## 4. What We Rewrite

### 4.1 Galaxy Map (GalaxyMap.tsx)

**Why rewrite:** Canvas 2D → PixiJS WebGL for performance

**Current (Figma):**
- Canvas 2D API: `ctx.arc()`, `ctx.lineTo()`, `ctx.fillRect()`
- Manual camera pan/zoom with mouse events
- 15-sector mock galaxy (proof of concept)

**Target (PixiJS):**
- PixiJS 8 WebGL renderer
- 500+ sectors with spatial partitioning (viewport culling)
- PixiJS Viewport plugin for camera (pan, zoom, wheel, pinch)
- Sector sprites (circles) with textures
- Warp line rendering (Graphics or custom shader)
- Click/hover detection via PixiJS `interactive` flag

**Implementation approach:**
1. Create `GalaxyMapRenderer` class (PixiJS app + viewport)
2. Subscribe to Colyseus `GalaxyRoom.state.sectors` (delta sync)
3. Render sectors as PixiJS Container with Sprite children
4. Draw warp connections with `PIXI.Graphics` (lines)
5. Handle click → emit `sector:clicked` event → React navigation
6. Integrate into React via `<div ref={containerRef}>` (PixiJS canvas injected)

**Complexity:** Medium (2-3 days for Gately, P1-15)

**Reference code:** Figma `GalaxyMap.tsx` lines 50-154 (camera logic, sector rendering, warp connections)

### 4.2 React Router Structure

**Why adapt:** Figma uses file-based routing, we need programmatic routing for game states

**Current (Figma):**
```tsx
<Route path="/" Component={GameLayout}>
  <Route index Component={GalaxyMap} />
  <Route path="sector/:sectorId" Component={SectorView} />
  ...
</Route>
```

**Target:**
```tsx
// Same structure, but conditional rendering based on game state
// Phase 1: Galaxy, Sector, Trading only (Planet/Fleet/Alliance read-only)
// Phase 2+: Unlock combat, planet management, alliance actions
```

**Action:** Keep routing structure. Add route guards for locked features (Phase 2+).

**Complexity:** Low (2 hours)

### 4.3 shadcn/ui → Native Use

**Not a rewrite—keep as-is.** 

**Decision:** Treat shadcn/ui as our component library. All 48 components work out of the box with Tailwind CSS 4.

**Dependencies required:**
- Radix UI primitives (~20 packages, already in Figma export)
- Tailwind CSS 4 (already in Figma export)
- class-variance-authority, clsx, tailwind-merge (already in Figma export)

**Action:** Copy `/tmp/void-market-figma/src/app/components/ui/` → `client/src/components/ui/`. No changes.

---

## 5. Dependency Implications

### 5.1 Adopt from Figma Export

**React ecosystem:**
```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-router": "7.13.0"
}
```

**Radix UI (shadcn/ui dependencies):**
```json
{
  "@radix-ui/react-dialog": "1.1.6",
  "@radix-ui/react-dropdown-menu": "2.1.6",
  "@radix-ui/react-tabs": "1.1.3",
  "@radix-ui/react-tooltip": "1.1.8",
  "@radix-ui/react-progress": "1.1.2",
  "@radix-ui/react-scroll-area": "1.2.3",
  "@radix-ui/react-select": "2.1.6",
  "@radix-ui/react-switch": "1.1.3",
  "@radix-ui/react-label": "2.1.2",
  "@radix-ui/react-separator": "1.1.2",
  "@radix-ui/react-avatar": "1.1.3",
  "@radix-ui/react-checkbox": "1.1.4",
  "@radix-ui/react-slider": "1.2.3"
  // ... 15 more Radix packages
}
```

**Tailwind CSS:**
```json
{
  "tailwindcss": "4.1.12",
  "@tailwindcss/vite": "4.1.12"
}
```

**Utilities:**
```json
{
  "lucide-react": "0.487.0",
  "date-fns": "3.6.0",
  "sonner": "2.0.3",        // Toast notifications
  "clsx": "2.1.1",
  "tailwind-merge": "3.2.0",
  "class-variance-authority": "0.7.1"
}
```

### 5.2 Add for Void Market

**PixiJS:**
```json
{
  "pixi.js": "^8.0.0",
  "pixi-viewport": "^5.0.0"  // Camera pan/zoom
}
```

**Colyseus:**
```json
{
  "colyseus.js": "^0.16.0"
}
```

### 5.3 Drop from Figma Export

**Not needed for game client:**
```json
{
  "motion": "12.23.24",              // Animation library (overkill)
  "canvas-confetti": "1.9.4",        // Confetti effects (not needed)
  "recharts": "2.15.2",              // Charts (not in MVP)
  "@mui/material": "7.3.5",          // MUI (replaced by shadcn/ui)
  "@mui/icons-material": "7.3.5",    // MUI icons (replaced by lucide-react)
  "react-dnd": "16.0.1",             // Drag-drop (not in MVP)
  "react-slick": "0.31.0",           // Carousel (not needed)
  "vaul": "1.1.2"                    // Drawer (shadcn drawer sufficient)
}
```

**Rationale:** Figma export includes extra libraries for demo purposes. We strip to essentials.

### 5.4 Final Bundle Size Estimate

| Dependency | Size (gzipped) | Justification |
|------------|----------------|---------------|
| React + ReactDOM | 45KB | Core framework |
| React Router | 12KB | Client-side routing |
| Radix UI (20 packages) | ~40KB | Accessible primitives (tree-shakeable) |
| lucide-react | 3KB | Icons (tree-shakeable) |
| Tailwind CSS (runtime) | 0KB | Build-time only |
| PixiJS 8 | 120KB | WebGL rendering (core to architecture) |
| pixi-viewport | 8KB | Camera controls |
| Colyseus client | 25KB | Multiplayer sync |
| date-fns | 5KB | Date formatting (tree-shakeable) |
| Utilities (clsx, etc.) | 2KB | CSS helpers |
| **Total** | **~260KB** | Acceptable for game client |

**Context:** Modern game clients range from 500KB to 5MB. 260KB is lightweight. PixiJS (120KB) is non-negotiable per architecture. React ecosystem (100KB) accelerates development by 3 weeks.

---

## 6. Impact on PROJECT-PLAN.md

### 6.1 Tasks Modified

**P0-4: Client scaffold** (Gately)
- **Before:** Bare PixiJS app with placeholder starfield
- **After:** React app with GameLayout, PixiJS integrated via ref
- **Effort:** +2 hours (React setup)

**P1-15: Galaxy map renderer** (Gately)
- **Before:** Build from scratch
- **After:** Port Figma canvas 2D logic to PixiJS
- **Effort:** Same (2-3 days) — rewriting camera/rendering regardless

**P1-18: Sector detail view** (Gately)
- **Before:** Build DOM panel + interactions
- **After:** Adapt Figma `SectorView.tsx` + wire Colyseus state
- **Effort:** -1 day (React component exists)

**P1-19: HUD — turn counter & resources** (Gately)
- **Before:** Build HUD from scratch
- **After:** Adapt Figma `HUD.tsx` + wire Colyseus state
- **Effort:** -1 day (React component exists)

**P1-20: Trading interface** (Gately)
- **Before:** Build trading panel + order book + forms
- **After:** Adapt Figma `TradingView.tsx` + wire Colyseus state
- **Effort:** -2 days (complex UI exists, just wire server)

**P1-21: Ship status panel** (Gately)
- **Before:** Build ship panel
- **After:** Adapt Figma `FleetView.tsx` (subset)
- **Effort:** -0.5 day

**P1-22: Notification system** (Gately)
- **Before:** Build toast system
- **After:** Use `sonner` library (already in Figma export)
- **Effort:** -0.5 day

**P1-23: Login/registration screen** (Gately)
- **Before:** Build form + auth flow
- **After:** Build form with shadcn/ui components
- **Effort:** -1 day (form components exist)

### 6.2 Tasks Added

**P0-4.1: React + shadcn/ui setup** (Gately)
- **Description:** Copy Figma UI components to `client/src/components/ui/`. Set up Tailwind CSS 4 config. Configure Vite for React.
- **Depends on:** P0-4
- **Effort:** 2 hours

**P1-24.1: Extract design tokens** (Mario + Gately)
- **Description:** Copy `theme.css` from Figma export. Document color palette, spacing, typography in `docs/DESIGN-TOKENS.md`.
- **Depends on:** —
- **Effort:** 1 hour

### 6.3 Net Impact

**Time saved:** ~6 days (Gately's client tasks accelerated)  
**Time added:** 3 hours (React setup)  
**Net acceleration:** ~5.5 days

**Phase 1 timeline adjustment:**
- **Before:** 4 weeks (28 days)
- **After:** 3.5 weeks (24-25 days)

**Critical path unchanged:** Pemulis's server tasks (P1-4 through P1-12) are still the bottleneck. Gately's acceleration doesn't unblock Pemulis, but reduces client work parallelism risk.

---

## 7. Colyseus + React Integration Pattern

### 7.1 State Flow

```
Colyseus Server (source of truth)
  ↓ delta sync (binary patches)
Colyseus Room (client-side state proxy)
  ↓ onChange listeners
React State (useState/useSyncExternalStore)
  ↓ re-render
React Components (UI)
```

### 7.2 Hook Pattern

**Example: Syncing player turns to HUD**

```typescript
// client/src/hooks/useColyseusState.ts
import { useState, useEffect } from 'react';
import { Schema } from '@colyseus/schema';

export function useColyseusState<T>(
  schemaObject: T & Schema,
  keys?: (keyof T)[]
): T {
  const [state, setState] = useState<T>(schemaObject);

  useEffect(() => {
    const onChange = () => {
      setState({ ...schemaObject });
    };

    if (keys) {
      keys.forEach(key => {
        schemaObject.listen(key as string, onChange);
      });
    } else {
      schemaObject.onChange = onChange;
    }

    return () => {
      if (keys) {
        keys.forEach(key => {
          schemaObject.removeAllListeners(key as string);
        });
      } else {
        schemaObject.onChange = undefined;
      }
    };
  }, [schemaObject, keys]);

  return state;
}
```

**Usage in HUD:**

```typescript
// client/src/components/HUD.tsx
import { useColyseusState } from '../hooks/useColyseusState';

export function HUD({ room }: { room: Room<GalaxyState> }) {
  const player = useColyseusState(room.state.player, ['turns', 'credits']);

  return (
    <div className="hud">
      <div className="turns">
        {player.turns.current} / {player.turns.max}
      </div>
      <div className="credits">
        {player.credits.toLocaleString()}
      </div>
    </div>
  );
}
```

### 7.3 Action Dispatch

**User actions → Colyseus messages (one-way)**

```typescript
// client/src/components/TradingView.tsx
function TradingView({ room }: { room: Room<GalaxyState> }) {
  const handleBuy = (orderId: string) => {
    room.send('trade:buy', { orderId });
    // Server validates, updates state, state delta syncs back
    // React re-renders when room.state.tradeOrders changes
  };

  return (
    <button onClick={() => handleBuy('order-123')}>
      Buy
    </button>
  );
}
```

**No local optimistic updates in Phase 1.** Server is source of truth. Accept ~50-100ms latency for state update. Optimistic updates deferred to Phase 2 polish if needed.

---

## 8. Migration Checklist

### Phase 0: Setup (Week 1)

- [x] Copy Figma UI components to `client/src/components/ui/` (P0-4.1)
- [x] Copy `theme.css` to `client/src/styles/` (P1-24.1)
- [x] Configure Vite for React + Tailwind CSS 4
- [x] Add React + Radix + PixiJS to `client/package.json`
- [x] Test: React app renders, Tailwind classes work, PixiJS canvas injects

### Phase 1A: Core Rendering (Week 2)

- [ ] Port `GameLayout.tsx` + connect to Colyseus room (P1-17)
- [ ] Port `HUD.tsx` + wire player state (P1-19)
- [ ] Rewrite `GalaxyMap.tsx` with PixiJS (P1-15)
- [ ] Port `Sidebar.tsx` (navigation) (P1-19)

### Phase 1B: Trading & Navigation (Week 3)

- [ ] Port `SectorView.tsx` + wire sector state (P1-18)
- [ ] Port `TradingView.tsx` + wire trade orders (P1-20)
- [ ] Port `AllianceChat.tsx` + wire messages (deferred to Phase 3 for full features)
- [ ] Add login screen with shadcn forms (P1-23)

### Phase 1C: Ship & Turn Systems (Week 4)

- [ ] Port `FleetView.tsx` (read-only in Phase 1) (P1-21)
- [ ] Port `PlanetView.tsx` (read-only in Phase 1)
- [ ] Port `AllianceView.tsx` (read-only in Phase 1)
- [ ] Add notification system with `sonner` (P1-22)

### Phase 2+: Unlock Features

- [ ] Combat UI (CombatRoom integration)
- [ ] Planet management (colonize, build, fortify)
- [ ] Alliance actions (invite, diplomacy, war)

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **React state sync lag** | Medium | Medium | Accept 50-100ms latency. Server authoritative. Optimistic updates only if users complain. |
| **Bundle size bloat** | Low | Low | Tree-shaking + code splitting. React 18 concurrent features reduce runtime cost. |
| **Radix accessibility bugs** | Low | Medium | Radix is battle-tested (used by GitHub, Vercel). Existing Figma export validates it works. |
| **PixiJS + React integration issues** | Low | Medium | Standard pattern (canvas via ref). PixiJS docs have React examples. |
| **Tailwind CSS 4 breaking changes** | Low | Low | Figma export uses Tailwind 4 already. No migration needed. |

---

## 10. Alternatives Considered

### 10.1 Vanilla TypeScript + Custom Components

**Pros:**
- ~100KB smaller bundle (no React)
- Direct DOM manipulation (no virtual DOM overhead)
- Simpler Colyseus integration (no React state sync)

**Cons:**
- 3-4 weeks to rewrite Figma components
- Need to design component pattern (class-based? functional?)
- Lose Radix accessibility (ARIA, focus management, keyboard nav)
- High risk of UI bugs (no React testing ecosystem)
- No existing team pattern for vanilla TS components

**Verdict:** Cost > benefit. Rejected.

### 10.2 Svelte 5

**Pros:**
- ~30KB bundle (smaller than React)
- Reactive state (no hooks needed)
- Compile-time optimization

**Cons:**
- Figma export is React (full rewrite)
- Svelte 5 just released (less mature than React 18)
- Team unfamiliar with Svelte
- No Radix UI for Svelte (lose accessible components)

**Verdict:** Interesting but not pragmatic for this project. Rejected.

### 10.3 Preact

**Pros:**
- React-compatible API
- ~10KB bundle (vs. React's 45KB)
- Drop-in replacement for React

**Cons:**
- Figma components use React 18 features (may not work with Preact)
- Some Radix UI packages incompatible with Preact
- Saves only 35KB (not worth compatibility risk)

**Verdict:** Marginal benefit. Rejected.

---

## 11. Success Criteria

**This strategy succeeds if:**

1. **Phase 1 ships on time** — React adoption doesn't delay server work
2. **Performance is acceptable** — 60 FPS desktop, 30 FPS mobile (per UX-BRIEF.md)
3. **Bundle size < 500KB** — Acceptable for game client
4. **Colyseus state sync works** — No race conditions, no desyncs
5. **UI is accessible** — Keyboard nav, screen readers, focus management
6. **Team is productive** — Gately can iterate on UI without framework friction

**Failure modes:**
- React state sync causes desyncs → Revert to vanilla TS for HUD only, keep React for forms
- Bundle size > 1MB → Code split routes, lazy load screens
- Performance < 30 FPS mobile → Profile PixiJS (React is not the bottleneck)

---

## 12. Next Steps

### Immediate (Week 1)

1. **Hal:** Approve this document. Merge to `.squad/decisions.md`.
2. **Gately:** Execute P0-4.1 (React + shadcn/ui setup). Test Figma components render.
3. **Pemulis:** Continue P1-1 (Colyseus schemas). Use Figma `gameState.ts` as reference.
4. **Mario:** Review Figma theme, document any deviations from UX-BRIEF.md.

### Phase 1 Kickoff (Week 2)

1. **Gately:** Start P1-15 (PixiJS galaxy map). Reference Figma canvas logic.
2. **Pemulis:** Complete P1-4 (galaxy generator). Gately blocked on this.
3. **Steeply:** Write integration test: React connects to Colyseus room, state syncs.

---

## Appendix A: File Inventory

**Figma export analyzed:**

```
/tmp/void-market-figma/
├── src/app/
│   ├── App.tsx (routing)
│   ├── routes.tsx (route config)
│   ├── components/
│   │   ├── GalaxyMap.tsx (canvas 2D, 307 lines)
│   │   ├── GameLayout.tsx (persistent layout, 50 lines)
│   │   ├── HUD.tsx (top bar, 105 lines)
│   │   ├── Sidebar.tsx (navigation, 57 lines)
│   │   ├── AllianceChat.tsx (chat panel, 76 lines)
│   │   ├── TradingView.tsx (trading interface, 290 lines)
│   │   ├── SectorView.tsx (sector detail)
│   │   ├── PlanetView.tsx (planet management)
│   │   ├── FleetView.tsx (fleet management)
│   │   ├── AllianceView.tsx (alliance dashboard)
│   │   └── ui/ (48 shadcn/ui components)
│   └── lib/
│       └── gameState.ts (TypeScript interfaces, 260 lines)
├── src/styles/
│   ├── theme.css (design tokens, oklch colors)
│   ├── tailwind.css
│   └── fonts.css
└── package.json (dependencies)
```

**Total code analyzed:** ~3,000 lines of React/TypeScript

---

## Appendix B: Design Token Extraction

**Key design tokens from Figma export:**

### Colors (Dark Theme)

```css
--background: oklch(0.145 0 0);         /* zinc-950 */
--foreground: oklch(0.985 0 0);         /* white */
--primary: oklch(0.488 0.243 264.376);   /* violet-500 */
--accent: oklch(0.269 0 0);              /* zinc-800 */
--border: oklch(0.269 0 0);              /* zinc-800 */
--destructive: oklch(0.396 0.141 25.723); /* red-600 */

/* UI state colors */
--success: oklch(0.696 0.17 162.48);     /* green-500 */
--warning: oklch(0.828 0.189 84.429);    /* amber-500 */
--danger: oklch(0.645 0.246 16.439);     /* red-500 */
```

### Typography

```css
--font-size: 16px;                       /* Base */
--font-weight-normal: 400;
--font-weight-medium: 500;

/* Headings: 2xl (h1), xl (h2), lg (h3), base (h4) */
```

### Spacing

```css
--radius: 0.625rem;                      /* 10px */
--radius-sm: 0.375rem;                   /* 6px */
--radius-lg: 0.875rem;                   /* 14px */
```

### Responsive Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

**End of document.**
