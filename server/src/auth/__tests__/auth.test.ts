/**
 * Auth module tests — JWT, password hashing, and route handlers.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../jwt.js";
import { hashPassword, comparePassword } from "../password.js";

// ── JWT Tests ────────────────────────────────────────────────────────────────

describe("JWT", () => {
  const userId = "test-uuid-123";
  const username = "TestPilot";

  describe("generateToken / verifyToken", () => {
    test("generates a valid token that can be verified", () => {
      const token = generateToken(userId, username);
      expect(typeof token).toBe("string");

      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.username).toBe(username);
    });

    test("returns null for an invalid token", () => {
      expect(verifyToken("not-a-real-token")).toBeNull();
    });

    test("returns null for an empty string", () => {
      expect(verifyToken("")).toBeNull();
    });

    test("returns null for a tampered token", () => {
      const token = generateToken(userId, username);
      const tampered = token.slice(0, -5) + "XXXXX";
      expect(verifyToken(tampered)).toBeNull();
    });
  });

  describe("generateRefreshToken / verifyRefreshToken", () => {
    test("generates a valid refresh token that can be verified", () => {
      const token = generateRefreshToken(userId);
      expect(typeof token).toBe("string");

      const payload = verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.type).toBe("refresh");
    });

    test("returns null for an invalid refresh token", () => {
      expect(verifyRefreshToken("garbage")).toBeNull();
    });

    test("access token cannot be used as refresh token", () => {
      const accessToken = generateToken(userId, username);
      expect(verifyRefreshToken(accessToken)).toBeNull();
    });

    test("refresh token cannot be used as access token", () => {
      const refreshToken = generateRefreshToken(userId);
      expect(verifyToken(refreshToken)).toBeNull();
    });
  });
});

// ── Password Tests ───────────────────────────────────────────────────────────

describe("Password hashing", () => {
  test("hashes a password and verifies it", async () => {
    const password = "s3cureP@ssw0rd!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix

    const match = await comparePassword(password, hash);
    expect(match).toBe(true);
  });

  test("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const match = await comparePassword("wrong-password", hash);
    expect(match).toBe(false);
  });

  test("produces different hashes for the same password", async () => {
    const password = "same-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2); // different salts
  });
});

// ── Route handler tests (mock db) ────────────────────────────────────────────

// We test routes by importing the router and using a lightweight approach
// with mocked db queries.

vi.mock("../../db/index.js", () => ({
  query: vi.fn(),
}));

import { query as mockQuery } from "../../db/index.js";
import express, { type Express } from "express";
import { authRouter } from "../routes.js";

const mockedQuery = vi.mocked(mockQuery);

function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
}

/** Minimal fetch-based test helper that works with Express. */
async function testRequest(
  app: Express,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  // Start a temporary server on a random port
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  try {
    const url = `http://127.0.0.1:${port}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body: json };
  } finally {
    server.close();
  }
}

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    test("registers a new user and returns tokens", async () => {
      // No existing user
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: "SELECT",
        rowCount: 0,
        oid: 0,
        fields: [],
      });
      // Insert returns new user
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "uuid-1",
            username: "newpilot",
            email: "pilot@void.market",
            created_at: new Date(),
          },
        ],
        command: "INSERT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/register", {
        username: "newpilot",
        email: "pilot@void.market",
        password: "securepass123",
      });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect((res.body.user as Record<string, unknown>).username).toBe("newpilot");
    });

    test("rejects duplicate username", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: "existing-uuid" }],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/register", {
        username: "taken",
        email: "taken@void.market",
        password: "securepass123",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already taken");
    });

    test("rejects invalid input", async () => {
      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/register", {
        username: "ab", // too short
        email: "not-an-email",
        password: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    test("logs in with valid credentials", async () => {
      const hash = await hashPassword("correctpassword");
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "uuid-2",
            username: "pilot2",
            email: "pilot2@void.market",
            password_hash: hash,
          },
        ],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/login", {
        username: "pilot2",
        password: "correctpassword",
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    test("rejects invalid credentials", async () => {
      const hash = await hashPassword("correctpassword");
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "uuid-2",
            username: "pilot2",
            email: "pilot2@void.market",
            password_hash: hash,
          },
        ],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/login", {
        username: "pilot2",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });

    test("rejects unknown username", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: "SELECT",
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/login", {
        username: "ghost",
        password: "doesntmatter",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    test("issues a new access token from a valid refresh token", async () => {
      const refreshToken = generateRefreshToken("uuid-3");
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: "uuid-3", username: "pilot3" }],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/refresh", {
        refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();

      // Verify the new access token is valid
      const payload = verifyToken(res.body.accessToken as string);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe("uuid-3");
    });

    test("rejects invalid refresh token", async () => {
      const app = createApp();
      const res = await testRequest(app, "POST", "/api/auth/refresh", {
        refreshToken: "invalid-token",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    test("returns user info for authenticated request", async () => {
      const token = generateToken("uuid-4", "pilot4");
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "uuid-4",
            username: "pilot4",
            email: "pilot4@void.market",
            created_at: new Date(),
          },
        ],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const app = createApp();
      const res = await testRequest(app, "GET", "/api/auth/me", undefined, {
        Authorization: `Bearer ${token}`,
      });

      expect(res.status).toBe(200);
      expect((res.body.user as Record<string, unknown>).username).toBe("pilot4");
    });

    test("rejects unauthenticated request", async () => {
      const app = createApp();
      const res = await testRequest(app, "GET", "/api/auth/me");

      expect(res.status).toBe(401);
    });

    test("rejects request with invalid token", async () => {
      const app = createApp();
      const res = await testRequest(app, "GET", "/api/auth/me", undefined, {
        Authorization: "Bearer invalid-token",
      });

      expect(res.status).toBe(401);
    });
  });
});
