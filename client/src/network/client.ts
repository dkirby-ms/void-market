/**
 * Colyseus client — connection management, auto-reconnect, message senders.
 * Module-level singleton: one Client, one Room, pub-sub for status + room events.
 */
import { Client, Room } from "colyseus.js";
import { GalaxyState, CLIENT_MSG } from "@void-market/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type StatusListener = (status: ConnectionStatus, error?: string) => void;
export type RoomListener = (room: Room<GalaxyState>) => void;

// ── Config ───────────────────────────────────────────────────────────────────

const SERVER_WS_URL: string =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  `ws://${window.location.hostname}:2567`;

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

// ── Module state ─────────────────────────────────────────────────────────────

let clientInstance: Client | null = null;
let roomInstance: Room<GalaxyState> | null = null;
let reconnectionToken: string | null = null;
let currentStatus: ConnectionStatus = "disconnected";
let currentError: string | undefined;

const statusSubscribers = new Set<StatusListener>();
const roomSubscribers = new Set<RoomListener>();

// ── Internal helpers ─────────────────────────────────────────────────────────

function notifyStatus(status: ConnectionStatus, error?: string): void {
  currentStatus = status;
  currentError = error;
  for (const cb of statusSubscribers) cb(status, error);
}

function notifyRoom(room: Room<GalaxyState>): void {
  for (const cb of roomSubscribers) cb(room);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupRoom(room: Room<GalaxyState>): Room<GalaxyState> {
  roomInstance = room;
  reconnectionToken = room.reconnectionToken;
  notifyStatus("connected");
  notifyRoom(room);

  room.onLeave((code) => {
    roomInstance = null;
    if (code === 1000) {
      notifyStatus("disconnected");
    } else {
      void attemptReconnect();
    }
  });

  room.onError((code, message) => {
    notifyStatus("error", `Room error ${code}: ${message ?? "unknown"}`);
  });

  return room;
}

async function attemptReconnect(): Promise<void> {
  if (!reconnectionToken) {
    notifyStatus("disconnected");
    return;
  }

  const client = getColyseusClient();

  for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
    notifyStatus("reconnecting");
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt),
      MAX_RECONNECT_DELAY_MS,
    );
    await sleep(delay);

    try {
      const room = await client.reconnect<GalaxyState>(reconnectionToken);
      setupRoom(room);
      return;
    } catch {
      // Retry on next iteration
    }
  }

  reconnectionToken = null;
  notifyStatus("disconnected");
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getColyseusClient(): Client {
  clientInstance ??= new Client(SERVER_WS_URL);
  return clientInstance;
}

export function getRoom(): Room<GalaxyState> | null {
  return roomInstance;
}

export function getSessionId(): string | null {
  return roomInstance?.sessionId ?? null;
}

/** Subscribe to connection status changes. Returns unsubscribe function. */
export function subscribeToStatus(cb: StatusListener): () => void {
  statusSubscribers.add(cb);
  cb(currentStatus, currentError);
  return () => {
    statusSubscribers.delete(cb);
  };
}

/** Subscribe to room lifecycle. Fires immediately if already connected. */
export function subscribeToRoom(cb: RoomListener): () => void {
  roomSubscribers.add(cb);
  if (roomInstance) cb(roomInstance);
  return () => {
    roomSubscribers.delete(cb);
  };
}

/** Join (or reconnect to) GalaxyRoom. Optionally pass a JWT auth token. */
export async function connect(authToken?: string): Promise<Room<GalaxyState>> {
  const client = getColyseusClient();
  notifyStatus("connecting");

  try {
    if (reconnectionToken) {
      try {
        const room = await client.reconnect<GalaxyState>(reconnectionToken);
        return setupRoom(room);
      } catch {
        reconnectionToken = null;
      }
    }

    const options: Record<string, unknown> = {};
    if (authToken) options.token = authToken;

    const room = await client.joinOrCreate<GalaxyState>(
      "galaxy",
      options,
      GalaxyState,
    );
    return setupRoom(room);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    notifyStatus("error", message);
    throw err;
  }
}

/** Leave the room cleanly. */
export async function disconnect(): Promise<void> {
  if (roomInstance) {
    await roomInstance.leave();
    roomInstance = null;
    reconnectionToken = null;
  }
  notifyStatus("disconnected");
}

// ── Message senders ──────────────────────────────────────────────────────────

export function sendMove(targetSectorId: number): void {
  roomInstance?.send(CLIENT_MSG.MOVE, { type: CLIENT_MSG.MOVE, targetSectorId });
}

export function sendDock(): void {
  roomInstance?.send(CLIENT_MSG.DOCK, { type: CLIENT_MSG.DOCK });
}

export function sendUndock(): void {
  roomInstance?.send(CLIENT_MSG.UNDOCK, { type: CLIENT_MSG.UNDOCK });
}

export function sendTrade(
  commodity: string,
  quantity: number,
  buying: boolean,
): void {
  roomInstance?.send(CLIENT_MSG.TRADE, {
    type: CLIENT_MSG.TRADE,
    commodity,
    quantity,
    buying,
  });
}

export function sendUpgradeShip(targetShipClass: string): void {
  roomInstance?.send(CLIENT_MSG.UPGRADE_SHIP, {
    type: CLIENT_MSG.UPGRADE_SHIP,
    targetShipClass,
  });
}
