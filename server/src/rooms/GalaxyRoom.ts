import { Room, type Client } from "@colyseus/core";
import { GalaxyState } from "@void-market/shared";

/**
 * GalaxyRoom — persistent room that holds the galaxy state.
 * Phase 1 issues will add navigation, trading, and turn logic.
 */
export class GalaxyRoom extends Room<{ state: GalaxyState }> {
  onCreate() {
    this.state = new GalaxyState();
    console.log(`[GalaxyRoom] Created (roomId: ${this.roomId})`);
  }

  onJoin(client: Client) {
    console.log(`[GalaxyRoom] Player joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    console.log(`[GalaxyRoom] Player left: ${client.sessionId}`);
  }

  onDispose() {
    console.log(`[GalaxyRoom] Disposed (roomId: ${this.roomId})`);
  }
}
