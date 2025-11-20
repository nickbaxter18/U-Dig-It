# Admin Dashboard Errors - Analysis & Solutions

**Date:** November 18, 2025
**Status:** Critical Issues Identified
**Priority:** High

---

## 📊 Executive Summary

The admin dashboard has **4 critical errors** related to authentication, RLS policies, and missing data. All errors stem from:
1. ❌ **Authentication mismatch** between client and server
2. ❌ **RLS policies blocking queries** due to missing service role client
3. ❌ **Undefined equipment IDs** being passed to API calls
4. ❌ **Missing database function** (get_equipment_with_stats)

---

## 🔴 Error 1: "Failed to load alerts"

### Symptoms
- Dashboard shows "Failed to load alerts" error banner (top right)
- Alerts section not loading on admin dashboard

### Root Cause
The API endpoint `/api/admin/maintenance/alerts` is querying `maintenance_alerts` table, but:
1. The RLS policy requires admin role check
2. The `requireAdmin()` function returns regular supabase client, not service role
3. RLS blocks the query because it can't verify admin status

### Evidence from Logs
```
GET | 401 | /rest/v1/alert_incidents?select=*&order=triggered_at.desc&limit=10&status=eq.open
```

### Solution

**Option A: Use Service Role Client (Recommended)**

Update `/api/admin/maintenance/alerts/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceClient();

    const filters = maintenanceAlertQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );

    let query = supabaseAdmin
      .from('maintenance_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.equipmentId) {
      query = query.eq('equipment_id', filters.equipmentId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Failed to fetch maintenance alerts', {
        component: 'admin-maintenance-alerts',
        action: 'fetch_failed',
        metadata: filters,
      }, fetchError);
      return NextResponse.json(
        { error: 'Unable to load maintenance alerts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ alerts: data ?? [] });
  } catch (err) {
    // ... existing error handling
  }
}
```

**Option B: Fix RLS Policy**

If you want to keep using regular client, modify the RLS policy to properly check admin role from auth.jwt():

```sql
-- Update maintenance_alerts RLS policy
DROP POLICY IF EXISTS maintenance_alerts_admin ON maintenance_alerts;

CREATE POLICY "maintenance_alerts_admin" ON maintenance_alerts
FOR ALL TO authenticated
USING (
  (SELECT auth.role()) = 'service_role'
  OR
  (SELECT COALESCE((auth.jwt()->>'user_metadata'->>'role')::text, 'customer')) IN ('admin', 'super_admin')
);
```

---

## 🔴 Error 2: "Failed to verify equipment status"

### Symptoms
- Modal alert pops up: "localhost:3000 says Failed to verify equipment status"
- Happens when trying to access equipment management features

### Root Cause
Looking at the equipment management page code:
1. The page calls `fetchEquipment()` which uses `supabase.rpc('get_equipment_with_stats')`
2. This RPC function **doesn't exist** in the database (returns 400 Bad Request)
3. The fallback query works but may be missing status field

### Evidence from Logs
```
POST | 400 | /rest/v1/rpc/get_equipment_with_stats
```

### Solution

**Step 1: Create Missing RPC Function**

```sql
-- Create get_equipment_with_stats function
CREATE OR REPLACE FUNCTION get_equipment_with_stats()
RETURNS TABLE (
  id UUID,
  "unitId" VARCHAR,
  "serialNumber" VARCHAR,
  model VARCHAR,
  make VARCHAR,
  type VARCHAR,
  status equipment_status,
  location VARCHAR,
  "dailyRate" NUMERIC,
  "weeklyRate" NUMERIC,
  "monthlyRate" NUMERIC,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ,
  total_revenue NUMERIC,
  total_bookings INTEGER,
  utilization_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e."unitId",
    e."serialNumber",
    e.model,
    e.make,
    e.type,
    e.status,
    e.location,
    e."dailyRate",
    e."weeklyRate",
    e."monthlyRate",
    e."createdAt",
    e."updatedAt",
    COALESCE(SUM(b."totalAmount"), 0) as total_revenue,
    COUNT(b.id)::INTEGER as total_bookings,
    CASE
      WHEN COUNT(b.id) > 0 THEN
        (COUNT(CASE WHEN b.status IN ('confirmed', 'paid', 'in_progress', 'delivered') THEN 1 END)::NUMERIC / COUNT(b.id)::NUMERIC) * 100
      ELSE 0
    END as utilization_rate
  FROM equipment e
  LEFT JOIN bookings b ON b."equipmentId" = e.id AND b.status NOT IN ('cancelled', 'rejected')
  GROUP BY e.id, e."unitId", e."serialNumber", e.model, e.make, e.type, e.status,
           e.location, e."dailyRate", e."weeklyRate", e."monthlyRate", e."createdAt", e."updatedAt"
  ORDER BY e."createdAt" DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_equipment_with_stats() TO authenticated;
```

**Step 2: Add Status Verification**

The status field might not be properly set. Ensure equipment table has valid status values:

```sql
-- Check for invalid status values
SELECT id, "unitId", status
FROM equipment
WHERE status IS NULL OR status NOT IN ('available', 'rented', 'maintenance', 'unavailable', 'reserved');

-- Fix any invalid statuses
UPDATE equipment
SET status = 'available'
WHERE status IS NULL OR status NOT IN ('available', 'rented', 'maintenance', 'unavailable', 'reserved');
```

---

## 🔴 Error 3: "Error loading equipment - Forbidden"

### Symptoms
- Equipment management page shows "Error loading equipment" + "Forbidden" error banner
- Equipment list fails to load

### Root Cause
The RLS policy on `equipment` table requires admin role check via join to `users` table:
1. Query hits equipment table with regular anon client
2. RLS policy tries to verify admin status
3. Policy fails because user session isn't properly authenticated OR
4. The join to `users` table fails because the current user doesn't have a users record

### Evidence from Logs
```
GET | 200 | /rest/v1/equipment?select=*&order=createdAt.desc
```
(Shows 200 but might be returning empty due to RLS)

### Solution

**Option 1: Use Service Role Client for Admin Routes (Recommended)**

Update `/api/admin/equipment/*/route.ts` to use service role:

```typescript
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin first
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Use service role client for the actual query
    const supabaseAdmin = createServiceClient();

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ equipment: data ?? [] });
  } catch (error) {
    // ... error handling
  }
}
```

**Option 2: Fix RLS Policy to Check JWT Claims**

Modify equipment RLS policy to check user role from JWT:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Equipment is manageable by admins" ON equipment;

-- Create new policy that checks JWT claims
CREATE POLICY "Equipment is manageable by admins" ON equipment
FOR ALL USING (
  -- Service role always has access
  (SELECT auth.role()) = 'service_role'
  OR
  -- Check user_metadata in JWT for role
  (SELECT COALESCE(
    (auth.jwt()->'user_metadata'->>'role')::text,
    'customer'
  )) IN ('admin', 'super_admin')
);
```

**Option 3: Ensure Users Table Records Exist**

Make sure authenticated users have records in the `users` table:

```sql
-- Check if admin users have records
SELECT
  au.id as auth_id,
  au.email,
  u.id as user_id,
  u.role
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE au.email IN ('aitest2@udigit.ca', 'udigitrentalsinc@gmail.com');

-- Create missing user records if needed
INSERT INTO users (id, email, role, "firstName", "lastName")
SELECT
  au.id,
  au.email,
  'admin'::users_role_enum,
  COALESCE(au.raw_user_meta_data->>'firstName', 'Admin'),
  COALESCE(au.raw_user_meta_data->>'lastName', 'User')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = au.id
)
AND au.email IN ('aitest2@udigit.ca', 'udigitrentalsinc@gmail.com');
```

---

## 🔴 Error 4: "Unable to load maintenance logs"

### Symptoms
- Schedule Maintenance modal shows "Unable to load maintenance logs" error
- Maintenance history section empty

### Root Cause
The API call `/api/admin/equipment/${equipment.id}/maintenance` is receiving `equipment.id = undefined`:

### Evidence from Logs
```
GET | 401 | /rest/v1/maintenance_logs?select=...&equipment_id=eq.undefined&deleted_at=is.null
```

The equipment ID is literally "undefined"! This means:
1. The modal is being opened with invalid equipment data
2. The equipment object doesn't have an `id` property
3. The component isn't properly validating equipment before opening modal

### Solution

**Step 1: Fix Component Prop Validation**

Update `MaintenanceScheduleModal.tsx`:

```typescript
export function MaintenanceScheduleModal({
  equipment,
  onClose,
  onScheduled,
}: MaintenanceScheduleModalProps) {
  // Validate equipment prop
  useEffect(() => {
    if (!equipment?.id) {
      logger.error('MaintenanceScheduleModal opened without valid equipment', {
        component: 'MaintenanceScheduleModal',
        action: 'invalid_equipment',
        metadata: { equipment },
      });
      setError('Invalid equipment data');
      return;
    }
  }, [equipment]);

  const fetchMaintenanceRecords = async () => {
    // Guard clause
    if (!equipment?.id) {
      setError('No equipment selected');
      return;
    }

    try {
      setLoadingRecords(true);
      setError(null);
      const response = await fetchWithAuth(
        `/api/admin/equipment/${equipment.id}/maintenance?type=scheduled&limit=5`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load maintenance history');
      }

      const payload = (await response.json()) as { data: MaintenanceRecord[] };
      setExistingRecords(payload.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load maintenance history';
      setError(message);
      logger.error(
        'Failed to load maintenance history',
        { component: 'MaintenanceScheduleModal', action: 'load_records_error' },
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setLoadingRecords(false);
    }
  };

  // ... rest of component
}
```

**Step 2: Fix Parent Component Passing Equipment**

In the equipment management page, ensure valid equipment is passed:

```typescript
const handleScheduleMaintenance = (equipmentItem: Equipment) => {
  // Validate equipment has required fields
  if (!equipmentItem?.id) {
    logger.error('Invalid equipment selected for maintenance', {
      component: 'EquipmentManagement',
      action: 'invalid_equipment',
      metadata: { equipmentItem },
    });
    alert('Cannot schedule maintenance: Invalid equipment data');
    return;
  }

  setSelectedEquipment(equipmentItem);
  setShowMaintenanceModal(true);
};
```

**Step 3: Use Service Role Client in API**

Update `/api/admin/equipment/[id]/maintenance/route.ts`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    // Validate equipment ID
    if (!params.id || params.id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Use service role client
    const supabaseAdmin = createServiceClient();

    if (type === 'scheduled') {
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam))) : 10;

      const { data, error: fetchError } = await supabaseAdmin
        .from('equipment_maintenance')
        .select(
          'id, title, maintenance_type, priority, status, scheduled_date, performed_by, cost, next_due_date'
        )
        .eq('equipment_id', params.id)
        .order('scheduled_date', { ascending: false })
        .limit(limit);

      if (fetchError) {
        logger.error('Failed to load equipment maintenance records', {
          component: 'admin-equipment-maintenance-api',
          action: 'fetch_error',
          metadata: { equipmentId: params.id },
        }, fetchError);
        return NextResponse.json(
          { error: 'Failed to load maintenance records' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: data ?? [] });
    }

    // Default: return maintenance logs
    const { data, error: fetchError } = await supabaseAdmin
      .from('maintenance_logs')
      .select(`
        id,
        equipment_id,
        maintenance_type,
        performed_at,
        technician,
        notes,
        cost,
        duration_hours,
        status,
        next_due_at,
        documents,
        created_by,
        created_at,
        updated_at,
        parts:maintenance_parts (
          id,
          part_name,
          quantity,
          cost_per_unit,
          supplier,
          created_at,
          updated_at
        )
      `)
      .eq('equipment_id', params.id)
      .is('deleted_at', null)
      .order('performed_at', { ascending: false });

    if (fetchError) {
      logger.error('Failed to fetch equipment maintenance logs', {
        component: 'admin-equipment-maintenance',
        action: 'fetch_logs_failed',
        metadata: { equipmentId: params.id },
      }, fetchError);
      return NextResponse.json(
        { error: 'Unable to load maintenance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ maintenanceLogs: data ?? [] });
  } catch (err) {
    logger.error('Unexpected error fetching maintenance data', {
      component: 'admin-equipment-maintenance',
      action: 'fetch_unexpected',
      metadata: { equipmentId: params.id },
    }, err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 🔧 Implementation Plan

### Phase 1: Critical Fixes (Do First) ⚡

1. **Create Service Role Client Helper** (if not exists)

```typescript
// /frontend/src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config';
import type { Database } from '@/../../supabase/types';

export function createServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

2. **Apply Database Migrations**

```bash
# Create get_equipment_with_stats function
mcp_supabase_apply_migration({
  name: "create_get_equipment_with_stats_function",
  query: "..." # SQL from Error 2 solution
})

# Fix equipment statuses
mcp_supabase_execute_sql({
  query: "..." # SQL from Error 2 solution
})

# Update RLS policies
mcp_supabase_apply_migration({
  name: "fix_rls_policies_for_admin",
  query: "..." # SQL from Error 3 solution
})
```

3. **Update API Routes to Use Service Role Client**

Update these files:
- `/api/admin/maintenance/alerts/route.ts`
- `/api/admin/equipment/route.ts`
- `/api/admin/equipment/[id]/route.ts`
- `/api/admin/equipment/[id]/maintenance/route.ts`

### Phase 2: Component Fixes

4. **Add Equipment Validation in Components**

Update these files:
- `components/admin/MaintenanceScheduleModal.tsx`
- `app/admin/equipment/page.tsx`

### Phase 3: Testing

5. **Test Each Fix**

```bash
# 1. Test alerts loading
# Navigate to /admin/dashboard
# Should see alerts without "Failed to load alerts" error

# 2. Test equipment loading
# Navigate to /admin/equipment
# Should see equipment list without "Forbidden" error

# 3. Test equipment status verification
# Click on any equipment item
# Should not see "Failed to verify equipment status" modal

# 4. Test maintenance logs
# Click "Schedule Maintenance" button
# Should see maintenance history without "Unable to load maintenance logs" error
```

### Phase 4: Monitoring

6. **Add Better Error Logging**

```typescript
// Add to all affected API routes
if (fetchError) {
  logger.error('Detailed error context', {
    component: 'component-name',
    action: 'action-name',
    metadata: {
      equipmentId: params.id,
      userId: user?.id,
      // Add relevant context
    },
  }, fetchError);

  // Return user-friendly error
  return NextResponse.json(
    { error: 'User-friendly message', details: process.env.NODE_ENV === 'development' ? fetchError.message : undefined },
    { status: 500 }
  );
}
```

---

## 📋 Checklist

### Before Starting
- [  ] Review all 4 errors and understand root causes
- [ ] Backup database before applying migrations
- [ ] Test in development environment first

### Implementation
- [ ] Create service role client helper
- [ ] Create get_equipment_with_stats database function
- [ ] Fix equipment status values
- [ ] Update RLS policies
- [ ] Update maintenance alerts API route
- [ ] Update equipment API routes
- [ ] Add equipment validation in components
- [ ] Add better error logging

### Testing
- [ ] Test alerts loading on dashboard
- [ ] Test equipment management page loading
- [ ] Test equipment status verification
- [ ] Test maintenance modal opening
- [ ] Test maintenance logs loading
- [ ] Verify no 401/403 errors in browser console
- [ ] Check Supabase logs for errors

### Deployment
- [ ] Apply database migrations to production
- [ ] Deploy frontend changes
- [ ] Monitor error logs
- [ ] Verify all features working

---

## 🎯 Success Criteria

✅ **All 4 errors resolved:**
1. ✅ Dashboard shows alerts without errors
2. ✅ Equipment management page loads equipment list
3. ✅ Equipment status verification works
4. ✅ Maintenance modal shows logs without errors

✅ **No RLS-related 401/403 errors in logs**

✅ **All admin features functional**

---

## 🔍 Root Cause Summary

All errors trace back to **3 core issues**:

1. **Service Role Client Not Used** - Admin API routes use regular anon client which triggers RLS checks
2. **RLS Policies Too Strict** - Policies require database joins that fail or check wrong auth fields
3. **Missing Data Validation** - Components don't validate data before making API calls

**The Fix:** Use service role client in all `/api/admin/*` routes after verifying admin status with `requireAdmin()`.

---

## 📚 References

- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Service Role Client: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Generated:** November 18, 2025
**Last Updated:** November 18, 2025

