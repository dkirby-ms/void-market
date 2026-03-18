/**
 * useGameNotifications — listens to Colyseus server messages and triggers toasts.
 *
 * Covers: trade results, movement, errors, system broadcasts, and turn regen milestones.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Room } from "colyseus.js";
import {
  SERVER_MSG,
  type GalaxyState,
  type TradeResultMessage,
  type ErrorMessage,
  type SectorEnteredMessage,
  type TurnUpdateMessage,
  type SystemMessage,
} from "@void-market/shared";
import { subscribeToRoom } from "../network/client.js";

const TURN_MILESTONE_INTERVAL = 100;

export function useGameNotifications(): void {
  const lastTurnMilestoneRef = useRef<number | null>(null);

  useEffect(() => {
    let onTradeResult: ((msg: TradeResultMessage) => void) | null = null;
    let onError: ((msg: ErrorMessage) => void) | null = null;
    let onSectorEntered: ((msg: SectorEnteredMessage) => void) | null = null;
    let onTurnUpdate: ((msg: TurnUpdateMessage) => void) | null = null;
    let onSystem: ((msg: SystemMessage) => void) | null = null;

    const unsubRoom = subscribeToRoom((room: Room<GalaxyState>) => {
      // Trade result
      onTradeResult = (msg: TradeResultMessage) => {
        if (msg.success) {
          const action = msg.profitLoss >= 0 ? "Earned" : "Spent";
          const amount = Math.abs(msg.profitLoss);
          toast.success(
            `Trade complete: ${msg.quantity} ${formatCommodity(msg.commodity)}`,
            {
              description: `${action} ${amount.toLocaleString()} credits`,
              duration: 4000,
            },
          );
        } else {
          toast.error("Trade failed", {
            description: msg.error ?? "Unknown error",
            duration: 5000,
          });
        }
      };
      room.onMessage(SERVER_MSG.TRADE_RESULT, onTradeResult);

      // Error
      onError = (msg: ErrorMessage) => {
        toast.error(msg.message, { duration: 5000 });
      };
      room.onMessage(SERVER_MSG.ERROR, onError);

      // Sector entered (own movement — only show for local player-relevant events)
      onSectorEntered = (msg: SectorEnteredMessage) => {
        if (msg.playerId === room.sessionId) {
          toast(`Warped to Sector #${msg.sectorId}`, { duration: 2500 });
        }
      };
      room.onMessage(SERVER_MSG.SECTOR_ENTERED, onSectorEntered);

      // Turn update — show milestone toasts
      onTurnUpdate = (msg: TurnUpdateMessage) => {
        const milestone =
          Math.floor(msg.turnsRemaining / TURN_MILESTONE_INTERVAL) *
          TURN_MILESTONE_INTERVAL;

        if (
          lastTurnMilestoneRef.current !== null &&
          milestone > lastTurnMilestoneRef.current
        ) {
          toast(`Turn regenerated (${msg.turnsRemaining}/${msg.turnsMax})`, {
            duration: 3000,
          });
        }
        lastTurnMilestoneRef.current = milestone;
      };
      room.onMessage(SERVER_MSG.TURN_UPDATE, onTurnUpdate);

      // System broadcast
      onSystem = (msg: SystemMessage) => {
        const variant =
          msg.severity === "critical"
            ? "error"
            : msg.severity === "warning"
              ? "warning"
              : "info";
        toast[variant](msg.message, { duration: 6000 });
      };
      room.onMessage(SERVER_MSG.SYSTEM, onSystem);
    });

    return () => {
      unsubRoom();
    };
  }, []);
}

function formatCommodity(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
