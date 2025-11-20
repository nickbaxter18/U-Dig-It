# Enterprise Permission System

A comprehensive Role-Based Access Control (RBAC) permission system with granular permissions, caching, and audit logging.

## Features

- **Granular Permissions**: 60+ permissions organized by resource and action
- **Role-Based Access**: Multiple roles with configurable permissions
- **Permission Caching**: 5-minute TTL cache for performance
- **Audit Logging**: Complete audit trail of all permission changes
- **Type-Safe**: Full TypeScript support
- **React Integration**: Hooks and components for UI
- **API Middleware**: Easy permission checks in API routes

## Quick Start

### In API Routes

```typescript
import { checkPermission } from '@/lib/permissions/middleware';

export async function PATCH(request: NextRequest) {
  const result = await checkPermission(request, 'admin_users:update:all');
  if (!result.hasAccess) return result.error;

  // User has permission, continue...
}
```

### In React Components

```tsx
import { PermissionGate } from '@/components/admin/PermissionGate';

<PermissionGate permission="bookings:update:all">
  <EditButton />
</PermissionGate>;
```

### Using Hooks

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, permissions } = usePermissions();

  const canEdit = await hasPermission('bookings:update:all');

  return <div>...</div>;
}
```

## Permission Format

Permissions follow the format: `{resource}:{action}:{scope}`

- **Resource**: The entity type (e.g., `bookings`, `equipment`, `customers`)
- **Action**: The operation (e.g., `create`, `read`, `update`, `delete`, `manage`)
- **Scope**: The access level (e.g., `own`, `all`)

### Examples

- `bookings:create:all` - Create any booking
- `bookings:read:own` - Read own bookings only
- `admin_users:update:all` - Update any admin user
- `equipment:manage:all` - Full equipment management

## Default Roles

1. **super_admin** - All permissions
2. **admin** - Most permissions (except sensitive operations)
3. **equipment_manager** - Equipment and booking permissions
4. **finance_admin** - Payment and financial permissions
5. **support_admin** - Customer support permissions
6. **read_only_admin** - View-only access

## Database Setup

The permission system requires two migrations:

1. `20250123000001_enterprise_permission_system.sql` - Creates tables and functions
2. `20250123000002_seed_permissions_and_roles.sql` - Seeds default data

Apply these migrations using Supabase MCP or your migration tool.

## API Reference

### Permission Checker

```typescript
import { getUserPermissions, hasPermission } from '@/lib/permissions/checker';

// Check single permission
const canEdit = await hasPermission(userId, 'bookings:update:all');

// Get all user permissions
const { permissions, roles } = await getUserPermissions(userId);
```

### Middleware

```typescript
import { checkPermission, requirePermission } from '@/lib/permissions/middleware';

// Check permission (returns result object)
const result = await checkPermission(request, 'admin_users:create:all');

// Require permission (throws if not authorized)
const { user } = await requirePermission(request, 'bookings:update:all');
```

### Audit Logging

```typescript
import { logPermissionChange } from '@/lib/permissions/audit';

await logPermissionChange({
  action: 'role_assigned',
  targetType: 'user',
  targetId: userId,
  roleId: roleId,
  performedBy: adminId,
});
```

## Components

### PermissionGate

Conditionally render children based on permissions:

```tsx
<PermissionGate
  permission="bookings:update:all"
  fallback={<div>No access</div>}
  loading={<Spinner />}
>
  <EditButton />
</PermissionGate>
```

### usePermissions Hook

Get user permissions and check access:

```tsx
const { permissions, roles, hasPermission, loading } = usePermissions();
```

## Performance

- **Caching**: Permissions cached for 5 minutes
- **Database Functions**: Optimized SQL functions for permission checks
- **Indexes**: All foreign keys and query columns indexed
- **RLS Integration**: Permission checks integrated with Row-Level Security

## Security

- **Service Role Client**: Admin operations use service role (bypasses RLS)
- **Audit Trail**: All permission changes logged
- **Self-Protection**: Users cannot demote themselves
- **Validation**: UUID validation and input sanitization

## Migration Guide

To migrate existing code:

1. Replace `role === 'super_admin'` checks with permission checks
2. Use `PermissionGate` instead of conditional role checks in UI
3. Use `checkPermission` in API routes instead of manual role checks
4. Apply database migrations
5. Seed permissions and roles

## Troubleshooting

### Permissions not working

1. Check that migrations are applied
2. Verify user has roles assigned in `user_roles` table
3. Check permission cache (may need to rebuild)
4. Review audit log for permission changes

### Performance issues

1. Check cache TTL (default 5 minutes)
2. Verify database indexes exist
3. Review RLS policy performance
4. Consider increasing cache duration

## Next Steps

- [ ] Apply database migrations
- [ ] Update remaining API routes
- [ ] Add more UI components with permission gates
- [ ] Build admin UI for permission management
- [ ] Create audit log viewer
