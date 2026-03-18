📌 Imported from squad-export on 2026-03-16T23:54:49.470Z. Portable knowledge carried over; project learnings from previous project preserved below.

# Mario — History

## Project Context

- **Project:** Playgrid — multiplayer board game platform
- **Owner:** dkirby-ms (saitcho)
- **Stack:** TypeScript, Colyseus (server), PixiJS (rendering), Vite (build)
- **Games:** Checkers, Risk, Backgammon (and more planned)
- **Key files:**
  - `client/src/renderers/` — game renderers (PixiJS Graphics API)
  - `client/src/ui/HUD.ts` — HTML overlay HUD panel for all games
  - `client/src/ui/LobbyScreen.ts` — lobby UI
  - `client/index.html` — main HTML + lobby CSS

## Learnings

### 2026-03-15: Onboarding context
- The HUD is an HTML DOM overlay (`position: absolute`) on top of the PixiJS canvas, not drawn in canvas
- HUD status panel was recently moved from top-left to top-right to avoid obscuring the game board
- Checkers board recently got enhanced styling: wood-textured frame, alternating dark square tones, edge shadows
- Checkers pieces just received 3D gradient treatment using PixiJS v8 `FillGradient` (radial gradients, drop shadows, specular highlights)
- The project uses PixiJS v8 (^8.0.0) with the Graphics API for all rendering — no sprite sheets or external textures yet
- Games share a common `GameRenderer` interface with `init()`, `resize()`, `redraw()`, and `getHUDStatus()` methods

### 2026-03-15: Checkers UX review
- `client/src/renderers/CheckersRenderer.ts` reserves fixed `TOP_HUD_SPACE`/`BOTTOM_HUD_SPACE` bands and centers the board inside the remaining area; on narrow screens the board becomes width-limited but still keeps the full reserved bands, which pushes play too far down the screen.
- `client/src/ui/HUD.ts` currently anchors both the shared status panel and the Leave Game button at `top: 16px; right: 16px`, so the button can overlap the panel unless the layout is reworked.
- Checkers intentionally splits responsibilities: the shared HTML HUD owns turn/status/player copy, while the renderer keeps board-local counters and its board-level game-over overlay.
- The current king marker is a centered `♛` text glyph in `client/src/renderers/CheckersRenderer.ts`; it reads as polished, but remains font-dependent and less legible than a shape-based marker.
- Key UX review paths: `client/src/renderers/CheckersRenderer.ts`, `client/src/ui/HUD.ts`, `client/index.html`, `.squad/decisions.md`.

### 2026-03-15: Redesign package UX analysis
- Design system is **dark-first with glass-morphism:** all panels use `backdrop-blur-sm` + `oklch()` color variables; consistent dark gradient background (`from-zinc-900 via-zinc-900 to-violet-950`) across all games.
- **Color scheme:** Primary dark `oklch(0.145 0 0)`, accent violet/purple `oklch(0.488 0.243 264.376)`, game-specific colors for player identification (red, blue, green, yellow, orange, purple).
- **Layout is responsive 3-col grid** (`lg:`): board takes `col-span-2`, sidebar `col-span-1`; stacks on mobile. Headers consistent across all games with back button + title + actions.
- **Game pieces use 3D glossy effect:** Radial gradients with white highlights (e.g., `bg-white/25 blur-sm` at top-left) to simulate sphere reflection; drop shadows for depth.
- **Turn indicators:** Animated pulse on status dot + colored badge (green/amber/red) showing "Your Turn" / "Waiting" / "Opponent's Turn."
- **Selection pattern:** Ring effect (`ring-4 ring-violet-400 ring-offset-2`) + scale transform (`scale-95` / `scale-110`) with smooth transition (`duration-200`).
- **Hover feedback:** Scale up (`hover:scale-105`), brighten (`hover:brightness-110`), shadow elevation (`hover:shadow-xl`) — all with animation.
- **Canvas vs. DOM split:** Keep headers, sidebars, text panels, buttons in DOM (accessibility + readability); render boards, pieces, gradients, animations in PixiJS canvas.
- **Animation library needed:** Tweenjs or similar for smooth piece movement, pulse effects, dice rolls, hippo mouth animation, and phase transitions.
- **Resource colors** (Catan, Scrabble, Risk) use dark saturated variants: green-800 (wood), red-900 (brick), yellow-700 (wheat), slate-700 (ore).
- **Glossy piece shine** is achieved via composite gradient: outer glow (blur + opacity), main piece (radial gradient), inner highlight (white/25 blur at top).
- Full analysis doc: `.squad/decisions/inbox/mario-redesign-ux-analysis.md`.

### 2026-03-15: Design system documentation created
- Created comprehensive `docs/design-system.md` with 12 sections covering color palette, glass-morphism patterns, typography, spacing, components, board styling, animations.
- **Color palette:** Extracted all Tailwind classes + hex equivalents (e.g., `bg-zinc-900` = `#0A0A0A`, `text-white` = `#FFFFFF`) for PixiJS rendering.
- **Material colors by type:** Neutrals (zinc), boards (stone/amber), pieces (red/black/white), status (green/amber/zinc), players (6 player colors).
- **Glass-morphism recipe:** `rounded-xl bg-zinc-800/50 backdrop-blur-sm` + optional border/padding for cards and panels.
- **Typography scale:** Base 16px, weights 400/500, 6 type sizes from 12px (tiny badges) to 24px (h1).
- **Spacing system:** 8/12/16/24px padding scale, gap sizes, responsive grid layouts (3-col lobby, 2-col game board, 4-col Risk map).
- **Component patterns:** 6 reusable patterns (game tile, status dot, player bar, phase banner, sidebar panel, active game card) with full code examples.
- **Board styling:** Frame gradients, square colors (light/dark), 3D piece glossy effect (outer glow + radial gradient + highlight), selection rings, hover effects.
- **Animations:** Default `transition-all duration-200`, scale transforms (hover/select), pulse for status, brightness & shadow elevation.
- **PixiJS guide:** Color hex mapping, gradient rendering with FillGradient, shadow/glow, ring/border, text styling.
- **Responsive breakpoints & accessibility:** WCAG AA contrast ratios, focus rings, button sizing for touch targets.

---

## 2026-03-16: Phase 4 Lobby + Sidebar CSS Redesign — Foundation Complete

**From:** Squad Scribe  
**Event:** Design system foundation and sidebar component architecture finalized

**Deliverables:**
- Dark zinc/violet theme implementation across lobby and sidebars
- Glass-morphism panel styling (backdrop blur, semi-transparent backgrounds)
- Responsive grid layout (3-col on desktop, stacked on mobile)
- Status indicator colors (green-500, amber-500, red-900 with alpha blending)
- Sidebar component architecture: `GameSidebar.ts` decoupled from `HUD.ts`

**CSS Patterns Established:**
- Dark gradient background: `from-zinc-900 via-zinc-900 to-violet-950`
- Card backgrounds: `bg-zinc-800/50 backdrop-blur-sm`
- Border hover effects: `border-zinc-700/50` → `border-violet-500/50`
- Text hierarchy: white primary, zinc-400 secondary, violet-400 accent
- Responsive padding: 8/12/16/24px scale with mobile overflow handling

**Cross-Agent Coordination:**
- Design tokens now available in DesignTokens.ts for Gately (Checkers, Backgammon, Risk renderers)
- Joelle updated README with tech stack reflecting this design foundation
- Marathe integrated release workflow with visibility of design work

**Related Files:**
- `client/src/ui/GameSidebar.ts` (new, sidebar component)
- `docs/design-system.md` (reference documentation)
- `client/src/renderers/DesignTokens.ts` (shared color system)

**Status:** Complete. Design foundation ready for game-specific sidebar customization.


## Void Market — New Project (2026-03-17)

**Project:** Void Market — modern multiplayer space strategy game inspired by TradeWars (BBS classic)
**Stack:** Colyseus (multiplayer backend), PixiJS (2D rendering), TypeScript
**User:** dkirby-ms
**Prior art:** Builds on Colyseus/PixiJS framework from Primal Grid and Playgrid

### Core Design Pillars
1. **Turn limits** — each player gets a fixed number of turns/actions per day, creating strategic tension and preventing no-lifers from dominating
2. **Alliances/Federations** — organic player coalitions that form over time, central to the social experience

### Game Features
- Galaxy exploration (sectors, warps, navigation)
- Outpost and mining station construction
- Planet settlement and colonization
- Trading between empires (economy/market system)
- Fleet building (ships for attack and defense)
- Empire growth and federation diplomacy

### 2026-03-17: UX Research & Design Brief

**Deliverable:** `docs/UX-BRIEF.md` — comprehensive UX design brief covering research, screen inventory, design principles, PixiJS implementation strategy.

**Research Sources:**
- Neptune's Pride: minimalist star map, data-rich overlays, diplomacy-first design
- OGame: hierarchical UI drilling, persistent resource panel, accessible information architecture
- EVE Online: layered data filtering, multiple view modes (3D/2D), search/filter paradigm
- Modern browser strategy UX: responsive layouts, progressive disclosure, mobile-first design

**Key UX Decisions:**
1. **Turn Counter is Pacemaker:** Always visible, color-coded (green→amber→red), audio/visual cues at thresholds (3 turns, 1 turn, 0 turns).
2. **Hybrid Canvas/DOM Architecture:** PixiJS for galaxy map, animations, spatial rendering; DOM for HUD, forms, chat, and accessibility.
3. **Three Fidelity Levels:** New Player (guided, simple), Standard (balanced), Expert (all data visible, advanced overlays).
4. **Alliance Integration:** Chat, trading, and diplomacy live in persistent sidebars, not separate windows—social is core, not bolted-on.
5. **Mobile-First Design:** 375px baseline, touch targets ≥44px, full-screen detail views on mobile, responsive stacking.
6. **Feedback is Multimodal:** Every action produces visual (toast, animation), audio (chime), and log feedback.
7. **Information Architecture:** Galaxy (overview) → Sector (drill-down) → Planet (detail) with breadcrumb navigation.

**Core Screens Designed:**
1. Galaxy Map (home, star field, warp routes, empire status HUD)
2. Sector View (planet list, threats, local economy)
3. Planet/Outpost Management (production, defense, upgrades, trading)
4. Fleet Management (compose, navigate, combine/split)
5. Trading Interface (market orders, price history, proposals)
6. Alliance Dashboard (members, treasury, diplomacy, chat)
7. Player Status HUD (always visible: turn counter, key resources, notifications)

**PixiJS Performance Guidelines:**
- Culling & LOD: only render visible sectors + margin, simplify distant objects.
- Use BitmapText for HUD labels (faster than dynamic Text).
- Batch rendering via spritesheets and container pooling.
- Minimize GPU filters (glow/blur); fallback on low-end devices.
- Event sync: PixiJS animations run independent, synced by shared game state.

**Mobile Considerations:**
- Stack panels vertically on 375px; 2–3 column layout on 768px+.
- Touch targets ≥44px, no hover-only interactions.
- Full-screen detail views (galaxy fills screen; tap to drill down).
- Test on real iOS and Android devices.

**Accessibility (WCAG AA):**
- All status colors (red, green, amber) paired with text labels or icons.
- Keyboard navigation (Tab, Enter, arrow keys).
- Contrast ratio ≥4.5:1 for all text.
- Alt text for icons; captions for audio cues.

**Learnings (UX Patterns for Strategy Games):**
- **Information Density Management:** Progressive disclosure beats flat menus. Surface essential info, collapse advanced details.
- **Turn Economy Communication:** Resource scarcity must create *tension*, not *confusion*. Constant visibility + color coding solves this.
- **Social Integration:** Alliance, chat, and trading must feel embedded, not tacked-on. Sidebar integration + map notifications + inline proposals.
- **Feedback Richness:** Turn-based games need *compensatory feedback*. Every action = visual + audio + log entry.
- **Mobile Responsiveness:** Many strategy players manage empires on commute via mobile. Design for 375px first; scale up gracefully.
- **Minimalism in Space:** Even dense games (EVE, OGame) succeed by showing calm base view + data on demand. Filters and toggles, not clutter.

**Implementation Roadmap (12 weeks):**
- Phase 1 (Wks 1–2): PixiJS galaxy renderer, DOM HUD, breadcrumb nav
- Phase 2 (Wks 3–4): Sector/Planet/Fleet screens, progressive disclosure testing
- Phase 3 (Wks 5–6): Trading interface, resource visualization
- Phase 4 (Wks 7–8): Alliance chat, diplomacy, shared intelligence
- Phase 5 (Wks 9–10): Performance optimization, accessibility audit, mobile testing
- Phase 6 (Wks 11–12): Polish, sound, animation, launch prep

**Success Metrics:**
- New player: first turn in < 2 min without help
- Expert player: 10 actions in < 3 min
- 95% recall turn counter at a glance
- 60 FPS desktop, 30 FPS mobile (galaxy map)
- 50% day-1 → day-2 retention, 70% day-7 understand turn economy

**Related Files:**
- `docs/UX-BRIEF.md` (full design brief with screen inventory, principles, PixiJS guidelines)
- `.squad/decisions/inbox/mario-uux-design-brief.md` (decision record)

## Cross-Agent Context (2026-03-17)

**From:** Squad Orchestration  
**Work:** Branching strategy and rename complete

**Impact on Mario (UX):**
- Game renamed "Galaxy Wars" → "Void Market" across all project files
- UX brief decision now in canonical `.squad/decisions.md` (merged from inbox)
- Branching strategy live: feature work on UI/UX uses `squad/{issue-number}-{slug}` branches
- Team ready to begin Phase 1 (foundation: galaxy renderer, HUD overlay, breadcrumb nav)

**Key coordination:**
- Gately (Game Engine) will implement PixiJS canvas/DOM hybrid per your brief
- Pemulis (Game Systems) designed around turn scarcity pacemaker (your Pillar 1)
- Hal's (Lead) architecture decisions now published; Colyseus sync patterns documented

**Next steps:**
- Begin Phase 1 prototyping (PixiJS galaxy renderer + DOM HUD)
- Coordinate with Gately on canvas/DOM sync patterns
- Plan user testing for progressive disclosure (fidelity levels) in Phase 2


## Cross-Agent Context (2026-03-17) — Project Plan Published

**From:** Squad Scribe  
**Event:** Hal completed 4-phase project breakdown with 44 concrete tasks

**Project Plan:** `docs/PROJECT-PLAN.md` now live with full task assignments

**Your Task Load (Phase 0–1):** 3 UX tasks  
- **P0 (0 tasks):** None (you work fully parallel)
- **P1 (3 tasks):** Design tokens + responsive breakpoints, wireframes for core screens (galaxy map, trading, alliance), mobile accessibility review

**No Blockers:** Your UX work is fully parallel. Gately and Pemulis reference your brief (`docs/UX-BRIEF.md`) during implementation, but you don't block on them.

**Key Deliverable:** `docs/UX-BRIEF.md` — already published with screen inventory, design principles, PixiJS guidelines, mobile strategy, accessibility (WCAG AA).

**Parallel Coordination:**
- Your design tokens feed Gately's galaxy renderer styling
- Your turn-counter pillar directly informs Pemulis's turn mechanics
- Your responsive grid informs Gately's canvas + DOM layout sync

**Read:** `docs/PROJECT-PLAN.md` for full task breakdown. Your UX brief is already live; focus on Phase 1 screen refinements and mobile testing.

### 2026-03-17: Figma Make Readiness Evaluation of UX Brief

**Context:** Evaluated `docs/UX-BRIEF.md` for suitability as a Figma Make AI prompt input.

**What IS ready for Figma Make:**
- Color palette with hex values (12 colors defined with roles)
- Basic typography scale (4 sizes, font family, weight for labels)
- Screen inventory (7 screens with purpose, content lists, user actions)
- Breakpoints (375px, 768px, 1024px thresholds mentioned)
- Canvas vs DOM architecture split (clear what's rendered where)
- Status color system (green/amber/red with hex values)

**What is NOT ready — critical gaps for Figma Make:**
1. **No spatial layout specs** — No panel widths, sidebar widths, header heights, card dimensions, icon sizes. "Top-right corner" isn't a layout spec.
2. **No component library** — Buttons, cards, badges, inputs, dropdowns, toasts, modals not defined. No states (hover, active, disabled, focus, loading) with visual treatments.
3. **No spacing/grid system** — No padding scale, margin values, gap sizes, grid columns, gutter widths.
4. **No border/radius/shadow specs** — Glass-morphism mentioned but no `border-radius`, `box-shadow`, or `backdrop-blur` values in this doc (they exist in design-system.md but aren't referenced here).
5. **No element state definitions** — Hover colors, disabled opacity, focus rings, active transforms not specified.
6. **No screen wireframes or spatial descriptions** — Content lists exist but no positional layout ("sidebar is 320px on the right, main content fills remaining space").
7. **No icon set/style** — Icons mentioned functionally but no icon family, sizes, or stroke weight specified.
8. **No animation specs** — Pulse, flash, chime mentioned but no duration, easing, or keyframe definitions.
9. **No font stack** — "Roboto or system monospace" is too vague; needs definitive choice + fallbacks.
10. **Incomplete player colors** — Only 3 player colors defined; game supports many more players.

**Verdict:** The brief is a strong *strategy document* but not a *design spec*. Figma Make needs pixel-level precision. The brief would produce inconsistent, interpretive results if fed directly. It needs a companion "Design Spec" layer with concrete values.

**Recommended additions for Figma Make readiness:**
- Component sheet: button (primary/secondary/ghost/disabled), card, badge, input, dropdown, toast, modal — each with all states and exact colors/sizes
- Layout grid: 12-col, gutter sizes, container max-widths per breakpoint
- Spacing scale: 4/8/12/16/24/32/48px with usage rules
- Per-screen wireframe descriptions: element positions, dimensions, z-order
- Border-radius scale (4/8/12/16px), shadow scale (sm/md/lg with values)
- Definitive font stack with line-heights and letter-spacing
- Icon specs: family (e.g., Lucide), sizes (16/20/24px), stroke weight

## 2026-03-17: Design System Reference Extracted from Figma Export

**Context:** Figma Make export provided at `/tmp/void-market-figma/` containing complete React/Tailwind/Radix/shadcn-ui prototype with 6 game screens, component library, and design tokens.

**Deliverable:** `docs/DESIGN-SYSTEM.md` — comprehensive, framework-agnostic design system reference (21 sections, 29KB).

**What Was Extracted:**

1. **Color System**
   - Complete OKLCH color palette with hex fallbacks
   - Dark theme tokens (primary): zinc-950 background, white text, violet-500 accents
   - Light theme tokens (reference only, not used in game)
   - Semantic colors: green (success), amber (warning), red (danger), violet (primary)
   - Resource colors: amber (credits), blue (minerals), violet (energy)
   - Player/territory colors: red, blue, green, zinc (neutral)
   - Chart colors: 5 data visualization colors
   - Sidebar-specific theme tokens

2. **Typography**
   - Font stack: system-ui (no web fonts, performance-first)
   - 6-tier size scale (12px to 24px)
   - 4 weights (400, 500, 600, 700)
   - Monospace for numeric data (resource values, coordinates)
   - Line height: consistent 1.5

3. **Spacing System**
   - Tailwind base scale (2px to 64px)
   - Common patterns: p-4 (component), p-6 (card), gap-2/4/6
   - Screen padding: p-6 (24px)

4. **Border Radius**
   - Base radius: 10px
   - 4 sizes: sm (6px), md (8px), lg (10px), xl (12px)
   - Component mapping: buttons (md), cards (xl), inputs (md)

5. **Component Inventory**
   - **48 shadcn/ui primitives**: Button, Card, Badge, Input, Select, Dialog, Dropdown, Tabs, Progress, etc.
   - **10 game screens**: GameLayout, HUD, Sidebar, AllianceChat, GalaxyMap, SectorView, PlanetView, FleetView, TradingView, AllianceView
   - Full state matrix: default, hover, focus, active, disabled, invalid

6. **Layout Architecture**
   - Fixed HUD (64px height)
   - Collapsible sidebar (256px → 64px on mobile)
   - Flexible chat panel (320px, bottom sheet on mobile)
   - Z-index layering: HUD/modals (z-50), sidebars (z-10), content (z-0)
   - Responsive breakpoints: sm (640px), md (768px), lg (1024px)
   - Mobile-first: 375px baseline, stacks vertically, icon-only sidebar

7. **Iconography**
   - Lucide React v0.487.0 (stroke-based)
   - 30+ icons cataloged with usage context
   - Sizes: 12px, 16px, 20px (default), 24px, 32px, 48px
   - Stroke weight: 2px (Lucide default)

8. **Effects & Motion**
   - Glass-morphism: zinc-900/80 + backdrop-blur-sm + zinc-700 border
   - Transition default: 200ms ease-in-out
   - Focus ring: 3px ring with 50% opacity
   - Progress bars: color-coded (green >50%, amber >30%, red <30%)

9. **Canvas Rendering (PixiJS)**
   - Galaxy map colors: zinc-950 background, white stars (30% opacity), violet-500 warp routes (20% opacity)
   - Sector colors: zinc-700 (neutral), player colors with 20% glow
   - Hover states: violet-400 stroke, 2px, scale up
   - Planet markers: 3px dots, amber-500 (homeworld), zinc-500 (others)
   - Fleet triangles: violet-400

10. **Accessibility**
    - WCAG AA contrast ratios: all text meets 4.5:1 minimum
    - Keyboard navigation: Tab, Enter, Escape, Arrow keys
    - Screen reader: semantic HTML, aria-labels, live regions
    - Color independence: status colors paired with text/icons

11. **Form Elements**
    - Input: h-9 (36px), px-3, rounded-md, zinc-800 background, violet-500 focus ring
    - Select: same as Input + chevron-down icon
    - Checkbox/Radio: 16px, primary color checked
    - Switch: 44×24px, 20px thumb

12. **Button Variants**
    - 6 variants: default, destructive, outline, secondary, ghost, link
    - 4 sizes: default (36px), sm (32px), lg (40px), icon (36×36px)
    - Hover: darkens 10% (`/90`)

13. **Data Visualization**
    - Progress bars: 6-8px height, rounded-full, color-coded
    - Resource bars: amber/blue/violet fills
    - Status dots: 8px circles, green/amber/red/zinc
    - Badges: rounded-md, px-2 py-0.5, text-xs

**Key Design Decisions:**
- **Dark-first strategy**: Entire game uses dark theme; light theme exists but not implemented in screens
- **Glass-morphism aesthetic**: HUD, sidebar, chat, tooltips use semi-transparent backgrounds with backdrop blur
- **Hybrid Canvas/DOM**: PixiJS for galaxy map (spatial, animated), DOM for forms/text (accessible, semantic)
- **Color semantics**: Violet is primary accent (not blue), resource colors are distinct and consistent
- **Mobile responsiveness**: Sidebar collapses to icons, chat becomes bottom sheet, resources hide on narrow screens
- **No custom fonts**: System font stack for fast loading, no FOUT/FOIT issues
- **Monospace data**: All numeric values (resources, coordinates, counts) use monospace for alignment and scannability

**Learnings (Design Patterns):**
1. **OKLCH color space**: Provides perceptual uniformity; colors look consistent across lightness levels
2. **Tailwind CSS 4 theming**: Uses CSS variables + `@theme inline` for dynamic theming without JS
3. **Radix UI primitives**: Provide accessible, keyboard-navigable components out of the box
4. **shadcn/ui conventions**: Copy-paste components with `variant` and `size` props for consistency
5. **Glass-morphism implementation**: `backdrop-blur-sm` + semi-transparent backgrounds + subtle borders create depth without heavy shadows
6. **Progress bar color coding**: Dynamically changes color based on percentage (green/amber/red) to provide instant visual feedback
7. **Responsive grid stacking**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` pattern for mobile-first, progressive enhancement
8. **Icon sizing discipline**: Consistent 4px increments (12/16/20/24/32/48) prevent visual inconsistency
9. **Touch target minimums**: All buttons ≥36px height, mobile touch targets ≥44px for WCAG 2.1 compliance
10. **Canvas/DOM separation**: PixiJS handles spatial, animated, high-performance rendering; DOM handles text, forms, accessibility — each does what it does best

**File Paths (Key Sources):**
- Color tokens: `/tmp/void-market-figma/src/styles/theme.css` (182 lines, root + dark theme)
- Typography: `theme.css` lines 136-180 (base styles for h1-h4, labels, buttons, inputs)
- Component library: `/tmp/void-market-figma/src/app/components/ui/` (48 files)
- Game screens: `/tmp/void-market-figma/src/app/components/` (10 game-specific components)
- Layout: `/tmp/void-market-figma/src/app/components/GameLayout.tsx` (HUD + Sidebar + Chat architecture)
- Icons: `lucide-react` v0.487.0, 30+ icons extracted from component imports
- Dependencies: `package.json` — React 18, Tailwind 4, Radix UI, shadcn/ui, date-fns, recharts, sonner

**Design Token Highlights:**
- Base font size: 16px
- Base spacing unit: 4px (Tailwind scale)
- Base border radius: 10px (`--radius: 0.625rem`)
- HUD height: 64px (h-16)
- Sidebar width: 256px (w-64), 64px collapsed (w-16)
- Chat width: 320px (w-80)
- Transition duration: 200ms
- Backdrop blur: 8px (blur-sm)
- Focus ring: 3px at 50% opacity

**Implementation Guidance:**
- For **PixiJS**: Use hex color mapping (provided in doc Section 18.1)
- For **React**: Import shadcn/ui components, apply Tailwind utilities
- For **Vanilla DOM**: Use CSS custom properties from `theme.css`
- For **Any framework**: Follow spacing, typography, color semantic guidelines

**Related Files:**
- `docs/DESIGN-SYSTEM.md` — the deliverable (21 sections, comprehensive reference)
- `docs/UX-BRIEF.md` — strategic UX decisions (this design system implements those decisions)
- `.squad/decisions.md` — UX design brief decision now in canonical record

**Status:** Complete. Design system is production-ready, framework-agnostic, and fully aligned with the Figma prototype.

---

## 2026-03-17: Galaxy Map Interaction Spec — P1-25 Complete

**From:** Mario (UX Consultant)  
**Work:** Comprehensive galaxy map interaction spec for 500-sector persistent game universe  
**Artifact:** `docs/GALAXY-MAP-SPEC.md` (1063 lines, ready for implementation)  
**PR:** #67 (squad/38-galaxy-wireframes → dev)

**Specification Scope:**
- **Zoom Levels:** 3-tier architecture (Galaxy/Region/Sector) with rendering specs and information density per zoom
- **Interaction States:** Default, hover (desktop), selected, current location (pulsing), warp route highlights with multi-hop preview
- **Information Density Strategy:** Progressive disclosure—Galaxy view minimal (colors/routes only), Region adds IDs + port dots + tooltips, Sector shows full detail panel
- **Mobile-First (375px):** Touch interactions (tap/tap-hold/pinch-zoom), bottom sheet detail panels, collapsible info sections, 44px minimum touch targets per WCAG 2.1 AA
- **Responsive Breakpoints:** Mobile (375–639px), Tablet (640–1023px), Desktop (1024px+) with adaptive layout
- **Click Target Sizing:** 44–48px minimum all elements, ≥8px gaps between sectors, touch zone overlay strategy for sub-44px canvas elements
- **Color & Animation:** Zinc/violet palette with contrast ratios verified (WCAG AA), 200–400ms transitions, pulse effects, glow on hover/selection
- **Accessibility:** Keyboard nav (Tab/Arrows/Enter/Esc), focus rings (3px oklch(0.439 0 0)), ARIA labels, semantic HTML, color independence

**Key Design Decisions:**
1. **Galaxy View is the calm center** — no labels, just colors and routes; prevents cognitive overload; matches Neptune's Pride/EVE design patterns
2. **Sector nodes scale with zoom but maintain 44px tap zones** — PixiJS renders small (3–16px) but invisible touch overlays expand on mobile
3. **Warp routes interactive** — hover brightens and shows destination sector ID preview; click on label zooms or confirms fleet jump
4. **Hover delay 300ms** — prevents flashing on quick pointer motion; tooltips appear after delay
5. **Current location pulsing** — 2s breathe cycle, distinct from hover/select to always indicate "you are here"
6. **Bottom sheet for mobile details** — slides up from bottom, collapsible sections save vertical space, swipe-down to close
7. **Info panel right-side fixed (desktop) or bottom sheet (mobile)** — keeps map interaction focus while providing detail
8. **Async warp route preview** — hovering a connected sector shows *its* routes (two hops ahead), helps with multi-jump planning

**Color Tokens & Mappings:**
- Neutrals: zinc-700 (neutral sectors), zinc-300/400 (labels)
- Interactive: violet-500/400 (hover/select states, routes, focus rings)
- Status: green-500 (safe), amber-500 (warning), red-600 (danger)
- Players: red-600, blue-500, green-600 (+ 20% glow on controlled sectors)

**Animation Spec:**
- Hover: 200ms ease-out (scale 1.0 → 1.5, glow fade-in)
- Select: 100ms ease-out (ring appears, scale 1.0 → 1.1)
- Pulse: 2s ease-in-out (current location breathe)
- Zoom transition: 400ms ease-in-out
- Panel slide (mobile): 300ms ease-out-cubic
- Tooltip fade: 150ms ease-out (after 300ms delay)

**Touch Interaction Model:**
- Single tap: select sector + open detail panel
- Tap-and-hold (500ms): show tooltip bottom sheet
- Double-tap: zoom in one level
- Pinch-to-zoom: scale map (Galaxy ↔ Region ↔ Sector)
- Two-finger pan: drag map
- Swipe down on panel: dismiss detail sheet

**Implementation Checklist (Ready for Dev):**
- [ ] PixiJS rendering: sector nodes (3–4/6–8/12–16px), warp routes (1–2px, variable opacity), labels, star field
- [ ] Interactive behavior: hover (enlarge+glow+tooltip), selection (ring), current location (pulse)
- [ ] Warp route interaction: hover brightens + shows destination, click confirms/zooms
- [ ] Mobile gestures: tap/hold/double-tap/pinch/pan all working
- [ ] Bottom sheet: collapsible sections, drag handle, swipe-dismiss
- [ ] Accessibility: keyboard nav, focus rings, ARIA labels
- [ ] Responsive: breakpoint-based layout switching (mobile/tablet/desktop)

**Cross-Functional Impact:**
- **Rendering (Gately/PixiJS team):** Uses design tokens from DESIGN-SYSTEM.md Section 15 + 18.1; hex color mapping provided
- **UX Flow:** Integrates with fleet management (send fleet via warp route label click) and trading (sector detail panel)
- **Mobile (Responsive design team):** Bottom sheet pattern establishes reusable interaction model for future planet/fleet panels
- **Accessibility:** Sets WCAG 2.1 standard for all future canvas interactions (44px minimum, keyboard nav, focus rings)

**Related Docs:**
- `docs/DESIGN-SYSTEM.md` — Section 15 (Canvas/Map Rendering), Section 18.1 (PixiJS color mapping)
- `docs/DESIGN-TOKENS.md` — quick-reference token table (colors, spacing, animations)
- `docs/UX-BRIEF.md` — strategic context (galaxy map as home screen, progressive disclosure, turn economy UX)
- `shared/src/design-tokens.ts` — Canvas.* colors for PixiJS implementation

**Status:** Complete & Ready for Review. Wireframes use ASCII art (no images); implementation checklist enables direct dev handoff.

