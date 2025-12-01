# Next.js Server Component Conversion Pattern

## Overview

This document describes the pattern for converting complex Client Components to use Server Components for initial data fetching while preserving client-side interactivity.

## Hybrid Approach Pattern

For pages with complex client-side interactivity (filters, real-time updates, modals, etc.), use a **hybrid approach**:

1. **Server Component Wrapper** - Fetches initial data server-side
2. **Client Component** - Handles all interactivity and state management
3. **Props Passing** - Server Component passes initial data to Client Component

## Structure

```
app/
  admin/
    dashboard/
      page.tsx              # Server Component (wrapper)
      DashboardClient.tsx   # Client Component (existing logic)
```

## Implementation Steps

### Step 1: Extract Client Component

Move the existing Client Component logic to a new file:

```typescript
// app/admin/dashboard/DashboardClient.tsx
'use client';

import { useState, useEffect } from 'react';
import type { DashboardSummary, DashboardChartsPayload } from '@/types/dashboard';

interface DashboardClientProps {
  initialStats: DashboardSummary;
  initialCharts: DashboardChartsPayload | null;
  initialDateRange: DateRangeKey;
}

export default function DashboardClient({
  initialStats,
  initialCharts,
  initialDateRange,
}: DashboardClientProps) {
  // All existing client-side logic
  // Use initialStats and initialCharts as initial state
  const [stats, setStats] = useState(initialStats);
  const [charts, setCharts] = useState(initialCharts);
  // ... rest of component
}
```

### Step 2: Create Server Component Wrapper

Create a Server Component that fetches initial data:

```typescript
// app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { cachedQuery, CACHE_PRESETS } from '@/lib/supabase/server-cache';
import DashboardClient from './DashboardClient';
import type { DashboardSummary, DashboardChartsPayload, DateRangeKey } from '@/types/dashboard';

export default async function AdminDashboardPage() {
  // Verify admin access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Check admin role (simplified - use requireAdmin in production)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  // Fetch initial data server-side
  const initialData = await cachedQuery(
    async (supabase) => {
      // Fetch dashboard data using same queries as API route
      // This is a simplified example - full implementation would
      // replicate the logic from /api/admin/dashboard/overview
      const { data } = await supabase
        .from('bookings')
        .select('id, totalAmount, createdAt, status')
        .limit(10);

      return {
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          // ... other stats
        },
        charts: null,
      };
    },
    ['dashboard-overview-month'],
    {
      ...CACHE_PRESETS.BOOKING,
      revalidate: 120, // 2 minutes
    }
  );

  return (
    <DashboardClient
      initialStats={initialData.stats}
      initialCharts={initialData.charts}
      initialDateRange="month"
    />
  );
}
```

### Step 3: Update Client Component to Accept Initial Data

Modify the Client Component to:
- Accept initial data as props
- Use it for initial state
- Still allow client-side refetching for real-time updates

## Benefits

1. **Faster Initial Load** - Data fetched server-side, no client-side loading state
2. **Better SEO** - Server-rendered content
3. **Progressive Enhancement** - Works without JavaScript for initial render
4. **Preserved Interactivity** - All client-side features still work
5. **Caching** - Server-side data can be cached with Next.js cache

## When to Use This Pattern

✅ **Use for:**
- Pages with complex client-side interactivity
- Pages that need real-time updates
- Pages with filters, modals, charts
- Pages where full Server Component conversion is too complex

❌ **Don't use for:**
- Simple static pages (convert fully to Server Component)
- Pages with no client-side interactivity
- Pages that are already simple Server Components

## Migration Strategy

1. **Start Simple** - Convert static pages first
2. **Incremental** - Convert one page at a time
3. **Test Thoroughly** - Verify all interactivity still works
4. **Monitor Performance** - Measure improvements

## Example: Admin Dashboard

The admin dashboard is a good candidate for this pattern because:
- Complex client-side state management
- Real-time updates
- Multiple filters and modals
- Chart interactions

**Current State**: Full Client Component
**Target State**: Server Component wrapper + Client Component
**Complexity**: High (requires careful state management)

## Helper Functions

Use the helper functions in `frontend/src/lib/admin/dashboard-server.ts`:
- `fetchDashboardOverview()` - Fetch dashboard data server-side
- `resolveDateRanges()` - Calculate date ranges
- `toDateString()` - Format dates

## Next Steps

1. Create Server Component wrapper for admin dashboard
2. Extract Client Component logic
3. Test thoroughly
4. Apply same pattern to other admin pages






