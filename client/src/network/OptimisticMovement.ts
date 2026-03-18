/**
 * OptimisticMovement — predict movement client-side, reconcile with server.
 *
 * Flow:
 *  1. User clicks a sector → requestMove(sectorId)
 *  2. Ship immediately lerp-animates to the target (optimistic)
 *  3. Server confirms (player.currentSectorId changes) → StateSync calls confirmMove()
 *  4. If server rejects (error message) → ship snaps back to previous position
 */
import type { Room } from "colyseus.js";
import type { GalaxyState } from "@void-market/shared";
import { CLIENT_MSG, SERVER_MSG } from "@void-market/shared";
import type { ErrorMessage } from "@void-market/shared";
import type { GalaxyRenderer } from "../game/GalaxyRenderer.js";

const MOVEMENT_ERROR_CODES = new Set([
  "INSUFFICIENT_TURNS",
  "CANNOT_MOVE_DOCKED",
  "NO_WARP",
  "INVALID_SECTOR",
]);

interface PendingMove {
  targetSectorId: number;
  previousSectorId: number;
  timestamp: number;
}

export class OptimisticMovement {
  private room: Room<GalaxyState>;
  private renderer: GalaxyRenderer;
  private pendingMove: PendingMove | null = null;
  private removeErrorListener: (() => void) | null = null;

  constructor(room: Room<GalaxyState>, renderer: GalaxyRenderer) {
    this.room = room;
    this.renderer = renderer;
    this.setupErrorListener();
  }

  private setupErrorListener(): void {
    this.removeErrorListener = this.room.onMessage(
      SERVER_MSG.ERROR,
      (message: ErrorMessage) => {
        if (this.pendingMove && MOVEMENT_ERROR_CODES.has(message.code)) {
          this.rejectMove();
        }
      },
    ) as (() => void) | null;
  }

  /**
   * Optimistically move the local player to the target sector.
   * The ship immediately starts animating; the move command is sent to the server.
   */
  requestMove(targetSectorId: number): void {
    const localPlayer = this.room.state.players.get(this.room.sessionId);
    if (!localPlayer) return;

    const previousSectorId = localPlayer.currentSectorId;
    if (previousSectorId === targetSectorId) return;

    this.pendingMove = {
      targetSectorId,
      previousSectorId,
      timestamp: Date.now(),
    };

    // Optimistic: animate ship to target immediately
    this.renderer.shipManager.moveShip(this.room.sessionId, targetSectorId);

    // Send the actual command to the server
    this.room.send(CLIENT_MSG.MOVE, {
      type: CLIENT_MSG.MOVE,
      targetSectorId,
    });
  }

  /**
   * Called by StateSync when the server confirms the player's sector changed.
   * Returns true if the optimistic prediction matched (skip redundant animation).
   */
  confirmMove(confirmedSectorId: number): boolean {
    if (!this.pendingMove) return false;

    if (this.pendingMove.targetSectorId === confirmedSectorId) {
      this.pendingMove = null;
      return true;
    }

    // Server moved us somewhere unexpected — clear pending and let StateSync animate
    this.pendingMove = null;
    return false;
  }

  /** Reject the pending move — snap ship back to its actual position. */
  private rejectMove(): void {
    if (!this.pendingMove) return;

    const { previousSectorId } = this.pendingMove;
    this.renderer.shipManager.snapShip(this.room.sessionId, previousSectorId);
    this.pendingMove = null;
  }

  get hasPendingMove(): boolean {
    return this.pendingMove !== null;
  }

  dispose(): void {
    this.removeErrorListener?.();
    this.removeErrorListener = null;
    this.pendingMove = null;
  }
}
