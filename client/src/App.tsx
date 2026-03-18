import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthScreen } from "./components/AuthScreen.js";
import { ConnectionStatusBadge } from "./components/ConnectionStatusBadge.js";
import { HUD } from "./components/HUD.js";
import { SectorDetail } from "./components/SectorDetail.js";
import { useAuth } from "./hooks/useAuth.js";
import { useGameState } from "./hooks/useGameState.js";
import type { SectorSnapshot } from "./hooks/useGameState.js";
import { initPixiApp } from "./game/PixiApp.js";
import { connect, sendMove, sendDock, subscribeToRoom } from "./network/client.js";
import { StateSync } from "./network/StateSync.js";
import { OptimisticMovement } from "./network/OptimisticMovement.js";

export function App(): React.JSX.Element {
  const auth = useAuth();
  const pixiContainerRef = useRef<HTMLDivElement | null>(null);
  const pixiInitRef = useRef(false);
  const [selectedSector, setSelectedSector] = useState<SectorSnapshot | null>(null);

  const gameState = useGameState();

  // Keep a ref to the PixiJS click handler so it always uses latest closure
  const sectorClickRef = useRef<((sectorId: number) => void) | null>(null);

  const handleSectorClick = useCallback(
    (sectorId: number) => {
      const sector = gameState.sectors.get(sectorId);
      if (sector) setSelectedSector(sector);
    },
    [gameState.sectors],
  );

  useEffect(() => {
    sectorClickRef.current = handleSectorClick;
  }, [handleSectorClick]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const container = pixiContainerRef.current;
    if (!container || pixiInitRef.current) return;
    pixiInitRef.current = true;

    let stateSync: StateSync | null = null;
    let movement: OptimisticMovement | null = null;

    void (async () => {
      // 1. Initialise PixiJS renderer (empty — no data yet)
      const pixi = await initPixiApp(container);

      // 2. Connect to GalaxyRoom with auth token
      try {
        await connect(auth.token ?? undefined);
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
          sectorClickRef.current?.(sectorId);
        });
      });
    })();
  }, [auth.isAuthenticated, auth.token]);

  // Keep the selected sector snapshot in sync with state changes
  useEffect(() => {
    if (selectedSector) {
      const updated = gameState.sectors.get(selectedSector.sectorId);
      if (updated) setSelectedSector(updated);
    }
  }, [gameState.sectors, selectedSector?.sectorId]);

  const handleMove = useCallback((targetSectorId: number) => {
    sendMove(targetSectorId);
  }, []);

  const handleDock = useCallback(() => {
    sendDock();
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSector(null);
  }, []);

  const handleSelectSector = useCallback(
    (sectorId: number) => {
      const sector = gameState.sectors.get(sectorId);
      if (sector) setSelectedSector(sector);
    },
    [gameState.sectors],
  );

  // Show a centered spinner while checking stored token
  if (auth.isLoading && !auth.isAuthenticated) {
    return (
      <div className="dark fixed inset-0 z-50 flex items-center justify-center bg-[var(--vm-neutral-950)]">
        <svg
          className="h-8 w-8 animate-spin text-[var(--vm-primary)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx={12}
            cy={12}
            r={10}
            stroke="currentColor"
            strokeWidth={4}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <AuthScreen
        onLogin={auth.login}
        onRegister={auth.register}
        serverError={auth.error}
        isLoading={auth.isLoading}
      />
    );
  }

  return (
    <>
      {/* PixiJS mounts into the canvas container via ref */}
      <div
        ref={pixiContainerRef}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      {/* React DOM overlay */}
      <HUD
        player={gameState.currentPlayer}
        currentSectorId={gameState.currentPlayer?.currentSectorId ?? null}
      />

      <ConnectionStatusBadge />

      {selectedSector && (
        <SectorDetail
          sector={selectedSector}
          player={gameState.currentPlayer}
          onMove={handleMove}
          onDock={handleDock}
          onClose={handleClose}
          onSelectSector={handleSelectSector}
        />
      )}
    </>
  );
}
