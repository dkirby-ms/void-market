import React, { useState } from "react";
import { MAX_TURN_BANK } from "@void-market/shared";
import { Badge } from "./ui/badge.js";
import { ShipPanel } from "./ShipPanel.js";
import type { PlayerSnapshot } from "../hooks/useGameState.js";

// ── Turn color thresholds ───────────────────────────────────────────────────

function turnColor(remaining: number, max: number): string {
  const pct = max > 0 ? remaining / max : 0;
  if (pct > 0.5) return "var(--vm-success)";
  if (pct > 0.2) return "var(--vm-warning)";
  return "var(--vm-danger)";
}

function turnBadgeClass(remaining: number, max: number): string {
  const pct = max > 0 ? remaining / max : 0;
  if (pct > 0.5) return "border-transparent bg-[var(--vm-success)]/15 text-[var(--vm-success)]";
  if (pct > 0.2) return "border-transparent bg-[var(--vm-warning)]/15 text-[var(--vm-warning)]";
  return "border-transparent bg-[var(--vm-danger)]/15 text-[var(--vm-danger)]";
}

// ── Props ───────────────────────────────────────────────────────────────────

interface HUDProps {
  player: PlayerSnapshot | null;
  currentSectorId: number | null;
}

// ── Component ───────────────────────────────────────────────────────────────

export function HUD({ player, currentSectorId }: HUDProps): React.JSX.Element | null {
  const [shipPanelOpen, setShipPanelOpen] = useState(false);

  if (!player) return null;

  const turnsMax = player.turnsMax || MAX_TURN_BANK;
  const cargoPct =
    player.maxCargoHolds > 0
      ? Math.round((player.cargoHolds / player.maxCargoHolds) * 100)
      : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 pointer-events-auto"
      style={{
        zIndex: "var(--vm-z-hud)" as unknown as number,
        background: "var(--vm-glass-bg)",
        backdropFilter: `blur(var(--vm-glass-blur))`,
        borderBottom: "1px solid var(--vm-glass-border)",
        fontFamily: "var(--vm-font-family-mono)",
        fontSize: "var(--vm-font-sm)",
        minHeight: "var(--vm-layout-hud-height)",
      }}
    >
      {/* Turn counter */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--vm-neutral-400)] text-xs uppercase tracking-wider">
          Turns
        </span>
        <Badge className={turnBadgeClass(player.turnsRemaining, turnsMax)}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1"
            style={{ backgroundColor: turnColor(player.turnsRemaining, turnsMax) }}
          />
          {player.turnsRemaining.toLocaleString()} / {turnsMax.toLocaleString()}
        </Badge>
      </div>

      {/* Credits */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--vm-neutral-400)] text-xs uppercase tracking-wider">
          Credits
        </span>
        <span className="text-[var(--vm-credits)] font-semibold">
          {player.credits.toLocaleString()}
        </span>
      </div>

      {/* Cargo */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-[var(--vm-neutral-400)] text-xs uppercase tracking-wider">
          Cargo
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-2 rounded-full bg-[var(--vm-neutral-800)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${cargoPct}%`,
                backgroundColor:
                  cargoPct > 90
                    ? "var(--vm-danger)"
                    : cargoPct > 60
                      ? "var(--vm-warning)"
                      : "var(--vm-primary)",
              }}
            />
          </div>
          <span className="text-[var(--vm-neutral-300)] text-xs">
            {player.cargoHolds}/{player.maxCargoHolds}
          </span>
        </div>
      </div>

      {/* Current sector */}
      {currentSectorId != null && (
        <div className="flex items-center gap-2">
          <span className="text-[var(--vm-neutral-400)] text-xs uppercase tracking-wider">
            Sector
          </span>
          <span className="text-[var(--vm-primary-light)] font-semibold">
            #{currentSectorId}
          </span>
        </div>
      )}

      {/* Ship panel toggle */}
      <button
        onClick={() => { setShipPanelOpen(true); }}
        className="ml-auto p-1.5 rounded text-[var(--vm-neutral-400)] hover:text-[var(--vm-primary-light)] hover:bg-[var(--vm-neutral-800)] transition-colors"
        aria-label="Open ship status"
        title="Ship Status"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2" />
          <path d="M12 2L2 20h20L12 2Z" />
          <path d="M12 10v4" />
        </svg>
      </button>

      {/* Ship status panel */}
      <ShipPanel
        player={player}
        open={shipPanelOpen}
        onClose={() => { setShipPanelOpen(false); }}
      />
    </div>
  );
}
