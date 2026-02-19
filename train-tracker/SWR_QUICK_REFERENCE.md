# SWR Quick Reference Guide# SWR Quick Reference Guide















































































































































































































































































































































































































**Quick Tip:** Use `revalidateOnFocus: false` for slow-changing data to reduce unnecessary requests!---- **GitHub:** https://github.com/vercel/swr- **API:** https://swr.vercel.app/docs/api- **Examples:** https://swr.vercel.app/examples- **Docs:** https://swr.vercel.app## Links---| Typed | `useSWR<Type>("/api/users", fetcher)` || Infinite | `useSWRInfinite(getKey, fetcher)` || No revalidate | `useSWRImmutable("/api/config", fetcher)` || Global mutate | `mutate("/api/users")` from `"swr"` || Optimistic | `mutate(newData, false); await api(); mutate()` || Refresh | `mutate()` || Conditional | `useSWR(id ? \`/api/users/\${id}\` : null, fetcher)` || Basic fetch | `useSWR("/api/users", fetcher)` ||------|------|| Task | Code |## Cheatsheet---```</button>  Load More<button onClick={() => setSize(size + 1)}>  data?.[data.length - 1]?.length < PAGE_SIZE;const isReachingEnd = );  fetcher  (index) => `/api/posts?page=${index}`,const { data, size, setSize } = useSWRInfinite(```typescript### Infinite Scroll```);  { dedupingInterval: 1000 }  fetcher,  email ? `/api/check-email?email=${email}` : null,const { data: isAvailable } = useSWR(const [email, setEmail] = useState("");```typescript### Form Validation```});  refreshInterval: 5000, // Refresh every 5sconst { data } = useSWR("/api/stats", fetcher, {```typescript### Real-time Dashboard## Common Use Cases---```mutate("/api/users", fetcher("/api/users"));// Prefetch before component mountsimport { mutate } from "swr";```typescript### 4. Prefetch Data```const { data } = useSWRImmutable("/api/config", fetcher);// Never revalidatesimport useSWRImmutable from "swr/immutable";```typescript### 3. Use Immutable for Static Data```});  revalidateOnReconnect: false,  revalidateOnFocus: false,const { data } = useSWR("/api/config", fetcher, {// For static/rarely changing data```typescript### 2. Disable Unnecessary Revalidation```// Only 1 network request! ⚡<ComponentC /> // useSWR("/api/users", fetcher)<ComponentB /> // useSWR("/api/users", fetcher)<ComponentA /> // useSWR("/api/users", fetcher)// Multiple components using same key = 1 request```typescript### 1. Deduplicate Requests## Performance Tips---```});  onLoadingSlow: () => console.log("⏳ Loading slow..."),  onError: (error) => console.log("❌ Error:", error),  onSuccess: (data) => console.log("✅ Success:", data),const { data } = useSWR("/api/users", fetcher, {```typescript### Log Requests```console.log("Cache keys:", Array.from(cache.keys()));const { cache } = useSWRConfig();import { useSWRConfig } from "swr";```typescript### Log Cache## Debugging---```</SWRConfig>  <App />>  }}    fetcher: (url) => fetch(url).then(r => r.json()),    revalidateOnFocus: true,    refreshInterval: 3000,  value={{<SWRConfigimport { SWRConfig } from "swr";```typescript### Provider Setup## Global SWR Configuration---```// error is typed as ApiError | undefinedconst { error } = useSWR<any, ApiError>("/api/users", fetcher);}  status: number;  message: string;interface ApiError {```typescript### Typed Error```// data is typed as ApiResponse | undefinedconst { data } = useSWR<ApiResponse>("/api/users", fetcher);}  data: User[];interface ApiResponse {}  name: string;  id: string;interface User {```typescript### Typed Response## TypeScript---```});  },    setTimeout(() => revalidate({ retryCount }), 5000);    // Retry after 5s        if (retryCount >= 3) return;    // Max 3 retries        if (error.status === 404) return;    // Never retry on 404  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {const { data } = useSWR("/api/users", fetcher, {```typescript### Custom Error Retry```}  );    </div>      <button onClick={() => mutate()}>Retry</button>      <p>Status: {error.status}</p>      <p>Error: {error.message}</p>    <div>  return (if (error) {```typescript### With Error Details```if (error) return <div>Failed to load</div>;const { data, error } = useSWR("/api/users", fetcher);```typescript### Basic Error Display## Error Handling---```console.log(cache);// Access global cacheconst { cache, mutate } = useSWRConfig();import { useSWRConfig } from "swr";```typescript### useSWRConfig```const { data } = useSWRImmutable("/api/config", fetcher);// Never revalidate (for static data)import useSWRImmutable from "swr/immutable";```typescript### useSWRImmutable```const { data, size, setSize } = useSWRInfinite(getKey, fetcher);};  return `/api/users?page=${pageIndex}`;  if (previousPageData && !previousPageData.hasMore) return null;const getKey = (pageIndex, previousPageData) => {import useSWRInfinite from "swr/infinite";```typescript### useSWRInfinite## Advanced Hooks---```await mutate("/api/users", newData, false);// Update data for specific key);  key => typeof key === 'string' && key.startsWith('/api/users')await mutate(// Revalidate all keys matching patternawait mutate("/api/users");// Revalidate specific keyimport { mutate } from "swr";```typescript## Global Mutation---```}  await mutate(currentData, false); // Rollback} catch {  await mutate(); // Revalidate  await apiCall();  await mutate(optimisticData, false);try {const currentData = data;```typescript### Rollback on Error```);  }    return updatedData;    // Update logic  async (currentData) => {await mutate(```typescript### Update with Promise```await mutate(newData, false);// Update cache, don't revalidateawait mutate(newData, true);// Update cache immediately, revalidate after```typescript### Optimistic Update```await mutate();// Trigger revalidationconst { mutate } = useSWR("/api/users", fetcher);```typescript### Manual Revalidation## Mutation Patterns---```}  keepPreviousData: false,      // Keep previous data during revalidation  fallbackData: undefined,      // Initial data before fetch  suspense: false,              // Enable React Suspense mode{```typescript### Behavior```}  shouldRetryOnError: true,     // Whether to retry on error  errorRetryCount: 3,           // Max retry attempts  errorRetryInterval: 5000,     // Retry delay  loadingTimeout: 3000,         // Timeout for loading state  dedupingInterval: 2000,       // Dedupe requests within 2s{```typescript### Performance```}  focusThrottleInterval: 5000,  // Throttle focus revalidation  refreshInterval: 0,            // Auto-refresh interval (ms)  revalidateIfStale: true,      // Revalidate if cache is stale  revalidateOnReconnect: true,  // Refresh when reconnecting  revalidateOnFocus: true,      // Refresh when window gains focus{```typescript### Revalidation## Configuration Options---```});  revalidateOnFocus: true,  refreshInterval: 3000,const { data } = useSWR("/api/users", fetcher, {```typescript### 4. With Options```const { data } = useSWR(`/api/users/${userId}`, fetcher);```typescript### 3. Dynamic Key```const { data } = useSWR(shouldFetch ? "/api/users" : null, fetcher);```typescript### 2. Conditional Fetch```const { data, error, isLoading } = useSWR("/api/users", fetcher);```typescript### 1. Basic Fetch## Common Patterns---| `mutate` | `function` | Function to mutate cached data || `isValidating` | `boolean` | True when request in flight (even if cached) || `isLoading` | `boolean` | True when fetching and no data yet || `error` | `Error` | Error thrown by fetcher || `data` | `any` | Data returned from fetcher ||----------|------|-------------|| Property | Type | Description |## useSWR Return Values---```const { data, error, isLoading, mutate } = useSWR("/api/endpoint", fetcher);import { fetcher } from "@/lib/fetcher";import useSWR from "swr";```typescript### Basic Usage```npm install swr```bash### Install## Quick Start
## Installation

```bash
npm install swr
```

## Basic Usage

```typescript
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const { data, error, isLoading, mutate } = useSWR("/api/endpoint", fetcher);
```

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `data` | any | Fetched data (undefined during loading) |
| `error` | Error | Error object if fetch failed |
| `isLoading` | boolean | True during initial fetch |
| `isValidating` | boolean | True during any fetch/revalidation |
| `mutate` | function | Function to manually trigger revalidation |

## Common Patterns

### 1. Basic Fetch

```typescript
const { data, error, isLoading } = useSWR("/api/users", fetcher);

if (error) return <div>Error</div>;
if (isLoading) return <div>Loading...</div>;
return <div>{data.users.map(u => u.name)}</div>;
```

### 2. Conditional Fetch

```typescript
// Only fetch if userId exists
const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
```

### 3. Manual Refresh

```typescript
const { data, mutate } = useSWR("/api/users", fetcher);

<button onClick={() => mutate()}>Refresh</button>
```

### 4. Optimistic Update

```typescript
const { data, mutate } = useSWR("/api/users", fetcher);

const addUser = async (newUser) => {
  // Optimistic update
  await mutate({ ...data, users: [...data.users, newUser] }, false);
  
  // API call
  await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(newUser)
  });
  
  // Revalidate
  await mutate();
};
```

### 5. With Configuration

```typescript
const { data } = useSWR("/api/users", fetcher, {
  refreshInterval: 5000,          // Refresh every 5s
  revalidateOnFocus: true,        // Refresh on window focus
  revalidateOnReconnect: true,    // Refresh on reconnect
  dedupingInterval: 2000,         // Dedupe requests within 2s
});
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `refreshInterval` | 0 | Auto-refresh interval (ms) |
| `revalidateOnFocus` | true | Revalidate when window gains focus |
| `revalidateOnReconnect` | true | Revalidate when going online |
| `dedupingInterval` | 2000 | Dedupe requests within interval (ms) |
| `errorRetryCount` | 5 | Max number of retry attempts |
| `errorRetryInterval` | 5000 | Delay between retries (ms) |
| `shouldRetryOnError` | true | Retry on error |
| `revalidateIfStale` | true | Revalidate if cache is stale |

## Cache Management

### Get Cache

```typescript
import { useSWRConfig } from "swr";

const { cache } = useSWRConfig();
console.log(cache.keys()); // All cache keys
```

### Clear Cache

```typescript
import { mutate } from "swr";

// Clear specific cache
mutate("/api/users", undefined, false);

// Clear all caches
cache.clear();
```

### Global Mutation

```typescript
import { mutate } from "swr";

// Revalidate all caches with this key
await mutate("/api/users");

// Revalidate all caches
await mutate(() => true);
```

## Error Handling

```typescript
const { data, error } = useSWR("/api/users", fetcher, {
  onError: (error, key) => {
    console.error(`Error fetching ${key}:`, error);
  },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404
    if (error.status === 404) return;
    
    // Max 3 retries
    if (retryCount >= 3) return;
    
    // Retry after 5s
    setTimeout(() => revalidate({ retryCount }), 5000);
  },
});
```

## TypeScript Support

```typescript
interface User {
  id: string;
  name: string;
}

interface ApiResponse {
  success: boolean;
  data: { users: User[] };
}

const { data } = useSWR<ApiResponse>("/api/users", fetcher);
// data is typed as ApiResponse | undefined
```

## Mutation Patterns

### Optimistic Update

```typescript
// Update immediately, rollback on error
try {
  await mutate(newData, false);
  await apiCall();
  await mutate();
} catch {
  await mutate(originalData, false);
}
```

### Pessimistic Update

```typescript
// Wait for API, then update
await apiCall();
await mutate();
```

### Local Only

```typescript
// Update cache without revalidation
mutate(newData, false);
```

## Advanced Features

### Dependent Fetching

```typescript
const { data: user } = useSWR("/api/user", fetcher);
const { data: posts } = useSWR(
  user ? `/api/posts?userId=${user.id}` : null,
  fetcher
);
```

### Pagination

```typescript
const [page, setPage] = useState(1);
const { data } = useSWR(`/api/users?page=${page}`, fetcher);
```

### Infinite Loading

```typescript
import useSWRInfinite from "swr/infinite";

const getKey = (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.hasMore) return null;
  return `/api/users?offset=${pageIndex * 10}`;
};

const { data, size, setSize } = useSWRInfinite(getKey, fetcher);
```

## Global Configuration

```typescript
import { SWRConfig } from "swr";

<SWRConfig
  value={{
    refreshInterval: 30000,
    revalidateOnFocus: true,
    fetcher: (url) => fetch(url).then(r => r.json())
  }}
>
  {children}
</SWRConfig>
```

## Common Mistakes

### ❌ Wrong: Changing key in effect

```typescript
const [key, setKey] = useState("/api/users");
useEffect(() => { setKey("/api/posts"); }, []);
const { data } = useSWR(key, fetcher);
```

### ✅ Right: Use conditional

```typescript
const shouldFetchPosts = true;
const { data } = useSWR(
  shouldFetchPosts ? "/api/posts" : "/api/users",
  fetcher
);
```

### ❌ Wrong: Multiple fetchers

```typescript
const { data: users } = useSWR("/api/users", fetcherA);
const { data: users2 } = useSWR("/api/users", fetcherB);
// Cache collision!
```

### ✅ Right: Unique keys

```typescript
const { data: users } = useSWR(["/api/users", "A"], fetcherA);
const { data: users2 } = useSWR(["/api/users", "B"], fetcherB);
```

## Performance Tips

1. **Use deduplication:** Multiple components with same key = 1 request
2. **Disable unnecessary revalidation:** Set to false for static data
3. **Use optimistic updates:** For better UX
4. **Cache strategically:** Consider data freshness requirements
5. **TypeScript:** Catch errors at compile time

## Demo Pages

- **Basic Demo:** `/swr-demo`
- **Optimistic Updates:** `/swr-demo/optimistic`

## Cheat Sheet

```typescript
// Basic
useSWR(key, fetcher)

// With options
useSWR(key, fetcher, { ...options })

// Conditional
useSWR(condition ? key : null, fetcher)

// Manual revalidate
mutate()

// Optimistic update
mutate(newData, false)

// Global mutation
import { mutate } from "swr"
mutate(key)
```

---

**Remember:** SWR = Stale-While-Revalidate = Show cache + Fetch fresh data in background ⚡
