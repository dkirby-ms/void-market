import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Badge } from "./ui/badge.js";
import type {
  SectorSnapshot,
  PlayerSnapshot,
  CommoditySnapshot,
} from "../hooks/useGameState.js";

// ── Commodity display name mapping ──────────────────────────────────────────

const COMMODITY_LABELS: Record<string, string> = {
  fuel_ore: "Fuel Ore",
  organics: "Organics",
  equipment: "Equipment",
};

const COMMODITY_COLORS: Record<string, string> = {
  fuel_ore: "var(--vm-fuel-ore)",
  organics: "var(--vm-organics)",
  equipment: "var(--vm-equipment)",
};

// ── Props ───────────────────────────────────────────────────────────────────

interface SectorDetailProps {
  sector: SectorSnapshot;
  player: PlayerSnapshot | null;
  onMove: (targetSectorId: number) => void;
  onDock: () => void;
  onClose: () => void;
  onSelectSector: (sectorId: number) => void;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function CommodityRow({ c }: { c: CommoditySnapshot }): React.JSX.Element {
  const label = COMMODITY_LABELS[c.commodity] ?? c.commodity;
  const color = COMMODITY_COLORS[c.commodity] ?? "var(--vm-neutral-400)";

  return (
    <tr className="border-b border-[var(--vm-neutral-800)] last:border-b-0">
      <td className="py-1.5 pr-3">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-[var(--vm-neutral-200)]">{label}</span>
        </span>
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-xs text-[var(--vm-neutral-300)]">
        {c.stock.toLocaleString()}
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-xs">
        {c.portBuys ? (
          <span className="text-[var(--vm-success)]">
            {c.sellPrice.toLocaleString()}
          </span>
        ) : (
          <span className="text-[var(--vm-danger)]">
            {c.buyPrice.toLocaleString()}
          </span>
        )}
      </td>
      <td className="py-1.5 pl-2 text-center">
        <Badge
          variant="outline"
          className={
            c.portBuys
              ? "text-[var(--vm-success)] border-[var(--vm-success)]/30 text-xs"
              : "text-[var(--vm-danger)] border-[var(--vm-danger)]/30 text-xs"
          }
        >
          {c.portBuys ? "Buying" : "Selling"}
        </Badge>
      </td>
    </tr>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function SectorDetail({
  sector,
  player,
  onMove,
  onDock,
  onClose,
  onSelectSector,
}: SectorDetailProps): React.JSX.Element {
  const isCurrentSector = player?.currentSectorId === sector.sectorId;
  const isAdjacent =
    player != null &&
    !isCurrentSector &&
    sector.warps.includes(player.currentSectorId);
  const adjacentFromHere =
    player != null && isCurrentSector
      ? false
      : isAdjacent;
  const hasPort = sector.portDetail != null;
  const canDock = isCurrentSector && hasPort && !player.isDocked;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 sm:bg-transparent"
        style={{ zIndex: "var(--vm-z-hud)" as unknown as number }}
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, right sidebar on desktop */}
      <div
        className={
          "fixed overflow-y-auto " +
          "bottom-0 left-0 right-0 max-h-[70vh] rounded-t-xl " +
          "sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto sm:max-h-none sm:rounded-t-none sm:rounded-l-xl " +
          "sm:w-[360px] " +
          "animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
        }
        style={{
          zIndex: "calc(var(--vm-z-hud) + 1)" as unknown as number,
          background: "var(--vm-glass-bg)",
          backdropFilter: `blur(var(--vm-glass-blur))`,
          borderLeft: "1px solid var(--vm-glass-border)",
          borderTop: "1px solid var(--vm-glass-border)",
        }}
      >
        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[var(--vm-neutral-100)] text-lg">
                Sector #{sector.sectorId}
              </CardTitle>
              {isCurrentSector && (
                <Badge className="mt-1 border-transparent bg-[var(--vm-primary)]/20 text-[var(--vm-primary-light)] text-xs">
                  Current Location
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[var(--vm-neutral-400)] hover:text-[var(--vm-neutral-100)]"
              aria-label="Close sector detail"
            >
              ✕
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Warp connections */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-2">
                Warp Connections
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sector.warps.map((warpId) => (
                  <button
                    key={warpId}
                    onClick={() => { onSelectSector(warpId); }}
                    className="px-2 py-1 rounded text-xs font-mono transition-colors
                      bg-[var(--vm-neutral-800)] hover:bg-[var(--vm-primary)]/20
                      text-[var(--vm-primary-light)] hover:text-[var(--vm-neutral-100)]
                      cursor-pointer border border-[var(--vm-neutral-700)] hover:border-[var(--vm-primary)]/40"
                  >
                    #{warpId}
                  </button>
                ))}
                {sector.warps.length === 0 && (
                  <span className="text-[var(--vm-neutral-500)] text-xs italic">
                    No warp connections
                  </span>
                )}
              </div>
            </div>

            {/* Ships present */}
            {sector.playerIds.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-2">
                  Ships Present
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {sector.playerIds.map((pid) => (
                    <Badge
                      key={pid}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {pid}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Port info */}
            {sector.portDetail && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-2">
                  Port
                </h3>
                <div className="rounded-lg bg-[var(--vm-neutral-900)]/60 border border-[var(--vm-neutral-800)] p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[var(--vm-neutral-100)] font-medium">
                      {sector.portDetail.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[var(--vm-primary-light)] border-[var(--vm-primary)]/30 text-xs font-mono"
                    >
                      Class {sector.portDetail.portClass}
                    </Badge>
                  </div>
                  {sector.portDetail.commodities.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[var(--vm-neutral-500)] text-xs border-b border-[var(--vm-neutral-700)]">
                          <th className="text-left py-1 font-medium">Commodity</th>
                          <th className="text-right py-1 px-2 font-medium">Stock</th>
                          <th className="text-right py-1 px-2 font-medium">Price</th>
                          <th className="text-center py-1 pl-2 font-medium">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sector.portDetail.commodities.map((c) => (
                          <CommodityRow key={c.commodity} c={c} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="gap-2 flex-wrap">
            {adjacentFromHere && (
              <Button
                onClick={() => { onMove(sector.sectorId); }}
                className="bg-[var(--vm-primary)] hover:bg-[var(--vm-primary-dark)] text-white"
              >
                Move Here
              </Button>
            )}
            {canDock && (
              <Button
                onClick={onDock}
                variant="outline"
                className="border-[var(--vm-primary)]/40 text-[var(--vm-primary-light)] hover:bg-[var(--vm-primary)]/10"
              >
                Dock at Port
              </Button>
            )}
            {!adjacentFromHere && !canDock && !isCurrentSector && (
              <span className="text-[var(--vm-neutral-500)] text-xs italic">
                Not adjacent — cannot move here directly
              </span>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
