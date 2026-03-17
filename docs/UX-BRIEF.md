# Void Market — UX Design Brief

**Project:** Void Market  
**Author:** Mario (UX Consultant)  
**Date:** 2026-03-17  
**Context:** Modern multiplayer space strategy game (PixiJS, Colyseus), inspired by TradeWars 2002.

---

## Executive Summary

Void Market is a turn-limited strategy game where players manage empires across a procedural galaxy, constrained by daily action limits and driven by alliance dynamics. The UX must handle **dense information flows** (resources, fleets, trading, diplomacy) while keeping the **player focused on strategy, not the interface**. This brief establishes design patterns, screen architecture, and implementation strategy to achieve elegant simplicity in the face of complex mechanics.

---

## 1. UX Research Summary

### What Modern Space Strategy Games Do Well

1. **Minimalist Star Maps with Dense Overlays**
   - Neptune's Pride succeeds by showing a clean, zoomable star map with data revealed on interaction, never forced.
   - EVE Online uses layered filtering: players can toggle security status, sovereignty, jump routes, and activity overlays without cluttering the base view.
   - **Takeaway:** Galaxy map should be the calm center; details surface on click, hover, or via toggles.

2. **Persistent Resource/Turn Status Panel**
   - OGame keeps resource counts (credits, minerals, energy) visible at all times, top-left or top-right corner.
   - Turn/action economy must be *always visible* to create cognitive tension—players need constant awareness of scarcity.
   - **Takeaway:** Empire status (turns left, key resources) in a fixed, high-contrast corner, never hidden.

3. **Contextual Deep Dives Over Flat Navigation**
   - Multi-layer navigation works better than flat menus: Galaxy → Sector → Planet → Details, each with one-click-back.
   - Right-click context menus and inline tooltips let players discover actions without cluttering the main screen.
   - **Takeaway:** Use progressive disclosure and breadcrumbs, not giant menus.

4. **Real-Time Feedback for Long-Duration Play**
   - Strategy games run over days or weeks; visual feedback (animations, pings, flashing alerts) compensates for the lack of immediate gratification.
   - Alliance chat, notifications, and event logs integrated into the main UI (not separate windows) keep social momentum.
   - **Takeaway:** Notifications are first-class citizens; integrate them into the HUD, not as afterthoughts.

5. **Responsive Diplomacy UI**
   - Alliance systems in Neptune's Pride, OGame, and Tribal Wars are successful because chat, diplomacy, and trading are *accessible but non-intrusive*—a sidebar, not a modal.
   - **Takeaway:** Social features must live alongside gameplay, not interrupt it.

### Common UX Pitfalls in Space Strategy Games

1. **Information Overload Without Progressive Disclosure**
   - Dense games (EVE, StarCraft) can overwhelm new players if all data is shown at once.
   - Mitigation: Beginner vs. expert UI modes, collapsible sections, tooltips on hover.

2. **Turn Counter Confusion**
   - Players forget their turn limit because it's not persistent or not prominently enough styled.
   - Mitigation: Always-visible counter, color-coded warnings (green → amber → red), audio/visual pings at low thresholds.

3. **Mobile Responsiveness Afterthought**
   - Many browser strategy games fail on mobile due to dense, fixed-width layouts.
   - Mitigation: Design for 375px (small phone) from the start; test on real devices.

4. **Alliance/Diplomacy Bolted On**
   - If chat and trading are separate from gameplay, players see them as auxiliary, not core.
   - Mitigation: Integrate chat, trading, and diplomacy notifications into the main HUD and map view.

5. **Unclear Action Feedback**
   - Players don't know if their command was received/queued; results aren't communicated.
   - Mitigation: Toast notifications, progress bars, sound effects, and log entries for every significant action.

### Turn Economy & Resource Scarcity Design

1. **Always-Visible Turn Counter**
   - Display: "Turns Left: 5/10" in a prominent corner (e.g., top-right, next to player name).
   - Styling: High-contrast color, larger than body text. Consider a progress bar (10 segments, one dim per turn spent).
   - Warnings: At 3 turns left, amber color; at 1 turn left, red + pulse animation; at 0 turns, crossed-out indicator.

2. **Action Cost Transparency**
   - Each action (move fleet, build structure, trade) shows its turn cost upfront: "This action costs 1 turn."
   - Disabled actions if insufficient turns: button dims, tooltip shows "Not enough turns."

3. **Resource Scarcity Visualization**
   - Resources (credits, minerals, energy, etc.) shown as numeric + bar meters.
   - Colors: green (abundant), amber (limited), red (critical/insufficient).
   - Contextual help: "You need 500 credits for a trading post. You have 300."

4. **Cooldown/Upkeep Communication**
   - If players must wait for resources to regenerate, show a timer or percentage fill bar.
   - Passive income streams (trade routes, mining) displayed clearly: "+50 credits/hour from mining stations."

### Information Density for Browser-Based Strategy

1. **Layered, Progressive Disclosure**
   - **Layer 1 (Galaxy Map):** Just stars, player colors, warp routes. Minimal text.
   - **Layer 2 (Sector View):** Add resource indicators (small icons), fleet counts (badges).
   - **Layer 3 (Planet/Outpost Detail):** Full stats, construction queue, defense details, trading history.

2. **Information Grouping by Context**
   - Group all production/economy info in one panel (Outposts, Resources, Market).
   - Group all combat/defense info in another (Fleets, Defense, Threats).
   - Use tabs or collapsible sections to separate concerns.

3. **Mobile Responsiveness Strategy**
   - For screens < 768px: Stack panels vertically, hide secondary details by default, make touch targets ≥ 44px.
   - For screens ≥ 768px: 2-3 column layout (Galaxy map in col 1–2, sidebar in col 3).
   - For screens ≥ 1024px: Add advanced panels (alliance map, market analytics).

4. **Avoid Cognitive Overload**
   - New players see only: Galaxy map, basic resources, turn counter, a "help" panel.
   - Experienced players toggle "advanced mode" to see: production chains, trade routes, threat matrix, alliance intel.

---

## 2. Core Screen Inventory

Each screen owns a specific domain and primary user actions. Navigation is breadcrumb-aware (can jump between siblings or pop back).

### Screen 1: Galaxy Map (Home Screen)

**Purpose:** High-level empire overview and navigation hub.

**Information Displayed:**
- Star field (procedurally rendered sectors, color-coded by owner).
- Player empires as colored regions or overlays.
- Warp routes between sectors (lines or beams).
- Key outposts/planets as icons (production rate, fleet count badges).
- Empire status bar (top-right): turn counter, main resource counts, federation status.
- Notifications/alerts pinned to the left or as a sidebar toast.

**Primary Player Actions:**
- Click sector → Sector View.
- Click planet/outpost → Detail View.
- Right-click → Context menu (build, scout, attack).
- Drag→ Pan. Scroll or buttons → Zoom.
- Toggle overlay modes (sovereignty, threat, economy, trade routes).

**UX Priorities:**
- Keep the map the visual focus; HUD elements must not obscure play area.
- Animated fleet movement (arcs or beams between sectors) conveys action without text.
- Notification pings (audio + visual) alert players to events without disrupting exploration.
- Fast load: only render visible sectors + neighbors.

**Design Notes:**
- Use PixiJS canvas for the star field, planets, fleets, and animations.
- Use DOM overlay for HUD panels (empire status, notifications, quick actions).
- Minimize redraw: only update when state changes (turn spent, fleet arrives, message received).

---

### Screen 2: Sector View

**Purpose:** Deep dive into a sector's contents; see all objects, structures, and threats.

**Information Displayed:**
- Sector name/coordinates.
- List of planets/outposts in the sector (table or cards).
- Fleets in transit to/from this sector (with ETA).
- Anomalies, asteroids, or resources specific to the sector.
- Alliance presence (friendly vs. rival empires).
- Local economy: trading offers, market prices.

**Primary Player Actions:**
- Click outpost → Planet/Outpost Detail View.
- Send fleet to a neighboring sector.
- Build a new outpost or station in empty space.
- Scan for resources or threats.
- Accept/initiate trades with local players.

**UX Priorities:**
- Clear table layout or card grid (responsive for mobile).
- Breadcrumb: Galaxy → Sector [name] with a back button.
- Sort/filter options (by production, threat level, owner).
- Tooltips on hover for expanded info (e.g., hover a planet to see its garrison strength).

**Design Notes:**
- Render sector contents as a PixiJS mini-scene or use a DOM table with small icons.
- Keep text legible; use color coding (green = safe, amber = warning, red = danger).

---

### Screen 3: Planet/Outpost Management

**Purpose:** Manage a single settlement: production, defense, construction, trading.

**Information Displayed:**
- Planet/outpost name, owner, faction, defenses.
- Current production queue (what's being built, time to completion).
- Resource production rates (per turn, per hour).
- Defense status (garrison count, defense structures, threat level).
- Storage capacity and usage (visual bars).
- Improvements/upgrades available and their costs.
- Trading offers and active trades.
- Historical production/defense logs.

**Primary Player Actions:**
- Queue a new building or ship (select from catalog, confirm cost).
- Assign fleets to defend the outpost.
- Sell or buy resources from other players or NPC traders.
- Upgrade structures (click to see cost and benefit).
- Scrap or dismantle buildings.
- Set rally point for fleets to gather here.

**UX Priorities:**
- Tabbed or sectioned layout: Overview | Production | Defense | Trading | History.
- Drag-to-reorder the production queue (visual feedback on drag).
- Clear cost/benefit tooltips (hover a building to see +5% production, -1 turn to build).
- Confirm dialogs for destructive actions (dismantle, sell resources).

**Design Notes:**
- Use DOM for tables, forms, and controls; lists and buttons are responsive with careful sizing.
- PixiJS for any animated production bars or ship icons.
- Real-time resource updates; consider a 5–10 second refresh rate to avoid overwhelming the server.

---

### Screen 4: Fleet Management

**Purpose:** Build, navigate, and command ships.

**Information Displayed:**
- List of active fleets (by location or destination).
- Fleet composition (ship types, counts, cargo).
- Fleet status (in transit, in orbit, idle, refueling).
- Movement range/fuel remaining.
- Target destination (if traveling).
- Combat strength vs. likely threats.
- Cargo manifest (if trading or transporting).

**Primary Player Actions:**
- Create a new fleet (select ships, confirm).
- Send fleet to destination (click sector, choose route).
- Split/merge fleets.
- Load or unload cargo.
- Set fleet stance (aggressive, neutral, defensive).
- Recall fleet to home sector.
- Disband/scrap a fleet.

**UX Priorities:**
- Clear visual status: icon + text (e.g., 🚀 "En route to Sector 5, ETA 2 turns").
- Drag-and-drop ship composition (pick 5 Fighters, 2 Cruisers, etc.).
- Route previewer on map (show path before committing).
- Undo-safe: players can change destination mid-journey if they have turns.

**Design Notes:**
- Fleet list as a DOM panel; fleet-on-map shown as PixiJS symbols.
- Animated paths/beams when fleet moves (satisfying visual feedback).

---

### Screen 5: Trading Interface

**Purpose:** Exchange resources, negotiate prices, and grow the economy.

**Information Displayed:**
- Active market (buy/sell orders from all players).
- Player inventory (what they're offering).
- Order book (oldest orders at top, grouped by resource).
- Price history (chart or sparkline of recent prices).
- Open trades (sent and received proposals).
- Trade agreement with other players (long-term contracts).

**Primary Player Actions:**
- Post a buy order ("I want 100 credits at 2 credits/unit").
- Post a sell order ("I'm selling 50 minerals at 3 credits/unit").
- Accept a buy/sell order (instant trade).
- Propose a multi-resource trade with another player (e.g., 100 credits + 20 minerals for 50 energy).
- Cancel an open order.
- View player reputation/trade history.

**UX Priorities:**
- Instant buy/sell buttons for quick trades; multi-resource forms for complex negotiation.
- Price chart (even a simple sparkline) shows trends and helps set reasonable offers.
- Notifications when someone accepts your order.
- Search/filter orders (by player, resource, price).

**Design Notes:**
- DOM tables and forms for the market; charts rendered with a lightweight library (e.g., Chart.js or a PixiJS graphics overlay).
- Consider a modal for trade proposals (confirm details before committing turn cost).

---

### Screen 6: Alliance Dashboard

**Purpose:** Manage federation politics, diplomacy, and shared resources.

**Information Displayed:**
- Alliance members list (name, empire size, status, contribution).
- Treasury (shared pool of resources).
- Diplomatic relations with other alliances (neutral, allied, hostile).
- Shared chat (live messages).
- Alliance-wide notifications (who joined, who attacked, who won).
- Shared intelligence (scouted enemy positions, shared trade opportunities).
- Alliance map (territory controlled, frontline hotspots).

**Primary Player Actions:**
- Post a message in alliance chat.
- Vote on diplomacy decisions (declare war, sign peace, form pacts).
- Contribute resources to the treasury.
- Request aid from alliance.
- View alliance members' empires (if permissions allow).
- Leave or invite members.

**UX Priorities:**
- Live chat integrated, not in a separate window (scroll up to see older messages).
- Clear member hierarchy: Leader, Officers, Members.
- Shared map overlays show alliance territory and allied fleets.
- Notifications for major events (new member, war declared, treasury funded).

**Design Notes:**
- Chat as a DOM sidebar or bottom panel, always accessible.
- Alliance map as an overlay on the main galaxy map.
- Real-time updates (WebSocket for chat, poll for big decisions).

---

### Screen 7: Player Status / HUD (Always Visible)

**Purpose:** Persistent status bar showing critical empire metrics.

**Information Displayed (Top-Right Corner):**
- Player name + federation affiliation.
- Turn counter (e.g., "5/10 turns left") with visual progress bar.
- Key resources: Credits, Minerals, Energy (numeric + bar).
- Current research or major ongoing task (text + progress).
- Notification badge (red dot if new messages or alerts).

**Interaction:**
- Click to open full empire status or settings.
- Click notification badge to see alerts/chat.
- Minimize/expand status bar on mobile.

**UX Priorities:**
- Always visible, high contrast, readable at a glance.
- Subtle animations (pulse on turn refresh, color flash on alert).
- Responsive: on mobile, collapse to icons with tooltips; on desktop, show full labels.

**Design Notes:**
- DOM overlay with CSS transitions for smooth updates.
- Sync with server every 5–10 seconds or on turn spend.

---

## 3. UX Design Principles for Void Market

### Principle 1: Turn Scarcity Must Create Tension, Not Confusion

**Guideline:** The turn counter is the pacemaker of the game. It must be:
- **Always visible:** No mode, no zoom level, no distraction should hide it.
- **Color-coded:** Green (plenty), Amber (3–4 turns left), Red (1–2 turns), Crossed-out (0 turns).
- **Audiovisual cues at critical thresholds:** Soft chime at 3 turns left; louder alert at 0.
- **Proactive warnings:** "Your turns refresh in 4 hours" shown 30 minutes before refresh.

**Why:** Players must *feel* time pressure without *suffering* from confusion. If they forget how many turns they have, the system failed.

### Principle 2: Information Density is Managed, Not Hidden

**Guideline:** Offer three **fidelity levels** of gameplay:
- **New Player Mode:** Hide advanced stats, show only essential actions (move, build, trade). Breadcrumb-guided workflows.
- **Standard Mode:** Show most info, but collapsible advanced sections (e.g., "Trade History" collapsed by default).
- **Expert Mode:** All data visible; minimap shows threat matrix, trade routes, alliance intelligence overlays.

**Why:** Strategy games serve both casual and hardcore players. One flat UI cannot satisfy both. Adaptive UI respects player skill and learning.

### Principle 3: Mobile is Not a Downgrade, It's a Constraint

**Guideline:**
- Design for 375px (small phone) as the baseline. Larger screens scale up, not down.
- Touch targets ≥ 44px. Avoid hover-only interactions.
- Stack panels vertically on mobile; use bottom sheet menus for secondary actions.
- Full-screen detail views on mobile (galaxy map fills screen; tap a sector to drill down).

**Why:** Many players will manage empires on the phone during commutes. Mobile-first design makes the game accessible anywhere, driving retention.

### Principle 4: Alliance/Social Integration, Not Bolted-On

**Guideline:**
- Chat lives in a persistent sidebar or pop-up, accessible from any screen, never a separate window.
- Trading proposals appear inline on the main screen, not in a separate modal.
- Alliance notifications (member joins, war declared) are pins on the galaxy map or toasts in the HUD.
- Shared intelligence (scouted fleets, discovered planets) appears in a shared intel feed next to the player's own activity log.

**Why:** Social dynamics are the soul of multiplayer strategy games. When chat and trading are embedded in the gameplay experience, they feel like core mechanics, not features.

### Principle 5: Feedback is Constant and Multimodal

**Guideline:**
- Every significant action (turn spent, fleet launched, trade executed, message sent) produces:
  - **Visual feedback:** Toast notification, color change, animation.
  - **Audio feedback:** Soft chime or satisfying "whoosh" sound.
  - **Log entry:** Recorded in activity log for reference.
- Resource changes are animated (bar fill, number count-up).

**Why:** Turn-based games lack the moment-to-moment feedback of action games. Compensate with *rich*, *immediate* feedback to make the game feel responsive and alive.

### Principle 6: Accessibility is Foundational, Not Cosmetic

**Guideline:**
- All colors used to convey status (red = critical, green = safe) must also use text labels or icons.
- Font sizes scale with device DPI; minimum 12px for readable text, 16px for buttons.
- Contrast ratio ≥ 4.5:1 for all text (WCAG AA standard).
- Keyboard navigation: Tab through all interactive elements; Enter to activate; arrow keys to navigate lists.
- Alt text on all icons; captions on audio cues (for hearing-impaired players).

**Why:** Accessibility is not a niche feature; it's inclusive design. Color-blind players, visually impaired players, and older players deserve a great experience.

---

## 4. PixiJS UI Considerations

### When to Use PixiJS Canvas vs. DOM Overlay

**PixiJS Canvas (Game Graphics, Animations, High-Performance UI)**
- Galaxy map and all spatial rendering (stars, planets, fleets, warp routes).
- Animated transitions and particle effects.
- HUD elements that benefit from GPU acceleration (progress bars, glowing effects, animated icons).
- Custom vector graphics (empire territory shading, threat indicators).

**Avoid in Canvas:**
- Text-heavy panels, forms, or tables (hard to make responsive and accessible).
- Interactive elements with complex state (dropdowns, checkboxes, input fields).

**DOM Overlay (Menus, Panels, Forms, Chat)**
- Empire status panel (top-right corner HUD).
- Sector view table (list of planets, sorting, filtering).
- Production queue and building catalog.
- Trading interface and forms.
- Alliance chat and diplomacy panels.
- Settings and configuration.

**Why this split:**
- Canvas excels at smooth rendering of spatial content and animations.
- DOM excels at responsive layouts, form interactions, and text.
- Hybrid approach: canvas for the game world, DOM for the UI chrome.

### Performance Best Practices for Void Market

1. **Culling & LOD (Level of Detail)**
   - Only render sectors visible in the camera view + 1 sector margin.
   - Distant sectors render as simplified representations (dot + name, no detail).
   - Fleet animations only when on screen; off-screen fleets update position but don't animate.

2. **Use Bitmap Text, Not Dynamic Text**
   - For turn counter, resource labels, and other frequently-updated UI: use `BitmapText` (pre-rendered fonts in a spritesheet).
   - Avoid `PIXI.Text` for HUD elements; it's slow for frequent updates.

3. **Batch Rendering**
   - Group planets by sector; render all in one batch.
   - Use spritesheets for ship icons, alliance badges, resource icons.
   - Reuse containers and recycled pools of objects (fleets, projectiles, notifications).

4. **Minimize Filter Overhead**
   - Glow or blur effects on high-performance platforms only.
   - Use fallback rendering (solid color) on low-end devices.

5. **Network Updates Don't Require Full Redraw**
   - Only redraw changed sectors. Use dirty flags.
   - Animate position changes smoothly over several frames instead of teleporting.

### Hybrid Architecture: Recommended Implementation

**Canvas (PixiJS):**
```
┌─────────────────────────────────────────────┐
│  Galaxy Renderer (PixiJS Stage)             │
│  ├─ Star Field                              │
│  ├─ Planets & Outposts (with icons)         │
│  ├─ Fleets (animated arcs/beams)            │
│  ├─ Warp Routes                             │
│  ├─ Tooltips on Hover (canvas text)         │
│  └─ Selected Indicator (glow/ring effect)   │
└─────────────────────────────────────────────┘
```

**DOM Overlay (HTML/CSS, positioned absolutely):**
```
┌─────────────────────────────────────────────┐
│  Top-Right: Empire Status HUD               │
│  ├─ Turn Counter (progress bar)             │
│  ├─ Key Resources                           │
│  └─ Notification Badge                      │
├─────────────────────────────────────────────┤
│  Left Sidebar: Notifications / Quick Actions│
├─────────────────────────────────────────────┤
│  Bottom: Alliance Chat (collapse/expand)    │
├─────────────────────────────────────────────┤
│  Main Panel: Context-Dependent              │
│  ├─ Galaxy: Empty (focus on map)            │
│  ├─ Sector Selected: Sector Detail Table    │
│  └─ Planet Selected: Planet Detail Panel    │
└─────────────────────────────────────────────┘
```

**Event Flow:**
- Click on PixiJS galaxy → bubble event to DOM handlers (JavaScript).
- DOM handlers update state, trigger network requests, re-render affected PixiJS objects.
- PixiJS animations run independently, synced by shared game state (not tightly coupled to DOM).

### Color Palette for Void Market UI

Inherit the Playgrid design system (dark zinc/violet, glass-morphism) and extend it:

| Role | Color | Usage |
|------|-------|-------|
| Primary BG | `#0A0A0A` (zinc-900) | Window backgrounds, panels |
| Secondary BG | `#27272A` (zinc-800/50 transparent) | Cards, containers |
| Accent | `#A78BFA` (violet-400) | Interactive elements, highlights |
| Text Primary | `#FFFFFF` | Headings, labels |
| Text Secondary | `#A1A1AA` (zinc-400) | Descriptions, helper text |
| Status: Safe | `#22C55E` (green-500) | No threat, resources abundant |
| Status: Warning | `#F59E0B` (amber-500) | Low resources, threats nearby |
| Status: Critical | `#DC2626` (red-600) | Dire threat, almost out of turns |
| Player 1 | `#EF4444` (red-500) | Empire color coding |
| Player 2 | `#3B82F6` (blue-500) | |
| Player 3 | `#10B981` (emerald-500) | |
| Alliance | `#8B5CF6` (violet-500) | Alliance overlay, friendly fleets |
| Neutral | `#6B7280` (gray-500) | Neutral zones, NPC traders |

**Typography:**
- Body: 14px, Roboto or system monospace for numbers.
- Labels: 12px, weight 500.
- Headings: 18px (h3), 20px (h2), 24px (h1).
- Turn Counter: 20px bold, high contrast.

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Weeks 1–2)
- [ ] Set up PixiJS galaxy renderer (render sectors, planets, basic navigation).
- [ ] Build DOM HUD overlay (empire status, turn counter, notifications).
- [ ] Implement breadcrumb navigation system (Galaxy → Sector → Planet).
- [ ] Test canvas/DOM sync on desktop and mobile.

### Phase 2: Core Screens (Weeks 3–4)
- [ ] Sector view (planet list table, drill-down to detail).
- [ ] Planet/outpost management panel (production queue, upgrades).
- [ ] Fleet management (list, compose, navigate).
- [ ] Playtest for information density; iterate on progressive disclosure.

### Phase 3: Economy & Trading (Weeks 5–6)
- [ ] Trading interface (market orders, price history chart, proposals).
- [ ] Resource visualization (bars, inventory, production rates).
- [ ] Trade notifications and activity log.

### Phase 4: Alliance & Social (Weeks 7–8)
- [ ] Alliance chat integration (sidebar, real-time messages).
- [ ] Diplomacy panel (relations, declarations, shared map).
- [ ] Shared intelligence feed (allied sightings, shared trade offers).

### Phase 5: Polish & Optimization (Weeks 9–10)
- [ ] Performance profiling and optimization (culling, LOD, batching).
- [ ] Accessibility audit (color contrast, keyboard nav, alt text).
- [ ] Mobile testing on real devices (iPhone, Android tablets).
- [ ] User testing with new players (onboarding, confusion points).

### Phase 6: Launch Prep (Week 11–12)
- [ ] Sound design integration (turn alert, action feedback, notifications).
- [ ] Animation polish (fleet movement, production bar fill, transitions).
- [ ] Server-side rate limiting and validation (prevent turn-counter cheats).
- [ ] Launch documentation and help systems.

---

## 6. Success Metrics

**Playability:**
- New player can complete first turn in < 2 minutes without help.
- Expert player can execute 10 actions in < 3 minutes.

**Clarity:**
- 95% of players correctly recall their turn counter without glancing at HUD.
- 90% understand why an action is disabled (tooltip explains turn/resource cost).

**Responsiveness:**
- Galaxy map pans/zooms with no lag (60 FPS on desktop, 30 FPS on mobile).
- DOM HUD updates (resource change, turn spent) visible within 100ms of server confirmation.

**Retention:**
- 50% of day-1 players return on day 2 (engagement metric).
- 70% of day-7 players report they understand the turn economy and empire mechanics.

**Accessibility:**
- Keyboard-only players can navigate all screens without the mouse.
- Color-blind players can distinguish all status states (not relying on color alone).

---

## Appendix: Reference Implementations

### EVE Online: Star Map Lessons
- **Learnings:** Multiple view modes (3D, 2D), layered data overlays (security, sovereignty, activity), search/filter for fast navigation.
- **For Void Market:** Offer sector view (grid) and map view (spatial); let players toggle "threat matrix" and "trade route" overlays.

### Neptune's Pride: Minimalist Elegance
- **Learnings:** Simple star map, animations convey all info, no clutter, diplomacy-first design.
- **For Void Market:** Animated fleet movement arcs, minimal labels on map, alliance chat as a first-class feature.

### OGame: Information Architecture
- **Learnings:** Hierarchical drilling (Empire → Planet → Building), persistent resource panel, production queue visualization.
- **For Void Market:** Reuse the sector/planet drill-down; add animated production queues.

---

## Document Version & Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-17 | Mario | Initial UX research and design brief. |

---

**Next Steps:**
1. Review this brief with the team (Gately, Joelle, Marathe).
2. Prototype the galaxy map and HUD in PixiJS.
3. User test with a cohort of 5–10 players to validate information hierarchy.
4. Iterate on mobile responsiveness and accessibility.

**Questions or Feedback?**  
Ping Mario in the #void-market channel or review the decisions log at `.squad/decisions.md`.
