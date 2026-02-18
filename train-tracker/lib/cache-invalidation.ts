import { cacheUtils, cacheKeys } from "@/lib/redis";
import { logger } from "@/lib/logger";

/**
 * Cache invalidation strategies for different operations
 * Use these functions to invalidate cache after data modifications
 */

/**
 * Invalidate cache after user-related changes
 */
export const invalidateUserCache = {
  /**
   * Invalidate a specific user's cache
   * Use after: user profile update, role change, etc.
   */
  async specificUser(userId: string) {
    try {
      const key = cacheKeys.user(userId);
      await cacheUtils.delete(key);
      logger.info("User cache invalidated", { userId, key });
    } catch (error) {
      logger.error("Failed to invalidate user cache", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate cache by email
   * Use after: email change, password reset, etc.
   */
  async byEmail(email: string) {
    try {
      const key = cacheKeys.userEmail(email);
      await cacheUtils.delete(key);
      logger.info("User email cache invalidated", { email, key });
    } catch (error) {
      logger.error("Failed to invalidate user email cache", {
        email,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all users list cache
   * Use after: new user signup, user deletion, bulk updates, role changes
   */
  async allUsersList() {
    try {
      const count = await cacheUtils.invalidatePattern("users:list:*");
      logger.info("All users list cache invalidated", { count });
    } catch (error) {
      logger.error("Failed to invalidate users list cache", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate user stats cache
   * Use after: user count changes, role changes
   */
  async userStats() {
    try {
      const key = cacheKeys.userStats();
      await cacheUtils.delete(key);
      logger.info("User stats cache invalidated", { key });
    } catch (error) {
      logger.error("Failed to invalidate user stats cache", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all user-related caches
   * Use after: major user-related operations
   */
  async all() {
    try {
      const count = await cacheUtils.invalidatePattern("user:*");
      logger.info("All user caches invalidated", { count });
    } catch (error) {
      logger.error("Failed to invalidate all user caches", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

/**
 * Invalidate cache after train-related changes
 */
export const invalidateTrainCache = {
  /**
   * Invalidate cache for a specific train
   */
  async specificTrain(trainId: string) {
    try {
      const keys = [
        cacheKeys.trainById(trainId),
        cacheKeys.trainSchedule(trainId),
        cacheKeys.trainAvailability(trainId)
      ];
      await cacheUtils.deleteMany(keys);
      logger.info("Train cache invalidated", { trainId });
    } catch (error) {
      logger.error("Failed to invalidate train cache", {
        trainId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all train-related cache
   */
  async all() {
    try {
      const count = await cacheUtils.invalidatePattern("train:*");
      logger.info("All train caches invalidated", { count });
    } catch (error) {
      logger.error("Failed to invalidate all train caches", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

/**
 * Invalidate cache after session-related changes
 */
export const invalidateSessionCache = {
  /**
   * Invalidate a specific session
   */
  async specificSession(sessionId: string) {
    try {
      const key = cacheKeys.session(sessionId);
      await cacheUtils.delete(key);
      logger.info("Session cache invalidated", { sessionId, key });
    } catch (error) {
      logger.error("Failed to invalidate session cache", {
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all sessions for a user
   */
  async allUserSessions(userId: string) {
    try {
      const key = cacheKeys.userSessions(userId);
      const count = await cacheUtils.invalidatePattern(`${key}:*`);
      logger.info("User sessions cache invalidated", { userId, count });
    } catch (error) {
      logger.error("Failed to invalidate user sessions cache", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all session caches
   */
  async all() {
    try {
      const count = await cacheUtils.invalidatePattern("session:*");
      logger.info("All session caches invalidated", { count });
    } catch (error) {
      logger.error("Failed to invalidate all session caches", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

/**
 * Invalidate API response cache
 */
export const invalidateApiCache = {
  /**
   * Invalidate cache for a specific endpoint
   */
  async endpoint(endpoint: string, params?: Record<string, any>) {
    try {
      const key = cacheKeys.apiResponse(endpoint, params);
      await cacheUtils.delete(key);
      logger.info("API response cache invalidated", { endpoint, key });
    } catch (error) {
      logger.error("Failed to invalidate API response cache", {
        endpoint,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  /**
   * Invalidate all cache for an endpoint pattern
   */
  async endpointPattern(pattern: string) {
    try {
      const count = await cacheUtils.invalidatePattern(pattern);
      logger.info("API response pattern cache invalidated", { pattern, count });
    } catch (error) {
      logger.error("Failed to invalidate API response pattern cache", {
        pattern,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};

/**
 * Global cache operations
 */
export const cacheOperations = {
  /**
   * Clear ALL cache (use with extreme caution!)
   */
  async clearAll() {
    try {
      await cacheUtils.clear();
      logger.warn("All cache cleared!");
    } catch (error) {
      logger.error("Failed to clear all cache", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
};
