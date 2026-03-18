# Trading Flow Wireframes — Void Market

**Design Document:** Issue #39  
**Author:** Mario (UX Designer)  
**Date:** 2026-03-18  
**Scope:** Port detail panel, buy/sell flows, trade confirmation, cargo management, turn cost visibility

---

## Overview

The trading system is the core MVP gameplay loop. This document specifies the wireframes, interaction flows, and turn cost visibility for:

1. **Port Detail Panel** — Inventory, market prices, trading controls
2. **Buy/Sell Interaction Flow** — Step-by-step transaction sequence
3. **Trade Confirmation Dialog** — Verify action, check resources, apply turn cost
4. **Cargo Management View** — Ship cargo capacity, jettison, optimize load
5. **Turn Cost Visibility** — Every trade action annotates its turn cost

**Reference Game Constants:**
- Trade action: **2 turns** (ActionType.Trade)
- Move action: **1 turn** (ActionType.Move)
- Max turn bank: **2,000 turns**
- Turn regeneration: **1 turn every 90 seconds**
- Commodities: Fuel Ore, Organics, Equipment (all tradeable at ports)

---

## 1. Port Detail Panel (Desktop Layout)

The port detail panel is a **glass-morphism card** (80% opacity, 8px blur) anchored to the right side of the galaxy map. Tabs navigate between **Market** (prices/inventory) and **Cargo** (player inventory).

### 1.1 Desktop Port Detail Panel (Market Tab)

```
┌─────────────────────────────────────┐
│ Port: Antares Station      [✕]      │  ← Glass header, drag-to-move
├─────────────────────────────────────┤
│  ⚙ Market  |  📦 Cargo  |  Info     │  ← Tabs (Market active)
├─────────────────────────────────────┤
│                                     │
│  Commodity          Price  Stock    │
│  ┌─────────────────────────────────┐│
│  │ 🔶 Fuel Ore (Sell)               ││
│  │ 45 cr/unit  [1,200 ▼▼▼]         ││  ← Stock bar shows full/empty
│  │ [- 1 +] [Max]  [BUY 100 units]   ││  ← QTY picker + preset buttons
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🟢 Organics (Buy)                ││
│  │ 62 cr/unit  [850 ▼▼▼▼]           ││
│  │ [- 1 +] [Max]  [SELL 50 units]   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🔵 Equipment (Sell)              ││
│  │ 156 cr/unit  [420 ▼▼]            ││
│  │ [- 1 +] [Max]  [BUY 20 units]    ││
│  └─────────────────────────────────┘│
│                                     │
│  Your Credits: 8,500               │
│  Your Cargo: 245/300 units         │  ← Capacity indicator
│                                     │
│  Turns Remaining: 12 (12/2000)      │  ← Always visible, color-coded
│  ┌────────┬────┬──┬──┬──┐           │  ← Progress bar: 1 segment = 100 turns
│  └────────┴────┴──┴──┴──┘           │
│                                     │
└─────────────────────────────────────┘

Legend:
  🔶 = Sell to player (can buy)
  🟢 = Buy from player (can sell)
  🔵 = Sell to player (can buy)
  ▼   = Stock level indicator (high/low/depleted)
```

**Interaction Details:**
- **Quantity Picker:** `-` / `+` spinners, or type directly
- **Preset Buttons:** "Max" adjusts qty to max cargo space (capped by funds)
- **BUY/SELL Button:** Large, color-coded (green for buy, orange for sell), disabled if:
  - Insufficient turns (< 2)
  - Insufficient funds
  - Cargo full (on buy) or empty (on sell)
  - Commodity unavailable at this port

**Hover Tooltips:**
- On "BUY/SELL" button: "This action costs 2 turns. You have 12 turns remaining."
- On stock bar: "Market has 1,200 units available. Stock is abundant (full)."
- On cargo bar: "245 units / 300 capacity. You have 55 units of space."

---

### 1.2 Desktop Port Detail Panel (Cargo Tab)

```
┌─────────────────────────────────────┐
│ Port: Antares Station      [✕]      │
├─────────────────────────────────────┤
│  ⚙ Market  |  📦 Cargo  |  Info     │  ← Cargo tab now active
├─────────────────────────────────────┤
│                                     │
│  Your Cargo (245/300 units)         │
│  ┌─────────────────────────────────┐│
│  │ 🔶 Fuel Ore: 85 units           ││
│  │    ████████░░░░░░░░░░░░░░░░  28%││
│  │    Worth: 3,825 credits         ││
│  │    [SELL 85]  [Drop]            ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🟢 Organics: 120 units          ││
│  │    ████████████░░░░░░░░░░░░░░  40%││
│  │    Worth: 7,440 credits         ││
│  │    [SELL 120]  [Drop]           ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🔵 Equipment: 40 units          ││
│  │    ████░░░░░░░░░░░░░░░░░░░░░░  13%││
│  │    Worth: 6,240 credits         ││
│  │    [SELL 40]  [Drop]            ││
│  └─────────────────────────────────┘│
│                                     │
│  Total Cargo Value: 17,505 credits  │
│  Est. Margin: +32% vs cost basis    │  ← If cost data available
│                                     │
└─────────────────────────────────────┘
```

**Interaction Details:**
- **SELL Button:** Quick-sell all units of commodity (opens confirm dialog with 2-turn cost)
- **Drop Button:** Jettison commodity into space (0 turns, 0 credits)
  - Triggered only in emergencies (e.g., cargo full, need to move)
  - Tooltip: "Drop this item. You will lose all units and receive no payment."
- **Cargo % Bar:** Visual representation of hold capacity per commodity
- **Total Value:** Useful for players tracking wealth; not tradeable as a single lot

---

## 2. Mobile Port Detail Panel (375px Viewport)

On mobile, the port detail panel is **full-screen modal** (better touch targets, no clutter).

```
┌──────────────────────┐
│ Antares Station [✕]  │  ← Header with close
├──────────────────────┤
│ Market | Cargo | Info │  ← Swipeable tabs
├──────────────────────┤
│                      │
│  Fuel Ore            │
│  45 cr/unit          │
│  [1200 in stock]     │
│  ─────────────────   │
│  [- 1 +]             │  ← Larger touch targets (44px+)
│  You have: 85 units  │
│  [BUY 100 UNITS]     │  ← Full width button
│  Costs 2 turns ℹ️     │  ← Inline turn cost
│                      │
│  ─────────────────   │
│                      │
│  Organics            │
│  62 cr/unit          │
│  [850 in stock]      │
│  ─────────────────   │
│  [- 1 +]             │
│  You have: 120 units │
│  [SELL 120 UNITS]    │
│  Costs 2 turns ℹ️     │
│                      │
│  ─────────────────   │
│                      │
│  Your Turns: 12/2000 │  ← Always sticky footer
│  Your Credits: 8,500 │
│  Your Cargo: 245/300 │
│                      │
└──────────────────────┘
```

**Design Principles:**
- Full-width buttons (touch-friendly)
- One commodity per screen section (vertical scroll)
- Turn cost inline on every action
- Sticky footer shows always-visible empire stats

---

## 3. Buy/Sell Interaction Flow (Step-by-Step)

### 3.1 Initial State (Port View)

```
Player arrives at Antares Station, opens Port Panel.
Sees commodity cards with stock levels, prices.
Enters desired quantity (e.g., "100 units of Fuel Ore").
Clicks [BUY 100 UNITS] button.
```

### 3.2 Trade Confirmation Dialog

**Dialog Title:** "Confirm Purchase"  
**Turn Cost:** 2 turns (visible in header)

```
┌─────────────────────────────────────┐
│ ✓ Confirm Purchase  ⏱️ 2 turns      │  ← Title + turn cost badge
├─────────────────────────────────────┤
│                                     │
│  You are buying:                    │
│  100 × Fuel Ore @ 45 cr/unit        │
│  = 4,500 credits                    │
│                                     │
│  Your Balance:                      │
│  Before: 8,500 credits              │
│  After:  4,000 credits              │  ← Highlight if balance low
│                                     │
│  Cargo Impact:                      │
│  Before: 245/300 units (81%)        │
│  After:  345/300 units ⚠️ OVER!     │  ← Warning if overfull
│                                     │
│  Turn Cost:                         │
│  Before: 12 turns remaining         │
│  After:  10 turns remaining         │  ← Highlight if < 3 turns left
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [CANCEL]           [CONFIRM BUY]   │  ← CTA buttons
│                                     │
└─────────────────────────────────────┘
```

**Validation Rules (on Confirm):**
1. **Sufficient Turns:** 2 turns available → proceed; else show "Not enough turns (need 2, have X)"
2. **Sufficient Funds:** 4,500 credits available → proceed; else show "Insufficient credits (need 4,500, have X)"
3. **Cargo Space:** 100 units + 245 current = 345, but capacity is 300 → BLOCK with "Cargo full (need 45 more space, would overfill by 45 units)"
   - Offer suggestion: "Drop 50 units of X or sell at this port to make space."

**On Confirm Success:**
1. Deduct 2 turns from player turn bank
2. Deduct 4,500 credits from player balance
3. Add 100 Fuel Ore to player cargo
4. Add 100 units to port "sold stock" (dynamic pricing may drop price next tick)
5. Show **Trade Receipt Toast:**
   ```
   ✓ Purchased 100 × Fuel Ore
   Cost: 4,500 credits, 2 turns
   Your turns: 10/2000 remaining
   ```
6. **Auto-close** port panel (or keep open if player wants to buy more)

---

### 3.3 Sell Flow (Parallel to Buy)

```
Player selects a commodity from Cargo tab (e.g., 120 Organics).
Clicks [SELL 120] button.
```

**Confirmation Dialog:**

```
┌─────────────────────────────────────┐
│ ✓ Confirm Sale  ⏱️ 2 turns          │
├─────────────────────────────────────┤
│                                     │
│  You are selling:                   │
│  120 × Organics @ 62 cr/unit        │
│  = 7,440 credits                    │
│                                     │
│  Your Balance:                      │
│  Before: 4,000 credits              │
│  After:  11,440 credits             │  ← Highlight gain (green)
│                                     │
│  Cargo Impact:                      │
│  Before: 345/300 units              │  ← If overfull, this frees space
│  After:  225/300 units (75%)        │
│                                     │
│  Turn Cost:                         │
│  Before: 10 turns remaining         │
│  After:  8 turns remaining          │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [CANCEL]           [CONFIRM SELL]  │
│                                     │
└─────────────────────────────────────┘
```

**On Confirm Success:**
1. Deduct 2 turns
2. Add 7,440 credits
3. Remove 120 Organics from cargo
4. Show **Trade Receipt:**
   ```
   ✓ Sold 120 × Organics
   Earned: 7,440 credits, 2 turns cost
   Your turns: 8/2000 remaining
   ```

---

## 4. Trade Confirmation Dialog Details

### 4.1 Error States

**Insufficient Turns:**
```
┌─────────────────────────────────────┐
│ ✗ Cannot Purchase  ⏱️ 2 turns (need) │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ NOT ENOUGH TURNS                │
│  You need 2 turns, but have only 1. │
│  Turns regenerate at 1 every 90 sec.│
│  Next available in ~45 seconds.     │
│                                     │
│  [OK]              [WAIT & RETRY]   │  ← Timer or dismiss
│                                     │
└─────────────────────────────────────┘
```

**Cargo Overfull:**
```
┌─────────────────────────────────────┐
│ ✗ Cannot Purchase  📦 CARGO FULL    │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ INSUFFICIENT CARGO SPACE        │
│  Need 100 units, have 55 free.      │
│  Current: 245/300 units             │
│                                     │
│  Options:                           │
│  1. Drop cargo (jettison items)     │
│  2. Sell commodities at this port   │
│  3. Return to reduce holdings       │
│                                     │
│  [MANAGE CARGO]    [DROP ITEMS]     │
│                                     │
└─────────────────────────────────────┘
```

**Insufficient Credits:**
```
┌─────────────────────────────────────┐
│ ✗ Cannot Purchase  💰 NO FUNDS      │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ INSUFFICIENT CREDITS            │
│  Cost: 4,500 credits                │
│  You have: 2,100 credits            │
│  Shortage: 2,400 credits            │
│                                     │
│  Options:                           │
│  1. Sell cargo at this port         │
│  2. Travel to another port          │
│  3. Reduce purchase qty             │
│                                     │
│  [ADJUST QTY]      [SELL CARGO]     │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Success State (Post-Transaction)

```
┌─────────────────────────────────────┐
│ ✓ Purchase Complete!                │
├─────────────────────────────────────┤
│                                     │
│  +100 × Fuel Ore                    │
│  -4,500 credits                     │
│  -2 turns                           │
│                                     │
│  Your Updated Status:               │
│  Turns: 10/2000 remaining           │
│  Credits: 4,000                     │
│  Cargo: 245/300 units               │
│                                     │
│  [CONTINUE TRADING]  [LEAVE PORT]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Cargo Management View

Accessed via a **"Manage Cargo"** button in the port sidebar, or when cargo is full.

```
┌──────────────────────────────────────┐
│ Cargo Management: 245/300 units      │
├──────────────────────────────────────┤
│ Fuel Ore: 85 units (28%)             │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ [SELL]  [DROP]  [TRANSFER]          │  ← Actions
│                                      │
│ Organics: 120 units (40%)            │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░ │
│ [SELL]  [DROP]  [TRANSFER]          │
│                                      │
│ Equipment: 40 units (13%)            │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ [SELL]  [DROP]  [TRANSFER]          │
│                                      │
├──────────────────────────────────────┤
│ Total Hold Used: 245/300 (81%)       │
│ ████████████████████░░░░░░░░░░░░░░ │
│ Space Available: 55 units            │
│                                      │
│ Est. Cargo Value: 17,505 credits     │
│                                      │
│ [CLOSE]                              │
└──────────────────────────────────────┘
```

**Actions:**
- **SELL:** Quick-sell all units of this commodity (2 turns, full market transaction)
- **DROP:** Jettison without payment (0 turns, 0 credits)
- **TRANSFER:** (Phase 2) Move to fleet mate or federated partner

---

## 6. Turn Cost Visibility Strategy

### 6.1 Principle: Turn Cost Annotations Everywhere

Every trade action must show turn cost in **three ways:**

1. **Inline Badge (Port Panel):**
   ```
   [BUY 100 UNITS]
   Costs 2 turns ⏱️
   ```

2. **Dialog Header (Confirmation):**
   ```
   ✓ Confirm Purchase  ⏱️ 2 turns
   ```

3. **Toast Notification (Result):**
   ```
   ✓ Purchased 100 × Fuel Ore
   Cost: 4,500 credits, 2 turns
   Your turns: 10/2000 remaining
   ```

### 6.2 Turn Counter Color Coding

Always-visible turn counter (top-right HUD):

```
Turns: 12/2000  (Green)
  └─ Abundant (> 10 turns)

Turns: 5/2000   (Amber/Yellow)
  └─ Limited (3–10 turns)

Turns: 1/2000   (Red + Pulse)
  └─ Critical (1–2 turns)

Turns: 0/2000   (Crossed-out, Greyed)
  └─ No actions allowed until regen
```

### 6.3 Turn Cost Validation on Disabled State

If player has insufficient turns, the BUY/SELL button is **disabled** with a tooltip:

```
[BUY 100 UNITS]  (disabled/greyed out)

Hover tooltip:
"You need 2 turns to trade.
You have 1 turn remaining.
Next turn available in ~40 seconds."
```

---

## 7. Responsive Design Summary

| Feature | Desktop (≥1024px) | Tablet (768–1024px) | Mobile (<768px) |
|---------|-------------------|---------------------|-----------------|
| **Panel** | Glass card, right sidebar | Glass card, bottom sheet | Full-screen modal |
| **Tabs** | Icon + text | Icon + text | Swipeable tabs |
| **Commodity Cards** | 3 per view (scroll) | 3 per view (scroll) | 1 per view (scroll) |
| **Button Size** | 44px min | 44px min | 48–56px (touch) |
| **Qty Picker** | Spinners + input | Spinners + input | Large spinners + input |
| **Turn Counter** | Top-right fixed | Top-right fixed | Top-right/sticky |
| **Confirmations** | Modal overlay | Modal overlay | Modal (full modal on mobile) |

---

## 8. Implementation Notes

### 8.1 PixiJS Canvas Integration

- Port panel is **DOM overlay** (React/Tailwind), positioned absolutely over canvas
- Trade animations (cargo loading, resource flow) play on canvas during transaction
- Cursor feedback: show "busy" spinner during trade confirmation (0.5–1s latency)

### 8.2 State Sync & Latency Handling

- When player clicks [CONFIRM BUY], client sends command to server
- Server validates:
  - Player has 2 turns available
  - Player has funds
  - Cargo space available
  - Port has stock
- On success, server broadcasts delta to all clients (Colyseus)
- Client receives state update, displays receipt, refreshes panel

### 8.3 Turn Cost Display (Always Sync'd)

- Turn counter in HUD: synced from server turn bank every message
- Local turn cost predictions: calculated client-side before confirmation
- No turn should be deducted from HUD until server confirmation received

### 8.4 Accessibility

- Turn cost badge includes `ℹ️` icon with aria-label: "Costs 2 turns"
- All buttons are keyboard-accessible (Tab, Enter, Escape)
- Color coding (green/amber/red) supplemented with text labels
- Modal dialogs trap focus, prevent body scroll

---

## 9. Visual Design Reference

**Glass-Morphism Panels:**
- Background: `var(--vm-glass-bg)` (rgba 80% opacity)
- Border: `1px solid var(--vm-glass-border)`
- Backdrop blur: `var(--vm-glass-blur)` (8px)
- Radius: `var(--vm-radius-lg)` (10px)

**Typography:**
- Title: `--vm-font-lg` (18px), `--vm-font-weight-semibold`
- Body: `--vm-font-base` (16px), `--vm-font-weight-normal`
- Labels: `--vm-font-sm` (14px), `--vm-font-weight-medium`

**Colors:**
- Prices: `--vm-credits` (gold)
- Commodity Icons: `--vm-fuel-ore`, `--vm-organics`, `--vm-equipment`
- Turn Badges: `--vm-warning` (amber) or `--vm-danger` (red) if low
- Success: `--vm-success` (green)

**Spacing:**
- Padding: `--vm-space-lg` (16px) internal; `--vm-space-md` (12px) between items
- Card gap: `--vm-space-md` (12px)
- Button spacing: `--vm-space-sm` (8px)

---

## 10. Future Enhancements (Phase 2)

- **Trade History Log:** Show last 10 trades with prices, timestamps
- **Price Chart:** Historical price trends per commodity
- **Port Rating:** Reputation/trustworthiness indicator
- **Multi-Port Compare:** Side-by-side prices across nearby ports
- **Cargo Transfer:** Send items to allied players or store in secured depot
- **Trade Alerts:** Notify player when price hits target (e.g., "Fuel Ore ≤40 cr/unit")

---

## References

- **Game Constants:** `shared/src/constants.ts` (TURN_COSTS, PORT_CLASS_DEFS)
- **Design Tokens:** `client/src/styles/theme.css`
- **UX Brief:** `docs/UX-BRIEF.md` (Screen Inventory, Turn Economy)
- **Colyseus State Sync:** `docs/ARCHITECTURE.md` (Three-Room Architecture)
