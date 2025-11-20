# Admin Rate Limit Migration Guide

## Problem

**CRITICAL**: All 101 admin API routes currently lack rate limiting, exposing the system to:

- Brute force attacks
- API abuse
- Resource exhaustion
- DoS attacks

## Solution

Use the `withAdminRateLimit` wrapper to add rate limiting + admin verification to all admin routes.

---

## Quick Start

### Before (Vulnerable)

```typescript
// frontend/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // ❌ NO RATE LIMITING
  // ❌ NO ADMIN VERIFICATION

  const { data } = await supabase.from('users').select('*');
  return NextResponse.json({ users: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // ❌ NO RATE LIMITING
  // ❌ NO ADMIN VERIFICATION

  const { data } = await supabase.from('users').insert(body);
  return NextResponse.json({ user: data });
}
```

### After (Secure)

```typescript
// frontend/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';
import { createClient } from '@/lib/supabase/server';

// ✅ RATE LIMITED: 120 req/min
// ✅ ADMIN VERIFIED
export const GET = withAdminRateLimit(
  async (request: NextRequest) => {
    const supabase = await createClient();
    const { data } = await supabase.from('users').select('*');
    return NextResponse.json({ users: data });
  },
  { limit: AdminRateLimitPresets.READ }
);

// ✅ RATE LIMITED: 30 req/min
// ✅ ADMIN VERIFIED
export const POST = withAdminRateLimit(
  async (request: NextRequest) => {
    const supabase = await createClient();
    const body = await request.json();
    const { data } = await supabase.from('users').insert(body);
    return NextResponse.json({ user: data });
  },
  { limit: AdminRateLimitPresets.WRITE }
);
```

---

## Rate Limit Presets

Use the appropriate preset based on operation type:

```typescript
import { AdminRateLimitPresets } from '@/lib/api/admin-rate-limit';

// READ operations (GET) - 120 req/min
AdminRateLimitPresets.READ;

// WRITE operations (POST, PUT, PATCH) - 30 req/min
AdminRateLimitPresets.WRITE;

// DELETE operations - 20 req/min
AdminRateLimitPresets.DELETE;

// BULK operations - 10 req/min
AdminRateLimitPresets.BULK;

// EXPORT operations - 5 req/min (slow operations)
AdminRateLimitPresets.EXPORT;

// EMAIL/NOTIFICATION operations - 15 req/min
AdminRateLimitPresets.COMMUNICATION;
```

---

## Examples by Route Type

### Example 1: Simple CRUD Routes

```typescript
// frontend/src/app/api/admin/bookings/route.ts
import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';

export const GET = withAdminRateLimit(
  async (request) => {
    // List bookings
  },
  { limit: AdminRateLimitPresets.READ }
);

export const POST = withAdminRateLimit(
  async (request) => {
    // Create booking
  },
  { limit: AdminRateLimitPresets.WRITE }
);

export const PUT = withAdminRateLimit(
  async (request) => {
    // Update booking
  },
  { limit: AdminRateLimitPresets.WRITE }
);

export const DELETE = withAdminRateLimit(
  async (request) => {
    // Delete booking
  },
  { limit: AdminRateLimitPresets.DELETE }
);
```

### Example 2: Bulk Operations

```typescript
// frontend/src/app/api/admin/bookings/bulk-update/route.ts
import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';

export const POST = withAdminRateLimit(
  async (request) => {
    const { bookingIds, updates } = await request.json();
    // Update multiple bookings
  },
  { limit: AdminRateLimitPresets.BULK } // ✅ Stricter limit for bulk ops
);
```

### Example 3: Export Operations

```typescript
// frontend/src/app/api/admin/analytics/export/route.ts
import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';

export const POST = withAdminRateLimit(
  async (request) => {
    // Generate and export large dataset
  },
  { limit: AdminRateLimitPresets.EXPORT } // ✅ Very strict limit (5 req/min)
);
```

### Example 4: Email/Notification Routes

```typescript
// frontend/src/app/api/admin/communications/campaigns/route.ts
import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';

export const POST = withAdminRateLimit(
  async (request) => {
    // Send email campaign
  },
  { limit: AdminRateLimitPresets.COMMUNICATION } // ✅ 15 req/min
);
```

### Example 5: Dynamic Route with Context

```typescript
// frontend/src/app/api/admin/users/[id]/route.ts
import { AdminRateLimitPresets, withAdminRateLimit } from '@/lib/api/admin-rate-limit';

export const GET = withAdminRateLimit(
  async (request, context) => {
    const { id } = context.params; // ✅ Access route params via context
    // Get user by ID
  },
  { limit: AdminRateLimitPresets.READ }
);
```

---

## Migration Priority

### Phase 1: Critical Routes (Week 1)

These routes MUST be secured immediately:

1. **Authentication/User Management**
   - `/api/admin/users/*`
   - `/api/admin/users/[id]/*`

2. **Payment Operations**
   - `/api/admin/payments/*`
   - `/api/admin/payments/refund/*`
   - `/api/admin/payments/manual/*`

3. **Bulk Operations**
   - `/api/admin/bookings/bulk-update/*`
   - `/api/admin/customers/bulk-update/*`
   - `/api/admin/equipment/bulk-update/*`

4. **Data Export**
   - `/api/admin/*/export`
   - `/api/admin/*/bulk-export`

### Phase 2: High-Value Routes (Week 2)

- Dashboard routes (`/api/admin/dashboard/*`)
- Booking management (`/api/admin/bookings/*`)
- Equipment management (`/api/admin/equipment/*`)
- Customer management (`/api/admin/customers/*`)

### Phase 3: Remaining Routes (Week 3)

- Communication routes (`/api/admin/communications/*`)
- Analytics routes (`/api/admin/analytics/*`)
- Support routes (`/api/admin/support/*`)
- All other admin routes

---

## Automated Migration Script

Use this script to quickly migrate all admin routes:

```bash
#!/bin/bash
# migrate-admin-rate-limits.sh

find frontend/src/app/api/admin -name "route.ts" | while read file; do
  echo "Migrating: $file"

  # Add import at the top
  sed -i '1i import { withAdminRateLimit, AdminRateLimitPresets } from "@/lib/api/admin-rate-limit";' "$file"

  # TODO: Manual review required for each route
  # - Determine appropriate rate limit preset
  # - Wrap export functions

  echo "  ⚠️  Manual review required"
done
```

---

## Testing

After migration, test each route:

```typescript
// Test rate limiting
import { describe, expect, it } from 'vitest';

describe('Admin Route Rate Limiting', () => {
  it('should rate limit admin routes', async () => {
    const requests = Array.from({ length: 150 }, () =>
      fetch('/api/admin/users', {
        headers: { Cookie: adminCookie },
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should verify admin access', async () => {
    const response = await fetch('/api/admin/users', {
      headers: { Cookie: nonAdminCookie },
    });

    expect(response.status).toBe(403);
  });
});
```

---

## Monitoring

After deployment, monitor these metrics:

1. **Rate Limit Hits**: How many requests are being rate limited?
   - Log level: WARN
   - Component: `admin-rate-limit`
   - Action: `rate_limit_exceeded`

2. **Unauthorized Access Attempts**: How many non-admins try to access admin routes?
   - Log level: WARN
   - Component: `admin-rate-limit`
   - Action: `unauthorized_access`

3. **Admin Access**: Audit trail of all admin operations
   - Log level: INFO
   - Component: `admin-rate-limit`
   - Action: `admin_access`

Query logs:

```sql
-- Rate limit violations
SELECT * FROM logs
WHERE component = 'admin-rate-limit'
AND action = 'rate_limit_exceeded'
AND created_at > NOW() - INTERVAL '24 hours';

-- Unauthorized access attempts
SELECT * FROM logs
WHERE component = 'admin-rate-limit'
AND action = 'unauthorized_access'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## Common Issues

### Issue 1: Context params not accessible

**Problem**: `context.params` is undefined

**Solution**: Ensure you pass `context` to handler:

```typescript
export const GET = withAdminRateLimit(
  async (request, context) => {
    // ✅ Add context parameter
    const { id } = context.params;
    // ...
  },
  { limit: AdminRateLimitPresets.READ }
);
```

### Issue 2: Rate limit too strict

**Problem**: Legitimate users are being rate limited

**Solution**: Use custom limit:

```typescript
export const GET = withAdminRateLimit(
  async (request) => {
    // ...
  },
  {
    limit: {
      requests: 200, // Custom limit
      window: 60,
    },
  }
);
```

### Issue 3: Need to skip auth for specific routes

**Problem**: Route needs rate limiting but not admin verification (e.g., health checks)

**Solution**: Use `skipAuth: true`:

```typescript
export const GET = withAdminRateLimit(
  async (request) => {
    // ...
  },
  {
    limit: AdminRateLimitPresets.READ,
    skipAuth: true, // ✅ Skip admin verification
  }
);
```

---

## Checklist for Each Route

When migrating a route, verify:

- [ ] Import `withAdminRateLimit` added
- [ ] Appropriate preset selected
- [ ] All export functions wrapped (GET, POST, PUT, DELETE)
- [ ] Context params accessible (for dynamic routes)
- [ ] Tested rate limiting works
- [ ] Tested admin verification works
- [ ] Logged admin access for audit trail
- [ ] Documented in PR/commit message

---

## See Also

- `frontend/src/lib/api/admin-rate-limit.ts` - Implementation
- `frontend/src/lib/rate-limit.ts` - Core rate limiting
- `@https://web.dev/vitals/` - Security best practices
- `CODEBASE_AUDIT_REPORT.md` - Issue #11

---

**Status**: ⚠️ **URGENT** - 101 admin routes need migration
**Priority**: 🔴 **CRITICAL**
**Estimated Effort**: 2-3 days (phased approach)
