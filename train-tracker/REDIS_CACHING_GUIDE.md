# Redis Caching Layer Guide

## Overview

Redis is an in-memory data store that serves as a caching layer to dramatically improve application performance by reducing database queries and API latency.

**Key Benefits:**
- ✅ **10-100x faster** than database queries
- ✅ **Reduced database load** through cache-aside pattern
- ✅ **Improved user experience** with faster response times
- ✅ **Smart invalidation** strategies to keep data fresh
- ✅ **Request tracing** for cache hits/misses
- ✅ **Automatic expiry** with TTL policies

---

## 1. Why Caching Matters

### Performance Impact Example

**Without Caching:**
```
Request 1: Database query → 150ms latency → Return response
Request 2: Database query → 150ms latency → Return response
Request 3: Database query → 150ms latency → Return response
Request 100: Database query → 150ms latency → Return response

Total: 15 seconds for 100 identical requests
```

**With Redis Caching:**
```
Request 1: Cache Miss → Database query (150ms) → Cache (5ms) → Return
Request 2: Cache Hit → Return from memory (2ms)
Request 3: Cache Hit → Return from memory (2ms)
Request 100: Cache Hit → Return from memory (2ms)

Total: ~5 seconds for 100 identical requests (3x faster!)
```

**Under Heavy Load (1000 concurrent requests):**
- Without cache: Database could crash or timeout
- With cache: Requests served instantly from memory

---

## 2. Architecture & Setup

### Connection Setup

**File: `lib/redis.ts`**

```typescript
import Redis from "ioredis";

// Initialize with environment variable or default
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

// Connection events
redis.on("connect", () => console.log("[Redis] Connected"));
redis.on("error", (error) => console.error("[Redis] Error:", error));

export default redis;
```

### Environment Configuration

**File: `.env.local`**

```dotenv
# Local Redis
REDIS_URL="redis://localhost:6379"

# Redis Cloud
REDIS_URL="redis://:password@host:port"

# AWS ElastiCache
REDIS_URL="redis://node-id.abc123.cache.amazonaws.com:6379"
```

---

## 3. Cache-Aside Pattern (Lazy Loading)

The **cache-aside** pattern is the foundation of our caching strategy:

```
1. Client requests data
2. Check Redis cache
   ├─ HIT: Return cached data (2-5ms)
   └─ MISS: 
      ├─ Query database (100-300ms)
      ├─ Cache result (5ms)
      └─ Return data
3. On data update: Invalidate cache
4. Next request hits cache again
```

### Implementation

**File: `lib/redis.ts` - cacheUtils.getOrFetch()**

```typescript
async getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await this.get<T>(key);
  if (cached) {
    console.log(`[Cache] Hit - ${key}`);
    return cached;
  }

  // Cache miss - fetch and store
  console.log(`[Cache] Miss - ${key} (fetching...)`);
  const data = await fetcher();
  await this.set(key, data, ttl);
  return data;
}
```

### Usage in Routes

**File: `app/api/users/route.ts`**

```typescript
export async function GET(request: NextRequest) {
  try {
    const cacheKey = "users:list:limit:10:offset:0";

    // Cache-aside pattern in one line!
    const usersData = await cacheUtils.getOrFetch(
      cacheKey,
      async () => {
        const users = await prisma.user.findMany({...});
        const total = await prisma.user.count();
        return { users, total };
      },
      300 // Cache for 5 minutes
    );

    return successResponse(usersData);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

**Console Output:**

```
[Cache] Miss - users:list:limit:10:offset:0 (fetching...)
[Cache] Hit - users:list:limit:10:offset:0
[Cache] Hit - users:list:limit:10:offset:0
```

---

## 4. Cache Key Strategy

Consistent cache keys ensure reliable invalidation and retrieval.

### Cache Key Generators

**File: `lib/redis.ts` - cacheKeys**

```typescript
export const cacheKeys = {
  // User keys
  user: (id: string) => `user:${id}`,
  userEmail: (email: string) => `user:email:${email}`,
  usersList: () => "users:list",
  userStats: () => "users:stats",

  // Train keys
  trainById: (id: string) => `train:${id}`,
  trainSchedule: (id: string) => `train:schedule:${id}`,
  trainAvailability: (id: string) => `train:availability:${id}`,

  // Session keys
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:sessions:${userId}`,

  // API keys
  apiResponse: (endpoint: string, params?: Record<string, any>) => {
    const paramStr = params ? `:${JSON.stringify(params)}` : "";
    return `api:${endpoint}${paramStr}`;
  }
};
```

### Pattern Examples

```typescript
// Specific keys
cacheKeys.user("user-123")                 // → "user:user-123"
cacheKeys.userEmail("john@example.com")   // → "user:email:john@example.com"
cacheKeys.trainById("train-456")          // → "train:train-456"

// List/Collection keys
cacheKeys.usersList()                      // → "users:list"
cacheKeys.userStats()                      // → "users:stats"

// Parameterized API keys
cacheKeys.apiResponse("/api/trains", { departure: "New York" })
// → "api:/api/trains:{"departure":"New York"}"
```

---

## 5. Time-To-Live (TTL) Policy

TTL determines how long cached data lives before automatic expiry.

### TTL Strategy

| Data Type | TTL | Reason |
|-----------|-----|--------|
| User profile | 1 hour (3600s) | Changes infrequently |
| Users list | 5 minutes (300s) | Public data, moderate changes |
| User stats | 1 minute (60s) | Changes with every signup |
| Train schedule | 24 hours | Static data |
| Train availability | 30 minutes | Updates periodically |
| Session | 24 hours | Matches JWT expiry |

### Setting TTL

```typescript
// Short TTL (volatile data)
await cacheUtils.set(key, data, 60);      // 1 minute

// Medium TTL (frequently changing)
await cacheUtils.set(key, data, 300);     // 5 minutes

// Long TTL (stable data)
await cacheUtils.set(key, data, 3600);    // 1 hour

// Very long TTL (static data)
await cacheUtils.set(key, data, 86400);   // 24 hours
```

### Dynamic TTL Extension

```typescript
// Check TTL of existing key
const ttl = await cacheUtils.getTTL(cacheKey);
console.log(`Cache expires in ${ttl} seconds`);

// Extend TTL if data is still relevant
if (ttl > 0 && ttl < 60) {
  await cacheUtils.extendTTL(cacheKey, 300);
  console.log("TTL extended for 5 more minutes");
}
```

---

## 6. Cache Invalidation Strategies

### Strategy 1: Time-Based Expiry (Passive)

Cache automatically expires after TTL.

**Pros:** Simple, automatic, no code needed
**Cons:** Stale data served until expiry

```typescript
// Data expires automatically after 5 minutes
await cacheUtils.set(key, data, 300);
```

### Strategy 2: Event-Based Invalidation (Active)

Clear cache when data changes.

**Pros:** Always fresh data, minimal stale content
**Cons:** More code, more cache misses after invalidation

**File: `lib/cache-invalidation.ts`**

```typescript
// Invalidate specific user
export const invalidateUserCache = {
  async specificUser(userId: string) {
    await cacheUtils.delete(cacheKeys.user(userId));
  },

  // Invalidate all users lists
  async allUsersList() {
    await cacheUtils.invalidatePattern("users:list:*");
  },

  // Invalidate by email
  async byEmail(email: string) {
    await cacheUtils.delete(cacheKeys.userEmail(email));
  }
};
```

### Strategy 3: Pattern-Based Invalidation

Invalidate multiple related cache entries.

```typescript
// Clear all user-related caches with pattern
const count = await cacheUtils.invalidatePattern("user:*");
console.log(`Cleared ${count} user cache entries`);

// Clear specific pattern
await cacheUtils.invalidatePattern("users:list:*");      // All paginated lists
await cacheUtils.invalidatePattern("train:schedule:*");  // All schedules
await cacheUtils.invalidatePattern("session:*");         // All sessions
```

---

## 7. Cache Invalidation in Action

### Example 1: Sign Up (Create User)

**Before:**
```typescript
// app/api/auth/signup/route.ts
const createdUser = await prisma.user.create({...});
return createdResponse(createdUser);
```

**After:**
```typescript
import { invalidateUserCache } from "@/lib/cache-invalidation";

const createdUser = await prisma.user.create({...});

// Invalidate all users lists (new user added)
await invalidateUserCache.allUsersList();

return createdResponse(createdUser);
```

**Console Logs:**
```
[Cache] All users list cache invalidated, count: 5
[Info] User signup completed, userId: user-789
```

### Example 2: Promote to Admin (Update User)

**Before:**
```typescript
// app/api/admin/route.ts - POST
const updatedUser = await prisma.user.update({...});
return successResponse(updatedUser);
```

**After:**
```typescript
import { invalidateUserCache } from "@/lib/cache-invalidation";

const updatedUser = await prisma.user.update({...});

// Invalidate specific user cache
await invalidateUserCache.specificUser(targetUserId);

// Invalidate lists (user role changed)
await invalidateUserCache.allUsersList();

// Invalidate stats (admin count changed)
await invalidateUserCache.userStats();

return successResponse(updatedUser);
```

**Console Logs:**
```
[Info] User cache invalidated, userId: user-456
[Info] All users list cache invalidated, count: 3
[Info] User stats cache invalidated
[Info] User promoted to admin, adminId: admin-1, promotedUserId: user-456
```

---

## 8. Monitoring Cache Performance

### Cache Hit/Miss Rates

```typescript
// Log shows hit/miss status
console.log("[Cache] Hit - users:list");    // Cache hit (fast)
console.log("[Cache] Miss - users:list (fetching...)");  // Cache miss (slow)
```

### Measuring Latency

```typescript
// Without cache
const start = Date.now();
const users = await prisma.user.findMany({...});
const duration = Date.now() - start;
console.log(`Database query: ${duration}ms`);  // ~100-200ms

// With cache (hit)
const start = Date.now();
const users = await cacheUtils.get("users:list");
const duration = Date.now() - start;
console.log(`Cache hit: ${duration}ms`);  // ~2-5ms
```

### Cache Statistics

```typescript
// Get cache key TTL
const ttl = await cacheUtils.getTTL("users:list");
if (ttl > 0) {
  console.log(`Cache expires in ${ttl} seconds`);
} else if (ttl === -1) {
  console.log("Cache has no expiry");
} else {
  console.log("Key not found in cache");
}
```

---

## 9. Common Patterns

### Pattern 1: Cache User Profile with Fallback

```typescript
async function getUserProfile(userId: string) {
  return await cacheUtils.getOrFetch(
    cacheKeys.user(userId),
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, createdAt: true }
      });
      
      if (!user) throw new Error("User not found");
      return user;
    },
    3600  // Cache for 1 hour
  );
}
```

### Pattern 2: Invalidate on Mutation

```typescript
async function updateUserProfile(userId: string, data: any) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data
  });

  // Clear related caches
  await invalidateUserCache.specificUser(userId);
  await invalidateUserCache.byEmail(updated.email);
  await invalidateUserCache.allUsersList();

  return updated;
}
```

### Pattern 3: Batch Cache Deletion

```typescript
async function deleteMultipleUsers(userIds: string[]) {
  // Delete from database
  await prisma.user.deleteMany({
    where: { id: { in: userIds } }
  });

  // Clear all user caches at once
  const keys = userIds.map(id => cacheKeys.user(id));
  await cacheUtils.deleteMany(keys);
  
  // Also clear lists
  await invalidateUserCache.allUsersList();
}
```

---

## 10. Cache Coherence & Stale Data

### The Stale Data Problem

```
Time 0:00  → User A fetches data → "John Doe" (cached 5 min)
Time 0:02  → Admin updates user's name to "Jane Smith" (cache NOT invalidated)
Time 0:03  → User B fetches data → Still gets "John Doe" ← STALE!
Time 0:05  → Cache expires → Fresh data served
```

### Solutions

**1. Short TTL (Accept staleness for duration)**
```typescript
await cacheUtils.set(key, data, 60);  // 1 minute
// Stale data risk: up to 1 minute
```

**2. Event-Based Invalidation (Keep cache fresh)**
```typescript
await updateUser(id, newData);
await invalidateUserCache.specificUser(id);  // ← Always fresh!
```

**3. Hybrid: TTL + Event Invalidation (Best)**
```typescript
// Cache for 1 hour, but invalidate immediately on change
await cacheUtils.set(key, data, 3600);
if (dataChanged) {
  await cacheUtils.delete(key);  // Fresh on next request
}
```

---

## 11. When NOT to Cache

⚠️ **Don't cache:**
- **Sensitive data** (passwords, PII, API keys) — security risk
- **Real-time data** (live prices, sensor readings) — would be stale
- **Unique per-user data** (personal history) — can't share across users
- **Small datasets** (< 100 bytes) — overhead exceeds benefit
- **Rarely accessed data** — wastes memory
- **Data with complex invalidation** — too error-prone

✅ **Good candidates:**
- **Frequently accessed data** (user lists, product catalogs)
- **Expensive queries** (aggregations, joins)
- **Public data** (settings, references, schedules)
- **Shareable data** (not user-specific)
- **Data with simple TTL** (can expire automatically)

---

## 12. Debugging Cache Issues

### Cache Not Working?

```typescript
// 1. Check Redis connection
redis.ping().then(() => console.log("Redis connected!"));

// 2. Verify cache hit/miss logs
// Should see "[Cache] Hit" not "[Cache] Miss" on repeated requests

// 3. Check cache key name
console.log("Expected key:", cacheKeys.usersList());
// → "users:list"

// 4. Manual cache inspection
const cached = await cacheUtils.get("users:list");
console.log("Cached data:", cached);

// 5. Clear and retry
await cacheUtils.delete("users:list");
```

### Memory Issues?

```typescript
// Check RedisCancel memory usage
redis.info("memory", (err, info) => {
  console.log(info);  // Shows used_memory, peak_memory, etc
});

// Reduce cache sizes or TTLs if memory is high
```

---

## 13. Implementation Checklist

✅ **Setup**
- [ ] Install `ioredis`: `npm install ioredis`
- [ ] Create `lib/redis.ts` with connection utility
- [ ] Add `REDIS_URL` to `.env.local`
- [ ] Test Redis connection in terminal

✅ **Basic Caching**
- [ ] Import `cacheUtils` in API routes
- [ ] Wrap database queries with `cacheUtils.getOrFetch()`
- [ ] Test cache hits in logs
- [ ] Measure latency improvements

✅ **Cache Invalidation**
- [ ] Create `lib/cache-invalidation.ts` utilities
- [ ] Call invalidation functions after mutations
- [ ] Test invalidation clears cache
- [ ] Verify fresh data served after updates

✅ **Monitoring**
- [ ] Log cache hits/misses
- [ ] Track TTL expiry times
- [ ] Monitor memory usage
- [ ] Set up alerts for cache failures

---

## 14. Benefits Summary

| Benefit | Impact | Example |
|---------|--------|---------|
| **Latency** | 20-100x faster | 150ms DB → 2ms cache |
| **Database Load** | Reduced by 80-95% | 1000 reqs → 50 DB hits |
| **Scalability** | Handle 10x more users | Same DB, better throughput |
| **Cost** | Lower infrastructure | Fewer DB connections |
| **UX** | Faster page loads | Happy users, less churn |

---

## 15. Next Steps

1. **Implement caching** for all frequently-accessed endpoints
2. **Monitor cache performance** with metrics
3. **Optimize TTLs** based on data freshness needs
4. **Integrate with external services** (LogDNA, Datadog)
5. **Plan for cache warming** (pre-load popular data)

---

**Pro Tip:** "Cache is like a short-term memory — it makes things fast, but only if you remember to forget at the right time. A good caching strategy balances speed with accuracy."
