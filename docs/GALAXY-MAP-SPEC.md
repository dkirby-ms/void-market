# Galaxy Map — Interaction Spec & Wireframes

**Document:** Galaxy Map interaction design specification  
**Author:** Mario (UX Consultant)  
**Date:** 2026-03-17  
**Scope:** P1-25 — Galaxy map zoom levels, sector hover states, click targets, information density  
**Reference:** [UX-BRIEF.md](./UX-BRIEF.md), [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)

---

## 1. Overview

The Galaxy Map is the primary navigation hub in Void Market. With **500 procedurally-generated sectors** and a persistent, player-driven economy, the map must scale elegantly across three zoom levels while maintaining clarity and responsiveness on mobile (375px) through desktop (1024px+).

**Design Principles:**
- **Progressive Disclosure:** Information revealed on demand; base view uncluttered.
- **Spatial Hierarchy:** Zoom level determines visual complexity and interaction density.
- **Mobile-First:** Touch-friendly targets (≥44px per WCAG 2.1), adaptive layouts for small screens.
- **Information Density Control:** Text, labels, and details only shown when relevant to the current zoom and device.

---

## 2. Zoom Level Architecture

### 2.1 Galaxy View (Zoomed Out)

**Visual State:** All 500 sectors visible; minimal labels; cluster patterns emerge.

**Rendering:**
```
┌─────────────────────────────────────────────────────┐
│  ★ (stars)                                          │
│                                                     │
│    ● ● ●  (sectors, 3-4px radius, color-coded)    │
│  ●   ●  ●                                          │
│   ● ●    ●  (warp routes: thin lines, 20% opacity)│
│    ●  ● ●                                          │
│  ●  ●   ● ●  (no labels; only colors visible)      │
│    ●   ●    ●                                      │
│  ●●   ●                                            │
│                                                     │
│ [Controls: Zoom buttons (TL), Legend (BL), Pan]    │
└─────────────────────────────────────────────────────┘
```

**Sector Appearance:**
- **Neutral (no player):** zinc-700 (#3F3F46), 3–4px radius
- **Controlled (player-owned):** Player color (red/blue/green) + 20% glow, 3–4px radius
- **Current Location:** Pulsing glow (2s cycle, 30% brightness increase on pulse)

**Information Shown:**
- Sector color only (no labels, no metadata)
- Warp routes: thin violet lines (20% opacity, 1px stroke)
- Cluster patterns: player-controlled regions visible as colored groups
- Star field: white dots with 30% opacity, random sizes 0–1.5px (procedural background)

**Click Targets:**
- Minimum: 44px diameter at screen level (scaled to 6–8px on canvas due to zoom factor)
- Spacing: Sectors positioned to maintain ≥8px gaps on Galaxy view

**Hover/Interaction:**
- **Hover (Desktop):** No visual change at Galaxy zoom; tooltip suppressed to avoid clutter.
- **Tap (Mobile):** No feedback; tap advances to Region View.

**Use Cases:**
- Quick overview of empire distribution and territorial control.
- Identify general warp route topology.
- Locate home sector among 500 candidates (via color and pulsing glow).

---

### 2.2 Region View (Medium Zoom)

**Visual State:** ~50–100 sectors visible; sector IDs shown; port indicators visible; warp routes highlighted.

**Rendering:**
```
┌──────────────────────────────────────────────────────┐
│  [Control: Zoom Out]                   [Zoom In]     │
│                                                      │
│        5───9───14                                    │
│        │   │   │                                     │
│    ●─3─┘   ├─11─┐                                   │
│    │       │    │   (sector nodes 6–8px,            │
│    │  ●─7──┴─13─●   IDs below, 10px text, zinc-300)│
│    │  │    │                                        │
│    ●─2─●─6─┤   ●   (warp routes: violet lines,      │
│        │    │ ╱     2px stroke, 60% opacity)        │
│        1───4──●                                      │
│        │    │ ╲     Port indicator: dot on sector   │
│        ●─8──┤  ●    (colored: red=fuel, green=org,  │
│             │       blue=equip, multi=port)         │
│    [Legend: Colors]                                 │
│                                                      │
│    [Info Panel: Sector 5, Port Type: Fuel]         │
│    [Owned by: Player Blue, Pop: 3 ships]           │
└──────────────────────────────────────────────────────┘
```

**Sector Appearance:**
- **Default:** 6–8px radius, zinc-700, ID label below (10px, zinc-300)
- **Controlled:** Player color + subtle glow, ID label white
- **Current Location:** Pulsing glow (2s cycle), ring highlight

**Information Shown:**
- Sector ID (numeric label, e.g., "5", "42", "127")
- Port indicator: small colored dot on sector node
  - Red: Fuel Ore port
  - Green: Organics port
  - Blue: Equipment port
  - Multi-color dot: Mixed port (rare)
- Player-owned flag: sector tinted to player color
- Mini player count (badge, e.g., "3 ships") if current player's perspective
- Warp routes: highlighted as violet lines (60% opacity, 2px stroke)

**Click Targets:**
- Minimum: 44px diameter at screen level
- Sector node radius: 6–8px on canvas, scales up on hover
- Touch-safe spacing: ≥8px between sector centers

**Hover/Interaction:**
- **Hover (Desktop):** 
  - Sector enlarge + glow (scale to 10–12px, violet-400 ring 2px)
  - Tooltip appears (300ms delay): sector ID, port type, owner, player count
  - Warp routes from/to this sector brighten (100% opacity)
- **Tap (Mobile):**
  - Tap triggers sector selection (highlighting + info panel opens at bottom)
  - Tap-and-hold (500ms) shows tooltip (bottom sheet on mobile, standard tooltip on tablet)

**Hover Tooltip Content:**
```
┌─────────────────────────────┐
│ Sector 42                   │
│ Port: Fuel Ore              │
│ Owner: Player Red           │
│ Ships: 2 | Structures: 1    │
│ (Tap for details)           │
└─────────────────────────────┘
```

**Use Cases:**
- Navigate to a specific sector by ID and port type.
- Identify trading opportunities (see which ports are nearby).
- Plan fleet movement (warp routes now visible and navigable).
- Scout neighboring sectors before commitment.

---

### 2.3 Sector View (Zoomed In)

**Visual State:** ~10–20 sectors visible in full detail; labels readable; individual objects distinguishable.

**Rendering:**
```
┌──────────────────────────────────────────────────────────┐
│ [Zoom Out]                                      [Zoom In]│
│                                                          │
│      Sector 42                    Sector 47             │
│      Fuel Ore Port                Equipment Port        │
│      Owner: Red | 3 ships         Owner: Blue | 1 ship  │
│                                                          │
│      ◆ (sector node, 12–16px)                           │
│     /│\                                                 │
│    / │ \  Warp route #1 (labeled)                       │
│   /  │  \          ▲ Sector 5                           │
│  ◆───┼───◆ ─────→  ◆ (Organics, Owner: Green)          │
│   \  │  /          ◆ Sector 8 (Neutral)                │
│    \ │ / Warp route #2                                 │
│     \│/           [Ship: Fighter x2, Cruiser x1]       │
│      ◆ Sector 37  [Located at: Sector 42]              │
│ Neutral            [Status: Refueling]                 │
│                                                          │
│ [Selected Sector Detail Panel (Right/Bottom)]           │
│ ├─ Sector 42 (Fuel Ore Port)                            │
│ ├─ Owner: Red | Ships: 3 | Defense: Strong             │
│ ├─ Resources: Fuel 1000/1000 | Trade Offer: Y           │
│ └─ Warp Routes: 5, 8, 47 (tap to jump)                 │
└──────────────────────────────────────────────────────────┘
```

**Sector Appearance:**
- **Default:** 12–16px radius, zinc-700, full label (14px, zinc-300)
- **Controlled:** Player color + glow, label white
- **Current Location:** Pulsing glow, bright ring
- **Selected:** Bright ring (violet-400, 3px), sector info panel opens

**Information Shown:**
- **Sector ID & Name** (e.g., "Sector 42")
- **Port Type:** Text label (e.g., "Fuel Ore Port", "Equipment Port", "Neutral")
- **Owner:** Player name and color
- **Player Count:** Ship count, player names if multiple players present
- **Warp Routes:** Numbered arcs showing connected sectors (route #1, #2, etc.)
- **Warp Route Labels:** Sector IDs of connected sectors (e.g., "→ Sector 5", "→ Sector 8")
- **Player Ships:** Triangle icons (violet-400) with cargo/composition badge (e.g., "F2 C1" = 2 Fighters, 1 Cruiser)
- **Structures:** Small icons for outposts, mining stations, etc.

**Click Targets:**
- **Sector Node:** 44px minimum (12–16px on canvas, easily selectable)
- **Warp Route Labels:** 44px tap target around each connection
- **Ship Icon:** 44px touch-safe area
- **Info Panel Button:** 48px minimum height for "Trade", "Scout", "Send Fleet" actions

**Hover/Interaction:**
- **Hover (Desktop):**
  - Sector enlarge (scale to 18–20px, violet glow)
  - Warp routes from this sector brighten and show destination sector IDs
  - Info tooltip shows (instant, no delay)
  - Nearby warp route labels brighten
- **Tap (Mobile):**
  - Sector selected (ring highlight, info panel slides up from bottom)
  - Warp routes from this sector highlight
  - Bottom sheet shows full sector detail (see Section 4.2)

**Interactive Warp Routes:**
- **Hover on route line:** Route path brightens, destination sector highlights
- **Hover on route label (e.g., "→ Sector 5"):** Shows quick preview: "Sector 5 — Organics, Owner: Green"
- **Click route label:** Fast-jump confirmation (if fleet ready) or zooms to destination sector

**Selection State:**
- Clicked sector shows a bright violet ring (3px, 100% opacity)
- Sector detail panel opens on right (desktop) or slides up from bottom (mobile)
- Can click another sector to switch selection without closing panel
- Warp routes from selected sector remain highlighted until deselected

**Use Cases:**
- **Detailed Planning:** See all adjacent sectors before committing a fleet to a warp route.
- **Trading Scout:** Check port types, ownership, and current trade offers in a region.
- **Defense Assessment:** Evaluate fleet strength in nearby sectors (threat matrix).
- **Route Navigation:** Visually plan multi-hop journeys (e.g., Sector 42 → Sector 5 → Sector 11).

---

## 3. Interaction States

This section defines visual and behavioral feedback for sector interactions across all zoom levels.

### 3.1 Default State

**Sector Node:**
- **Size:** 3–4px (Galaxy), 6–8px (Region), 12–16px (Sector)
- **Color:** zinc-700 (#3F3F46) for neutral, player color for controlled
- **Opacity:** 100%
- **Glow:** None (unless current location)

**Warp Routes:**
- **Stroke:** violet-500 (#8B5CF6), 20% opacity (Galaxy), 60% opacity (Region/Sector)
- **Thickness:** 1px (Galaxy), 2px (Region), 2px (Sector)

**Labels:**
- **Sector ID/Name:** Hidden (Galaxy), shown (Region/Sector), 10–14px, zinc-300 or white
- **Port Type:** Hidden (Galaxy), shown (Region as icon, Sector as text)
- **Owner Info:** Hidden (Galaxy/Region), shown (Sector, small badge)

### 3.2 Hover State (Desktop)

**On Sector Node:**
1. **Enlarge:** Scale from base size to +50% (e.g., 6px → 9px, 12px → 18px)
2. **Glow:** Add violet-400 (#A78BFA) stroke, 2px, 100% opacity
3. **Pulse Animation:** Optional subtle pulse (0.5s breathe cycle) if current location
4. **Tooltip Delay:** 300ms before tooltip appears (to avoid flashing on quick hovers)

**Tooltip Content & Positioning:**
- **Position:** Offset 8px above and right of sector node, avoid edges
- **Max Width:** 250px (responsive, shrink on mobile)
- **Styling:** 
  - Background: zinc-900/95 with backdrop blur
  - Border: 1px zinc-700
  - Padding: 12px
  - Border Radius: 8px
  - Text: white (14px) + zinc-400 (12px for metadata)

**On Warp Route:**
- **Brightness:** Route line brightens to 100% opacity (from base 20–60%)
- **Destination Glow:** Connected sector node glows (violet-400, 2px ring)
- **Route Labels:** Brighten and show connected sector ID

**On Info Panel (Sector Detail):**
- **Panel Header:** Brighten background (zinc-800/80 → zinc-800/100)
- **Buttons ("Trade", "Send Fleet", etc.):** Background shifts zinc-700 → violet-500/30, text brightens
- **Section Collapse/Expand Arrows:** Show on hover

### 3.3 Selected State

**On Sector Node:**
- **Ring:** Bright violet-400 (#A78BFA) ring, 3px, 100% opacity
- **Scale:** Slightly enlarged (1.1x base size for visual emphasis)
- **Persistence:** Remains highlighted until another sector is clicked or panel is closed

**Info Panel (Sector Detail):**
- **Header:** Solid violet-500/50 background
- **Border:** Left border (4px, violet-500) for visual accent
- **Content:** Full sector detail visible (see Section 4)
- **On Mobile:** Panel is bottom sheet, taking up lower 50–70% of screen

**Related Sectors (Connected by Warp Route):**
- **Routes:** Routes from selected sector brighten and remain visible
- **Connected Sectors:** Show subtle highlight or pulse to indicate "connected to selected"

### 3.4 Current Location State

**On Player's Current Sector:**
- **Pulse Animation:** 2s breathe cycle, scaling from base to +20% and back
- **Glow:** Permanent violet-400 glow (40% opacity), distinct from hover
- **Indicator Icon:** Optional badge "You are here" or small home icon (✦) at sector center
- **Priority:** Current location visible at all zoom levels (no hiding)

**On Entry to Sector:**
- **Transition Animation:** 0.5s scale-in of sector (small to full size) with fade-in
- **Audio Feedback:** Optional subtle chime sound effect

### 3.5 Warp Route Interaction

**Unselected Route:**
- **Display:** Thin violet line, 20–60% opacity (zoom-dependent)
- **Labels:** Faint (zinc-500), only shown at Sector zoom level

**On Hover (Route Line or Label):**
- **Route Line:** Brighten to 100% opacity, thickness +1px for emphasis
- **Destination Sector:** Highlight with violet glow
- **Route Labels:** Brighten (zinc-300) and show full destination info: "Sector 42 — Fuel Ore, Owner: Blue"

**On Click (Route Label):**
- **If Fleet Selected:** Show confirmation: "Send fleet to Sector 42? Cost: 1 turn"
- **If No Fleet:** Zoom to destination sector (Region/Sector view)
- **Visual Feedback:** Brief highlight flash (200ms) on clicked route

**Multi-Hop Preview:**
- On region/sector view: Routes from current sector are highlighted
- On hover over a connected sector: Routes from *that* sector preview (showing two hops ahead)
- Helps players plan multi-jump journeys

---

## 4. Information Density Spec

### 4.1 Galaxy View — Minimal

**Rendered Elements:**
- Background stars (procedural, ~100–200 visible stars at any zoom, 0–1.5px white dots)
- Sector nodes (3–4px dots, color-coded)
- Warp routes (thin lines, 1px, violet-500 20% opacity)
- Control overlays (zoom buttons, legend, pan controls)

**Not Shown:**
- Sector IDs or names
- Port indicators
- Fleet or structure icons
- Player names or resource counts
- Labels of any kind

**Cognitive Load:** Minimal. Player sees only:
1. Overall territorial distribution (colored regions)
2. Warp route topology (connection patterns)
3. Current location (pulsing highlight)

**Use Case:** "Where is my home sector?" / "What does the galaxy look like?"

---

### 4.2 Region View — Balanced

**Rendered Elements:**
- Sector nodes (6–8px), ID labels (10px, zinc-300/white)
- Warp routes (2px, violet 60% opacity)
- Port indicators (small colored dots: red/green/blue)
- Current location highlight (pulsing glow)
- Hover tooltip (on demand)

**Shown on Hover:**
- Expanded tooltip: Sector ID, Port Type, Owner, Player Count

**Not Shown (Unless Requested):**
- Full fleet composition
- Resource counts
- Detailed structure list
- Alliance status

**Cognitive Load:** Moderate. Player sees:
1. Sector IDs (navigation reference)
2. Port types (trading opportunity indicator)
3. Basic ownership (color)
4. Hover tooltips for deeper detail

**Information Grouping:**
| Category | Shown | Hidden |
|----------|-------|--------|
| Sector ID | ✓ | — |
| Port Type | ✓ (color dot) | Full name (shown in tooltip) |
| Owner | ✓ (color) | Player name (shown in tooltip) |
| Fleets | — | ✓ |
| Resources | — | ✓ |
| Structures | — | ✓ |

**Use Case:** "I need to find a Fuel Ore port near me" / "Which sectors belong to Player Blue?"

---

### 4.3 Sector View — Detailed

**Rendered Elements:**
- Sector nodes (12–16px), full labels (14px): "Sector 42", "Fuel Ore Port"
- Port type text label
- Owner name (small badge or text)
- Warp routes (numbered, 2px, violet 100% opacity)
- Destination sector IDs on routes
- Fleet icons (triangle shapes, colors)
- Fleet composition badges (e.g., "F2 C1" = 2 Fighters, 1 Cruiser)
- Structures (small icons for outposts, etc.)
- Info panel (right/bottom sheet)

**Info Panel Content (Detailed List):**
```
┌────────────────────────────┐
│ Sector 42                  │
│ Fuel Ore Port              │
├────────────────────────────┤
│ Owner: Red Player          │
│ Status: Safe              │
│ Ships in Sector: 3        │
│ Ships at Port: 1          │
├────────────────────────────┤
│ Port Capacity: 1000       │
│ Fuel in Stock: 500        │
│ Trade Offers: 2           │
│ ▼ View Trades             │
├────────────────────────────┤
│ ⚔ Defense: Strong         │
│ Garrison: 2 Cruisers      │
│ Defense Structures: 2     │
├────────────────────────────┤
│ Warp Routes:              │
│ → Sector 5 (Org)          │
│ → Sector 8 (Equip)        │
│ → Sector 47 (Fuel)        │
├────────────────────────────┤
│ [Send Fleet]  [Trade]     │
│ [Scout]       [Build]     │
└────────────────────────────┘
```

**Cognitive Load:** High, but organized. Player sees:
1. **Sector Identity:** ID, port type, owner
2. **Fleet & Structure Data:** Ships, garrison, structures
3. **Economy Data:** Resources, trade offers
4. **Navigation:** Warp routes with destination info
5. **Actions:** Buttons for trading, scouting, building, sending fleets

**Information Grouping:**
| Section | Content |
|---------|---------|
| **Header** | Sector ID, Port Type, Owner, Status |
| **Economy** | Resources in stock, Trade Offers |
| **Defense** | Garrison ships, Defense structures |
| **Navigation** | Warp routes with destination sectors |
| **Actions** | Contextual buttons (Trade, Scout, Send Fleet, Build) |

**Collapsible Sections (Mobile):**
On mobile, sections can collapse to conserve vertical space:
```
▼ Sector 42 (always visible header)
▸ Economy (collapsed)
▸ Defense (collapsed)
▼ Navigation (expanded by default)
```

**Use Case:** "I want to trade with this port" / "How many ships defend this sector?" / "Where can I go from here?"

---

## 5. Mobile Adaptations (375px Baseline)

### 5.1 Touch Interactions

**Tap vs. Hover:**
- **Tap (single):** Selects sector and opens info panel.
- **Tap and Hold (≥500ms):** Shows tooltip (bottom sheet on mobile).
- **Double-Tap:** Zoom in to next level (if available).
- **No Hover:** Pointer-hover interactions disabled on mobile; replaced with tap states.

**Multi-Touch Gestures:**
- **Pinch-to-Zoom:** Two-finger pinch expands/contracts map zoom (Galaxy ↔ Region ↔ Sector).
- **Two-Finger Pan:** Drag with two fingers to pan map (in addition to one-finger drag).
- **Long-Press:** 500ms press on a sector shows action menu: "Select | Scout | Info" (bottom sheet).

### 5.2 Touch Target Sizing

**Minimum Sizes (WCAG 2.1 AA):**
- **Sector Node:** 44px diameter at screen level (scales down on canvas due to zoom)
- **Warp Route Touch Target:** 44px radius around route line for tapping
- **UI Buttons:** 44–48px height (padding: 12px vertical, 16px horizontal)
- **Panel Controls:** 44px touch targets (close button, collapse arrow, action buttons)

**Spacing:**
- **Between Sectors:** ≥8px gaps to prevent accidental taps on adjacent sectors
- **Button Spacing:** ≥12px margin between touch controls

### 5.3 Information Architecture

**Galaxy View (375px):**
```
┌──────────────────────────┐
│ [≡] Void Market  [?]     │  ← Header (fixed, 56px)
├──────────────────────────┤
│                          │
│   Galaxy Map            │  ← Full-screen canvas
│   (500 sectors visible)  │
│   (no labels)            │
│                          │
├──────────────────────────┤
│ [⊕] [⊖]  [↺]  [⊙]       │  ← Controls (fixed, 44px)
│ (Zoom In, Out, Reset,    │
│  Full-Screen Toggle)     │
└──────────────────────────┘
```

**Region View (375px):**
```
┌──────────────────────────┐
│ [←] Region View  [?]     │  ← Header (fixed, 56px)
├──────────────────────────┤
│                          │
│   Galaxy Map             │  ← Zoomable canvas, 50 sectors
│   (tap sector for detail)│
│                          │
│                          │
│                          │
├──────────────────────────┤
│ [⊕] [⊖]  [↺]  [⊙]       │  ← Controls (fixed, 44px)
└──────────────────────────┘

[Bottom sheet: Tapped sector info]
┌──────────────────────────┐
│ — Sector 42 —            │  ← Drag handle
├──────────────────────────┤
│ Fuel Ore Port            │
│ Owner: Red Player        │
│ Ships: 3                 │
│ Warp Routes: 5, 8, 47    │
├──────────────────────────┤
│ [Trade]  [Scout]         │  ← Action buttons
│ [Send Fleet]  [Build]    │
└──────────────────────────┘
```

**Sector View (375px):**
```
┌──────────────────────────┐
│ [←] Sector 42  [⋯]       │  ← Header (fixed, 56px)
├──────────────────────────┤
│                          │
│   Sector Map             │  ← ~10–20 sectors, full detail
│   (20 sectors zoomed in) │
│   (interactive routes)   │
│                          │
│                          │
├──────────────────────────┤
│ [⊕] [⊖]  [↺]  [⊙]       │  ← Controls (fixed, 44px)
└──────────────────────────┘

[Bottom sheet: Sector detail (collapsible)]
┌──────────────────────────┐
│ — Sector 42 —            │  ← Drag handle
├──────────────────────────┤
│ ▼ Economy                │  ← Collapsible
│   Fuel: 500/1000         │
│   Trade Offers: 2        │
│ ▸ Defense (collapsed)    │
│ ▼ Navigation             │
│   → Sector 5 (Org)       │
│   → Sector 8 (Equip)     │
├──────────────────────────┤
│ [Trade]  [Scout]         │  ← 44px buttons
└──────────────────────────┘
```

### 5.4 Bottom Sheet Interactions

**Sector Detail Sheet:**
- **Trigger:** Tap on a sector node
- **Initial State:** Slides up, covering lower 50–70% of screen
- **Content:** Collapsible sections (Economy, Defense, Navigation)
- **Drag Handle:** Visual bar at top (—) for dragging to resize or close
- **Close:** Swipe down or tap outside (map) to dismiss
- **Persistence:** Stays open when panning/zooming map (user can re-examine)

**Tooltip Sheet:**
- **Trigger:** Tap-and-hold (≥500ms) on sector or warp route
- **Content:** Quick summary (Sector ID, Port Type, Owner, Ships)
- **Duration:** Remains until user taps elsewhere
- **Behavior:** Tap another sector = update sheet to new sector's info

### 5.5 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| **Mobile** | 375–639px | Full-screen map, bottom sheet for details, vertical button stack |
| **Tablet** | 640–1023px | Map + side panel (30% width), info panel on right, horizontal button layout |
| **Desktop** | 1024px+ | Map + full HUD overlay, info panel fixed right, advanced controls visible |

---

## 6. Click Target Sizing & Accessibility

### 6.1 WCAG 2.1 Compliance

**Minimum Touch Target Size:** 44×44px (at screen level per WCAG 2.1 Level AAA)

**Sector Nodes:**
- **Galaxy View:** 3–4px radius (canvas), but scaled to 44px on touchscreen via expanded tap zones
- **Region View:** 6–8px radius (canvas), 44px tap zone overlay ensures accessibility
- **Sector View:** 12–16px radius (canvas), 44px tap zone overlay

**Implementation Strategy:**
```typescript
// On mobile: expand tap zones invisibly
const getTapZone = (canvasRadius: number) => {
  const minRadius = 22; // 44px diameter = 22px radius
  return Math.max(canvasRadius, minRadius);
};

// On hover: scale sector node for visual feedback
const onHover = (sector) => {
  const newRadius = Math.min(sector.radius * 1.5, 22);
  sector.scale = newRadius / sector.baseRadius;
};
```

**UI Buttons & Controls:**
- **Zoom Buttons:** 44×44px minimum, 8px spacing
- **Action Buttons:** 44–48px height, full width on mobile, 20% width on desktop
- **Close/Back Buttons:** 44×44px
- **Info Panel Header:** 56px height (includes close button at 44×44px)

### 6.2 Spacing & Proximity

**Sector Node Gaps:**
- Minimum 8px gap between adjacent sector centers on Galaxy/Region views
- On Sector view: gaps expand as zoom increases, ensuring no accidental selection

**Button Spacing:**
- 12px margin between adjacent buttons
- 16px padding inside buttons (vertical) to ensure readable text

**Panel Spacing:**
- Top margin: 16px (avoids status bar on mobile)
- Left/Right margin: 12px (mobile), 24px (tablet+)
- Section dividers: 12px gap with 1px border

### 6.3 Focus & Keyboard Navigation

**Keyboard Navigation (Desktop):**
- **Tab:** Move focus between sectors (map) and UI controls
- **Arrow Keys:** Navigate adjacent sectors on map
- **Enter/Space:** Select focused sector (open detail panel)
- **Escape:** Close detail panel, return to map

**Focus Indicators:**
- **Default:** 3px ring-ring/50 (oklch(0.439 0 0)) per DESIGN-SYSTEM.md
- **Visible:** Always visible on focus-visible (not on pointer-click, only on keyboard)
- **Contrast:** 4.8:1 minimum (AA compliance)

**Screen Reader Support:**
- All sector nodes have aria-label: `"Sector 42, Fuel Ore, Owner Red Player, 3 ships"`
- Buttons have descriptive text: "Send Fleet to Sector 42" (not just "Send")
- Live regions announce state changes: "Sector 42 selected" (aria-live="polite")
- Navigation breadcrumbs: "Galaxy › Region › Sector 42"

---

## 7. Color Palette & Visual Hierarchy

All colors from [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) Section 15.

### 7.1 Sector Node Colors

| State | Neutral | Red Player | Blue Player | Green Player |
|-------|---------|-----------|-----------|-------------|
| **Default** | zinc-700 (#3F3F46) | red-600 + 20% glow | blue-600 + 20% glow | green-600 + 20% glow |
| **Hover** | violet-400 (#A78BFA) ring | violet-400 ring + glow | violet-400 ring + glow | violet-400 ring + glow |
| **Selected** | violet-400 ring (3px) | violet-400 ring (3px) | violet-400 ring (3px) | violet-400 ring (3px) |
| **Current Location** | violet pulse (2s cycle) | violet pulse (2s cycle) | violet pulse (2s cycle) | violet pulse (2s cycle) |

### 7.2 Line & Route Colors

| Element | Color | Opacity | Context |
|---------|-------|---------|---------|
| **Warp Route (default)** | violet-500 (#8B5CF6) | 20% | Galaxy |
| **Warp Route (default)** | violet-500 (#8B5CF6) | 60% | Region/Sector |
| **Warp Route (hover)** | violet-500 (#8B5CF6) | 100% | All (on hover) |
| **Warp Route (selected)** | violet-400 (#A78BFA) | 100% | Sector (route from selected sector) |
| **Tooltip Border** | zinc-700 (#3F3F46) | 100% | All |

### 7.3 Text Hierarchy

| Level | Color | Size | Weight | Use Case |
|-------|-------|------|--------|----------|
| **Primary** | white / zinc-50 (#FAFAFA) | 14px | 500 | Sector ID, Port Type, Owner name |
| **Secondary** | zinc-400 (#A1A1AA) | 12px | 400 | Metadata, labels (e.g., "Ships: 3") |
| **Tertiary** | zinc-500 (#71717A) | 10px | 400 | Minor details, timestamps |
| **Accent** | violet-400 (#A78BFA) | 14px | 500 | Highlights, selected state |

### 7.4 Accessibility Contrast Ratios

| Combination | Ratio | WCAG Level |
|-----------|-------|-----------|
| white on zinc-950 | 19:1 | AAA |
| zinc-400 on zinc-950 | 5.8:1 | AA |
| violet-500 on zinc-950 | 4.6:1 | AA |
| violet-400 on zinc-950 | ~5.2:1 | AA |

---

## 8. Animation & Feedback

### 8.1 Transitions

| Action | Duration | Easing | Effect |
|--------|----------|--------|--------|
| **Sector hover** | 200ms | ease-out | Scale 1.0 → 1.5, opacity 100% → 100%, glow fade-in |
| **Sector select** | 100ms | ease-out | Ring appears, scale 1.0 → 1.1 |
| **Current location pulse** | 2s | ease-in-out | Scale 1.0 → 1.2 → 1.0 (infinite loop) |
| **Panel slide-up (mobile)** | 300ms | ease-out-cubic | Bottom sheet slides from bottom to 50% height |
| **Warp route brighten** | 150ms | ease-out | Opacity 20/60% → 100%, stroke thickness +1px |
| **Zoom transition** | 400ms | ease-in-out | Map smoothly scales, sectors fade in/out |
| **Tooltip fade-in** | 150ms | ease-out | Opacity 0 → 100% (after 300ms delay) |

### 8.2 Audio Feedback (Optional)

- **Sector Selection:** Subtle click sound (50–100ms, low frequency)
- **Warp Route Activation:** Soft beep (70ms, mid frequency)
- **Panel Open (Mobile):** Quiet whoosh (200ms)
- **Alert/Notification:** Brief chime (if resources/turns updated)

---

## 9. Information Density Summary Table

| Data Point | Galaxy | Region | Sector |
|-----------|--------|--------|--------|
| Sector ID | ✗ | ✓ | ✓ |
| Port Type | Color only | Dot + tooltip | Text label |
| Owner | Color only | Color + tooltip | Name + badge |
| Player Count | ✗ | Tooltip | Info panel |
| Fleet Ships | ✗ | ✗ | Icons + badge |
| Structures | ✗ | ✗ | Icons list |
| Resources | ✗ | ✗ | Info panel |
| Trade Offers | ✗ | ✗ | Info panel |
| Defense Info | ✗ | ✗ | Info panel |
| Warp Routes | Lines only | Lines + IDs (hover) | Numbered + labels |

---

## 10. Implementation Checklist

### Rendering & Canvas (PixiJS)

- [ ] **Sector Nodes:**
  - [ ] Base rendering at 3–4px (Galaxy), 6–8px (Region), 12–16px (Sector)
  - [ ] Color mapping: neutral (zinc-700), player colors, hover state (violet), selection (bright violet ring)
  - [ ] Glow effect on player-controlled sectors (20% brightness + soft shadow)
  - [ ] Pulsing animation for current location (2s breathe cycle)

- [ ] **Warp Routes:**
  - [ ] Line rendering: violet-500, configurable opacity (20/60/100%) and thickness (1–2px)
  - [ ] Hover brightness transition (150ms ease-out)
  - [ ] Route numbering/labeling in Sector view

- [ ] **Labels & Text:**
  - [ ] Sector ID labels (zoom-dependent visibility: hidden Galaxy, shown Region+)
  - [ ] Port type labels (Sector view only)
  - [ ] Owner badges (small text, Sector view)
  - [ ] Fleet composition badges (e.g., "F2 C1")

- [ ] **Background:**
  - [ ] Star field (procedural white dots, 0–1.5px, 30% opacity, ~100–200 stars visible at any zoom)
  - [ ] Smooth background color (zinc-950 #0A0A0A)

### Interactive Behavior

- [ ] **Hover (Desktop):**
  - [ ] Sector enlarge + glow + tooltip (300ms delay)
  - [ ] Warp route brighten on hover
  - [ ] Tooltip content: Sector ID, Port, Owner, Ships, "Tap for details"

- [ ] **Selection (Tap/Click):**
  - [ ] Sector highlight with ring
  - [ ] Info panel open (right panel desktop, bottom sheet mobile)
  - [ ] Persist selection until user closes panel

- [ ] **Warp Route Interaction:**
  - [ ] Hover shows destination sector preview
  - [ ] Click on route label confirms/zooms to destination
  - [ ] Multi-hop preview (show two hops ahead on hover)

- [ ] **Touch Gestures (Mobile):**
  - [ ] Single tap: select sector, open info panel
  - [ ] Tap-and-hold (500ms): show tooltip bottom sheet
  - [ ] Double-tap: zoom in to next level
  - [ ] Pinch-to-zoom: scale map
  - [ ] Two-finger pan: drag map

### Panels & HUD

- [ ] **Info Panel (Desktop):**
  - [ ] Position: right side, fixed or sticky (60% width)
  - [ ] Header: Sector name, close button (X)
  - [ ] Sections: Economy, Defense, Navigation, Actions
  - [ ] Buttons: Trade, Scout, Send Fleet, Build (44–48px height each)
  - [ ] Responsive: collapse sections on narrow screens

- [ ] **Bottom Sheet (Mobile):**
  - [ ] Position: lower 50–70% of screen
  - [ ] Drag handle at top (—)
  - [ ] Collapsible sections with expand/collapse arrows (▸/▼)
  - [ ] Swipe-down or outside-tap to dismiss
  - [ ] Persistence across map panning

- [ ] **Control Overlays:**
  - [ ] Zoom buttons (+/−, 44×44px each, 8px spacing)
  - [ ] Reset view button (↺, 44×44px)
  - [ ] Full-screen toggle (⊙, 44×44px)
  - [ ] Legend panel (bottom-left, glass morphism styling)
  - [ ] Mobile: stack controls vertically on bottom

- [ ] **Tooltips:**
  - [ ] Fade-in animation (150ms, after 300ms delay)
  - [ ] Positioning: above/right of target, avoid edges
  - [ ] Dismiss: click elsewhere, timeout (3s idle)

### Accessibility

- [ ] **Keyboard Navigation:**
  - [ ] Tab through sectors and UI controls
  - [ ] Arrow keys navigate adjacent sectors
  - [ ] Enter/Space select sector
  - [ ] Escape close panel

- [ ] **Focus Indicators:**
  - [ ] 3px ring-ring/50 (oklch(0.439 0 0)) on focus-visible
  - [ ] Never remove focus ring

- [ ] **Screen Reader Support:**
  - [ ] aria-label on all sector nodes
  - [ ] aria-label on UI buttons
  - [ ] Live regions for state announcements
  - [ ] Semantic HTML structure

- [ ] **Touch Targets:**
  - [ ] All interactive elements ≥44×44px on mobile
  - [ ] Sufficient spacing (≥8px gaps between sectors, ≥12px between buttons)

- [ ] **Color Independence:**
  - [ ] Port types indicated by both color AND icon/text
  - [ ] Status conveyed via icon + label, not color alone

### Responsive Design

- [ ] **Mobile (375px):**
  - [ ] Full-screen map, no HUD overlay
  - [ ] Bottom sheet for sector detail
  - [ ] Vertical button stacks (44–48px height each)
  - [ ] Collapse info sections to conserve space

- [ ] **Tablet (640–1023px):**
  - [ ] Map + side panel (30% width)
  - [ ] Info panel on right side
  - [ ] Horizontal button layout where space permits

- [ ] **Desktop (1024px+):**
  - [ ] Map + fixed right panel
  - [ ] HUD overlay top-right (empire status)
  - [ ] Advanced controls visible
  - [ ] Max-width constraints (map ≤ 1600px)

---

## 11. Design Tokens Reference

For implementation, use tokens from [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) and [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) Section 18.1:

```typescript
// PixiJS color mapping
const colors = {
  // Neutrals
  background: 0x0A0A0A,    // zinc-950
  surface: 0x18181B,       // zinc-900
  border: 0x27272A,        // zinc-800
  
  // Interactive
  primary: 0x8B5CF6,       // violet-500
  primaryLight: 0xA78BFA,  // violet-400
  
  // Status
  statusGreen: 0x22C55E,   // green-500
  statusAmber: 0xEAB308,   // amber-500
  statusRed: 0xDC2626,     // red-600
  
  // Players
  playerRed: 0xDC2626,     // red-600
  playerBlue: 0x3B82F6,    // blue-500
  playerGreen: 0x16A34A,   // green-600
};

// Sector appearance
const sectorRadius = {
  galaxy: 3,     // px
  region: 6,     // px
  sector: 12,    // px
};

// Warp route appearance
const routeStyle = {
  galaxyOpacity: 0.2,
  regionOpacity: 0.6,
  hoverOpacity: 1.0,
  thickness: { galaxy: 1, region: 2, sector: 2 },
};

// Animation timings
const timings = {
  hoverDelay: 300,          // ms
  hoverDuration: 200,       // ms
  pulseInterval: 2000,      // ms
  tooltipTimeout: 3000,     // ms
  touchHoldThreshold: 500,  // ms
};
```

---

## Appendix: Wireframe ASCII Art

### Galaxy View Wireframe
```
┌────────────────────────────────────────────────────────────┐
│ [Void Market] [⊕] [⊖] [↺] [Full Screen] [Legend] [?]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                  ★ (star field)                           │
│                                                            │
│          ●───●───●  (sector nodes, 3-4px)               │
│          │  ●  │  │                                      │
│          ●───●───●  (warp routes, violet 20% opacity)   │
│                                                            │
│  ● ● ●        ●●●                                        │
│  ●●  ●  ●  ●  ●  (500 sectors total, color-coded)      │
│  ●   ●● ● ●    ●                                        │
│      ●  ●●●  ●●                                         │
│                                                            │
│                                                            │
│    Legend: ● Red Player  ● Blue Player  ● Green Player  │
│            ● Neutral                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Region View Wireframe
```
┌────────────────────────────────────────────────────────────┐
│ [← Galaxy] [Region View] [⊕] [⊖] [↺] [?]                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│        Sector 5        Sector 9        Sector 14         │
│        Organics        Neutral         Equipment         │
│        Owner: Green    Owner: None     Owner: Red        │
│                                                            │
│        ●─────●─────●                                     │
│        │     │     │  (Sector nodes 6-8px)             │
│        5     9    14  (IDs shown below)                 │
│        ↓     ↓     ↓  (warp routes, 2px, 60% opacity)   │
│        │ ╱───┴───╲ │  (connected sectors highlighted)   │
│        ●       ●    ●                                    │
│        3       11   47  (port indicators: colored dots)  │
│                                                            │
│  [Sector Info Panel (Hover/Tap)]                          │
│  ┌─────────────────────────────────┐                    │
│  │ Sector 9 — Neutral              │                    │
│  │ Owner: None | Structures: 1     │                    │
│  │ Players: 2 ships                │                    │
│  │ Connected: 5, 11, 14            │                    │
│  │ (Tap for details)               │                    │
│  └─────────────────────────────────┘                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Sector View Wireframe (Desktop)
```
┌──────────────────────────────────┬─────────────────────────┐
│ [← Region] Sector 42 [⋯]         │ Sector 42 Detail Panel  │
├──────────────────────────────────┤                         │
│                                  │ Fuel Ore Port           │
│         Sector 5                 │ Owner: Red Player       │
│         Organics                 │ Ships: 3 | Status: Safe │
│         Owner: Green             │                         │
│         ●                        │ ═════════════════════   │
│        ╱ ╲                       │ ▼ Economy               │
│       ╱   ╲                      │   Fuel: 500/1000        │
│      ●─────●────●               │   Trades: 2 offers      │
│      │  42 │    │               │                         │
│      ●─────●────●               │ ▸ Defense               │
│   8 │ 37 │ 47                   │                         │
│     ╲     ╱   ╱                 │ ▼ Navigation            │
│      ╲   ╱───╱                  │   ► Sector 5 (Org)      │
│       ●                         │   ► Sector 8 (Neutral)  │
│   (Port dot:                    │   ► Sector 47 (Fuel)    │
│    ■ Fuel, ■ Org,              │                         │
│    ■ Equip, ■ Multi)            │ ═════════════════════   │
│                                  │ [Trade] [Scout]         │
│       [Legend]                   │ [Send Fleet] [Build]    │
│       ● Neutral                 │                         │
│       ● Red                      │                         │
│       ● Green                    │                         │
│       ● Blue                     │                         │
│                                  │                         │
└──────────────────────────────────┴─────────────────────────┘
```

### Sector View Wireframe (Mobile)
```
┌────────────────────────┐
│ [←] Sector 42  [⋯]     │  ← Header (56px)
├────────────────────────┤
│                        │
│   Sector Map           │  ← Full-screen canvas
│   (zoomed detail)      │
│   ~10-20 sectors       │
│   visible              │
│                        │
│                        │
│                        │
├────────────────────────┤
│ [⊕] [⊖] [↺] [⊙]       │  ← Controls (44px)
└────────────────────────┘
     
     [Bottom Sheet: Sector 42]
     ┌────────────────────────┐
     │ —— (drag handle)       │
     ├────────────────────────┤
     │ Fuel Ore Port          │
     │ Owner: Red | 3 ships   │
     │                        │
     │ ▼ Economy              │
     │   Fuel: 500/1000       │
     │   Trades: 2            │
     │ ▸ Defense              │
     │ ▼ Navigation           │
     │   → Sector 5 (Org)     │
     │   → Sector 8 (Equip)   │
     │                        │
     │ [Trade]  [Scout]       │
     └────────────────────────┘
```

---

## Document Metadata

- **Version:** 1.0
- **Status:** Draft (Ready for Implementation Review)
- **Related Issues:** #38
- **Branch:** `squad/38-galaxy-wireframes`
- **Next Steps:** Implementation feedback, PixiJS prototype, mobile testing
