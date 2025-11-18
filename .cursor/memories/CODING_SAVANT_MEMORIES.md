 Memories - Coding Savant Patterns

**Purpose**: These memories should be saved in Cursor's memory system for automatic recall.

**How to Use**: Copy each memory below and save it in Cursor's memory system (Cmd/Ctrl + K → "Save memory")

---

## 🔥 Critical API Route Pattern

**Memory**: For all API routes in this codebase, ALWAYS follow this exact 8-step pattern: 1) Rate limit FIRST with `rateLimit(request, RateLimitPresets.STRICT)`, 2) Validate request size/content-type, 3) Authenticate with `supabase.auth.getUser()`, 4) Sanitize input with `sanitizeBookingFormData()`, 5) Validate with Zod schema, 6) Process business logic, 7) Log with structured logger, 8) Return JSON response. This pattern was established after fixing payment webhooks failing silently, booking creation failures, and rate limit bypasses.

---

## 🔥 Supabase Query Pattern

**Memory**: For all Supabase queries in this codebase, ALWAYS use specific columns (never SELECT *), add pagination with `.range()` and `.limit()`, use indexed filters (check which columns have indexes), and handle errors with logging. This pattern reduces payload size by 60% and improves query time from 200ms to 15ms. Always check for empty results before proceeding.

---

## 🔥 RLS Policy Pattern

**Memory**: For all RLS policies in this codebase, ALWAYS wrap `auth.uid()` in `(SELECT auth.uid())` for better plan caching (30% faster), create separate policies for each operation (SELECT/INSERT/UPDATE/DELETE), and ALWAYS index all columns referenced in policies. This pattern was established after fixing RLS performance issues that caused slow queries.

---

## 🔥 Webhook Service Role Client

**Memory**: For all webhook endpoints in this codebase, ALWAYS use service role client (`createAdminClient` with `SUPABASE_SERVICE_ROLE_KEY`), not regular `createClient()`. Webhooks are server-to-server calls with NO user session, so RLS blocks updates with regular client. This was the root cause of payment webhooks failing silently - they returned 200 OK but didn't update the database.

---

## 🔥 Frontend Startup Script

**Memory**: ALWAYS use `bash start-frontend-clean.sh` to start the frontend. NEVER use `pnpm dev` directly. The script ensures port cleanup (kills processes on 3000/3001), process cleanup (terminates existing Next.js), cache cleanup (removes `.next` directory), and guaranteed clean start. This prevents port conflicts, stale cache causing hydration mismatches, and zombie processes causing memory leaks.

---

## 🔥 SQL camelCase Column Names

**Memory**: PostgreSQL column names are case-sensitive. ALWAYS quote camelCase columns in SQL: use `"customerId"` not `customerId`. Unquoted identifiers are lowercased by PostgreSQL, causing "column equipmentid does not exist" errors. This was the root cause of database trigger failures.

---

## 🔥 NULL Handling in Triggers

**Memory**: ALWAYS use `COALESCE()` to handle NULL values in database triggers. Never assume fields are non-NULL. Example: `COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`. The search index trigger failed when user data was NULL, causing booking creation to fail without errors.

---

## 🔥 React setTimeout Cleanup

**Memory**: Be careful with `setTimeout` cleanup in React `useEffect`. Don't clear timers prematurely - if you return a cleanup function that clears the timer, it may execute before the timer fires. The payment success overlay stuck on "Updating..." because cleanup cleared the redirect timer before the 3-second delay completed.

---

## 🔥 Supabase MCP Tools Only

**Memory**: The `/backend` directory is LEGACY and INACTIVE. All database operations MUST use Supabase MCP tools (`mcp_supabase_execute_sql`, `mcp_supabase_apply_migration`). Never modify the `/backend` directory. This codebase migrated from NestJS to Supabase-first architecture, and the NestJS backend causes confusion and duplicate code.

---

## 🔥 Booking Availability Check

**Memory**: When checking equipment availability, MUST consider `actual_start_date` and `actual_end_date` for active rentals, not just `start_date` and `end_date`. Active rentals use actual dates, confirmed bookings use scheduled dates. Equipment showed as available when actually rented because we only checked scheduled dates.

---

## 🔥 Pricing Calculation Order

**Memory**: Pricing MUST be calculated in this exact order: 1) Base rental cost, 2) Long-term discounts (weekly 10%, monthly 20%), 3) Add-ons (insurance 8%, operator $150/day, delivery), 4) Subtotal, 5) Coupon discount (reduces subtotal), 6) Taxes (HST 15% on subtotal), 7) Total, 8) Security deposit (30% of total). Wrong order caused incorrect totals and tax calculations.

---

## 🔥 Seasonal Pricing Application

**Memory**: Seasonal multipliers apply to BASE RATES, not final totals. Peak season (May-September) uses 1.15-1.25 multiplier, off-season uses 0.85-0.95 multiplier. Applied multiplier to total instead of base rate, causing incorrect pricing. Pattern: `adjustedDailyRate = dailyRate * multiplier`.

---

## 🔥 Stripe Payment Intent

**Memory**: When creating Stripe payment intents, ALWAYS convert amounts to cents with `Math.round(amount * 100)` and include booking metadata (`booking_id`, `customer_id`). Forgot to convert to cents caused payment failures. Always use `currency: 'cad'` for Canadian dollars.

---

## 🔥 Webhook Idempotency

**Memory**: For all webhook endpoints, ALWAYS verify webhook signatures and check for duplicate processing using idempotency keys. Store webhook event IDs in `webhook_events` table and return early if already processed. Duplicate webhooks caused double-charging and booking status issues.

---

## 🔥 Silent Failure Debugging

**Memory**: When operations fail silently, check: 1) RLS policies (may block operations), 2) Error handling (may swallow errors), 3) Service role client (webhooks need it), 4) NULL values (may cause trigger failures). Booking creation failed silently because errors were caught but not logged - add comprehensive logging with structured logger.

---

## 🔥 Database Trigger Debugging

**Memory**: When database triggers fail, check: 1) Column name casing (quote camelCase), 2) NULL handling (use COALESCE), 3) Function permissions (may need GRANT), 4) Trigger order (may conflict). Triggers failed silently, causing booking creation to fail without errors. Test triggers manually with `SELECT trigger_function_name(arg1, arg2)`.

---

## 🔥 Server Actions vs API Routes

**Memory**: Use Server Actions for form submissions (direct database access, no HTTP overhead), API Routes for external integrations (webhooks, external APIs). Server Actions reduce HTTP overhead and simplify form handling. Pattern: `'use server'` for Server Actions, `export async function POST()` for API Routes.

---

## 🔥 TanStack Query Pattern

**Memory**: Use TanStack Query for all server state management. Provides caching, refetching, and optimistic updates. Pattern: `useQuery({ queryKey: ['resource', id], queryFn: () => fetchResource(id), staleTime: 30000 })`. Manual state management caused stale data and unnecessary refetches.

---

## 🔥 Test Account Credentials

**Memory**: For E2E tests, ALWAYS use test account `aitest2@udigit.ca` / `TestAI2024!@#$`. Never use production accounts - causes test data pollution and account lockouts. Standard login flow: navigate to signin, fill form, click sign in, wait for "Welcome back".

---

## 🔥 Environment Variable Validation

**Memory**: ALWAYS use `@t3-oss/env-nextjs` for environment variable validation. Validates at build time, prevents runtime errors from missing env vars. Pattern: `createEnv({ server: {...}, client: {...}, runtimeEnv: {...} })`. Missing env vars caused runtime errors that were hard to debug.

---

## 🔥 Migration Testing Pattern

**Memory**: ALWAYS test migrations in a Supabase branch before applying to production. Pattern: `mcp_supabase_create_branch()` → `mcp_supabase_apply_migration()` → test thoroughly → `mcp_supabase_merge_branch()`. Direct production migrations caused downtime and rollback issues.

---

## 🔥 Build Checklist

**Memory**: ALWAYS run this build checklist before deployment: `pnpm install` → `pnpm type-check` → `pnpm lint` → `pnpm build` → `pnpm test`. Deploying without building caused runtime errors in production. TypeScript errors must be fixed before deployment.

---

## 🔥 Graceful Degradation

**Memory**: Always provide fallbacks when external services fail. Example: If Google Maps API fails, use city-based delivery fee pricing instead of failing completely. Pattern: try external service, catch error, log warning, use fallback. Google Maps API failures caused booking creation to fail completely.

---

## 🔥 Retry Pattern

**Memory**: Implement exponential backoff for transient failures. Pattern: retry up to 3 times with delay `delay * Math.pow(2, attempt)`. Network hiccups caused payment processing to fail unnecessarily. Use for external API calls, database connections, and network requests.

---

## 🎯 Performance Wins Summary

**Memory**: These patterns provide measurable performance improvements: 1) Specific columns in queries (60% payload reduction), 2) Pagination (prevents memory issues), 3) Indexed filters (200ms → 15ms query time), 4) Memoized calculations (prevents re-renders), 5) Memoized callbacks (prevents re-renders). Always apply these optimizations.

---

## 🎯 Common Mistakes Summary

**Memory**: Always avoid these mistakes: 1) Unquoted camelCase in SQL, 2) Missing NULL handling in triggers, 3) Clearing setTimeout prematurely, 4) Using regular client for webhooks, 5) SELECT * without pagination, 6) Missing RLS policy indexes. These cause silent failures and performance issues.
