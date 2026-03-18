import React, { useMemo, useState } from "react";
import { ShipClass, SHIP_SPECS, Commodity, type ShipSpec } from "@void-market/shared";
import { Badge } from "./ui/badge.js";
import { Button } from "./ui/button.js";
import type { PlayerSnapshot, CargoEntry } from "../hooks/useGameState.js";
import { sendUpgradeShip } from "../network/client.js";

// ── Display helpers ──────────────────────────────────────────────────────────

const SHIP_DISPLAY_NAMES: Record<string, string> = {
  [ShipClass.Scout]: "Scout Marauder",
  [ShipClass.Merchant]: "Merchant Freighter",
  [ShipClass.Frigate]: "Frigate",
  [ShipClass.Cruiser]: "Cruiser",
  [ShipClass.Dreadnought]: "Dreadnought",
};

const SHIP_ORDER: ShipClass[] = [
  ShipClass.Scout,
  ShipClass.Merchant,
  ShipClass.Frigate,
  ShipClass.Cruiser,
  ShipClass.Dreadnought,
];

const COMMODITY_COLORS: Record<string, string> = {
  [Commodity.FuelOre]: "var(--vm-fuel-ore)",
  [Commodity.Organics]: "var(--vm-organics)",
  [Commodity.Equipment]: "var(--vm-equipment)",
};

const COMMODITY_LABELS: Record<string, string> = {
  [Commodity.FuelOre]: "Fuel Ore",
  [Commodity.Organics]: "Organics",
  [Commodity.Equipment]: "Equipment",
};

// ── Props ────────────────────────────────────────────────────────────────────

interface ShipPanelProps {
  player: PlayerSnapshot;
  open: boolean;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ShipPanel({ player, open, onClose }: ShipPanelProps): React.JSX.Element | null {
  const [upgradeTarget, setUpgradeTarget] = useState<ShipClass | null>(null);

  const cargoPct = player.maxCargoHolds > 0
    ? Math.round((player.cargoHolds / player.maxCargoHolds) * 100)
    : 0;

  const currentSpec = SHIP_SPECS[player.shipClass as ShipClass];
  const currentIdx = SHIP_ORDER.indexOf(player.shipClass as ShipClass);

  const availableUpgrades = useMemo(() => {
    return SHIP_ORDER.filter((_cls, idx) => idx > currentIdx);
  }, [currentIdx]);

  const targetSpec: ShipSpec | null = upgradeTarget ? SHIP_SPECS[upgradeTarget] : null;
  const tradeInValue = Math.floor(currentSpec.cost * 0.5);
  const upgradeCost = targetSpec ? Math.max(0, targetSpec.cost - tradeInValue) : 0;

  const handleUpgrade = () => {
    if (upgradeTarget) {
      sendUpgradeShip(upgradeTarget as string);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--vm-z-modal)] flex justify-end"
      role="dialog"
      aria-label="Ship Status"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="relative w-full max-w-sm overflow-y-auto border-l animate-in slide-in-from-right duration-200"
        style={{
          background: "var(--vm-surface)",
          borderColor: "var(--vm-glass-border)",
          fontFamily: "var(--vm-font-family-mono)",
          fontSize: "var(--vm-font-sm)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{
            background: "var(--vm-surface-raised)",
            borderColor: "var(--vm-glass-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <ShipIcon className="w-5 h-5 text-[var(--vm-primary)]" />
            <h2 className="text-[var(--vm-neutral-100)] font-semibold text-base">
              Ship Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--vm-neutral-400)] hover:text-[var(--vm-neutral-100)] hover:bg-[var(--vm-neutral-800)] transition-colors"
            aria-label="Close ship panel"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Ship Type */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="border-transparent bg-[var(--vm-primary)]/15 text-[var(--vm-primary-light)]">
                {SHIP_DISPLAY_NAMES[player.shipClass] ?? player.shipClass}
              </Badge>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-[var(--vm-neutral-400)]">
              <span>Speed: <span className="text-[var(--vm-neutral-200)]">{player.shipSpeed}</span></span>
              <span>Holds: <span className="text-[var(--vm-neutral-200)]">{player.maxCargoHolds}</span></span>
            </div>
          </section>

          {/* Cargo Capacity */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-2">
              Cargo Capacity
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 rounded-full bg-[var(--vm-neutral-800)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${cargoPct}%`,
                    backgroundColor:
                      cargoPct > 90 ? "var(--vm-danger)"
                        : cargoPct > 60 ? "var(--vm-warning)"
                          : "var(--vm-primary)",
                  }}
                />
              </div>
              <span className="text-xs text-[var(--vm-neutral-300)] min-w-[4rem] text-right">
                {player.cargoHolds} / {player.maxCargoHolds}
              </span>
            </div>
          </section>

          {/* Commodity Breakdown */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-2">
              Cargo Manifest
            </h3>
            <div className="space-y-2">
              {player.cargo.length === 0 ? (
                <p className="text-xs text-[var(--vm-neutral-600)] italic">
                  Cargo holds empty
                </p>
              ) : (
                player.cargo.map((entry: CargoEntry) => (
                  <CommodityRow
                    key={entry.commodity}
                    entry={entry}
                    maxHolds={player.maxCargoHolds}
                  />
                ))
              )}
            </div>
          </section>

          {/* Ship Upgrade (only when docked) */}
          {player.isDocked && availableUpgrades.length > 0 && (
            <section
              className="border rounded-lg p-3"
              style={{ borderColor: "var(--vm-glass-border)" }}
            >
              <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)] mb-3">
                Ship Upgrade
              </h3>

              {/* Upgrade target selector */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {availableUpgrades.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => { setUpgradeTarget(cls); }}
                    className={`px-2 py-1 rounded text-xs transition-colors border ${
                      upgradeTarget === cls
                        ? "border-[var(--vm-primary)] bg-[var(--vm-primary)]/15 text-[var(--vm-primary-light)]"
                        : "border-[var(--vm-neutral-700)] text-[var(--vm-neutral-400)] hover:border-[var(--vm-neutral-500)]"
                    }`}
                  >
                    {SHIP_DISPLAY_NAMES[cls] ?? cls}
                  </button>
                ))}
              </div>

              {/* Comparison */}
              {upgradeTarget && targetSpec && (
                <div className="space-y-3">
                  <div
                    className="grid grid-cols-3 gap-2 text-xs border rounded p-2"
                    style={{ borderColor: "var(--vm-neutral-800)" }}
                  >
                    <div className="text-[var(--vm-neutral-500)]" />
                    <div className="text-center text-[var(--vm-neutral-400)]">Current</div>
                    <div className="text-center text-[var(--vm-primary-light)]">New</div>

                    <div className="text-[var(--vm-neutral-400)]">Cargo</div>
                    <div className="text-center text-[var(--vm-neutral-200)]">{currentSpec.cargoCapacity}</div>
                    <StatDiff current={currentSpec.cargoCapacity} next={targetSpec.cargoCapacity} />

                    <div className="text-[var(--vm-neutral-400)]">Speed</div>
                    <div className="text-center text-[var(--vm-neutral-200)]">{currentSpec.warpSpeed}</div>
                    <StatDiff current={currentSpec.warpSpeed} next={targetSpec.warpSpeed} />

                    <div className="text-[var(--vm-neutral-400)]">Shields</div>
                    <div className="text-center text-[var(--vm-neutral-200)]">{currentSpec.maxShields}</div>
                    <StatDiff current={currentSpec.maxShields} next={targetSpec.maxShields} />

                    <div className="text-[var(--vm-neutral-400)]">Fighters</div>
                    <div className="text-center text-[var(--vm-neutral-200)]">{currentSpec.maxFighters}</div>
                    <StatDiff current={currentSpec.maxFighters} next={targetSpec.maxFighters} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--vm-neutral-400)]">
                      Cost: <span className="text-[var(--vm-credits)] font-semibold">
                        {upgradeCost.toLocaleString()} cr
                      </span>
                    </span>
                    {tradeInValue > 0 && (
                      <span className="text-[var(--vm-neutral-600)]">
                        (trade-in: {tradeInValue.toLocaleString()} cr)
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={handleUpgrade}
                    disabled={player.credits < upgradeCost}
                    className="w-full bg-[var(--vm-primary)] hover:bg-[var(--vm-primary-dark)] text-white text-xs"
                    size="sm"
                  >
                    {player.credits < upgradeCost
                      ? `Need ${(upgradeCost - player.credits).toLocaleString()} more credits`
                      : `Upgrade to ${SHIP_DISPLAY_NAMES[upgradeTarget] ?? upgradeTarget}`}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CommodityRow({ entry, maxHolds }: { entry: CargoEntry; maxHolds: number }) {
  const pct = maxHolds > 0 ? Math.round((entry.quantity / maxHolds) * 100) : 0;
  const color = COMMODITY_COLORS[entry.commodity] ?? "var(--vm-neutral-400)";
  const label = COMMODITY_LABELS[entry.commodity] ?? entry.commodity;

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[var(--vm-neutral-300)] w-20 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--vm-neutral-800)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[var(--vm-neutral-400)] min-w-[2.5rem] text-right">
        {entry.quantity}
      </span>
    </div>
  );
}

function StatDiff({ current, next }: { current: number; next: number }) {
  const diff = next - current;
  const color =
    diff > 0 ? "var(--vm-success)" : diff < 0 ? "var(--vm-danger)" : "var(--vm-neutral-400)";
  return (
    <div className="text-center" style={{ color }}>
      {next}
      {diff !== 0 && (
        <span className="ml-0.5 text-[10px]">
          ({diff > 0 ? "+" : ""}{diff})
        </span>
      )}
    </div>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function ShipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}
