import React, { useEffect, useRef } from "react";
import { ConnectionStatusBadge } from "./components/ConnectionStatusBadge.js";
import { initPixiApp } from "./game/PixiApp.js";
import { connect, subscribeToRoom } from "./network/client.js";
import { StateSync } from "./network/StateSync.js";
import { OptimisticMovement } from "./network/OptimisticMovement.js";

export function App(): React.JSX.Element {
  const pixiContainerRef = useRef<HTMLDivElement | null>(null);
  const pixiInitRef = useRef(false);

  useEffect(() => {
    const container = pixiContainerRef.current;
    if (!container || pixiInitRef.current) return;
    pixiInitRef.current = true;

    let stateSync: StateSync | null = null;
    let movement: OptimisticMovement | null = null;

    void (async () => {
      // 1. Initialise PixiJS renderer (empty — no data yet)
      const pixi = await initPixiApp(container);

      // 2. Connect to GalaxyRoom (non-fatal — badge shows error on failure)
      try {
        await connect();
      } catch {
        return;
      }

      // 3. Wire up room state to renderer whenever a room is (re)established
      subscribeToRoom((room) => {
        stateSync?.dispose();
        movement?.dispose();

        stateSync = new StateSync(room, pixi.galaxyRenderer, () => {
          const localPlayer = room.state.players.get(room.sessionId);
          if (localPlayer) {
            const sector = room.state.sectors.get(
              String(localPlayer.currentSectorId),
            );
            if (sector) {
              pixi.recenterViewport(sector.x, sector.y);
            }
          }
        });

        movement = new OptimisticMovement(room, pixi.galaxyRenderer);
        stateSync.setOptimisticMovement(movement);

        pixi.setSectorClickHandler((sectorId) => {
          movement?.requestMove(sectorId);
        });
      });
    })();
  }, []);

  return (
    <>
      {/* PixiJS mounts into the canvas container via ref */}
      <div
        ref={pixiContainerRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      {/* React DOM overlay */}
      <ConnectionStatusBadge />
    </>
  );
}
