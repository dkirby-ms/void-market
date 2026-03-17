# Void Market Design System Reference

**Version:** 1.0  
**Source:** Figma Make Export (void-market.zip)  
**Date:** 2026-03-17  
**Stack:** React 18 + Tailwind CSS 4 + Radix UI + shadcn/ui + Lucide Icons

---

## Overview

This document extracts the visual design language from the Figma Make prototype into a framework-agnostic reference. This design system can be implemented in PixiJS, vanilla DOM, React, or any other UI framework.

The design is **dark-themed, space-focused, and information-dense** with a glass-morphism aesthetic. It prioritizes:
- **Clarity**: Information-dense UIs with clear visual hierarchy
- **Accessibility**: WCAG AA contrast ratios, keyboard navigation, semantic colors
- **Responsiveness**: Mobile-first (375px baseline) with desktop scaling
- **Feedback**: Multi-modal feedback (visual + contextual states)

---

## 1. Color System

### 1.1 Color Space
All colors use **OKLCH color space** for perceptual uniformity. Fallback hex values provided for compatibility.

### 1.2 Theme Variables

#### Light Theme (Root)
```css
--background: #ffffff
--foreground: oklch(0.145 0 0)          /* Near-black text */
--card: #ffffff
--card-foreground: oklch(0.145 0 0)
--popover: oklch(1 0 0)                 /* White */
--popover-foreground: oklch(0.145 0 0)
--primary: #030213                      /* Deep blue-black */
--primary-foreground: oklch(1 0 0)
--secondary: oklch(0.95 0.0058 264.53)  /* Light violet tint */
--secondary-foreground: #030213
--muted: #ececf0                        /* Light gray */
--muted-foreground: #717182             /* Mid gray */
--accent: #e9ebef                       /* Light blue-gray */
--accent-foreground: #030213
--destructive: #d4183d                  /* Red */
--destructive-foreground: #ffffff
--border: rgba(0, 0, 0, 0.1)
--input: transparent
--input-background: #f3f3f5
--switch-background: #cbced4
--ring: oklch(0.708 0 0)                /* Focus ring gray */
```

#### Dark Theme (Game Default)
```css
--background: oklch(0.145 0 0)          /* #0A0A0A, near-black */
--foreground: oklch(0.985 0 0)          /* #FAFAFA, near-white */
--card: oklch(0.145 0 0)
--card-foreground: oklch(0.985 0 0)
--popover: oklch(0.145 0 0)
--popover-foreground: oklch(0.985 0 0)
--primary: oklch(0.985 0 0)             /* White text */
--primary-foreground: oklch(0.205 0 0)  /* #27272A, zinc-800 */
--secondary: oklch(0.269 0 0)           /* #3F3F46, zinc-700 */
--secondary-foreground: oklch(0.985 0 0)
--muted: oklch(0.269 0 0)               /* Zinc-700 */
--muted-foreground: oklch(0.708 0 0)    /* #A1A1AA, zinc-400 */
--accent: oklch(0.269 0 0)              /* Zinc-700 */
--accent-foreground: oklch(0.985 0 0)
--destructive: oklch(0.396 0.141 25.723)  /* Red-700 */
--destructive-foreground: oklch(0.637 0.237 25.331)  /* Red-400 */
--border: oklch(0.269 0 0)              /* Zinc-700 */
--input: oklch(0.269 0 0)
--ring: oklch(0.439 0 0)                /* Zinc-600, focus ring */
```

### 1.3 Chart Colors
Used for data visualization (charts, graphs, player identification):
```css
--chart-1: oklch(0.488 0.243 264.376)   /* Violet-500, #8B5CF6 */
--chart-2: oklch(0.696 0.17 162.48)     /* Green-400 */
--chart-3: oklch(0.769 0.188 70.08)     /* Yellow-400 */
--chart-4: oklch(0.627 0.265 303.9)     /* Pink-500 */
--chart-5: oklch(0.645 0.246 16.439)    /* Orange-500 */
```

### 1.4 Sidebar Theme
Specialized sidebar colors for navigation:
```css
/* Dark theme */
--sidebar: oklch(0.205 0 0)              /* #27272A, zinc-800 */
--sidebar-foreground: oklch(0.985 0 0)
--sidebar-primary: oklch(0.488 0.243 264.376)  /* Violet-500 */
--sidebar-primary-foreground: oklch(0.985 0 0)
--sidebar-accent: oklch(0.269 0 0)       /* Zinc-700 */
--sidebar-accent-foreground: oklch(0.985 0 0)
--sidebar-border: oklch(0.269 0 0)
--sidebar-ring: oklch(0.439 0 0)
```

### 1.5 Semantic Color Palette

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Success** | green-500 | #22C55E | Positive status, sufficient resources |
| **Warning** | amber-500 | #F59E0B | Medium resources, caution states |
| **Danger** | red-500 | #EF4444 | Low resources, destructive actions |
| **Info/Primary** | violet-500 | #8B5CF6 | Primary actions, accents, links |
| **Neutral** | zinc-700 | #3F3F46 | Default backgrounds, borders |
| **Background** | zinc-950 | #0A0A0A | Main background |
| **Surface** | zinc-900 | #18181B | Card/panel backgrounds |
| **Text Primary** | white | #FFFFFF | Primary text |
| **Text Secondary** | zinc-400 | #A1A1AA | Secondary text, labels |
| **Text Tertiary** | zinc-500 | #71717A | Tertiary text, hints |
| **Border** | zinc-800 | #27272A | Default borders |
| **Hover Border** | zinc-700 | #3F3F46 | Hovered element borders |

### 1.6 Resource Colors
Consistent color coding for game resources:
```css
Credits: amber-400/500     /* #FBBF24, #F59E0B */
Minerals: blue-400/500     /* #60A5FA, #3B82F6 */
Energy: violet-400/500     /* #A78BFA, #8B5CF6 */
```

### 1.7 Player/Territory Colors
Used for fleet/territory identification on galaxy map:
```css
Player 1 (You): red-500    /* #EF4444 */
Player 2: blue-500         /* #3B82F6 */
Player 3: green-500        /* #22C55E */
Neutral: zinc-700          /* #3F3F46 */
```

---

## 2. Typography

### 2.1 Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```
No custom web fonts loaded; relies on system font stack for performance.

### 2.2 Font Sizes
```css
--font-size: 16px           /* Base size */
--text-xs: 0.75rem          /* 12px */
--text-sm: 0.875rem         /* 14px */
--text-base: 1rem           /* 16px */
--text-lg: 1.125rem         /* 18px */
--text-xl: 1.25rem          /* 20px */
--text-2xl: 1.5rem          /* 24px */
```

### 2.3 Font Weights
```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### 2.4 Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **h1** | 24px (1.5rem) | 500 | 1.5 | Page titles, main headings |
| **h2** | 20px (1.25rem) | 500 | 1.5 | Section headings |
| **h3** | 18px (1.125rem) | 500 | 1.5 | Subsection headings |
| **h4** | 16px (1rem) | 500 | 1.5 | Card titles |
| **Body** | 16px (1rem) | 400 | 1.5 | Body text |
| **Label** | 16px (1rem) | 500 | 1.5 | Form labels |
| **Button** | 16px (1rem) | 500 | 1.5 | Button text |
| **Small** | 14px (0.875rem) | 400 | 1.5 | Helper text, captions |
| **Tiny** | 12px (0.75rem) | 400 | 1.5 | Timestamps, metadata |
| **Monospace** | Varies | 600 | 1.5 | Resource values, numbers |

### 2.5 Monospace Usage
For numeric data (resources, coordinates, counts):
```css
font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
font-weight: 600 (semibold)
```

---

## 3. Spacing System

### 3.1 Base Scale (Tailwind defaults)
```
0.5 → 2px
1   → 4px
1.5 → 6px
2   → 8px
2.5 → 10px
3   → 12px
4   → 16px
5   → 20px
6   → 24px
8   → 32px
12  → 48px
16  → 64px
```

### 3.2 Common Patterns

| Pattern | Value | Usage |
|---------|-------|-------|
| **Component padding** | p-4 (16px) | Default internal padding |
| **Card padding** | p-6 (24px) | Card/panel padding |
| **Element gaps** | gap-2, gap-4 | Between related elements |
| **Section gaps** | gap-6 (24px) | Between sections |
| **Screen padding** | p-6 (24px) | Page outer padding |
| **Icon spacing** | gap-2 (8px) | Icon to text gap |
| **Form field spacing** | space-y-4 | Between form fields |

---

## 4. Border Radius

### 4.1 Radius Variables
```css
--radius: 0.625rem          /* 10px, base radius */
--radius-sm: 0.375rem       /* 6px, small elements */
--radius-md: 0.5rem         /* 8px, medium elements */
--radius-lg: 0.625rem       /* 10px, large elements */
--radius-xl: 0.875rem       /* 14px, extra large */
```

### 4.2 Component Radius

| Component | Radius | Notes |
|-----------|--------|-------|
| Button | rounded-md (6px) | Standard buttons |
| Card | rounded-xl (12px) | Cards, panels |
| Input/Select | rounded-md (6px) | Form elements |
| Badge | rounded-md (6px) | Status badges |
| Modal/Dialog | rounded-xl (12px) | Overlays |
| Tooltip | rounded-lg (10px) | Tooltips, popovers |
| Full Circle | rounded-full | Avatars, indicators |

---

## 5. Effects & Shadows

### 5.1 Glass-morphism Pattern
```css
background: rgba(24, 24, 27, 0.8)    /* zinc-900/80 */
backdrop-filter: blur(8px)            /* backdrop-blur-sm */
border: 1px solid rgba(63, 63, 70, 1) /* zinc-700 */
```
Applied to: HUD, sidebar, chat panel, tooltips, controls overlay.

### 5.2 Shadow System
Shadows are minimal in this design (dark theme). Not heavily used.

### 5.3 Focus Ring
```css
outline: none
ring: 3px solid rgba(ring-color, 0.5)
border-color: var(--ring)
```

---

## 6. Component Library

### 6.1 Complete Component Inventory

| Component | File | Purpose | Variants | States |
|-----------|------|---------|----------|--------|
| **Accordion** | accordion.tsx | Collapsible content sections | default | open, closed |
| **Alert** | alert.tsx | Non-disruptive notifications | default, destructive | - |
| **Alert Dialog** | alert-dialog.tsx | Modal confirmation dialogs | - | open, closed |
| **Aspect Ratio** | aspect-ratio.tsx | Maintain aspect ratio containers | - | - |
| **Avatar** | avatar.tsx | User profile images with fallback | - | loaded, fallback |
| **Badge** | badge.tsx | Status indicators, labels | default, secondary, destructive, outline | - |
| **Breadcrumb** | breadcrumb.tsx | Navigation hierarchy | - | active, inactive |
| **Button** | button.tsx | Interactive actions | default, destructive, outline, secondary, ghost, link | default, hover, active, disabled, focus |
| **Calendar** | calendar.tsx | Date picker | - | selected, disabled |
| **Card** | card.tsx | Content containers | - | - |
| **Carousel** | carousel.tsx | Image/content slider | - | - |
| **Chart** | chart.tsx | Data visualization wrapper | - | - |
| **Checkbox** | checkbox.tsx | Boolean input | - | checked, unchecked, indeterminate, disabled |
| **Collapsible** | collapsible.tsx | Expand/collapse content | - | open, closed |
| **Command** | command.tsx | Command palette/search | - | - |
| **Context Menu** | context-menu.tsx | Right-click menu | - | open, closed |
| **Dialog** | dialog.tsx | Modal overlays | - | open, closed |
| **Drawer** | drawer.tsx | Side panel overlay | - | open, closed |
| **Dropdown Menu** | dropdown-menu.tsx | Action menus | - | open, closed |
| **Form** | form.tsx | Form wrapper with validation | - | valid, invalid |
| **Hover Card** | hover-card.tsx | Hover-triggered popover | - | open, closed |
| **Input** | input.tsx | Text input field | - | default, hover, focus, disabled, invalid |
| **Input OTP** | input-otp.tsx | One-time password input | - | - |
| **Label** | label.tsx | Form field labels | - | - |
| **Menubar** | menubar.tsx | Top-level menu bar | - | - |
| **Navigation Menu** | navigation-menu.tsx | Site navigation | - | active, inactive |
| **Pagination** | pagination.tsx | Page navigation | - | active, disabled |
| **Popover** | popover.tsx | Floating content panel | - | open, closed |
| **Progress** | progress.tsx | Progress bars | - | 0-100% (color: green >50%, amber >30%, red <30%) |
| **Radio Group** | radio-group.tsx | Single-select input | - | selected, unselected, disabled |
| **Resizable** | resizable.tsx | Resizable panels | - | - |
| **Scroll Area** | scroll-area.tsx | Custom scrollbar | - | - |
| **Select** | select.tsx | Dropdown selection | - | default, hover, focus, disabled, invalid |
| **Separator** | separator.tsx | Visual divider | horizontal, vertical | - |
| **Sheet** | sheet.tsx | Side panel drawer | - | open, closed |
| **Sidebar (shadcn)** | sidebar.tsx | Navigation sidebar framework | - | collapsed, expanded |
| **Skeleton** | skeleton.tsx | Loading placeholder | - | loading |
| **Slider** | slider.tsx | Range input | - | - |
| **Sonner** | sonner.tsx | Toast notifications | - | visible, dismissed |
| **Switch** | switch.tsx | Toggle switch | - | on, off, disabled |
| **Table** | table.tsx | Data tables | - | - |
| **Tabs** | tabs.tsx | Tabbed interface | - | active, inactive |
| **Textarea** | textarea.tsx | Multi-line text input | - | default, hover, focus, disabled, invalid |
| **Toggle** | toggle.tsx | Toggle button | - | on, off, disabled |
| **Toggle Group** | toggle-group.tsx | Grouped toggles | - | single, multiple |
| **Tooltip** | tooltip.tsx | Hover hint | - | visible, hidden |

### 6.2 Game-Specific Components

| Component | File | Purpose | Features |
|-----------|------|---------|----------|
| **GameLayout** | GameLayout.tsx | Root layout shell | HUD + Sidebar + Main + Chat |
| **HUD** | HUD.tsx | Heads-up display | Turn counter, resources, player info, actions |
| **Sidebar** | Sidebar.tsx | Left navigation | Nav links, notifications |
| **AllianceChat** | AllianceChat.tsx | Chat panel | Message list, input, timestamps |
| **GalaxyMap** | GalaxyMap.tsx | Main map view (Canvas) | Sector rendering, zoom, pan, tooltips |
| **SectorView** | SectorView.tsx | Sector detail | Planets, fleets, connections |
| **PlanetView** | PlanetView.tsx | Planet detail | Production, structures, defense, trading |
| **FleetView** | FleetView.tsx | Fleet management | Fleet list, composition, movement |
| **TradingView** | TradingView.tsx | Trading interface | Order book, market orders, create orders |
| **AllianceView** | AllianceView.tsx | Alliance dashboard | Members, diplomacy, treasury |

---

## 7. Layout Architecture

### 7.1 Screen Structure
```
┌─────────────────────────────────────────────┐
│ HUD (h-16, fixed top)                       │
│ [Menu] Player | Resources | Turns | Actions │
├──────┬──────────────────────────────┬───────┤
│      │                              │       │
│ Side │  Main Content Area           │ Chat  │
│ bar  │  (Outlet/Router)             │ Panel │
│      │                              │       │
│ Nav  │  Galaxy Map / Sector View    │ Msgs  │
│ +    │  Planet / Fleet / Trading    │ +     │
│ Noti │  Alliance                    │ Input │
│ fic  │                              │       │
│ atio │                              │       │
│ ns   │                              │       │
│      │                              │       │
└──────┴──────────────────────────────┴───────┘
```

### 7.2 Layout Dimensions

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| **HUD Height** | 64px (h-16) | 64px | Fixed, always visible |
| **Sidebar Width** | 256px (w-64) | 64px (w-16) | Collapsible, icon-only on mobile |
| **Chat Width** | 320px (w-80) | Full width | Bottom sheet on mobile |
| **Main Content** | Flex-1 (remaining) | Full width | Takes remaining space |
| **Screen Padding** | 24px (p-6) | 24px (p-6) | Inner content padding |

### 7.3 Responsive Breakpoints
```css
sm: 640px     /* Small devices */
md: 768px     /* Medium devices (tablets) */
lg: 1024px    /* Large devices (desktops) */
xl: 1280px    /* Extra large */
2xl: 1536px   /* Ultra wide */
```

### 7.4 Mobile Behavior
- **Sidebar**: Collapses to icon-only (64px) on `< sm` (640px)
- **Chat**: Becomes bottom sheet or modal on `< sm`
- **HUD**: Resources collapse (hide Minerals/Energy, show Credits only) on `< sm`
- **Grid layouts**: Stack vertically (grid-cols-1) on `< md`
- **Touch targets**: Minimum 44px × 44px (WCAG 2.1)

### 7.5 Z-Index Layers
```css
HUD: z-50            (top layer, always visible)
Tooltip/Popover: z-50
Modal/Dialog: z-50
Chat Panel: z-10
Sidebar: z-10
Main Content: z-0    (base layer)
Background: -        (no z-index)
```

---

## 8. Iconography

### 8.1 Icon Library
**Lucide React** (v0.487.0) — Consistent stroke-based icon set

### 8.2 Icon Inventory

| Icon | Usage | Screens |
|------|-------|---------|
| **ArrowLeft** | Back navigation | Breadcrumbs |
| **ArrowRight** | Forward navigation | Pagination |
| **Bell** | Notifications | HUD |
| **Box** | Inventory/cargo | Fleet View |
| **Building2** | Structures, planets | Planet View, Sector View |
| **Check** | Confirmation | Forms, Checkboxes |
| **ChevronDown** | Expand/dropdown | Select, Accordion |
| **ChevronRight** | Navigation, next | Breadcrumbs, Carousel |
| **Clock** | Time, ETA | Trade orders, Fleets |
| **Construction** | Building, production | Planet View |
| **Crown** | Alliance leader | Alliance View |
| **Home** | Galaxy Map home | Sidebar |
| **Map** | Location, sector | Sector View |
| **MapPin** | Location marker | Fleet View |
| **Maximize2** | Reset view/zoom | Galaxy Map controls |
| **Menu** | Toggle sidebar | HUD |
| **MessageSquare** | Chat | HUD, Alliance View |
| **MoreHorizontal** | More options | Context menus |
| **Rocket** | Fleet/ships | Fleet View, Sidebar |
| **Search** | Search/filter | Command palette |
| **Send** | Send message | Chat input |
| **Shield** | Defense | Planet View, Alliance |
| **TrendingUp** | Trading, growth | Trading View, Sidebar |
| **TrendingDown** | Market sell orders | Trading View |
| **User** | Player/profile | Trade orders |
| **Users** | Alliance/multiplayer | Alliance View, Sidebar |
| **X** | Close/dismiss | Modals, Chat |
| **ZoomIn** | Zoom in | Galaxy Map controls |
| **ZoomOut** | Zoom out | Galaxy Map controls |

### 8.3 Icon Sizing
```css
size-3: 12px    /* Tiny, inline with text-xs */
size-4: 16px    /* Small, inline with text-sm/base */
size-5: 20px    /* Default, standalone icons */
size-6: 24px    /* Large, prominent icons */
size-8: 32px    /* Hero icons */
size-12: 48px   /* Empty state illustrations */
```

### 8.4 Icon Stroke Weight
Default stroke: `2px` (Lucide default)
Consistent across all icons.

---

## 9. Animation & Motion

### 9.1 Transition Defaults
```css
transition: all 200ms ease-in-out
```
Applied to: buttons, hover states, focus rings.

### 9.2 Animation Library
Uses `tw-animate-css` for pre-built animations:
- **fade-in / fade-out**: Modal/dialog entry/exit
- **slide-in-from-top/bottom/left/right**: Sheet/drawer entry
- **zoom-in / zoom-out**: Popover/select content

### 9.3 Hover Effects

| Element | Hover Transform | Notes |
|---------|----------------|-------|
| **Button** | `hover:bg-{color}/90` | Darkens background 10% |
| **Card** | `hover:border-{color}/50` | Changes border color |
| **Navigation Item** | `hover:bg-zinc-800` | Background highlight |
| **Icon Button** | `hover:bg-zinc-800` | Background highlight |
| **Canvas Element** | Scale or glow | Custom PixiJS animations |

### 9.4 Focus States
```css
focus-visible:outline-none
focus-visible:ring-[3px]
focus-visible:ring-ring/50
focus-visible:border-ring
```

### 9.5 Progress Animations
**Turn Counter Progress Bar:**
- Smooth transition on value change
- Color transitions: green → amber → red based on thresholds

**Loading States:**
- Skeleton shimmer (subtle pulse)
- Spinner rotation (360deg, 1s linear infinite)

---

## 10. Button Variants

| Variant | Background | Text | Border | Hover | Usage |
|---------|-----------|------|--------|-------|-------|
| **default** | primary (white) | primary-foreground (dark) | none | bg-primary/90 | Primary actions |
| **destructive** | destructive (red) | white | none | bg-destructive/90 | Delete, cancel |
| **outline** | transparent | foreground | border | bg-accent | Secondary actions |
| **secondary** | secondary (zinc-700) | secondary-foreground | none | bg-secondary/80 | Tertiary actions |
| **ghost** | transparent | foreground | none | bg-accent/50 | Minimal actions |
| **link** | transparent | primary | none | underline | Text links |

### Button Sizes
```css
default: h-9 (36px) px-4 py-2
sm: h-8 (32px) px-3
lg: h-10 (40px) px-6
icon: size-9 (36×36px)
```

---

## 11. Form Elements

### 11.1 Input Styling
```css
height: 36px (h-9)
padding: 12px horizontal (px-3)
background: var(--input-background) or zinc-800 (dark)
border: 1px solid var(--border)
border-radius: 6px (rounded-md)
focus: ring-3 ring-violet-500/50 border-violet-500
invalid: ring-destructive/20 border-destructive
```

### 11.2 Select Styling
Similar to Input, with chevron-down icon on right.

### 11.3 Textarea
Same as Input, but `min-h-20` (80px minimum height), resizable.

### 11.4 Checkbox & Radio
```css
size: 16px (size-4)
border: 1px solid border
checked: bg-primary text-primary-foreground
focus: ring-2 ring-ring
```

### 11.5 Switch (Toggle)
```css
width: 44px
height: 24px
thumb: 20px diameter
checked: bg-primary
unchecked: bg-switch-background (gray)
```

---

## 12. Data Visualization

### 12.1 Progress Bars
```css
height: 8px (h-2) or 6px (h-1.5)
background: zinc-800 (track)
indicator: green-500 (>50%), amber-500 (30-50%), red-500 (<30%)
border-radius: rounded-full
transition: smooth width change
```

### 12.2 Resource Bars
Horizontal bars with color-coded fills:
- **Credits**: amber-500
- **Minerals**: blue-500
- **Energy**: violet-500

### 12.3 Status Indicators (Dots)
```css
size: 8px (size-2)
border-radius: rounded-full
colors:
  - green-500: online, active, sufficient
  - amber-500: warning, medium
  - red-500: offline, low, critical
  - zinc-500: neutral, inactive
```

### 12.4 Badge Status
```css
inline-flex px-2 py-0.5 rounded-md text-xs
default: bg-primary text-primary-foreground
secondary: bg-secondary text-secondary-foreground
destructive: bg-destructive/60 text-destructive-foreground
outline: border text-foreground
```

---

## 13. Card/Panel Patterns

### 13.1 Standard Card
```css
background: zinc-900/50 (semi-transparent)
border: 1px solid zinc-800
border-radius: rounded-xl (12px)
padding: p-6 (24px)
```

### 13.2 Stat Card (Compact)
```css
background: zinc-900/50
border: 1px solid zinc-800
border-radius: rounded-lg (10px)
padding: p-4 (16px)
text: zinc-400 label, white value, 2xl font-bold
```

### 13.3 Glass Panel (HUD, Sidebar, Chat)
```css
background: zinc-900/80
backdrop-blur: backdrop-blur-sm (8px)
border: 1px solid zinc-800
```

### 13.4 Tooltip/Popover
```css
background: zinc-900/95
backdrop-blur: backdrop-blur-sm
border: 1px solid zinc-700
border-radius: rounded-lg
padding: p-3
font-size: text-sm
shadow: subtle
```

---

## 14. Navigation Patterns

### 14.1 Breadcrumb
```
Galaxy Map / Sector Alpha-7 / Planet Terra
```
- Separator: `/` in zinc-600
- Links: zinc-400, hover to white
- Active: white, font-semibold

### 14.2 Sidebar Navigation
- **Active**: bg-violet-500/20, text-violet-400, border border-violet-500/30
- **Inactive**: text-zinc-400, hover:bg-zinc-800, hover:text-white
- Icon + label (label hidden on mobile)

### 14.3 Tabs
- **Active**: bg-violet-500, text-white, shadow-sm
- **Inactive**: text-zinc-400
- Tab bar: bg-zinc-900, border border-zinc-800, rounded-md

---

## 15. Canvas/Map Rendering

### 15.1 Galaxy Map (PixiJS)
- **Background**: #0A0A0A (zinc-950)
- **Stars**: white with 30% opacity, random sizes 0-1.5px
- **Warp Routes**: violet-500 (#8B5CF6) at 20% opacity, 1px stroke
- **Sectors**: 
  - Neutral: zinc-700 (#3F3F46)
  - Controlled: Player color (red/blue/green) with 20% glow
  - Hovered: violet-400 (#A78BFA) stroke, 2px, scale up to 12px
- **Planets**: Orbiting dots, 3px radius, amber-500 (homeworld), zinc-500 (others)
- **Fleets**: Triangle shape, violet-400 (#A78BFA)
- **Sector Names**: White text, 12px, only visible at zoom > 0.6

### 15.2 Control Overlays
Floating controls (zoom, reset) use glass-morphism:
```css
background: zinc-900/80
backdrop-blur: backdrop-blur-sm
border: 1px solid zinc-700
border-radius: rounded-lg
padding: p-2
hover: bg-zinc-800
```

### 15.3 Legend
- Positioned bottom-left
- Glass panel styling
- Color-coded dots with labels
- Text: zinc-300, labels: zinc-400

---

## 16. Accessibility

### 16.1 Contrast Ratios (WCAG AA)
- **Primary text on background**: white on zinc-950 → 19:1 (AAA)
- **Secondary text on background**: zinc-400 on zinc-950 → 5.8:1 (AA)
- **Green-500 on zinc-950**: 4.8:1 (AA)
- **Amber-500 on zinc-950**: 6.1:1 (AA+)
- **Red-500 on zinc-950**: 5.3:1 (AA)
- **Violet-500 on zinc-950**: 4.6:1 (AA)

### 16.2 Keyboard Navigation
- All interactive elements: focusable with Tab
- Focus ring: 3px ring-ring/50, visible on focus-visible
- Arrow keys: Navigate lists, select options
- Enter: Activate buttons, submit forms
- Escape: Close modals, cancel actions

### 16.3 Screen Reader Support
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`)
- aria-label on icon-only buttons
- aria-invalid on form errors
- Live regions for notifications (toast)

### 16.4 Color Independence
- Status colors paired with icons or text labels
- Never rely on color alone (e.g., red/green status also shows "Low" / "Sufficient" text)

---

## 17. Responsive Design

### 17.1 Mobile-First Approach
Design starts at 375px (iPhone SE), scales up.

### 17.2 Breakpoint Strategy

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| **< 640px (sm)** | 375-639px | Single column, sidebar icons only, chat bottom sheet, resource HUD minimal |
| **640-767px (sm-md)** | 640-767px | Two columns possible, sidebar text visible, chat side panel |
| **768-1023px (md-lg)** | 768-1023px | Three columns, full layout, sidebar + main + chat |
| **1024+ (lg+)** | 1024px+ | Optimized spacing, wider cards, max-width constraints |

### 17.3 Grid Patterns

| Screen | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| **Stat Cards** | grid-cols-1 | grid-cols-2 | grid-cols-3 or grid-cols-4 |
| **Content + Sidebar** | grid-cols-1 (stacked) | grid-cols-1 | grid-cols-3 (2:1 ratio) |
| **Planet/Fleet List** | grid-cols-1 | grid-cols-2 | grid-cols-3 |

---

## 18. Implementation Notes

### 18.1 PixiJS Mapping
For PixiJS rendering, map CSS colors to hex:
```typescript
const colors = {
  background: 0x0A0A0A,    // zinc-950
  surface: 0x18181B,       // zinc-900
  border: 0x27272A,        // zinc-800
  primary: 0x8B5CF6,       // violet-500
  success: 0x22C55E,       // green-500
  warning: 0xF59E0B,       // amber-500
  danger: 0xEF4444,        // red-500
  text: 0xFFFFFF,          // white
  textSecondary: 0xA1A1AA, // zinc-400
};
```

### 18.2 Tailwind CSS Integration
The Figma export uses **Tailwind CSS 4** with:
- CSS variables for theming
- Inline theme definitions (`@theme inline`)
- Custom variants (`@custom-variant dark`)
- Plugin: `tw-animate-css` for animations

### 18.3 Radix UI Primitives
All interactive components (Dialog, Dropdown, Select, etc.) use Radix UI primitives for accessibility, keyboard navigation, and focus management.

### 18.4 shadcn/ui Components
The component library follows shadcn/ui conventions:
- Copy-paste components (not NPM package)
- Customizable via Tailwind utilities
- Consistent API (`variant`, `size` props)

---

## 19. Design Tokens Summary

### 19.1 Quick Reference
```typescript
const tokens = {
  // Spacing
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  
  // Border Radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    full: '9999px',
  },
  
  // Typography
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Layout
  layout: {
    hudHeight: '64px',
    sidebarWidth: '256px',
    sidebarCollapsed: '64px',
    chatWidth: '320px',
  },
  
  // Effects
  backdropBlur: 'blur(8px)',
  transition: 'all 200ms ease-in-out',
  focusRing: '3px solid rgba(var(--ring), 0.5)',
};
```

---

## 20. Component State Matrix

| Component | Default | Hover | Focus | Active | Disabled | Invalid |
|-----------|---------|-------|-------|--------|----------|---------|
| **Button** | bg-primary | bg-primary/90 | ring-3 | pressed effect | opacity-50 | - |
| **Input** | bg-zinc-800 | - | ring-3 violet | - | opacity-50 cursor-not-allowed | ring-destructive |
| **Card** | border-zinc-800 | border-zinc-700 | - | - | - | - |
| **Nav Item** | text-zinc-400 | bg-zinc-800 | ring-2 | bg-violet-500/20 | - | - |
| **Badge** | bg-primary | - | ring-3 | - | - | - |
| **Checkbox** | border | - | ring-2 | bg-primary checked | opacity-50 | - |
| **Switch** | bg-gray | - | ring-2 | bg-primary checked | opacity-50 | - |

---

## 21. Conclusion

This design system provides a complete framework-agnostic specification of the Void Market visual language. Whether implementing in PixiJS, React, vanilla DOM, or another stack, these tokens, patterns, and components ensure visual consistency.

### Key Takeaways
1. **Dark-first**: Zinc-950 background, white text, glass-morphism panels
2. **Color semantics**: Violet primary, green/amber/red for status, resource-specific colors
3. **Typography**: System font stack, monospace for data, clear hierarchy
4. **Spacing**: 8px base grid, 24px card padding, 16px component padding
5. **Components**: 48 shadcn/ui primitives + 10 game screens
6. **Responsive**: 375px mobile baseline, stacks to multi-column on desktop
7. **Accessibility**: WCAG AA contrast, keyboard nav, semantic HTML
8. **Canvas/DOM hybrid**: PixiJS for galaxy map, DOM for HUD/forms

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-17  
**Maintained by:** Mario (UX Consultant)
