/**
 * App — Smoke Tests
 *
 * Verifies the React app renders without errors in all auth states.
 * All external dependencies (PixiJS, Colyseus, hooks) are mocked so
 * tests run headless in CI with no browser or server.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

// ── Mock all external dependencies ──────────────────────────────────────────

vi.mock("../hooks/useAuth.js", () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../hooks/useGameState.js", () => ({
  useGameState: vi.fn().mockReturnValue({
    currentPlayer: null,
    currentSector: null,
    sectors: new Map(),
    isConnected: false,
    connectionStatus: "disconnected",
    sessionId: null,
  }),
}));

vi.mock("../hooks/useGameNotifications.js", () => ({
  useGameNotifications: vi.fn(),
}));

vi.mock("../game/PixiApp.js", () => ({
  initPixiApp: vi.fn().mockResolvedValue({
    app: {},
    galaxyRenderer: { shipManager: {}, setGalaxyData: vi.fn() },
    setSectorClickHandler: vi.fn(),
    recenterViewport: vi.fn(),
    viewport: {},
  }),
}));

vi.mock("../network/client.js", () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  sendMove: vi.fn(),
  sendDock: vi.fn(),
  sendUndock: vi.fn(),
  sendTrade: vi.fn(),
  sendUpgradeShip: vi.fn(),
  subscribeToRoom: vi.fn().mockReturnValue(vi.fn()),
  subscribeToStatus: vi.fn().mockImplementation((cb: (s: string) => void) => {
    cb("disconnected");
    return vi.fn();
  }),
  getRoom: vi.fn().mockReturnValue(null),
  getSessionId: vi.fn().mockReturnValue(null),
}));

vi.mock("../network/StateSync.js", () => ({
  StateSync: vi.fn().mockImplementation(() => ({
    setOptimisticMovement: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock("../network/OptimisticMovement.js", () => ({
  OptimisticMovement: vi.fn().mockImplementation(() => ({
    requestMove: vi.fn(),
    confirmMove: vi.fn(),
    dispose: vi.fn(),
    hasPendingMove: false,
  })),
}));

// Mock child components to avoid transitive browser deps (Radix UI, etc.)
vi.mock("../components/AuthScreen.js", () => ({
  AuthScreen: () => React.createElement("div", { "data-testid": "auth-screen" }),
}));

vi.mock("../components/ConnectionStatusBadge.js", () => ({
  ConnectionStatusBadge: () =>
    React.createElement("div", { "data-testid": "connection-badge" }),
}));

vi.mock("../components/HUD.js", () => ({
  HUD: () => React.createElement("div", { "data-testid": "hud" }),
}));

vi.mock("../components/SectorDetail.js", () => ({
  SectorDetail: () =>
    React.createElement("div", { "data-testid": "sector-detail" }),
}));

vi.mock("../components/TradingPanel.js", () => ({
  TradingPanel: () =>
    React.createElement("div", { "data-testid": "trading-panel" }),
}));

vi.mock("../components/GameToaster.js", () => ({
  GameToaster: () =>
    React.createElement("div", { "data-testid": "game-toaster" }),
}));

import { App } from "../App.js";
import { useAuth } from "../hooks/useAuth.js";
import type { UseAuth } from "../hooks/useAuth.js";
import { initPixiApp } from "../game/PixiApp.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultAuth: UseAuth = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading spinner when checking stored token", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuth,
      isLoading: true,
      isAuthenticated: false,
    });

    const html = renderToString(<App />);
    expect(html).toContain("animate-spin");
  });

  test("renders auth screen when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuth,
      isLoading: false,
      isAuthenticated: false,
    });

    const html = renderToString(<App />);
    expect(html).toContain("auth-screen");
  });

  test("renders game container when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuth,
      isLoading: false,
      isAuthenticated: true,
      token: "test-jwt",
    });

    const html = renderToString(<App />);
    expect(html).toContain("connection-badge");
  });

  test("does not throw on mount in any auth state", () => {
    const states: Partial<UseAuth>[] = [
      { isLoading: true, isAuthenticated: false },
      { isLoading: false, isAuthenticated: false },
      { isLoading: false, isAuthenticated: true, token: "jwt" },
    ];

    for (const overrides of states) {
      vi.mocked(useAuth).mockReturnValue({ ...defaultAuth, ...overrides });
      expect(() => renderToString(<App />)).not.toThrow();
    }
  });
});

describe("PixiJS initialization (mock contract)", () => {
  test("initPixiApp returns handle with expected structure", async () => {
    const handle = await initPixiApp({} as HTMLElement);

    expect(handle).toHaveProperty("app");
    expect(handle).toHaveProperty("galaxyRenderer");
    expect(handle).toHaveProperty("setSectorClickHandler");
    expect(handle).toHaveProperty("recenterViewport");
    expect(handle).toHaveProperty("viewport");
  });

  test("initPixiApp handle methods are callable without errors", async () => {
    const handle = await initPixiApp({} as HTMLElement);

    expect(() => {
      handle.setSectorClickHandler(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );
    }).not.toThrow();
    expect(() => {
      handle.recenterViewport(0, 0);
    }).not.toThrow();
  });
});
