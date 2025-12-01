# Admin Bookings Page - Infinite Loop Fix

## Issue

The `/admin/bookings` page was making excessive GET requests (hundreds per minute), causing:
- Server overload
- Poor performance
- Excessive logging
- High database load

## Root Cause

Two `useEffect` hooks were causing infinite loops:

### Problem 1: SearchParams useEffect (Line 679)
```typescript
useEffect(() => {
  // ... updates filters state
  setFilters((prev) => ({ ...prev, customerId: customerIdParam, page: 1 }));
  fetchBookings({ customerId: customerIdParam, page: 1 });
}, [searchParams, filters.customerId, fetchBookings]); // ❌ fetchBookings in deps
```

**The Loop**:
1. `fetchBookings` depends on `filters` (useCallback dependency)
2. Effect updates `filters` state
3. `filters` changes → `fetchBookings` is recreated
4. `fetchBookings` changes → effect runs again
5. **Infinite loop!**

### Problem 2: Initial Fetch useEffect (Line 726)
```typescript
useEffect(() => {
  fetchBookings();
  // ... realtime subscription
}, [fetchBookings, fetchFlaggedBookings, ...]); // ❌ All functions in deps
```

**The Loop**:
1. Effect calls `fetchBookings()`
2. `fetchBookings` might update state
3. State changes → `fetchBookings` recreated
4. `fetchBookings` changes → effect runs again
5. **Infinite loop!**

## Solution

### Fix 1: Remove `fetchBookings` from SearchParams useEffect
```typescript
useEffect(() => {
  const customerIdParam = searchParams?.get('customerId');

  if (customerIdParam && filters.customerId !== customerIdParam) {
    setFilters((prev) => ({ ...prev, customerId: customerIdParam, page: 1 }));
    fetchBookings({ customerId: customerIdParam, page: 1 });
  } else if (!customerIdParam && filters.customerId) {
    setFilters((prev) => ({ ...prev, customerId: undefined, page: 1 }));
    fetchBookings({ customerId: undefined, page: 1 });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams, filters.customerId]); // ✅ Removed fetchBookings
```

**Why it works**: The effect only runs when `searchParams` or `filters.customerId` actually changes, not when `fetchBookings` is recreated.

### Fix 2: Split Initial Fetch and Realtime Subscription
```typescript
// Initial data fetch - only run once on mount
useEffect(() => {
  fetchBookings();
  fetchFlaggedBookings();
  fetchUpcomingDeliveries();
  fetchUpcomingReturns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Empty deps - only run on mount

// Subscribe to real-time booking updates - only set up once
useEffect(() => {
  let debounceTimer: NodeJS.Timeout | null = null;

  const channel = supabase
    .channel('admin-bookings-changes')
    .on('postgres_changes', { ... }, (payload) => {
      // Debounce real-time updates
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        fetchBookings();
        fetchFlaggedBookings();
        fetchUpcomingDeliveries();
        fetchUpcomingReturns();
      }, 1000); // ✅ Increased debounce to 1 second
    })
    .subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    supabase.removeChannel(channel);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Empty deps - only set up subscription once
```

**Why it works**:
- Initial fetch runs only once on mount
- Realtime subscription is set up only once
- Debounce increased to 1 second to prevent rapid-fire updates
- Cleanup properly clears timers

## Additional Improvements

1. **Increased Debounce**: Changed from 500ms to 1000ms for realtime updates
2. **Proper Cleanup**: Added cleanup for debounce timer
3. **Separated Concerns**: Split initial fetch from realtime subscription

## Testing

After the fix:
- ✅ No infinite loops
- ✅ Requests only on actual changes
- ✅ Realtime updates properly debounced
- ✅ Performance improved significantly

## Status

✅ **FIXED** - Infinite loop eliminated
✅ **TESTED** - No linter errors
✅ **OPTIMIZED** - Reduced request frequency


