import { Room, type Client } from "@colyseus/core";
import {
  GalaxyState,
  PlayerSchema,
  ShipSchema,
  ShipClass,
  ActionType,
  CLIENT_MSG,
  SERVER_MSG,
  STARTING_TURNS,
  STARTING_CREDITS,
  STARTING_SECTOR_ID,
  MAX_TURN_BANK,
  TURN_COSTS,
  TURN_REGEN_INTERVAL_MS,
  SHIP_SPECS,
  type MoveMessage,
  type TradeMessage,
  type ErrorMessage,
  type PlayerJoinedMessage,
  type PlayerLeftMessage,
  type SectorEnteredMessage,
  type TurnUpdateMessage,
  type TradeResultMessage,
} from "@void-market/shared";
import { generateGalaxy } from "../galaxy/GalaxyGenerator.js";
import {
  loadCargo,
  unloadCargo,
  isValidCommodity,
  freeCargoHolds,
} from "../game/ShipManager.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

let playerCounter = 0;

function nextPlayerId(): string {
  playerCounter += 1;
  return `p-${playerCounter}`;
}

/** Reset the player counter (useful for tests). */
export function _resetPlayerCounter(): void {
  playerCounter = 0;
}

// ── GalaxyRoom ───────────────────────────────────────────────────────────────

/**
 * GalaxyRoom — persistent room that holds the galaxy state.
 *
 * Responsibilities:
 *  - Generate the galaxy on creation (via GalaxyGenerator)
 *  - Spawn players on join (sector 1, starting turns/credits)
 *  - Handle move, dock, undock, and trade commands
 *  - Validate turn balance on every action
 *  - Regenerate turns on a timer
 */
export class GalaxyRoom extends Room<{ state: GalaxyState }> {
  private turnRegenInterval: ReturnType<typeof setInterval> | undefined;

  onCreate(options: { seed?: number } = {}) {
    const seed = options.seed ?? Date.now();
    this.state = generateGalaxy(seed);

    // ── Register message handlers ──
    this.onMessage(CLIENT_MSG.MOVE, (client, message: MoveMessage) => {
      this.handleMove(client, message);
    });

    this.onMessage(CLIENT_MSG.DOCK, (client) => {
      this.handleDock(client);
    });

    this.onMessage(CLIENT_MSG.UNDOCK, (client) => {
      this.handleUndock(client);
    });

    this.onMessage(CLIENT_MSG.TRADE, (client, message: TradeMessage) => {
      this.handleTrade(client, message);
    });

    // ── Turn regeneration timer ──
    this.turnRegenInterval = setInterval(() => {
      this.regenTurns();
    }, TURN_REGEN_INTERVAL_MS);

    console.log(
      `[GalaxyRoom] Created (roomId: ${this.roomId}, seed: ${seed}, sectors: ${this.state.sectors.size})`,
    );
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  onJoin(client: Client, options?: { displayName?: string }) {
    const playerId = nextPlayerId();
    const displayName = options?.displayName ?? `Pilot-${playerId}`;

    // Create player schema
    const player = new PlayerSchema();
    player.playerId = playerId;
    player.displayName = displayName;
    player.credits = STARTING_CREDITS;
    player.turnsRemaining = STARTING_TURNS;
    player.turnsMax = MAX_TURN_BANK;
    player.currentSectorId = STARTING_SECTOR_ID;
    player.isDocked = false;
    player.isOnline = true;

    // Create default ship (Scout)
    const ship = new ShipSchema();
    const scoutSpec = SHIP_SPECS[ShipClass.Scout];
    ship.shipId = `ship-${playerId}`;
    ship.shipClass = ShipClass.Scout;
    ship.name = `${displayName}'s Scout`;
    ship.maxCargoHolds = scoutSpec.cargoCapacity;
    ship.speed = scoutSpec.warpSpeed;
    ship.cargoHolds = 0;
    player.ship = ship;

    // Register in state
    this.state.players.set(client.sessionId, player);

    // Add to starting sector's playerIds
    const sector = this.state.sectors.get(String(STARTING_SECTOR_ID));
    if (sector) {
      sector.playerIds.push(client.sessionId);
    }

    // Broadcast join to other players
    const joinMsg: PlayerJoinedMessage = {
      type: SERVER_MSG.PLAYER_JOINED,
      playerId: client.sessionId,
      displayName,
      sectorId: STARTING_SECTOR_ID,
    };
    this.broadcast(SERVER_MSG.PLAYER_JOINED, joinMsg, { except: client });

    // Send initial turn update to joining player
    this.sendTurnUpdate(client, player);

    console.log(
      `[GalaxyRoom] Player joined: ${client.sessionId} (${displayName}) in sector ${STARTING_SECTOR_ID}`,
    );
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isOnline = false;

      // Remove from current sector's playerIds
      const sector = this.state.sectors.get(String(player.currentSectorId));
      if (sector) {
        const idx = sector.playerIds.indexOf(client.sessionId);
        if (idx !== -1) sector.playerIds.splice(idx, 1);
      }
    }

    // Broadcast leave
    const leaveMsg: PlayerLeftMessage = {
      type: SERVER_MSG.PLAYER_LEFT,
      playerId: client.sessionId,
    };
    this.broadcast(SERVER_MSG.PLAYER_LEFT, leaveMsg);

    console.log(`[GalaxyRoom] Player left: ${client.sessionId}`);
  }

  onDispose() {
    if (this.turnRegenInterval) {
      clearInterval(this.turnRegenInterval);
    }
    console.log(`[GalaxyRoom] Disposed (roomId: ${this.roomId})`);
  }

  // ── Message handlers ─────────────────────────────────────────────────────

  private handleMove(client: Client, message: MoveMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const cost = TURN_COSTS[ActionType.Move];

    // Turn validation
    if (!this.deductTurns(client, player, cost, "move")) return;

    // Cannot move while docked
    if (player.isDocked) {
      this.refundTurns(player, cost);
      this.sendError(client, "CANNOT_MOVE_DOCKED", "Undock before moving");
      return;
    }

    // Validate warp connection
    const currentSector = this.state.sectors.get(
      String(player.currentSectorId),
    );
    if (!currentSector) {
      this.refundTurns(player, cost);
      this.sendError(client, "INVALID_SECTOR", "Current sector not found");
      return;
    }

    const targetId = message.targetSectorId;
    const hasWarp = currentSector.warps.includes(targetId);
    if (!hasWarp) {
      this.refundTurns(player, cost);
      this.sendError(
        client,
        "NO_WARP",
        `No warp connection from sector ${player.currentSectorId} to ${targetId}`,
      );
      return;
    }

    // Validate target sector exists
    const targetSector = this.state.sectors.get(String(targetId));
    if (!targetSector) {
      this.refundTurns(player, cost);
      this.sendError(client, "INVALID_SECTOR", "Target sector not found");
      return;
    }

    // Execute move
    const oldSectorId = player.currentSectorId;
    const oldSector = this.state.sectors.get(String(oldSectorId));
    if (oldSector) {
      const idx = oldSector.playerIds.indexOf(client.sessionId);
      if (idx !== -1) oldSector.playerIds.splice(idx, 1);
    }

    player.currentSectorId = targetId;
    targetSector.playerIds.push(client.sessionId);

    // Broadcast sector entered to players in the target sector
    const enterMsg: SectorEnteredMessage = {
      type: SERVER_MSG.SECTOR_ENTERED,
      playerId: client.sessionId,
      displayName: player.displayName,
      sectorId: targetId,
    };
    this.broadcast(SERVER_MSG.SECTOR_ENTERED, enterMsg, { except: client });

    this.sendTurnUpdate(client, player);
  }

  private handleDock(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (player.isDocked) {
      this.sendError(client, "ALREADY_DOCKED", "Already docked at a port");
      return;
    }

    // Check port exists in sector
    const sector = this.state.sectors.get(String(player.currentSectorId));
    if (!sector?.port) {
      this.sendError(
        client,
        "NO_PORT",
        `No port in sector ${player.currentSectorId}`,
      );
      return;
    }

    // Dock is free (0 turns) but still validate turn balance
    const cost = TURN_COSTS[ActionType.Dock];
    if (cost > 0 && !this.deductTurns(client, player, cost, "dock")) return;

    player.isDocked = true;
    if (cost > 0) this.sendTurnUpdate(client, player);
  }

  private handleUndock(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (!player.isDocked) {
      this.sendError(client, "NOT_DOCKED", "Not docked at a port");
      return;
    }

    const cost = TURN_COSTS[ActionType.Undock];
    if (cost > 0 && !this.deductTurns(client, player, cost, "undock")) return;

    player.isDocked = false;
    if (cost > 0) this.sendTurnUpdate(client, player);
  }

  private handleTrade(client: Client, message: TradeMessage): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Must be docked
    if (!player.isDocked) {
      this.sendError(client, "NOT_DOCKED", "Must be docked to trade");
      return;
    }

    // Turn validation
    const cost = TURN_COSTS[ActionType.Trade];
    if (!this.deductTurns(client, player, cost, "trade")) return;

    // Validate commodity
    if (!isValidCommodity(message.commodity)) {
      this.refundTurns(player, cost);
      this.sendError(
        client,
        "INVALID_COMMODITY",
        `Unknown commodity: ${message.commodity}`,
      );
      return;
    }

    if (message.quantity <= 0) {
      this.refundTurns(player, cost);
      this.sendError(client, "INVALID_QUANTITY", "Quantity must be positive");
      return;
    }

    // Get port
    const sector = this.state.sectors.get(String(player.currentSectorId));
    const port = sector?.port;
    if (!port) {
      this.refundTurns(player, cost);
      this.sendError(client, "NO_PORT", "No port in current sector");
      return;
    }

    const commoditySchema = port.commodities.get(message.commodity);
    if (!commoditySchema) {
      this.refundTurns(player, cost);
      this.sendError(
        client,
        "COMMODITY_NOT_AVAILABLE",
        "Port does not stock this commodity",
      );
      return;
    }

    if (message.buying) {
      // Player buys from port (port sells)
      if (commoditySchema.portBuys) {
        // Port buys this commodity, not sells
        this.refundTurns(player, cost);
        this.sendError(
          client,
          "PORT_NOT_SELLING",
          "Port does not sell this commodity",
        );
        return;
      }

      const availableStock = commoditySchema.stock;
      const qty = Math.min(message.quantity, availableStock);
      if (qty === 0) {
        this.refundTurns(player, cost);
        this.sendError(client, "OUT_OF_STOCK", "Port is out of stock");
        return;
      }

      const totalPrice = qty * commoditySchema.buyPrice;
      if (player.credits < totalPrice) {
        this.refundTurns(player, cost);
        this.sendError(
          client,
          "INSUFFICIENT_CREDITS",
          `Need ${totalPrice} credits, have ${Math.floor(player.credits)}`,
        );
        return;
      }

      // Check cargo capacity
      const free = freeCargoHolds(player.ship);
      const actualQty = Math.min(qty, free);
      if (actualQty === 0) {
        this.refundTurns(player, cost);
        this.sendError(client, "CARGO_FULL", "No free cargo holds");
        return;
      }

      const actualPrice = actualQty * commoditySchema.buyPrice;

      // Execute trade
      player.credits -= actualPrice;
      commoditySchema.stock -= actualQty;
      loadCargo(player.ship, message.commodity, actualQty);

      const result: TradeResultMessage = {
        type: SERVER_MSG.TRADE_RESULT,
        success: true,
        commodity: message.commodity,
        quantity: actualQty,
        totalPrice: actualPrice,
        newCredits: player.credits,
        newStock: commoditySchema.stock,
      };
      client.send(SERVER_MSG.TRADE_RESULT, result);
    } else {
      // Player sells to port (port buys)
      if (!commoditySchema.portBuys) {
        this.refundTurns(player, cost);
        this.sendError(
          client,
          "PORT_NOT_BUYING",
          "Port does not buy this commodity",
        );
        return;
      }

      // Unload from cargo
      const actualQty = unloadCargo(
        player.ship,
        message.commodity,
        message.quantity,
      );
      if (actualQty === 0) {
        this.refundTurns(player, cost);
        this.sendError(client, "NO_CARGO", "You have none of this commodity");
        return;
      }

      const totalPrice = actualQty * commoditySchema.sellPrice;

      // Execute trade
      player.credits += totalPrice;
      commoditySchema.stock += actualQty;

      const result: TradeResultMessage = {
        type: SERVER_MSG.TRADE_RESULT,
        success: true,
        commodity: message.commodity,
        quantity: actualQty,
        totalPrice,
        newCredits: player.credits,
        newStock: commoditySchema.stock,
      };
      client.send(SERVER_MSG.TRADE_RESULT, result);
    }

    this.sendTurnUpdate(client, player);
  }

  // ── Turn management ──────────────────────────────────────────────────────

  /**
   * Deduct turns for an action. Sends an error and returns false if the
   * player cannot afford the cost.
   */
  private deductTurns(
    client: Client,
    player: PlayerSchema,
    cost: number,
    action: string,
  ): boolean {
    if (player.turnsRemaining < cost) {
      this.sendError(
        client,
        "INSUFFICIENT_TURNS",
        `Not enough turns for ${action} (need ${cost}, have ${player.turnsRemaining})`,
      );
      return false;
    }
    player.turnsRemaining -= cost;
    return true;
  }

  /** Refund turns (used when a validation fails after initial deduction). */
  private refundTurns(player: PlayerSchema, cost: number): void {
    player.turnsRemaining = Math.min(
      player.turnsRemaining + cost,
      player.turnsMax,
    );
  }

  /** Regenerate 1 turn for all online players. */
  private regenTurns(): void {
    this.state.players.forEach((player, sessionId) => {
      if (!player.isOnline) return;
      if (player.turnsRemaining >= player.turnsMax) return;

      player.turnsRemaining = Math.min(
        player.turnsRemaining + 1,
        player.turnsMax,
      );

      // Send update to the specific client
      const client = this.clients.getById(sessionId);
      if (client) {
        this.sendTurnUpdate(client, player);
      }
    });
  }

  // ── Messaging helpers ────────────────────────────────────────────────────

  private sendError(client: Client, code: string, message: string): void {
    const errorMsg: ErrorMessage = {
      type: SERVER_MSG.ERROR,
      code,
      message,
    };
    client.send(SERVER_MSG.ERROR, errorMsg);
  }

  private sendTurnUpdate(client: Client, player: PlayerSchema): void {
    const msg: TurnUpdateMessage = {
      type: SERVER_MSG.TURN_UPDATE,
      turnsRemaining: player.turnsRemaining,
      turnsMax: player.turnsMax,
      nextRegenAt: Date.now() + TURN_REGEN_INTERVAL_MS,
    };
    client.send(SERVER_MSG.TURN_UPDATE, msg);
  }
}
