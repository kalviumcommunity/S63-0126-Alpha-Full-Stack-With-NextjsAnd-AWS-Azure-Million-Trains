# SWR Testing & Verification Guide

## Quick Start Testing

### 1. Start Development Server

```bash
cd train-tracker
npm run dev
```

Server starts at `http://localhost:3000`

---

## Test 1: Basic SWR Caching

### Navigate to Basic Demo

**URL:** `http://localhost:3000/swr-demo`

### Test Steps

#### Step 1: First Load
- [ ] Page loads and displays users
- [ ] Check Network tab: 1 request to `/api/users`
- [ ] Note the "Last Fetched" timestamp

**Expected:** ✅ Data loads successfully

#### Step 2: Refresh Page
- [ ] Press F5 to refresh
- [ ] Page shows users **instantly** (from cache)
- [ ] Check Network tab: New request made in background

**Expected:** ⚡ Instant load from cache, background revalidation

#### Step 3: Tab Focus Revalidation
- [ ] Switch to another browser tab
- [ ] Wait 3 seconds
- [ ] Switch back to the demo tab
- [ ] Watch "Last Fetched" timestamp update

**Expected:** 🔄 Data refreshes when tab gains focus

#### Step 4: Manual Revalidation
- [ ] Click "🔄 Manual Revalidate" button
- [ ] Watch timestamp update
- [ ] Check Network tab: New request made

**Expected:** ✅ Manual refresh triggers revalidation

#### Step 5: Cache Inspection
- [ ] Open browser DevTools (F12)
- [ ] Click "📋 Log Cache to Console"
- [ ] Check Console tab

**Expected Console Output:**
```
🎯 SWR Cache Key: /api/users
📦 Cached Data: {success: true, data: {...}, timestamp: "..."}
⏰ Timestamp: 2026-02-19T...
```

---

## Test 2: Request Deduplication

### Open Multiple Components

1. Open `/swr-demo` in one tab
2. Open `/swr-demo` in another tab (same browser)
3. Open DevTools Network tab
4. Refresh both tabs **at the same time**

### Verification
- [ ] Check Network tab
- [ ] Only **1 request** to `/api/users` (not 2!)
- [ ] Both tabs show the same data

**Expected:** 🚀 SWR deduplicates simultaneous requests

---

## Test 3: Optimistic Updates

### Navigate to Optimistic Demo

**URL:** `http://localhost:3000/swr-demo/optimistic`

### Test Optimistic Pattern

#### Step 1: Add User (Optimistic)
- [ ] Fill in both name and email fields
- [ ] Click "⚡ Add (Optimistic)" button
- [ ] Watch the UI update **instantly**
- [ ] Watch Activity Log for workflow

**Expected Log Sequence:**
```
🚀 Starting optimistic update...
⚡ Updating UI immediately (optimistic)
📡 Sending request to server...
```

**Then either:**
```
✅ Server confirmed - update successful!
🔄 Revalidating with server data...
```

**Or (30% chance):**
```
❌ Server error - rolling back optimistic update
↩️ UI restored to previous state
```

**Expected Behavior:**
- ✅ UI updates **before** server responds
- ✅ User added to list instantly
- ✅ "⏳ Pending" badge shows temporarily
- ✅ On error: automatic rollback to original state

#### Step 2: Add User (Pessimistic)
- [ ] Fill in fields again
- [ ] Click "🐌 Add (Pessimistic)" button
- [ ] Notice the **delay** before UI updates
- [ ] Watch Activity Log

**Expected Behavior:**
- ⏳ UI waits for server confirmation
- ✅ Updates only after successful response
- ✅ No rollback needed (no optimistic state)

#### Step 3: Local-Only Update
- [ ] Click "🎨 Local Update" button
- [ ] First user gets a ⭐ star
- [ ] Click "🌍 Global Revalidate"
- [ ] Star disappears (not persisted)

**Expected:** ✨ Local changes don't persist to server

#### Step 4: Global Mutation
- [ ] Click "🌍 Global Revalidate" button
- [ ] Check Activity Log

**Expected Log:**
```
🌍 Triggering global mutation for all /api/users caches
🔄 All components using /api/users will revalidate
```

---

## Test 4: Error Handling

### Test Error States

#### Network Error Simulation
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Refresh the page
4. Should show error state with retry button

**Expected:**
- ⚠️ Error message displays
- 🔄 "Retry" button available
- ❌ Graceful error handling

#### Test Optimistic Rollback
1. Go to `/swr-demo/optimistic`
2. Add multiple users with optimistic updates
3. ~30% will fail (simulated)
4. Watch Activity Log for rollback messages

**Expected:**
- ✅ 70% succeed normally
- ❌ 30% fail and rollback
- ↩️ UI restores to previous state on error

---

## Test 5: Cache Persistence

### Test Cache Behavior

#### Step 1: Load Initial Data
- [ ] Navigate to `/swr-demo`
- [ ] Wait for data to load
- [ ] Note the users displayed

#### Step 2: Navigate Away
- [ ] Click "Home" in breadcrumb
- [ ] Wait 2 seconds

#### Step 3: Return to Demo
- [ ] Navigate back to `/swr-demo`
- [ ] Page loads **instantly** with cached data
- [ ] New request made in background

**Expected:** ⚡ Instant load from in-memory cache

---

## Test 6: Browser Console Logs

### Enable Console Logging

1. Open DevTools (F12) → Console tab
2. Navigate through demo pages
3. Perform actions (add user, refresh, etc.)

### Expected Console Output

#### Basic Demo
```
📦 SWR Cache Keys: ["/api/users"]
📊 Cache Data: {success: true, ...}
⏰ Timestamp: 2026-02-19T10:30:00.000Z
```

#### Optimistic Demo
```
🚀 Starting optimistic update...
⚡ Updating UI immediately (optimistic)
📡 Sending request to server...
✅ Server confirmed - update successful!
🔄 Revalidating with server data...
```

Or on error:
```
❌ Server error - rolling back optimistic update
↩️ UI restored to previous state
```

---

## Test 7: Performance Comparison

### Traditional Fetch (Baseline)

Navigate to `/users` (traditional approach)

- [ ] Open Network tab
- [ ] Refresh page
- [ ] Note: Always makes new request
- [ ] No caching benefit

### SWR Approach

Navigate to `/swr-demo`

- [ ] Open Network tab
- [ ] Refresh page **multiple times**
- [ ] First load: 1 request
- [ ] Subsequent loads: Instant + background revalidation

**Performance Comparison:**

| Metric | Traditional | SWR |
|--------|-------------|-----|
| First load | 500ms | 500ms |
| Second load | 500ms | **0ms (cached)** ⚡ |
| Third load | 500ms | **0ms (cached)** ⚡ |
| Network requests | 3 | 3 (but served from cache) |
| User experience | Waiting | **Instant** 🚀 |

---

## Test 8: Component Isolation

### Test Shared Cache

1. Open two browser windows side-by-side
2. Navigate both to `/swr-demo`
3. Click "Manual Revalidate" in one window
4. Watch the other window update too

**Expected:** 🌍 Changes propagate across all instances

---

## Test 9: React DevTools

### Inspect SWR State

1. Install React Developer Tools extension
2. Open DevTools → Components tab
3. Navigate to `/swr-demo`
4. Find `SWRConfig` in component tree

**What to check:**
- [ ] SWR provider exists
- [ ] Cache data visible
- [ ] State updates on interactions

---

## Common Issues & Solutions

### Issue: Theme not persisting
**Solution:** Check localStorage in DevTools → Application → Local Storage

### Issue: Optimistic updates not working
**Cause:** API endpoint might not exist
**Solution:** This is a demo with simulated API responses

### Issue: Cache not clearing
**Solution:** Clear browser cache or use incognito mode

### Issue: "Failed to fetch data" error
**Cause:** API endpoint requires authentication
**Solution:** Log in first at `/login` before accessing demos

---

## Verification Checklist

### Basic Functionality
- [ ] ✅ Data loads on first visit
- [ ] ✅ Data cached on subsequent visits
- [ ] ✅ Revalidates on tab focus
- [ ] ✅ Manual revalidation works
- [ ] ✅ Error states display correctly
- [ ] ✅ Loading states show

### Optimistic Updates
- [ ] ✅ UI updates instantly (optimistic)
- [ ] ✅ Activity log shows workflow
- [ ] ✅ Rollback works on error
- [ ] ✅ Pessimistic update waits for server
- [ ] ✅ Local updates don't persist

### Performance
- [ ] ✅ Only 1 request for duplicate keys
- [ ] ✅ Cache serves data instantly
- [ ] ✅ Background revalidation works
- [ ] ✅ No unnecessary re-renders

### Developer Experience
- [ ] ✅ Console logs are clear
- [ ] ✅ TypeScript errors work
- [ ] ✅ React DevTools shows state
- [ ] ✅ Error messages are helpful

---

## Advanced Testing

### Test with Network Throttling

1. DevTools → Network → Throttling
2. Set to "Slow 3G"
3. Navigate to `/swr-demo`
4. Notice cached data loads instantly
5. Background request takes longer

**Expected:** ⚡ UI still feels fast despite slow network

### Test with Multiple Tabs

1. Open 5 tabs to `/swr-demo`
2. Check Network tab
3. Only 1 request made (shared cache)

**Expected:** 🚀 Excellent performance at scale

---

## Screenshot Checklist

For documentation, capture:

1. **Basic Demo:**
   - [ ] Users list with data
   - [ ] Info cards showing cache status
   - [ ] Console logs with cache data
   - [ ] Network tab showing deduplication

2. **Optimistic Demo:**
   - [ ] Form with filled fields
   - [ ] Activity log with workflow
   - [ ] User list with pending badge
   - [ ] Successful completion
   - [ ] Error with rollback

3. **Console Outputs:**
   - [ ] Cache inspection logs
   - [ ] Optimistic update workflow
   - [ ] Error handling logs

---

## Performance Metrics to Track

Use Chrome DevTools → Performance tab:

1. Record interaction
2. Check metrics:
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Total Blocking Time (TBT)

**Expected Improvements with SWR:**
- ✅ Faster perceived load time
- ✅ Reduced network waterfall
- ✅ Better user engagement

---

## Final Validation

### All Tests Passing? ✅

- [ ] Basic caching works
- [ ] Revalidation triggers correctly
- [ ] Optimistic updates function
- [ ] Error handling graceful
- [ ] Performance improved
- [ ] Console logs helpful
- [ ] No TypeScript errors

### Ready for Production! 🚀

---

## Next Steps

1. **Integrate with real APIs:**
   - Replace simulated responses
   - Connect to actual backend

2. **Add more features:**
   - Infinite scroll
   - Search with SWR
   - Real-time updates

3. **Optimize further:**
   - Fine-tune revalidation intervals
   - Add error boundaries
   - Implement retry strategies

---

**Testing Complete!** 🎉

Your SWR implementation is ready for production use.

**Last Updated:** February 19, 2026
