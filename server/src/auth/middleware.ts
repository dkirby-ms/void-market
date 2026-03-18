import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "./jwt.js";

/** Extends Express Request with authenticated user info. */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Express middleware that validates a JWT from the Authorization header.
 * Expects: `Authorization: Bearer <token>`
 * On success, attaches `req.user` with `{ userId, username }`.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}
