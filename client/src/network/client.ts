import { Client } from "colyseus.js";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type StatusListener = (status: ConnectionStatus, error?: string) => void;

const SERVER_WS_URL: string =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  `ws://${window.location.hostname}:2567`;

let clientInstance: Client | null = null;

export function getColyseusClient(): Client {
  clientInstance ??= new Client(SERVER_WS_URL);
  return clientInstance;
}

/**
 * Attempt to connect to the GalaxyRoom.
 * Calls `onStatus` with connection lifecycle events.
 */
export async function connectToServer(onStatus: StatusListener): Promise<void> {
  const client = getColyseusClient();
  onStatus("connecting");

  try {
    const room = await client.joinOrCreate("galaxy");
    onStatus("connected");

    room.onLeave(() => {
      onStatus("disconnected");
    });

    room.onError((code, message) => {
      onStatus("error", `Room error ${code}: ${message ?? "unknown"}`);
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    onStatus("error", message);
  }
}
