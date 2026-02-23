/**
 * Token Blacklist Service
 * Manages invalidated tokens (e.g., after logout)
 * In production, consider using Redis for distributed caching
 */

// In-memory store for blacklisted tokens (reset on server restart)
// In production, use Redis or database
const blacklistedTokens = new Set<string>();

export interface BlacklistedTokenEntry {
  token: string;
  expiredAt: number;
  blacklistedAt: number;
}

/**
 * Add token to blacklist (after logout)
 * @param token - The JWT token to invalidate
 * @param expiresAt - Unix timestamp when token would expire anyway
 */
export function blacklistToken(token: string, expiresAt: number): void {
  try {
    blacklistedTokens.add(token);
    
    // Clean up expired tokens after their expiry time
    const now = Date.now() / 1000; // Current time in seconds
    const delayMs = Math.max(0, (expiresAt - now) * 1000);
    
    setTimeout(() => {
      blacklistedTokens.delete(token);
      console.log(`[Blacklist] Token expired and removed from blacklist`);
    }, delayMs + 1000); // Add 1s buffer
    
    console.log(`[Blacklist] Token added to blacklist (expires in ${Math.ceil(delayMs / 1000)}s)`);
  } catch (error) {
    console.error(`[Blacklist] Error blacklisting token:`, error);
  }
}

/**
 * Check if token is blacklisted
 * @param token - The JWT token to check
 * @returns true if token is blacklisted, false otherwise
 */
export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token);
}

/**
 * Clear entire blacklist (for testing or manual reset)
 */
export function clearBlacklist(): void {
  blacklistedTokens.clear();
  console.log("[Blacklist] All tokens removed from blacklist");
}

/**
 * Get blacklist size (for monitoring)
 */
export function getBlacklistSize(): number {
  return blacklistedTokens.size;
}

/**
 * Blacklist all tokens for a user (on password change, suspicious activity, etc.)
 * In production, you'd query database for user's active sessions
 */
export function blacklistAllUserTokens(userId: string): void {
  console.log(`[Blacklist] All tokens for user ${userId} should be invalidated`);
  // In production with database:
  // 1. Query all active sessions for user
  // 2. Add all their tokens to blacklist
  // 3. Or update a "token version" field that increments on password change
}

/**
 * Redis implementation example (for production scalability)
 * Uncomment and configure when using Redis
 */
/*
import redis from './redis'; // Your Redis client

export async function blacklistTokenRedis(token: string, expiresAt: number): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(0, expiresAt - now);
    
    if (ttl > 0) {
      await redis.setex(`blacklist:${token}`, ttl, '1');
      console.log(`[Blacklist-Redis] Token blacklisted with TTL ${ttl}s`);
    }
  } catch (error) {
    console.error(`[Blacklist-Redis] Error:`, error);
  }
}

export async function isTokenBlacklistedRedis(token: string): Promise<boolean> {
  try {
    const exists = await redis.exists(`blacklist:${token}`);
    return exists === 1;
  } catch (error) {
    console.error(`[Blacklist-Redis] Error checking token:`, error);
    return false; // Fail open to let request through on error
  }
}
*/
