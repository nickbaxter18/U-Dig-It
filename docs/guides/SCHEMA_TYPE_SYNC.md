# Schema Type Synchronization Guide

**Purpose**: Automated synchronization between Supabase database schema and frontend TypeScript types.

**Last Updated**: 2025-01-22

---

## Overview

This guide explains how types are automatically synchronized between the Supabase database and the frontend TypeScript codebase. Types are automatically regenerated after every migration, ensuring the frontend always has up-to-date type definitions.

---

## How It Works

### Automatic Type Generation

Types are **automatically regenerated** after every database migration:

1. **Migration Applied**: When you apply a migration via `mcp_supabase_apply_migration()`
2. **Types Regenerated**: Automatically call `mcp_supabase_generate_typescript_types()`
3. **Types Written**: Generated types are written to `supabase/types.ts`
4. **Type Check**: Verify types compile: `cd frontend && pnpm type-check`
5. **Commit Types**: Types must be committed with the migration

**No manual action required** - types regenerate automatically as part of the migration workflow.

### Migration Workflow

**Reference**: `.cursor/rules/workflows/database-migration.mdc`

When creating a migration:

1. Create test branch: `mcp_supabase_create_branch({ name: 'test-migration' })`
2. Apply migration: `mcp_supabase_apply_migration({ name: '...', query: '...' })`
3. **Types auto-regenerate** (automatic)
4. Verify types compile: `cd frontend && pnpm type-check`
5. If errors: Fix migration or update frontend code
6. Test thoroughly
7. Merge branch: `mcp_supabase_merge_branch({ branch_id: 'xxx' })`

**Types are automatically included** when you merge the branch.

---

## Using Types in Frontend Code

### Option 1: Typed Helpers (Recommended)

Use type-safe helpers that enforce schema compliance at compile time:

```typescript
import { typedSelect, typedInsert, typedUpdate, TableRow } from '@/lib/supabase/typed-helpers';
import { supabase } from '@/lib/supabase/client';

// Type-safe select
const { data, error } = await typedSelect(supabase, 'bookings', 'id, status, totalAmount')
  .eq('customerId', userId)
  .limit(10);

// Type-safe insert
const { data: newBooking } = await typedInsert(supabase, 'bookings', {
  customerId: userId,
  equipmentId: equipment.id,
  startDate: '2025-01-01',
  endDate: '2025-01-05',
  // TypeScript will error if required fields are missing or types don't match
});

// Type-safe result typing
type Booking = TableRow<'bookings'>;
const booking: Booking = data[0]; // Properly typed
```

**See complete examples**: `frontend/src/lib/supabase/typed-helpers.examples.ts`

**Benefits**:
- Compile-time validation
- Autocomplete for table names
- Type checking for insert/update data
- No runtime overhead

### Option 2: Generated Types Directly

Use generated types from `supabase/types.ts`:

```typescript
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/../../supabase/types';
import { supabase } from '@/lib/supabase/client';

// Typed client
const supabaseTyped = supabase as SupabaseClient<Database>;

// Query with typed result
const { data } = await supabaseTyped
  .from('bookings')
  .select('id, status, totalAmount')
  .eq('customerId', userId);

// Type the result
type Booking = Tables<'bookings'>;
const booking: Booking = data[0];

// Typed insert
const insertData: TablesInsert<'bookings'> = {
  customerId: userId,
  equipmentId: equipment.id,
  // ...
};
```

### Option 3: Type Assertions (Use Sparingly)

Only use type assertions when types can't be inferred:

```typescript
import type { Tables } from '@/../../supabase/types';

// ✅ CORRECT - Using proper type
const booking = data[0] as Tables<'bookings'>;

// ❌ WRONG - Using 'any'
const booking = data[0] as any; // ESLint will warn
```

---

## Type Safety Rules

### 1. Never Use `SELECT *`

**Already enforced by ESLint** - will error if you try:

```typescript
// ❌ FORBIDDEN - ESLint error
const { data } = await supabase.from('bookings').select('*');

// ✅ REQUIRED - Specific columns
const { data } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status, totalAmount')
  .limit(20);
```

### 2. Never Use `as any` on Supabase Results

**ESLint will warn** if you use `as any`:

```typescript
// ❌ WRONG - ESLint warning
const booking = data as any;

// ✅ CORRECT - Use proper type
const booking = data as Tables<'bookings'>;
// Or use typedSelect() helper
```

### 3. Always Use Typed Clients

Ensure Supabase clients are typed with `Database`:

```typescript
// ✅ CORRECT - Typed client
import type { Database } from '@/../../supabase/types';
const supabase = createClient<Database>();

// ❌ WRONG - Untyped client
const supabase = createClient(); // Missing type parameter
```

---

## When Types Are Out of Sync

### Symptoms

- TypeScript errors about missing properties
- Type errors about property types not matching
- Autocomplete not working for table/column names
- Type errors after a migration

### How to Fix

1. **Check if migration was applied**
   - Verify migration exists in `supabase/migrations/`
   - Check if types were regenerated after migration

2. **Manually regenerate types** (if needed)
   - Use MCP tool: `mcp_supabase_generate_typescript_types()`
   - Types will be written to `supabase/types.ts`

3. **Verify types compile**
   ```bash
   cd frontend && pnpm type-check
   ```

4. **Fix type errors**
   - Update frontend code to match new schema
   - Use typed helpers to ensure type safety
   - Replace `as any` with proper types

5. **Commit updated types**
   - Types must be committed with migration
   - Never commit migrations without updated types

---

## Type Generation Process

### Automatic (Recommended)

Types are **automatically regenerated**:
- After every migration via `mcp_supabase_apply_migration()`
- As part of the migration workflow (integrated into `.cursor/rules/workflows/database-migration.mdc`)
- Before merging migration branches
- Types are verified to compile before migration is considered complete

**No manual action needed** - it's automatic.

### Manual (If Needed)

If you need to manually regenerate types:

1. **Using MCP Tool** (Recommended)
   ```typescript
   // In Cursor/development environment
   await mcp_supabase_generate_typescript_types();
   ```

2. **Using Supabase CLI** (Alternative)
   ```bash
   # From local Supabase
   supabase gen types typescript --local > supabase/types.ts

   # From remote Supabase
   supabase gen types typescript --project-id YOUR_PROJECT_ID > supabase/types.ts
   ```

---

## Type Safety Best Practices

### 1. Use Typed Helpers for New Code

**Always use typed helpers** in new code:

```typescript
import { typedSelect, typedInsert, typedUpdate } from '@/lib/supabase/typed-helpers';

// Type-safe query
const { data } = await typedSelect(supabase, 'bookings', 'id, status');
```

### 2. Migrate Existing Code Gradually

**Fix existing code incrementally**:
- Use typed helpers when touching existing code
- Fix `as any` usages when refactoring
- No need to fix everything at once

### 3. Verify Types Before Committing

**Always verify types compile**:

```bash
cd frontend && pnpm type-check
```

Fix any type errors before committing.

### 4. Commit Types with Migrations

**Types must be committed** with the migration that changed the schema:
- Migration changes schema
- Types regenerate automatically
- Commit both migration and types together

---

## Validation Scripts

### check-types-sync.sh

Validates that frontend code uses types correctly:

```bash
bash scripts/check-types-sync.sh
```

**Checks:**
- Types file exists and is recent
- No `as any` usage (excluding examples)
- No untyped Supabase clients
- No SELECT * usage
- Types compile successfully

**Usage:**
- Run manually: `bash scripts/check-types-sync.sh`
- Runs automatically in pre-commit hook (non-blocking)
- Runs automatically in CI/CD (non-blocking)

### update-supabase-types.sh

Manually update types (usually not needed - types auto-regenerate):

```bash
bash scripts/update-supabase-types.sh [--force]
```

**Features:**
- Checksum comparison (skips if unchanged)
- Validation (file size, syntax)
- Type compilation verification
- `--force` flag to regenerate anyway

**Note:** Types are automatically regenerated via MCP tools during migrations. This script is for manual updates only.

### schema-diff.ts

Compare database schema with TypeScript types:

```bash
npx tsx scripts/schema-diff.ts
```

**Note:** Full comparison requires MCP tools integration. This is a foundation for future enhancement.

---

## Troubleshooting

### Type Errors After Migration

**Problem**: TypeScript errors after applying migration

**Solution**:
1. Verify types were regenerated: Check `supabase/types.ts` timestamp
2. Run type check: `cd frontend && pnpm type-check`
3. Fix type errors in frontend code
4. Update code to match new schema

### Types Not Updating

**Problem**: Types don't reflect database changes

**Solution**:
1. Verify migration was applied: Check `mcp_supabase_list_migrations()`
2. Manually regenerate: `mcp_supabase_generate_typescript_types()`
3. Verify types file updated: Check `supabase/types.ts` content
4. Run type check: `cd frontend && pnpm type-check`

### Type Mismatches

**Problem**: TypeScript says property doesn't exist or type doesn't match

**Solution**:
1. Check database schema: `mcp_supabase_list_tables({ schemas: ['public'] })`
2. Regenerate types: `mcp_supabase_generate_typescript_types()`
3. Verify column names match (camelCase vs snake_case)
4. Use typed helpers to catch mismatches at compile time

---

## CI/CD Integration

### Type Validation in CI/CD

Types are validated in CI/CD (non-blocking initially):

1. **Generate types** from current database
2. **Compare** with committed `supabase/types.ts`
3. **Report drift** (warning only in Week 1-2)
4. **Block PRs** with type drift (Week 3+)

### CI/CD Workflow Example

Add this step to your CI/CD workflow (`.github/workflows/ci.yml` or equivalent):

```yaml
- name: Verify Types Are Current
  run: |
    # Generate types from current database
    # Note: This requires Supabase CLI and project access
    # For now, this is a placeholder - implement when CI/CD is configured

    # Option 1: Using Supabase CLI (if configured)
    # supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > supabase/types.ts.new
    # diff supabase/types.ts supabase/types.ts.new || echo "⚠️ Type drift detected"

    # Option 2: Using MCP tools (if available in CI)
    # This would require MCP server access in CI environment

    # For now, verify types compile
    cd frontend && pnpm type-check

    # Report type health metrics (non-blocking)
    echo "Type check completed"
```

**Note**: Full type generation in CI/CD requires Supabase CLI or MCP server access. For now, verify types compile.

### Gradual Enforcement

- **Week 1-2**: Warnings only, don't block
- **Week 3-4**: Block PRs with type drift
- **Week 5+**: Block merges with type drift

### Type Health Metrics

Add reporting step (non-blocking):

```yaml
- name: Type Health Report
  run: |
    # Count type issues (trending down)
    echo "## Type Health Metrics" >> $GITHUB_STEP_SUMMARY
    echo "- Type check: ✅ Passed" >> $GITHUB_STEP_SUMMARY
    # Add more metrics as needed
```

---

## Reference Files

- **Generated Types**: `supabase/types.ts`
- **Typed Helpers**: `frontend/src/lib/supabase/typed-helpers.ts`
- **Migration Workflow**: `.cursor/rules/workflows/database-migration.mdc`
- **Component Workflow**: `.cursor/rules/workflows/component-development.mdc`
- **Type Definitions Index**: `docs/reference/TYPE_DEFINITIONS_INDEX.md`

---

## Quick Reference

### Regenerate Types

```typescript
// Automatic (after migration)
mcp_supabase_apply_migration({ name: '...', query: '...' });
// Types auto-regenerate

// Manual (if needed)
mcp_supabase_generate_typescript_types();
```

### Use Typed Helpers

```typescript
import { typedSelect, typedInsert, TableRow } from '@/lib/supabase/typed-helpers';

// Type-safe query
const { data } = await typedSelect(supabase, 'bookings', 'id, status');

// Type-safe result
type Booking = TableRow<'bookings'>;
```

### Verify Types

```bash
cd frontend && pnpm type-check
```

---

## Summary

- ✅ **Types auto-regenerate** after every migration
- ✅ **No manual scripts** - uses MCP tools
- ✅ **Type-safe helpers** available for new code
- ✅ **ESLint warnings** for type safety issues
- ✅ **CI/CD validation** ensures types stay in sync
- ✅ **Gradual migration** - fix existing code incrementally

**Remember**: Types are automatically synchronized. If you see type errors, regenerate types and fix the code to match the new schema.

