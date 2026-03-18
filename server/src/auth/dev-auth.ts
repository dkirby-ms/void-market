/**
 * Dev Auth Bypass — provides automatic authentication for local development.
 *
 * Enabled when NODE_ENV !== "production" AND DEV_AUTH_BYPASS === "true".
 * In production this module is inert: every function returns null / false.
 */

import type { Request, Response } from "express";
import { generateToken, generateRefreshToken } from "./jwt.js";

// ── Single flag ──────────────────────────────────────────────────────────────

const _enabled =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_AUTH_BYPASS === "true";

/** True only when dev auth bypass is active. */
export function isDevAuthEnabled(): boolean {
  return _enabled;
}

// ── Dev user identity (deterministic, no DB required) ────────────────────────

export const DEV_USER = {
  id: "dev-user-00000000-0000-0000-0000-000000000000",
  username: "DevPilot",
  email: "dev@void.market",
} as const;

// ── Token helpers ────────────────────────────────────────────────────────────

/** Generate a full token set for the dev user. */
export function generateDevTokens(): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateToken(DEV_USER.id, DEV_USER.username),
    refreshToken: generateRefreshToken(DEV_USER.id),
  };
}

// ── Express endpoint ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/dev-token — returns a valid JWT for the dev user.
 * Only mounted when dev auth bypass is enabled.
 */
export function devTokenHandler(_req: Request, res: Response): void {
  if (!_enabled) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { accessToken, refreshToken } = generateDevTokens();
  res.status(200).json({
    user: { id: DEV_USER.id, username: DEV_USER.username, email: DEV_USER.email },
    accessToken,
    refreshToken,
  });
}
