# Decision: Galaxy Map Renderer Architecture

**Date:** 2026-03-17  
**Author:** Gately (Game Dev)  
**PR:** #68  
**Issue:** #29

## Decisions

1. **Data-driven renderer with plain interfaces** — `GalaxyRenderer` accepts `GalaxyData` (plain TS interfaces), not Colyseus Schema objects. Decouples rendering from networking.
2. **pixi-viewport for camera** — Drag, pinch, wheel zoom, decelerate, clamp-zoom. Zoom range 0.05x–3x, initial 0.15x centered on starting sector.
3. **Single Graphics batch for warp lines** — All warp connections in one `Graphics` object. Edge deduplication via key set.
4. **Colors from design tokens** — No hardcoded hex. Sector color encodes state (neutral=empty, resource hue=port, warning=occupied, primary=current).
5. **Mock data is temporary** — `mockGalaxyData.ts` replaced by Colyseus state sync (issue #31). Seeded RNG for determinism.

## Consequences

- Client can iterate on galaxy visuals without a running server
- Colyseus integration (#31) needs a mapper from `GalaxyState` schema to `GalaxyData`
- New visual states just extend `SectorNode.draw()`
