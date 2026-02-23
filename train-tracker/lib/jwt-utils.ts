import jwt, { SignOptions } from "jsonwebtoken";

// Token configuration
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-key";
export const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived: 15 minutes
export const REFRESH_TOKEN_EXPIRY = "7d"; // Long-lived: 7 days

export interface JWTPayload {
  id: string;
  email: string;
  fullName?: string;
  role: string; // "user", "admin", etc.
  tokenType?: "access" | "refresh"; // Distinguish token types
  iat?: number; // Issued at (Unix timestamp)
  exp?: number; // Expires at (Unix timestamp)
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate an Access Token (short-lived, 15 minutes)
 * Used for API requests
 */
export function generateAccessToken(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: "HS256"
  };
  
  return jwt.sign(
    { ...payload, tokenType: "access" },
    JWT_SECRET,
    options
  ) as string;
}

/**
 * Generate a Refresh Token (long-lived, 7 days)
 * Used to obtain new access tokens
 */
export function generateRefreshToken(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: "HS256"
  };
  
  return jwt.sign(
    { ...payload, tokenType: "refresh" },
    JWT_REFRESH_SECRET,
    options
  ) as string;
}

/**
 * Generate both tokens at once
 * Called after successful login
 */
export function generateTokenPair(payload: Omit<JWTPayload, "tokenType" | "iat" | "exp">): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Verify an Access Token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Ensure it's an access token
    if (decoded.tokenType !== "access") {
      console.warn("Token type mismatch - expected 'access'");
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("Access token expired:", error.message);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("JWT verification error:", error.message);
    }
    return null;
  }
}

/**
 * Verify a Refresh Token
 * Uses separate secret for added security
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    
    // Ensure it's a refresh token
    if (decoded.tokenType !== "refresh") {
      console.warn("Token type mismatch - expected 'refresh'");
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("Refresh token expired - user must re-authenticate");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("Refresh token verification error:", error.message);
    }
    return null;
  }
}

/**
 * Verify any JWT token (for backward compatibility)
 */
export function verifyToken(token: string): JWTPayload | null {
  // Try as access token first, then refresh token
  const accessResult = verifyAccessToken(token);
  if (accessResult) return accessResult;
  
  return verifyRefreshToken(token);
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  
  return parts[1];
}

/**
 * Decode token without verification (for debugging)
 * WARNING: Only use for debugging/logging, never validate with this
 */
export function decodeTokenWithoutVerification(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload | null;
  } catch (error) {
    return null;
  }
}
