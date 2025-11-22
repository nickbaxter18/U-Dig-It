# Supabase Database Patterns (Quick Reference)

## Database Operations

**IMPORTANT**: Always use Supabase MCP tools, never modify `/backend` directory (legacy).

### MCP Tools
- **Schema verification**: `mcp_supabase_list_tables({ schemas: ['public'] })`
- **Data queries**: `mcp_supabase_execute_sql({ query: 'SELECT ...' })`
- **Schema changes**: `mcp_supabase_apply_migration({ name: '...', query: '...' })`
- **Performance**: `mcp_supabase_get_advisors({ type: 'performance' })`
- **Security**: `mcp_supabase_get_advisors({ type: 'security' })`
- **Debugging**: `mcp_supabase_get_logs({ service: 'api' })`

## Migration Patterns

### Naming Convention
- Format: `YYYYMMDD_description.sql`
- Example: `20250121000002_rls_policies.sql`
- Location: `supabase/migrations/`

### Migration Structure
Reference actual migrations:
- Initial schema: @supabase/migrations/20250121000001_initial_schema.sql
- RLS policies: @supabase/migrations/20250121000002_rls_policies.sql
- Enhanced schema: @supabase/migrations/20250121000003_enhanced_schema.sql

### Database Design Standards

#### Naming Conventions (STRICT)
- Use `snake_case` for everything
- Table names: plural (e.g., `bookings`, `equipment`)
- Column names: snake_case (e.g., `customer_id`, `created_at`)

#### Primary Keys
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

#### Timestamps
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

#### Foreign Keys
```sql
customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

### Indexing (MANDATORY)

Always index:
1. Foreign keys - Every FK column must have an index
2. WHERE clause columns - Columns used in WHERE clauses
3. RLS policy columns - ALL columns referenced in RLS policies
4. Sort columns - Columns used in ORDER BY
5. Composite indexes - For common query patterns

Examples:
```sql
-- 1. Foreign key
CREATE INDEX CONCURRENTLY idx_bookings_customer_id ON bookings(customer_id);

-- 2. WHERE clause
CREATE INDEX CONCURRENTLY idx_bookings_status ON bookings(status);

-- 3. Composite for availability queries (from actual migration)
CREATE INDEX CONCURRENTLY idx_bookings_availability
ON bookings(equipment_id, start_date, end_date)
WHERE status NOT IN ('cancelled', 'rejected', 'completed');

-- 4. Partial index for active bookings
CREATE INDEX CONCURRENTLY idx_bookings_active_period
ON bookings(start_date, end_date)
WHERE status IN ('confirmed', 'active');

-- 5. GIN index for JSONB columns
CREATE INDEX CONCURRENTLY idx_equipment_specifications
ON equipment USING gin(specifications);

-- 6. BRIN index for time series data
CREATE INDEX CONCURRENTLY idx_bookings_created_at_brin
ON bookings USING brin(created_at);
```

**Reference actual migrations**:
- Critical FK indexes: @supabase/migrations/20250122000004_add_critical_fk_indexes.sql
- More FK indexes: @supabase/migrations/20250122000006_add_more_fk_indexes.sql
- Missing indexes (RLS & availability): @supabase/migrations/20251118_add_missing_indexes.sql
- Performance optimizations: @supabase/migrations/20250121000006_performance_optimizations.sql
  - Partial indexes (lines 145-149)
  - GIN indexes for JSONB (lines 157-163)
  - BRIN indexes for time series (lines 165-167)
  - Composite indexes (lines 151-155)

### RLS Policies

#### Golden Rules
1. ✅ **ENABLE RLS on EVERY user-facing table**
2. ✅ **Separate policies for each operation** (SELECT/INSERT/UPDATE/DELETE)
3. ✅ **Use `(SELECT auth.uid())` wrapper** for better plan caching (30% faster)
4. ✅ **Index ALL columns in policies**

#### Customer Ownership Pattern
```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select" ON bookings
FOR SELECT TO authenticated
USING (
  "customerId" = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);
```

**Reference actual migrations**:
- Customer ownership: @supabase/migrations/20250121000002_rls_policies.sql:26-58
- Enhanced version: @supabase/migrations/20250121000004_enhanced_rls_policies.sql:244-270
- Performance optimized: @supabase/migrations/20251118_fix_rls_auth_uid_wrapper.sql

### Updated_at Trigger

Add to all tables:
```sql
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON table_name
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Reference actual migrations**:
- Function creation: @supabase/migrations/20251113_fix_updated_at_function.sql
- Guard implementation: @supabase/migrations/20251113_update_updated_at_guard.sql

## Testing Migrations

**ALWAYS** test in a branch first:
1. `mcp_supabase_create_branch({ name: 'test-migration' })`
2. `mcp_supabase_apply_migration({ name: '...', query: '...' })`
3. Test thoroughly
4. `mcp_supabase_merge_branch({ branch_id: 'xxx' })`

## Common Mistakes

1. **Don't use camelCase** - PostgreSQL lowercases unquoted identifiers
2. **Always quote camelCase columns** - Use `"customerId"` not `customerId`
3. **Handle NULL values** - Use `COALESCE()` in triggers
4. **Index policy columns** - RLS policies need indexed columns
5. **Test in branch first** - Never apply directly to production

## Migration Files

Reference actual patterns from migrations:
- Initial schema setup: @supabase/migrations/20250121000001_initial_schema.sql
- RLS policy patterns: @supabase/migrations/20250121000002_rls_policies.sql
- Index creation: @supabase/migrations/20250122000004_add_critical_fk_indexes.sql
- Performance optimizations: @supabase/migrations/20250121000006_performance_optimizations.sql

