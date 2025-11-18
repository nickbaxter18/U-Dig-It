# 🚀 Coding Savant Quick Reference Cheat Sheet

**Purpose**: One-page quick reference for the most critical patterns and rules.

**Last Updated**: 2025-01-21

---

## 🔥 Critical Patterns (Copy-Paste Ready)

### API Route Template
```typescript
export async function POST(request: NextRequest) {
  // 1. Rate limit
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
  if (!rateLimitResult.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // 2. Validate request
  const validation = await validateRequest(request, { maxSize: 10 * 1024 });
  if (!validation.valid) return validation.error!;

  // 3. Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 4. Sanitize & validate
  const body = await request.json();
  const sanitized = sanitizeBookingFormData(body);
  const validated = schema.parse(sanitized);

  // 5. Process
  const result = await performOperation(validated);

  // 6. Log & return
  logger.info('Operation completed', { component: 'route-name', metadata });
  return NextResponse.json({ success: true, data: result }, { status: 201 });
}
```

### Supabase Query Template
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('col1, col2, col3') // Specific columns
  .eq('indexed_column', value) // Indexed filter
  .order('created_at', { ascending: false })
  .range(0, 19)
  .limit(20);

if (error) {
  logger.error('Query failed', { component: 'query-name', error }, error);
  throw new Error('Failed to fetch data');
}

if (!data || data.length === 0) return [];
```

### Webhook Template
```typescript
// Use service role client!
const { createClient: createAdminClient } = await import('@supabase/supabase-js');
const supabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify signature
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  await request.text(),
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!
);

// Check idempotency
const { data: existing } = await supabase
  .from('webhook_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) return NextResponse.json({ received: true });
```

### RLS Policy Template
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "table_select" ON table_name
FOR SELECT TO authenticated
USING (
  "customerId" = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Index policy columns
CREATE INDEX CONCURRENTLY idx_table_customer_id ON table_name("customerId");
```

---

## ⚠️ Common Mistakes (Always Avoid)

| Mistake | Fix |
|---------|-----|
| Unquoted camelCase in SQL | Use `"customerId"` not `customerId` |
| Missing NULL handling | Use `COALESCE(field, '')` |
| Clearing setTimeout prematurely | Don't clear timer in useEffect cleanup |
| Regular client for webhooks | Use service role client |
| SELECT * without pagination | Use specific columns + `.range()` |
| Missing RLS policy indexes | Index all columns in policies |

---

## ✅ Performance Wins (Always Apply)

1. **Specific columns** → 60% payload reduction
2. **Pagination** → Prevents memory issues
3. **Indexed filters** → 200ms → 15ms query time
4. **Memoized calculations** → Prevents re-renders
5. **Memoized callbacks** → Prevents re-renders

---

## 🎯 Quick Commands

```bash
# Start frontend (MANDATORY)
bash start-frontend-clean.sh

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test

# Build
pnpm build

# Supabase operations
pnpm supabase:start
pnpm supabase:status
pnpm supabase:reset
```

---

## 🔍 Debugging Checklist

When something fails silently, check:
1. ✅ RLS policies (may block operations)
2. ✅ Error handling (may swallow errors)
3. ✅ Service role client (webhooks need it)
4. ✅ NULL values (may cause trigger failures)
5. ✅ Column name casing (quote camelCase)

---

## 📊 Business Logic Quick Reference

### Pricing Order
1. Base rental cost
2. Long-term discounts (weekly 10%, monthly 20%)
3. Add-ons (insurance 8%, operator $150/day, delivery)
4. Subtotal
5. Coupon discount
6. Taxes (HST 15%)
7. Total
8. Security deposit (30%)

### Availability Check
- Active rentals: Check `actual_start_date` / `actual_end_date`
- Confirmed bookings: Check `start_date` / `end_date`

### Seasonal Pricing
- Peak (May-September): 1.15-1.25 multiplier
- Off-season: 0.85-0.95 multiplier
- Apply to base rates, not totals

---

## 🧪 Testing Quick Reference

### Test Account
- Email: `aitest2@udigit.ca`
- Password: `TestAI2024!@#$`

### Test Pattern
```typescript
// Unit test
describe('functionName', () => {
  it('should do something', () => {
    expect(functionName(input)).toBe(expected);
  });
});

// E2E test
test('should complete flow', async ({ page }) => {
  await page.goto('/path');
  await page.click('button');
  await expect(page.locator('text')).toBeVisible();
});
```

---

## 🚀 Deployment Checklist

- [ ] Run `pnpm build` successfully
- [ ] All tests passing (`pnpm test`)
- [ ] Type check passing (`pnpm type-check`)
- [ ] Lint passing (`pnpm lint`)
- [ ] Environment variables validated
- [ ] Migrations tested in branch
- [ ] Webhook endpoints configured
- [ ] Service role key secured

---

**Remember**:
- 🔥 **Copy-paste templates above**
- ⚠️ **Avoid common mistakes**
- ✅ **Apply performance wins**
- 🎯 **Follow business logic order**
- 🧪 **Use test account**
- 🚀 **Check deployment checklist**
