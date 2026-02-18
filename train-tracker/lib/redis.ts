import Redis from "ioredis";

/**
 * Redis client instance
 * 
 * Connection string should be set in .env.local:
 * REDIS_URL=redis://localhost:6379
 * 
 * Or for managed services (Redis Cloud, AWS ElastiCache):
 * REDIS_URL=redis://:[password]@[host]:[port]
 */
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

// Connection event handlers
redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server");
});

redis.on("error", (error) => {
  console.error("[Redis] Connection error:", error.message);
});

redis.on("reconnecting", () => {
  console.log("[Redis] Reconnecting to Redis server...");
});

redis.on("ready", () => {
  console.log("[Redis] Redis client ready");
});

export default redis;

/**
 * Cache utility functions for common operations
 */
export const cacheUtils = {
  /**
   * Get cached data
   * @param key Cache key
   * @returns Parsed cached data or null if not found/expired
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cached data with TTL
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Time-to-live in seconds (default: 3600 = 1 hour)
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl: number = 3600
  ): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  },

  /**
   * Delete cached data
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
    }
  },

  /**
   * Delete multiple cached keys
   * @param keys Array of cache keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await redis.del(...keys);
    } catch (error) {
      console.error(`[Cache] Error deleting multiple keys:`, error);
    }
  },

  /**
   * Invalidate cache by pattern (e.g., "users:*")
   * @param pattern Redis key pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(
        `[Cache] Error invalidating pattern ${pattern}:`,
        error
      );
      return 0;
    }
  },

  /**
   * Get or fetch (cache-aside pattern)
   * @param key Cache key
   * @param fetcher Function to fetch data if not cached
   * @param ttl Time-to-live in seconds (default: 3600)
   */
  async getOrFetch<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await cacheUtils.get<T>(key);
      if (cached) {
        console.log(`[Cache] Hit - ${key}`);
        return cached;
      }

      // Cache miss - fetch and store
      console.log(`[Cache] Miss - ${key} (fetching...)`);
      const data = await fetcher();
      await cacheUtils.set(key, data, ttl);

      return data;
    } catch (error) {
      console.error(`[Cache] Error in getOrFetch for ${key}:`, error);
      throw error;
    }
  },

  /**
   * Increment counter in cache
   * @param key Cache key
   * @param increment Amount to increment (default: 1)
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, increment);
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Get TTL of cached key
   * @param key Cache key
   * @returns TTL in seconds (-1 if no expiry, -2 if not found)
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error(`[Cache] Error getting TTL for ${key}:`, error);
      return -2;
    }
  },

  /**
   * Extend TTL of existing cached key
   * @param key Cache key
   * @param ttl New TTL in seconds
   */
  async extendTTL(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error extending TTL for ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<void> {
    try {
      await redis.flushdb();
      console.log("[Cache] All cache cleared");
    } catch (error) {
      console.error("[Cache] Error clearing cache:", error);
    }
  },
};

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userEmail: (email: string) => `user:email:${email}`,
  usersList: () => "users:list",
  userStats: () => "users:stats",

  // Train cache keys
  trains: (query: string) => `trains:${query}`,
  trainById: (id: string) => `train:${id}`,
  trainSchedule: (id: string) => `train:schedule:${id}`,
  trainAvailability: (id: string) => `train:availability:${id}`,

  // Session cache keys
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,

  // General API cache keys
  apiResponse: (endpoint: string, params?: Record<string, any>) => {
    const paramStr = params ? `:${JSON.stringify(params)}` : "";
    return `api:${endpoint}${paramStr}`;
  },
};
