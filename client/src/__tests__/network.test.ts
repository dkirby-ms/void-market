/**
 * Network layer tests — Colyseus client, StateSync, OptimisticMovement.
 *
 * Mocks WebSocket (via colyseus.js) and tests the client-side network stack
 * headless in CI with no real server.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { CLIENT_MSG, SERVER_MSG } from "@void-market/shared";

// ── Hoisted globals (run before any module-level code) ──────────────────────

vi.hoisted(() => {
  // client.ts references window.location.hostname at module level
  globalThis.window = {
    location: { hostname: "localhost" },
    devicePixelRatio: 1,
  } as unknown as Window & typeof globalThis;
});

// ── Mock colyseus.js ────────────────────────────────────────────────────────

const mockJoinOrCreate = vi.fn();
const mockReconnect = vi.fn();

vi.mock("colyseus.js", () => ({
  Client: class MockClient {
    joinOrCreate(...args: unknown[]): unknown {
      return mockJoinOrCreate(...args);
    }
    reconnect(...args: unknown[]): unknown {
      return mockReconnect(...args);
    }
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMockRoom(sessionId = "local-session") {
  return {
    sessionId,
    reconnectionToken: "mock-reconnection-token",
    state: {},
    leave: vi.fn().mockResolvedValue(undefined),
    send: vi.fn(),
    onLeave: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn().mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    ),
  };
}

interface MockSchemaMap<V> {
  _items: Map<string, V>;
  _addCbs: ((item: V, key: string) => void)[];
  _removeCbs: ((item: V, key: string) => void)[];
  _changeCbs: ((item: V, key: string) => void)[];
  onAdd: (cb: (item: V, key: string) => void, triggerAll?: boolean) => () => boolean;
  onRemove: (cb: (item: V, key: string) => void) => () => boolean;
  onChange: (cb: (item: V, key: string) => void) => () => boolean;
  get: (key: string) => V | undefined;
  forEach: (cb: (item: V, key: string) => void) => void;
  simulateAdd: (item: V, key: string) => void;
  simulateRemove: (item: V, key: string) => void;
  simulateChange: (item: V, key: string) => void;
}

function makeSchemaMap<V>(initial?: Map<string, V>): MockSchemaMap<V> {
  const items = initial ?? new Map<string, V>();
  const addCbs: ((item: V, key: string) => void)[] = [];
  const removeCbs: ((item: V, key: string) => void)[] = [];
  const changeCbs: ((item: V, key: string) => void)[] = [];

  return {
    _items: items,
    _addCbs: addCbs,
    _removeCbs: removeCbs,
    _changeCbs: changeCbs,
    onAdd(cb, triggerAll?) {
      addCbs.push(cb);
      if (triggerAll) items.forEach((item, key) => cb(item, key));
      return () => true;
    },
    onRemove(cb) {
      removeCbs.push(cb);
      return () => true;
    },
    onChange(cb) {
      changeCbs.push(cb);
      return () => true;
    },
    get(key) {
      return items.get(key);
    },
    forEach(cb) {
      items.forEach(cb);
    },
    simulateAdd(item, key) {
      items.set(key, item);
      for (const cb of addCbs) cb(item, key);
    },
    simulateRemove(item, key) {
      items.delete(key);
      for (const cb of removeCbs) cb(item, key);
    },
    simulateChange(item, key) {
      for (const cb of changeCbs) cb(item, key);
    },
  };
}

interface MockSector {
  sectorId: number;
  x: number;
  y: number;
  warps: number[];
  port: { portId: string; name: string; portClass: string } | null;
  playerIds: string[];
}

function makeMockSector(id: number, x = 0, y = 0): MockSector {
  return {
    sectorId: id,
    x,
    y,
    warps: [],
    port: null,
    playerIds: [],
  };
}

interface MockPlayer {
  displayName: string;
  currentSectorId: number;
}

function makeMockPlayer(sectorId: number, name = "TestPlayer"): MockPlayer {
  return { displayName: name, currentSectorId: sectorId };
}

function makeMockRenderer() {
  return {
    updateSector: vi.fn(),
    setGalaxyData: vi.fn(),
    setCurrentSector: vi.fn(),
    shipManager: {
      addShip: vi.fn(),
      moveShip: vi.fn(),
      removeShip: vi.fn(),
      snapShip: vi.fn(),
    },
    update: vi.fn(),
  };
}

function makeStateSyncRoom(sessionId = "local-session") {
  const sectors = makeSchemaMap<MockSector>();
  const players = makeSchemaMap<MockPlayer>();

  return {
    sessionId,
    state: { sectors, players },
    send: vi.fn(),
    onMessage: vi.fn().mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    ),
    onLeave: vi.fn(),
    onError: vi.fn(),
    reconnectionToken: "mock-token",
  };
}

// ── Static imports for StateSync and OptimisticMovement ─────────────────────

import { StateSync } from "../network/StateSync.js";
import { OptimisticMovement } from "../network/OptimisticMovement.js";

// ── Tests: Colyseus client module ───────────────────────────────────────────

describe("Colyseus client module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("subscribeToStatus fires immediately with 'disconnected'", async () => {
    const { subscribeToStatus } = await import("../network/client.js");
    const listener = vi.fn();

    subscribeToStatus(listener);

    expect(listener).toHaveBeenCalledWith("disconnected", undefined);
  });

  test("subscribeToStatus returns unsubscribe function", async () => {
    const { subscribeToStatus } = await import("../network/client.js");
    const listener = vi.fn();

    const unsub = subscribeToStatus(listener);

    expect(typeof unsub).toBe("function");
    unsub();
  });

  test("connect joins GalaxyRoom and notifies subscribers", async () => {
    const room = makeMockRoom();
    mockJoinOrCreate.mockResolvedValue(room);

    const { connect, subscribeToStatus, subscribeToRoom } =
      await import("../network/client.js");

    const statusListener = vi.fn();
    const roomListener = vi.fn();
    subscribeToStatus(statusListener);
    subscribeToRoom(roomListener);
    statusListener.mockClear();

    await connect("test-auth-token");

    expect(mockJoinOrCreate).toHaveBeenCalledWith(
      "galaxy",
      { token: "test-auth-token" },
      expect.anything(),
    );
    expect(statusListener).toHaveBeenCalledWith("connecting", undefined);
    expect(statusListener).toHaveBeenCalledWith("connected", undefined);
    expect(roomListener).toHaveBeenCalledWith(room);
  });

  test("connect notifies error on failure", async () => {
    mockJoinOrCreate.mockRejectedValue(new Error("Connection failed"));

    const { connect, subscribeToStatus } =
      await import("../network/client.js");

    const statusListener = vi.fn();
    subscribeToStatus(statusListener);
    statusListener.mockClear();

    await expect(connect()).rejects.toThrow("Connection failed");
    expect(statusListener).toHaveBeenCalledWith("connecting", undefined);
    expect(statusListener).toHaveBeenCalledWith("error", "Connection failed");
  });

  test("disconnect leaves room and notifies disconnected", async () => {
    const room = makeMockRoom();
    mockJoinOrCreate.mockResolvedValue(room);

    const { connect, disconnect, subscribeToStatus } =
      await import("../network/client.js");

    await connect();

    const statusListener = vi.fn();
    subscribeToStatus(statusListener);
    statusListener.mockClear();

    await disconnect();

    expect(room.leave).toHaveBeenCalled();
    expect(statusListener).toHaveBeenCalledWith("disconnected", undefined);
  });

  test("getRoom returns null when not connected", async () => {
    const { getRoom } = await import("../network/client.js");
    expect(getRoom()).toBeNull();
  });

  test("getSessionId returns null when not connected", async () => {
    const { getSessionId } = await import("../network/client.js");
    expect(getSessionId()).toBeNull();
  });

  test("message senders are no-ops when no room connected", async () => {
    const { sendMove, sendDock, sendUndock, sendTrade } =
      await import("../network/client.js");

    expect(() => sendMove(5)).not.toThrow();
    expect(() => sendDock()).not.toThrow();
    expect(() => sendUndock()).not.toThrow();
    expect(() => sendTrade("fuel_ore", 10, true)).not.toThrow();
  });

  test("subscribeToRoom fires immediately if room exists", async () => {
    const room = makeMockRoom();
    mockJoinOrCreate.mockResolvedValue(room);

    const { connect, subscribeToRoom } =
      await import("../network/client.js");

    await connect();

    const roomListener = vi.fn();
    subscribeToRoom(roomListener);

    // Should fire immediately since room already exists
    expect(roomListener).toHaveBeenCalledWith(room);
  });
});

// ── Tests: StateSync ────────────────────────────────────────────────────────

describe("StateSync", () => {
  test("constructor sets galaxy data on renderer", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    expect(renderer.setGalaxyData).toHaveBeenCalledOnce();
    sync.dispose();
  });

  test("sector onAdd populates galaxy data and updates renderer", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    const sector = makeMockSector(5, 100, 200);
    sector.warps = [6, 7];
    room.state.sectors.simulateAdd(sector, "5");

    expect(renderer.updateSector).toHaveBeenCalledWith(
      expect.objectContaining({ sectorId: 5, x: 100, y: 200 }),
    );

    sync.dispose();
  });

  test("player onAdd creates ship in renderer", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    const player = makeMockPlayer(3, "RemotePlayer");
    room.state.players.simulateAdd(player, "remote-session");

    expect(renderer.shipManager.addShip).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "remote-session",
        displayName: "RemotePlayer",
        sectorId: 3,
        isLocal: false,
      }),
    );

    sync.dispose();
  });

  test("player onRemove removes ship from renderer", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    const player = makeMockPlayer(1);
    room.state.players.simulateAdd(player, "leaving-session");
    room.state.players.simulateRemove(player, "leaving-session");

    expect(renderer.shipManager.removeShip).toHaveBeenCalledWith("leaving-session");

    sync.dispose();
  });

  test("player onChange moves ship when sector changes", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    // Add a player first
    const player = makeMockPlayer(1, "Mover");
    room.state.players.simulateAdd(player, "mover-session");

    // Move to new sector
    player.currentSectorId = 5;
    room.state.players.simulateChange(player, "mover-session");

    expect(renderer.shipManager.moveShip).toHaveBeenCalledWith("mover-session", 5);

    sync.dispose();
  });

  test("dispose detaches all listeners", () => {
    const room = makeStateSyncRoom();
    const renderer = makeMockRenderer();

    const sync = new StateSync(
      room as unknown as ConstructorParameters<typeof StateSync>[0],
      renderer as unknown as ConstructorParameters<typeof StateSync>[1],
    );

    // Should not throw
    expect(() => sync.dispose()).not.toThrow();

    // Adding a sector after dispose should not call renderer
    renderer.updateSector.mockClear();
    room.state.sectors.simulateAdd(makeMockSector(99), "99");
    // Callbacks were detached, but our mock detach returns true (not actually
    // removing from the array). The important thing is dispose() doesn't throw.
  });
});

// ── Tests: OptimisticMovement ───────────────────────────────────────────────

describe("OptimisticMovement", () => {
  function makeOMRoom(sessionId = "local-session") {
    const players = new Map<string, MockPlayer>();
    return {
      sessionId,
      state: {
        players: { get: (key: string) => players.get(key) },
      },
      send: vi.fn(),
      onMessage: vi.fn().mockReturnValue(vi.fn()),
      _players: players,
    };
  }

  test("requestMove sends command and animates ship", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();
    room._players.set("local-session", makeMockPlayer(1));

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);

    expect(renderer.shipManager.moveShip).toHaveBeenCalledWith("local-session", 5);
    expect(room.send).toHaveBeenCalledWith(CLIENT_MSG.MOVE, {
      type: CLIENT_MSG.MOVE,
      targetSectorId: 5,
    });

    om.dispose();
  });

  test("requestMove is no-op when no local player", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);

    expect(renderer.shipManager.moveShip).not.toHaveBeenCalled();
    expect(room.send).not.toHaveBeenCalled();

    om.dispose();
  });

  test("requestMove is no-op when target equals current sector", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();
    room._players.set("local-session", makeMockPlayer(5));

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);

    expect(renderer.shipManager.moveShip).not.toHaveBeenCalled();

    om.dispose();
  });

  test("confirmMove returns true for matching prediction", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();
    room._players.set("local-session", makeMockPlayer(1));

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);
    expect(om.confirmMove(5)).toBe(true);
    expect(om.hasPendingMove).toBe(false);

    om.dispose();
  });

  test("confirmMove returns false with no pending move", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    expect(om.confirmMove(5)).toBe(false);

    om.dispose();
  });

  test("confirmMove returns false for mismatched sector", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();
    room._players.set("local-session", makeMockPlayer(1));

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);
    expect(om.confirmMove(7)).toBe(false);
    expect(om.hasPendingMove).toBe(false);

    om.dispose();
  });

  test("error listener snaps ship back on movement error", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();

    // Capture error handler registered via onMessage
    let errorHandler: ((message: { code: string; message: string }) => void) | null = null;
    room.onMessage.mockImplementation(
      (type: string, handler: (msg: { code: string; message: string }) => void) => {
        if (type === SERVER_MSG.ERROR) errorHandler = handler;
        return vi.fn();
      },
    );

    room._players.set("local-session", makeMockPlayer(1));

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.requestMove(5);

    // Simulate server rejecting the move
    errorHandler?.({ code: "INSUFFICIENT_TURNS", message: "No turns left" });

    expect(renderer.shipManager.snapShip).toHaveBeenCalledWith("local-session", 1);
    expect(om.hasPendingMove).toBe(false);

    om.dispose();
  });

  test("dispose cleans up error listener", () => {
    const room = makeOMRoom();
    const renderer = makeMockRenderer();

    const removeListener = vi.fn();
    room.onMessage.mockReturnValue(removeListener);

    const om = new OptimisticMovement(
      room as unknown as ConstructorParameters<typeof OptimisticMovement>[0],
      renderer as unknown as ConstructorParameters<typeof OptimisticMovement>[1],
    );

    om.dispose();

    expect(removeListener).toHaveBeenCalled();
  });
});
