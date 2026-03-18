import { Router, type Request, type Response } from "express";
import { query } from "../db/index.js";
import { hashPassword, comparePassword } from "./password.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./jwt.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware.js";

// ── Validation helpers ───────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateRegistration(
  body: Record<string, unknown>,
): string | null {
  const { username, email, password } = body;
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return "Username must be 3-64 alphanumeric characters, hyphens, or underscores";
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return "Invalid email address";
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

// ── Route types ──────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// ── Router ───────────────────────────────────────────────────────────────────

export const authRouter = Router();

/** POST /api/auth/register — create account, return tokens. */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const error = validateRegistration(req.body as Record<string, unknown>);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    // Check for existing user
    const existing = await query<UserRow>(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Username or email already taken" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await query<UserRow>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash],
    );

    const user = result.rows[0];
    const accessToken = generateToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("[auth/register] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/auth/login — authenticate, return tokens. */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const result = await query<UserRow>(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1",
      [username],
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const accessToken = generateToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("[auth/login] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/auth/refresh — exchange refresh token for new access token. */
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Look up user to get current username for the new access token
    const result = await query<UserRow>(
      "SELECT id, username FROM users WHERE id = $1",
      [payload.userId],
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const user = result.rows[0];
    const accessToken = generateToken(user.id, user.username);

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error("[auth/refresh] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** GET /api/auth/me — return current authenticated user info. */
authRouter.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const result = await query<UserRow>(
        "SELECT id, username, email, created_at FROM users WHERE id = $1",
        [userId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = result.rows[0];
      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        },
      });
    } catch (err) {
      console.error("[auth/me] Unexpected error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);
