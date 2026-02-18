import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

export interface JWTPayload {
  id: string;
  email: string;
  fullName?: string;
}

/**
 * Generate a JWT token for authenticated users
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: "HS256"
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error instanceof Error ? error.message : error);
    return null;
  }
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
