import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Badge } from "./ui/badge.js";
import { Input } from "./ui/input.js";
import type {
  PlayerSnapshot,
  PortSnapshot,
  CommoditySnapshot,
} from "../hooks/useGameState.js";
import { sendTrade, sendUndock, getRoom } from "../network/client.js";
import { SERVER_MSG, type TradeResultMessage } from "@void-market/shared";

// ── Constants ────────────────────────────────────────────────────────────────

const TRADE_TURN_COST = 2;

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

// ── Trade Result State ───────────────────────────────────────────────────────

interface TradeResult {
  success: boolean;
  commodity: string;
  quantity: number;
  totalPrice: number;
  profitLoss: number;
  newCredits: number;
  buying: boolean;
  error?: string;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TradingPanelProps {
  player: PlayerSnapshot;
  port: PortSnapshot;
  onClose: () => void;
}

// ── Commodity Trade Row ──────────────────────────────────────────────────────

function CommodityTradeRow({
  commodity,
  player,
  quantities,
  onQuantityChange,
  onTrade,
  pendingCommodity,
}: {
  commodity: CommoditySnapshot;
  player: PlayerSnapshot;
  quantities: Record<string, number>;
  onQuantityChange: (commodity: string, qty: number) => void;
  onTrade: (commodity: string, buying: boolean) => void;
  pendingCommodity: string | null;
}): React.JSX.Element {
  const label = COMMODITY_LABELS[commodity.commodity] ?? commodity.commodity;
  const color = COMMODITY_COLORS[commodity.commodity] ?? "var(--vm-neutral-400)";
  const qty = quantities[commodity.commodity] ?? 1;
  const playerCargo =
    player.cargo.find((c) => c.commodity === commodity.commodity)?.quantity ?? 0;
  const freeHolds = player.maxCargoHolds - player.cargoHolds;
  const isPending = pendingCommodity === commodity.commodity;

  // Port buys from player → player can SELL
  // Port sells to player → player can BUY
  const canPlayerBuy = !commodity.portBuys;
  const canPlayerSell = commodity.portBuys;

  const buyPrice = commodity.buyPrice;
  const sellPrice = commodity.sellPrice;

  // Disable conditions for buying
  const buyDisabled =
    !canPlayerBuy ||
    isPending ||
    qty <= 0 ||
    player.turnsRemaining < TRADE_TURN_COST ||
    player.credits < buyPrice * qty ||
    freeHolds < qty ||
    commodity.stock < qty;

  // Disable conditions for selling
  const sellDisabled =
    !canPlayerSell ||
    isPending ||
    qty <= 0 ||
    player.turnsRemaining < TRADE_TURN_COST ||
    playerCargo < qty;

  const maxBuyQty = canPlayerBuy
    ? Math.min(
        freeHolds,
        commodity.stock,
        buyPrice > 0 ? Math.floor(player.credits / buyPrice) : 0,
      )
    : 0;
  const maxSellQty = canPlayerSell ? playerCargo : 0;

  const handleMax = () => {
    const max = canPlayerBuy ? maxBuyQty : maxSellQty;
    onQuantityChange(commodity.commodity, Math.max(1, max));
  };

  return (
    <div className="rounded-lg bg-[var(--vm-neutral-900)]/60 border border-[var(--vm-neutral-800)] p-3 space-y-2">
      {/* Commodity header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-[var(--vm-neutral-100)] font-medium">
            {label}
          </span>
        </span>
        <Badge
          variant="outline"
          className={
            commodity.portBuys
              ? "text-[var(--vm-success)] border-[var(--vm-success)]/30 text-xs"
              : "text-[var(--vm-danger)] border-[var(--vm-danger)]/30 text-xs"
          }
        >
          {commodity.portBuys ? "Port Buying" : "Port Selling"}
        </Badge>
      </div>

      {/* Price and stock info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-[var(--vm-neutral-500)]">Stock</span>
          <p className="font-mono text-[var(--vm-neutral-200)]">
            {commodity.stock.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-[var(--vm-neutral-500)]">
            {canPlayerBuy ? "Buy Price" : "Sell Price"}
          </span>
          <p className="font-mono text-[var(--vm-neutral-200)]">
            {(canPlayerBuy ? buyPrice : sellPrice).toLocaleString()} cr
          </p>
        </div>
        <div>
          <span className="text-[var(--vm-neutral-500)]">Your Cargo</span>
          <p className="font-mono text-[var(--vm-neutral-200)]">
            {playerCargo.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Quantity controls and trade button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-[var(--vm-neutral-700)] text-[var(--vm-neutral-300)]"
          onClick={() => {
            onQuantityChange(commodity.commodity, Math.max(1, qty - 1));
          }}
        >
          −
        </Button>
        <Input
          type="number"
          min={1}
          max={canPlayerBuy ? maxBuyQty : maxSellQty}
          value={qty}
          onChange={(e) => {
            onQuantityChange(
              commodity.commodity,
              Math.max(1, parseInt(e.target.value, 10) || 1),
            );
          }}
          className="h-8 w-20 text-center font-mono text-sm bg-[var(--vm-neutral-900)] border-[var(--vm-neutral-700)] text-[var(--vm-neutral-100)]"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-[var(--vm-neutral-700)] text-[var(--vm-neutral-300)]"
          onClick={() => { onQuantityChange(commodity.commodity, qty + 1); }}
        >
          +
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 border-[var(--vm-neutral-700)] text-[var(--vm-neutral-400)] text-xs"
          onClick={handleMax}
        >
          Max
        </Button>

        {canPlayerBuy && (
          <Button
            disabled={buyDisabled}
            onClick={() => { onTrade(commodity.commodity, true); }}
            className="ml-auto h-8 bg-[var(--vm-success)]/90 hover:bg-[var(--vm-success)] text-white text-xs font-medium disabled:opacity-40"
          >
            {isPending ? "…" : `Buy ${qty}`}
          </Button>
        )}
        {canPlayerSell && (
          <Button
            disabled={sellDisabled}
            onClick={() => { onTrade(commodity.commodity, false); }}
            className="ml-auto h-8 bg-[var(--vm-fuel-ore)]/90 hover:bg-[var(--vm-fuel-ore)] text-white text-xs font-medium disabled:opacity-40"
          >
            {isPending ? "…" : `Sell ${qty}`}
          </Button>
        )}
      </div>

      {/* Turn cost inline */}
      <div className="flex items-center gap-1 text-xs text-[var(--vm-neutral-500)]">
        <span>⏱</span>
        <span>Costs {TRADE_TURN_COST} turns</span>
        {canPlayerBuy && qty > 0 && (
          <span className="ml-auto font-mono text-[var(--vm-neutral-400)]">
            Total: {(buyPrice * qty).toLocaleString()} cr
          </span>
        )}
        {canPlayerSell && qty > 0 && (
          <span className="ml-auto font-mono text-[var(--vm-neutral-400)]">
            Total: {(sellPrice * qty).toLocaleString()} cr
          </span>
        )}
      </div>
    </div>
  );
}

// ── Trade Result Toast ───────────────────────────────────────────────────────

function TradeResultToast({
  result,
  onDismiss,
}: {
  result: TradeResult;
  onDismiss: () => void;
}): React.JSX.Element {
  const label = COMMODITY_LABELS[result.commodity] ?? result.commodity;

  useEffect(() => {
    const timer = setTimeout(() => { onDismiss(); }, 5000);
    return () => { clearTimeout(timer); };
  }, [onDismiss]);

  return (
    <div
      className={`rounded-lg border p-3 text-sm animate-in slide-in-from-top duration-200 ${
        result.success
          ? "bg-[var(--vm-success)]/10 border-[var(--vm-success)]/30 text-[var(--vm-success)]"
          : "bg-[var(--vm-danger)]/10 border-[var(--vm-danger)]/30 text-[var(--vm-danger)]"
      }`}
    >
      {result.success ? (
        <>
          <p className="font-medium">
            ✓ {result.buying ? "Purchased" : "Sold"} {result.quantity} × {label}
          </p>
          <p className="text-xs mt-1 opacity-80">
            {result.buying ? "Cost" : "Earned"}:{" "}
            {result.totalPrice.toLocaleString()} credits
            {result.profitLoss !== 0 && (
              <span
                className={
                  result.profitLoss > 0
                    ? "text-[var(--vm-success)]"
                    : "text-[var(--vm-danger)]"
                }
              >
                {" "}
                ({result.profitLoss > 0 ? "+" : ""}
                {result.profitLoss.toLocaleString()} profit)
              </span>
            )}
          </p>
          <p className="text-xs mt-0.5 opacity-70">
            Balance: {result.newCredits.toLocaleString()} credits
          </p>
        </>
      ) : (
        <>
          <p className="font-medium">✗ Trade Failed</p>
          <p className="text-xs mt-1 opacity-80">
            {result.error ?? "Unknown error"}
          </p>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function TradingPanel({
  player,
  port,
  onClose,
}: TradingPanelProps): React.JSX.Element {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [pendingCommodity, setPendingCommodity] = useState<string | null>(null);

  // Listen for trade result messages from the server
  useEffect(() => {
    const room = getRoom();
    if (!room) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const removeListener: () => void = room.onMessage(
      SERVER_MSG.TRADE_RESULT,
      (msg: TradeResultMessage) => {
        const buying = !port.commodities.find(
          (c) => c.commodity === msg.commodity,
        )?.portBuys;
        setTradeResult({
          success: msg.success,
          commodity: msg.commodity,
          quantity: msg.quantity,
          totalPrice: msg.totalPrice,
          profitLoss: msg.profitLoss,
          newCredits: msg.newCredits,
          buying,
          error: msg.error,
        });
        setPendingCommodity(null);
      },
    );

    return () => {
      removeListener();
    };
  }, [port.commodities]);

  const handleQuantityChange = useCallback(
    (commodity: string, qty: number) => {
      setQuantities((prev) => ({ ...prev, [commodity]: qty }));
    },
    [],
  );

  const handleTrade = useCallback(
    (commodity: string, buying: boolean) => {
      const qty = quantities[commodity] ?? 1;
      if (qty <= 0) return;
      setPendingCommodity(commodity);
      setTradeResult(null);
      sendTrade(commodity, qty, buying);
    },
    [quantities],
  );

  const handleUndock = useCallback(() => {
    sendUndock();
    onClose();
  }, [onClose]);

  const handleDismissResult = useCallback(() => {
    setTradeResult(null);
  }, []);

  const freeHolds = player.maxCargoHolds - player.cargoHolds;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 sm:bg-transparent"
        style={{ zIndex: "var(--vm-z-hud)" as unknown as number }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={
          "fixed overflow-y-auto " +
          "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-xl " +
          "sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto sm:max-h-none sm:rounded-t-none sm:rounded-l-xl " +
          "sm:w-[400px] " +
          "animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
        }
        style={{
          zIndex: "calc(var(--vm-z-hud) + 1)" as unknown as number,
          background: "var(--vm-glass-bg)",
          backdropFilter: "blur(var(--vm-glass-blur))",
          borderLeft: "1px solid var(--vm-glass-border)",
          borderTop: "1px solid var(--vm-glass-border)",
        }}
      >
        <Card className="bg-transparent border-0 shadow-none">
          {/* Header */}
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-[var(--vm-neutral-100)] text-lg">
                {port.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-[var(--vm-primary-light)] border-[var(--vm-primary)]/30 text-xs font-mono"
                >
                  Class {port.portClass}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[var(--vm-neutral-400)] border-[var(--vm-neutral-700)] text-xs font-mono"
                >
                  Sector #{port.sectorId}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[var(--vm-neutral-400)] hover:text-[var(--vm-neutral-100)]"
              aria-label="Close trading panel"
            >
              ✕
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            {/* Trade result toast */}
            {tradeResult && (
              <TradeResultToast
                result={tradeResult}
                onDismiss={handleDismissResult}
              />
            )}

            {/* Player status bar */}
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--vm-neutral-900)]/80 border border-[var(--vm-neutral-800)] p-2 text-xs">
              <div className="text-center">
                <span className="text-[var(--vm-neutral-500)]">Credits</span>
                <p className="font-mono text-[var(--vm-credits)] font-medium">
                  {player.credits.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <span className="text-[var(--vm-neutral-500)]">Cargo</span>
                <p className="font-mono text-[var(--vm-neutral-200)]">
                  {player.cargoHolds}/{player.maxCargoHolds}
                  <span className="text-[var(--vm-neutral-500)] ml-1">
                    ({freeHolds} free)
                  </span>
                </p>
              </div>
              <div className="text-center">
                <span className="text-[var(--vm-neutral-500)]">Turns</span>
                <p
                  className={`font-mono font-medium ${
                    player.turnsRemaining < TRADE_TURN_COST
                      ? "text-[var(--vm-danger)]"
                      : player.turnsRemaining < 10
                        ? "text-[var(--vm-warning)]"
                        : "text-[var(--vm-neutral-200)]"
                  }`}
                >
                  {player.turnsRemaining.toLocaleString()}/{player.turnsMax.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Insufficient turns warning */}
            {player.turnsRemaining < TRADE_TURN_COST && (
              <div className="rounded-lg bg-[var(--vm-danger)]/10 border border-[var(--vm-danger)]/30 p-2 text-xs text-[var(--vm-danger)]">
                ⚠ Not enough turns to trade. You need {TRADE_TURN_COST} turns
                but have {player.turnsRemaining}.
              </div>
            )}

            {/* Commodity rows */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-[var(--vm-neutral-400)]">
                Market
              </h3>
              {port.commodities.map((c) => (
                <CommodityTradeRow
                  key={c.commodity}
                  commodity={c}
                  player={player}
                  quantities={quantities}
                  onQuantityChange={handleQuantityChange}
                  onTrade={handleTrade}
                  pendingCommodity={pendingCommodity}
                />
              ))}
              {port.commodities.length === 0 && (
                <p className="text-[var(--vm-neutral-500)] text-sm italic">
                  No commodities available at this port.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleUndock}
              variant="outline"
              className="w-full border-[var(--vm-danger)]/40 text-[var(--vm-danger)] hover:bg-[var(--vm-danger)]/10"
            >
              Undock from Port
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
