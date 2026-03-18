import jwt from "jsonwebtoken";

// ── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  username: string;
}

export interface RefreshPayload {
  userId: string;
  type: "refresh";
}

// ── Config ───────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET ?? "void-market-dev-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "void-market-dev-refresh-secret";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// ── Token functions ──────────────────────────────────────────────────────────

/** Sign a short-lived access token containing user identity. */
export function generateToken(userId: string, username: string): string {
  const payload: JwtPayload = { userId, username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** Verify and decode an access token. Returns null on any failure. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.username !== "string"
    ) {
      return null;
    }
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
}

/** Sign a long-lived refresh token (contains only userId + type marker). */
export function generateRefreshToken(userId: string): string {
  const payload: RefreshPayload = { userId, type: "refresh" };
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/** Verify and decode a refresh token. Returns null on any failure. */
export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      JWT_REFRESH_SECRET,
    ) as jwt.JwtPayload;
    if (typeof decoded.userId !== "string" || decoded.type !== "refresh") {
      return null;
    }
    return { userId: decoded.userId, type: "refresh" };
  } catch {
    return null;
  }
}
