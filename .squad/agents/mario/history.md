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

