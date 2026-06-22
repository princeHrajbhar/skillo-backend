import jwt from "jsonwebtoken";
import { AppError, ErrorCode } from "../../errors/AppError.js";

const getSecret = (key: string): string => {
  const secret = process.env[key];
  if (!secret) throw new Error(`Missing required env var: ${key}`);
  return secret;
};

// ─── Access token (short-lived, carries identity + role) ────────────────────

export interface AccessTokenPayload {
  userId: string;
  role: string;
  sessionId: string; // ties the token to a specific session — enables per-session revocation
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), { expiresIn: "15m" });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getSecret("JWT_ACCESS_SECRET")) as AccessTokenPayload;
};

// ─── Refresh token — we only store a HASH; the token itself is opaque ────────
// Refresh tokens are now random hex strings (see auth.utils.ts generateSecureToken).
// JWT is NOT used for refresh tokens to prevent algorithm-confusion attacks and
// to ensure that token validity is always checked against the DB (true revocation).

export const generateAccessTokenForSession = (
  userId: string,
  role: string,
  sessionId: string
): string => generateAccessToken({ userId, role, sessionId });