# Comprehensive Component/Page Analysis Prompt - V3 (Maximum Power)

## 🎯 Purpose
Use this prompt when linking me to any component or page to get the most comprehensive, bug-free implementation plan with full integration of all available tools, patterns, and workflows from the cursor rules system.

---

## 📋 Copy This Prompt

```
I need you to perform a COMPREHENSIVE ANALYSIS and create a DETAILED IMPLEMENTATION PLAN for this component/page to achieve a fully functional, bug-free product.

**IMPORTANT**: Follow the systematic workflow from @docs/reference/AI_WORKFLOW_CHECKLISTS.md and leverage ALL available tools and patterns from the cursor rules system.

## Analysis Requirements

### 1. Deep Codebase Analysis

**Codebase Search** (MANDATORY FIRST STEP):
- Use `codebase_search` to find similar components/pages and patterns
  - Search for related functionality, not just exact matches
  - Use semantic queries: "How is [similar feature] implemented?"
  - Search in target directories if scope is known
- Review @docs/reference/COMPONENT_INDEX.md for existing components
- Review @docs/reference/API_ROUTES_INDEX.md for related endpoints
- Check @docs/reference/AI_CODING_REFERENCE.md for established patterns
- Review @docs/reference/CODING_SAVANT_CHEAT_SHEET.md for codebase-specific patterns
- Identify all dependencies and related files
- Find actual implementation examples using @filename:line references

**Pattern Discovery**:
- Identify reusable components from COMPONENT_INDEX.md
- Find similar API routes from API_ROUTES_INDEX.md
- Locate utility functions in @frontend/src/lib/
- Check for existing hooks in @frontend/src/hooks/
- Review similar database queries and patterns
- Check for self-healing patterns that might apply (from coding savant patterns)

**External Documentation** (Use MCP Tools):
- **Supabase**: Use `mcp_supabase_search_docs({ graphql_query: "query { searchDocs(query: \"[topic]\") { ... } }" })` for database/auth/storage questions
- **Stripe**: Use `mcp_Stripe_search_stripe_documentation({ question: "[question]", language: "node" })` for payment questions
- **Next.js/Libraries**: Use `mcp_Context7_resolve_library_id({ libraryName: "[library]" })` then `mcp_Context7_get_library_docs({ context7CompatibleLibraryID: "[id]", topic: "[topic]" })` for library docs
- Reference: @docs/guides/AI_WORKFLOW_GUIDE.md:53-81 for external docs usage

### 2. Database Schema Analysis (Using Supabase MCP)

**Schema Verification** (MANDATORY):
- Use `mcp_supabase_list_tables({ schemas: ['public'] })` to verify current schema
- Check existing tables and relationships
- Verify column types and constraints
- Check for existing indexes using `mcp_supabase_execute_sql({ query: "SELECT * FROM pg_indexes WHERE schemaname = 'public' AND tablename = '[table]'" })`
- Review RLS policies with `mcp_supabase_execute_sql({ query: "SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = '[table]'" })`
- Check for existing migrations in @supabase/migrations/ for similar patterns

**Schema Requirements**:
- Map all required tables (new or existing)
- Identify foreign key relationships
- Determine required indexes (FKs, RLS columns, WHERE clauses, sort columns)
- Plan RLS policies (use (SELECT auth.uid()) wrapper pattern for 30% faster plan caching)
- Check for updated_at triggers
- Verify naming conventions (snake_case)
- Reference actual migration patterns: @supabase/migrations/

**Migration Planning** (Follow Workflow Rule):
- Reference workflow: @.cursor/rules/workflows/database-migration.mdc
- Plan migration using `mcp_supabase_apply_migration`
- **MANDATORY**: Test in branch first: `mcp_supabase_create_branch({ name: 'test-migration' })` → test → `mcp_supabase_merge_branch({ branch_id: 'xxx' })`
- Include CONCURRENTLY for indexes
- Use IF NOT EXISTS/IF EXISTS for safety
- Plan rollback strategy

**Type Generation** (After Schema Changes):
- Regenerate types: `mcp_supabase_generate_typescript_types()` after migration
- Verify types in @supabase/types.ts
- Update TypeScript interfaces if needed

### 3. Architecture & Design Review

**Current State Analysis**:
- Analyze current implementation (if exists)
- Review file structure and organization
- Check for TypeScript types in @supabase/types.ts
- Verify component hierarchy and data flow

**API Endpoint Requirements**:
- Identify all required API endpoints
- Determine HTTP methods (GET, POST, PUT, DELETE)
- Map request/response schemas
- Plan rate limiting strategy (STRICT/MODERATE/LENIENT)
- Identify authentication requirements (public/authenticated/admin)
- Reference workflow: @.cursor/rules/workflows/api-route-development.mdc

**Integration Requirements**:
- Stripe integration (payments, webhooks) - use `mcp_Stripe_search_stripe_documentation` for patterns
- SendGrid integration (emails, notifications) - use `mcp_supabase_search_docs` for email patterns
- Google Maps API (if location-based)
- IDKit verification (if applicable)
- Other third-party services

**Database Requirements**:
- Query patterns (specific columns, pagination)
- Join requirements
- Aggregation needs
- Real-time subscriptions (if applicable)

### 4. Security Analysis

**Input Validation**:
- Identify all user inputs
- Plan Zod schemas for validation
- Use `sanitizeBookingFormData` pattern from @frontend/src/lib/input-sanitizer.ts
- Check for malicious input detection
- Plan XSS prevention (React auto-escapes, DOMPurify for HTML)

**Authentication & Authorization**:
- Verify auth patterns from @frontend/src/lib/supabase/server.ts
- Plan RLS policies (customer ownership, admin-only, public read)
- Check for admin role verification
- Plan webhook authentication (signature verification)
- Use service role client for webhooks: @frontend/src/lib/supabase/service.ts

**Secrets Management**:
- Verify secrets loader usage (getSendGridApiKey, getStripeSecretKey)
- NEVER access process.env directly for secrets
- Check @frontend/src/lib/secrets/ for secret loaders
- Plan for Supabase Edge Function secrets if needed

**Rate Limiting**:
- Apply rate limiting to all API routes
- Use RateLimitPresets (STRICT/MODERATE/LENIENT)
- Reference @frontend/src/lib/rate-limiter.ts

**Security Advisors** (Post-Implementation):
- Run `mcp_supabase_get_advisors({ type: 'security' })` after schema changes
- Fix any RLS policy issues
- Address missing indexes on RLS columns
- Verify no exposed sensitive data

### 5. Performance Analysis

**Query Optimization**:
- Use specific columns (never SELECT *)
- Add pagination with .range() and .limit()
- Index all foreign keys
- Index all RLS policy columns
- Index WHERE clause columns
- Index sort columns (ORDER BY)
- Use partial indexes for filtered queries
- Use GIN indexes for JSONB/arrays
- Use BRIN indexes for time series data
- Reference: @supabase/migrations/20250121000006_performance_optimizations.sql

**Frontend Optimization**:
- Check for lazy loading opportunities
- Use dynamic imports for heavy components
- Memoize expensive calculations (useMemo)
- Memoize callbacks (useCallback)
- Optimize images (OptimizedImage component)
- Check bundle size impact

**Performance Advisors** (Post-Implementation):
- Run `mcp_supabase_get_advisors({ type: 'performance' })` after schema changes
- Fix slow queries
- Add missing indexes
- Optimize RLS policies

**Performance Benchmarking**:
- Plan query performance targets (<20ms for simple queries)
- Set bundle size budgets
- Plan for pagination limits (20-50 items per page)

### 6. Accessibility Analysis

**WCAG AA Compliance**:
- Verify semantic HTML usage
- Check keyboard navigation (all interactive elements focusable)
- Review ARIA labels and roles
- Verify focus management (visible focus indicators)
- Check color contrast ratios
- Review screen reader compatibility
- Test with keyboard-only navigation

**Form Accessibility**:
- Proper label associations
- Error message announcements
- Required field indicators
- Help text associations

### 7. Error Handling & Edge Cases

**Error Scenarios**:
- Network failures (retry with exponential backoff)
- Authentication failures (401/403 handling)
- Validation errors (user-friendly messages)
- Database errors (graceful degradation)
- External API failures (fallback strategies)
- Timeout handling
- Race conditions
- Concurrent operations

**Null/Undefined Handling**:
- Check for NULL in database triggers (use COALESCE)
- Handle undefined in TypeScript (optional chaining, nullish coalescing)
- Verify database constraints (NOT NULL where appropriate)

**Error Recovery**:
- Retry strategies for transient failures
- Fallback UI states
- Error boundaries for React components
- Graceful degradation patterns

**Self-Healing Patterns** (Check Known Patterns):
- Reference coding savant patterns for known self-healing fixes
- Check for RLS policy blocks, port conflicts, SQL casing issues, etc.
- Apply auto-fixes for known patterns

### 8. Testing Requirements

**Unit Tests**:
- Business logic functions
- Utility functions
- Validation functions
- Calculation functions

**Integration Tests**:
- API route handlers
- Database queries
- External service integrations (mocked)
- Authentication flows

**E2E Tests** (Browser Automation):
- Complete user flows
- Form submissions
- Navigation patterns
- Error scenarios
- Use test account: aitest2@udigit.ca / TestAI2024!@#$ (NEVER production accounts)

**Test Data Requirements**:
- Test fixtures
- Mock data generators
- Database seed data (if needed)

### 9. Business Logic Validation

**Domain Rules** (if applicable):
- Booking availability checks (use actual_start_date/actual_end_date for active rentals)
- Pricing calculation order (base → discounts → add-ons → taxes → deposit)
- Seasonal pricing application (multiplier on base rates, not totals)
- Discount code validation
- Payment processing flows
- Contract generation logic
- Refund calculation rules

**Reference Business Logic**:
- @docs/reference/BUSINESS_LOGIC_PATTERNS.md
- @.cursor/rules/business-workflows.mdc
- @.cursor/rules/business-pricing.mdc

### 10. Webhook Pattern Verification (if applicable)

**Webhook Requirements**:
- Signature verification (Stripe, SendGrid, IDKit)
- Idempotency handling (check webhook_events table)
- Service role client usage (bypasses RLS)
- Error handling and retries
- Event logging

**Reference Webhook Patterns**:
- Stripe webhook: @frontend/src/app/api/webhooks/stripe/route.ts
- SendGrid webhook: @frontend/src/app/api/webhooks/sendgrid/route.ts
- IDKit webhook: @frontend/src/app/api/webhooks/idkit/route.ts
- Service client pattern: @frontend/src/lib/supabase/service.ts

## Implementation Plan Requirements

Create a DETAILED plan that includes:

### Phase 1: Pre-Implementation

**Follow Pre-Implementation Checklist**: @docs/reference/AI_WORKFLOW_CHECKLISTS.md:8-36

**Codebase Discovery**:
- [ ] Codebase search results with similar patterns found (use `codebase_search`)
- [ ] List of reusable components from COMPONENT_INDEX.md
- [ ] List of similar API routes from API_ROUTES_INDEX.md
- [ ] Utility functions identified in @frontend/src/lib/
- [ ] Hooks identified in @frontend/src/hooks/
- [ ] External documentation consulted (use MCP tools for Supabase/Stripe/Next.js)

**Database Analysis** (Using Supabase MCP):
- [ ] Current schema verified with `mcp_supabase_list_tables`
- [ ] Existing indexes checked with SQL query
- [ ] RLS policies reviewed
- [ ] Migration plan created (test in branch first - MANDATORY)
- [ ] Index requirements identified (FKs, RLS columns, WHERE, ORDER BY)
- [ ] Type generation planned (after migration)

**File Inventory**:
- [ ] List of all files that need to be created
- [ ] List of all files that need to be modified
- [ ] Type definitions needed (add to @supabase/types.ts or component files)
- [ ] Utility functions needed (add to @frontend/src/lib/)
- [ ] Component structure and props interface

**API Route Specifications**:
- [ ] HTTP method (GET/POST/PUT/DELETE)
- [ ] Authentication requirements (public/authenticated/admin)
- [ ] Rate limiting preset (STRICT/MODERATE/LENIENT)
- [ ] Request validation schema (Zod)
- [ ] Response schema
- [ ] Error handling approach
- [ ] Reference workflow: @.cursor/rules/workflows/api-route-development.mdc

**Component Specifications**:
- [ ] Props interface definition
- [ ] State management plan (useState, useReducer, TanStack Query)
- [ ] Memoization needs (useMemo, useCallback)
- [ ] Validation functions
- [ ] Error handling approach
- [ ] Reference workflow: @.cursor/rules/workflows/component-development.mdc

**Todo Management** (For Complex Tasks):
- [ ] Create todo list with `todo_write` if 3+ steps
- [ ] Break down into atomic tasks
- [ ] Track progress through implementation

### Phase 2: Implementation Steps

**Follow Implementation Checklist**: @docs/reference/AI_WORKFLOW_CHECKLISTS.md:39-70

Break down into atomic steps with code references. **Build incrementally and verify each step**.

**Database Changes** (if applicable):
- [ ] Step 1: Create migration branch with `mcp_supabase_create_branch({ name: 'test-migration' })`
- [ ] Step 2: Apply migration with `mcp_supabase_apply_migration` (reference actual migration patterns from @supabase/migrations/)
- [ ] Step 3: Verify schema with `mcp_supabase_list_tables`
- [ ] Step 4: Check security advisors with `mcp_supabase_get_advisors({ type: 'security' })`
- [ ] Step 5: Check performance advisors with `mcp_supabase_get_advisors({ type: 'performance' })`
- [ ] Step 6: Fix any advisor issues
- [ ] Step 7: Regenerate types with `mcp_supabase_generate_typescript_types()`
- [ ] Step 8: Test thoroughly in branch
- [ ] Step 9: Merge branch with `mcp_supabase_merge_branch({ branch_id: 'xxx' })` (if tests pass)
- [ ] Reference workflow: @.cursor/rules/workflows/database-migration.mdc

**API Route Implementation** (if applicable):
- [ ] Step 1: Create route file in @frontend/src/app/api/[route]/route.ts
- [ ] Step 2: Add rate limiting FIRST (reference @frontend/src/app/api/bookings/route.ts:73-87)
- [ ] Step 3: Add request validation (reference @frontend/src/app/api/bookings/route.ts:90-97)
- [ ] Step 4: Add authentication (reference @frontend/src/app/api/bookings/route.ts:133-145)
- [ ] Step 5: Add input sanitization (reference @frontend/src/app/api/bookings/route.ts:101-102)
- [ ] Step 6: Add Zod validation (reference @frontend/src/app/api/bookings/route.ts:100-101)
- [ ] Step 7: Implement business logic (reference similar API route)
- [ ] Step 8: Add structured logging (reference @frontend/src/app/api/bookings/route.ts:226-235)
- [ ] Step 9: Return JSON response (reference @frontend/src/app/api/bookings/route.ts:237-266)
- [ ] Step 10: Add error handling (reference @frontend/src/app/api/bookings/route.ts:267-299)
- [ ] Step 11: Verify each step works before proceeding (incremental development)
- [ ] Reference workflow: @.cursor/rules/workflows/api-route-development.mdc

**Component Implementation** (if applicable):
- [ ] Step 1: Create component file in @frontend/src/components/[category]/ComponentName.tsx
- [ ] Step 2: Define props interface (reference @frontend/src/components/EnhancedBookingFlowV2.tsx:105-109)
- [ ] Step 3: Add state management (reference @frontend/src/components/EnhancedBookingFlowV2.tsx:110-128)
- [ ] Step 4: Add memoized calculations (reference @frontend/src/components/EnhancedBookingFlowV2.tsx:136-179)
- [ ] Step 5: Add memoized callbacks (reference @frontend/src/components/EnhancedBookingFlowV2.tsx)
- [ ] Step 6: Add validation functions (reference @frontend/src/components/EnhancedBookingFlowV2.tsx:373-426)
- [ ] Step 7: Add error handling
- [ ] Step 8: Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Step 9: Add loading states
- [ ] Step 10: Add error boundaries if needed
- [ ] Step 11: Verify each step works before proceeding (incremental development)
- [ ] Reference workflow: @.cursor/rules/workflows/component-development.mdc

**Utility Functions** (if applicable):
- [ ] Step 1: Create utility file in @frontend/src/lib/[category]/functionName.ts
- [ ] Step 2: Add TypeScript types
- [ ] Step 3: Implement function with error handling
- [ ] Step 4: Add JSDoc comments
- [ ] Step 5: Write unit tests
- [ ] Step 6: Verify function works

Each step should:
- Reference actual codebase patterns using @filename:line syntax
- Include exact code patterns to follow
- Specify validation requirements
- Include error handling approach
- Note security considerations
- Include performance considerations
- **Verify step works before proceeding** (incremental development)

### Phase 3: Quality Assurance

**Follow Post-Implementation Checklist**: @docs/reference/AI_WORKFLOW_CHECKLISTS.md:73-108

**Code Quality Checks**:
- [ ] Linter checks: `read_lints` on all changed files
- [ ] TypeScript compilation: `pnpm type-check`
- [ ] No console.log statements (use structured logger)
- [ ] No process.env direct access (use secrets loaders)

**Database Quality Checks** (if schema changed):
- [ ] Security advisors: `mcp_supabase_get_advisors({ type: 'security' })` - fix all issues
- [ ] Performance advisors: `mcp_supabase_get_advisors({ type: 'performance' })` - fix all issues
- [ ] Verify RLS policies work correctly
- [ ] Verify indexes are created
- [ ] Test queries with EXPLAIN ANALYZE (if needed)
- [ ] Types regenerated: `mcp_supabase_generate_typescript_types()`

**Browser Verification** (if UI component):
- [ ] Navigate to page: `mcp_cursor-ide-browser_browser_navigate({ url: 'http://localhost:3000/...' })`
- [ ] Take snapshot: `mcp_cursor-ide-browser_browser_snapshot()`
- [ ] Test interactions: `mcp_cursor-ide-browser_browser_click()`, `mcp_cursor-ide-browser_browser_type()`
- [ ] Verify form submissions
- [ ] Test error scenarios
- [ ] Check console for errors: `mcp_cursor-ide-browser_browser_console_messages()`
- [ ] Verify network requests: `mcp_cursor-ide-browser_browser_network_requests()`

**Accessibility Audit**:
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

**Error Scenario Testing**:
- [ ] Network failures handled
- [ ] Validation errors display correctly
- [ ] Authentication errors handled
- [ ] Database errors handled gracefully
- [ ] Timeout scenarios handled

**Edge Case Testing**:
- [ ] Null/undefined values handled
- [ ] Empty states display correctly
- [ ] Loading states work
- [ ] Race conditions prevented
- [ ] Concurrent operations handled

**Self-Healing Pattern Checks**:
- [ ] Check for known self-healing patterns that might apply
- [ ] Apply auto-fixes for known issues (RLS blocks, port conflicts, etc.)

### Phase 4: Documentation & Testing

**Documentation Updates** (Auto-update via rule):
- [ ] COMPONENT_INDEX.md updated (if component) - auto-update via @.cursor/rules/documentation-auto-update.mdc
- [ ] API_ROUTES_INDEX.md updated (if API route) - auto-update via @.cursor/rules/documentation-auto-update.mdc
- [ ] DATABASE_SCHEMA.md updated (if schema changes) - auto-update via @.cursor/rules/documentation-auto-update.mdc
- [ ] TYPE_DEFINITIONS_INDEX.md updated (if new types) - auto-update via @.cursor/rules/documentation-auto-update.mdc
- [ ] UTILITY_FUNCTIONS_INDEX.md updated (if new utilities) - auto-update via @.cursor/rules/documentation-auto-update.mdc
- [ ] Verify documentation updates are correct

**Testing**:
- [ ] Unit tests written for business logic
- [ ] Integration tests written for API routes
- [ ] E2E tests written for user flows (browser automation)
- [ ] Test data fixtures created
- [ ] All tests passing

**Logs & Monitoring**:
- [ ] Check API logs: `mcp_supabase_get_logs({ service: 'api' })` (if errors)
- [ ] Check auth logs: `mcp_supabase_get_logs({ service: 'auth' })` (if auth issues)
- [ ] Check postgres logs: `mcp_supabase_get_logs({ service: 'postgres' })` (if DB issues)
- [ ] Verify structured logging works
- [ ] Check for error patterns in logs

## Code Quality Standards

Ensure the plan follows ALL these patterns:

### API Routes (if applicable)

**Follow the 8-step pattern** from @frontend/src/app/api/bookings/route.ts:72-297:
**Reference workflow**: @.cursor/rules/workflows/api-route-development.mdc

1. **Rate limit FIRST**: @frontend/src/app/api/bookings/route.ts:73-87
   - Use `rateLimit(request, RateLimitPresets.STRICT)` from @frontend/src/lib/rate-limiter.ts

2. **Validate request**: @frontend/src/app/api/bookings/route.ts:90-97
   - Use `validateRequest()` from @frontend/src/lib/request-validator.ts

3. **Authenticate**: @frontend/src/app/api/bookings/route.ts:133-145
   - Use `createClient()` from @frontend/src/lib/supabase/server.ts
   - Verify with `supabase.auth.getUser()`

4. **Sanitize input**: @frontend/src/app/api/bookings/route.ts:101-102
   - Use `sanitizeBookingFormData()` from @frontend/src/lib/input-sanitizer.ts

5. **Validate with Zod**: @frontend/src/app/api/bookings/route.ts:100-101
   - Create Zod schema matching sanitized data

6. **Process business logic**: @frontend/src/app/api/bookings/route.ts:147-214
   - Use specific columns in queries (never SELECT *)
   - Add pagination with .range() and .limit()
   - Use indexed filters

7. **Log with structured logger**: @frontend/src/app/api/bookings/route.ts:226-235, 268-276
   - Use `logger` from @frontend/src/lib/logger.ts
   - **IMPORTANT**: Error signature is `logger.error('message', context, error)` - error LAST

8. **Return JSON response**: @frontend/src/app/api/bookings/route.ts:237-266
   - Proper status codes
   - Consistent response format

**Webhook Pattern** (if applicable):
- Use service role client: @frontend/src/lib/supabase/service.ts
- Verify webhook signature
- Check idempotency (webhook_events table)
- Reference: @frontend/src/app/api/webhooks/idkit/route.ts:79

### Components (if applicable)

**Follow patterns** from @frontend/src/components/EnhancedBookingFlowV2.tsx:
**Reference workflow**: @.cursor/rules/workflows/component-development.mdc

- **Props interface**: @frontend/src/components/EnhancedBookingFlowV2.tsx:105-109
- **State management**: @frontend/src/components/EnhancedBookingFlowV2.tsx:110-128
- **Memoized calculations**: @frontend/src/components/EnhancedBookingFlowV2.tsx:136-179
- **Memoized callbacks**: useCallback for event handlers
- **Validation functions**: @frontend/src/components/EnhancedBookingFlowV2.tsx:373-426
- **Error handling**: Error boundaries, try/catch, user-friendly messages

### Database Operations (if applicable)

**Supabase MCP Tools ONLY**:
- Schema queries: `mcp_supabase_list_tables({ schemas: ['public'] })`
- Data queries: `mcp_supabase_execute_sql({ query: 'SELECT ...' })`
- Schema changes: `mcp_supabase_apply_migration({ name: '...', query: '...' })`
- Type generation: `mcp_supabase_generate_typescript_types()`
- Advisors: `mcp_supabase_get_advisors({ type: 'security' | 'performance' })`
- Logs: `mcp_supabase_get_logs({ service: 'api' | 'auth' | 'postgres' })`
- **Reference workflow**: @.cursor/rules/workflows/database-migration.mdc

**RLS Patterns**:
- Enable RLS on all user-facing tables
- Use `(SELECT auth.uid())` wrapper for better plan caching (30% faster)
- Separate policies for each operation (SELECT/INSERT/UPDATE/DELETE)
- Index ALL columns referenced in policies

**Query Patterns**:
- Specific columns (never SELECT *)
- Pagination with .range() and .limit()
- Indexed filters
- Reference actual queries: @frontend/src/app/api/bookings/route.ts:147-153

**Migration Safety**:
- Test in branch first: `mcp_supabase_create_branch` → test → `mcp_supabase_merge_branch`
- Use CONCURRENTLY for indexes
- Use IF NOT EXISTS/IF EXISTS
- Reference actual migrations: @supabase/migrations/
- Regenerate types after migration: `mcp_supabase_generate_typescript_types()`

### Security Patterns

**Secrets Management**:
- Use secrets loaders: `getSendGridApiKey()`, `getStripeSecretKey()`
- NEVER access `process.env` directly for secrets
- Reference: @frontend/src/lib/secrets/email.ts, @frontend/src/lib/stripe/config.ts

**Webhook Authentication**:
- Use service role client for webhooks (bypasses RLS)
- Verify webhook signatures
- Check idempotency
- Reference: @frontend/src/lib/supabase/service.ts

**Input Validation**:
- Sanitize with `sanitizeBookingFormData()` from @frontend/src/lib/input-sanitizer.ts
- Validate with Zod schemas
- Detect malicious input

**Rate Limiting**:
- Apply to all API routes
- Use RateLimitPresets (STRICT/MODERATE/LENIENT)
- Reference: @frontend/src/lib/rate-limiter.ts

**Structured Logging**:
- Use `logger` from @frontend/src/lib/logger.ts
- NEVER use console.log
- Error signature: `logger.error('message', context, error)` - error LAST

### Performance Patterns

**Query Optimization**:
- Specific columns (60% payload reduction)
- Pagination (prevents memory issues)
- Indexed filters (200ms → 15ms query time)
- Reference: @frontend/src/app/api/bookings/route.ts:147-153

**Frontend Optimization**:
- Memoized calculations (useMemo)
- Memoized callbacks (useCallback)
- Lazy loading for heavy components
- Dynamic imports

**Index Strategy**:
- Index ALL foreign keys
- Index ALL RLS policy columns
- Index WHERE clause columns
- Index sort columns (ORDER BY)
- Partial indexes for filtered queries
- GIN indexes for JSONB/arrays
- BRIN indexes for time series data
- Reference: @supabase/migrations/20250121000006_performance_optimizations.sql

## Deliverables

Provide:

1. **Comprehensive Analysis Report** - All findings from analysis requirements
   - Codebase search results (with semantic queries)
   - Database schema analysis (with MCP tool results)
   - External documentation references (using MCP tools)
   - Architecture requirements
   - Security considerations
   - Performance opportunities
   - Accessibility needs
   - Error scenarios
   - Testing requirements
   - Business logic validation
   - Self-healing pattern matches

2. **Detailed Implementation Plan** - Step-by-step plan with code references
   - Pre-implementation checklist (from AI_WORKFLOW_CHECKLISTS.md)
   - Atomic implementation steps (with @filename:line references)
   - Workflow rule references (@.cursor/rules/workflows/*)
   - Incremental development approach (verify each step)
   - Quality assurance steps
   - Documentation updates (auto-update verification)
   - Testing strategy

3. **Risk Assessment** - Potential issues and mitigation strategies
   - Security risks
   - Performance risks
   - Data integrity risks
   - User experience risks
   - Mitigation strategies for each
   - Self-healing pattern applications

4. **Testing Strategy** - Complete testing plan
   - Unit test plan
   - Integration test plan
   - E2E test plan (browser automation)
   - Test data requirements
   - Edge cases to test

5. **Quality Checklist** - Pre-commit checklist
   - Code quality checks
   - Database quality checks (with MCP advisors)
   - Browser verification steps
   - Documentation updates (auto-update verification)
   - Success criteria

## Success Criteria

The implementation is complete when:

**Code Quality**:
- ✅ All linter checks pass (`read_lints`)
- ✅ TypeScript compilation succeeds (`pnpm type-check`)
- ✅ No console.log statements (use structured logger)
- ✅ No process.env direct access (use secrets loaders)

**Database Quality** (if schema changed):
- ✅ Security advisors pass: `mcp_supabase_get_advisors({ type: 'security' })` - no issues
- ✅ Performance advisors pass: `mcp_supabase_get_advisors({ type: 'performance' })` - no issues
- ✅ RLS policies verified and working
- ✅ All required indexes created
- ✅ Migration tested in branch and merged
- ✅ Types regenerated: `mcp_supabase_generate_typescript_types()`

**Browser Verification** (if UI component):
- ✅ Page loads without errors
- ✅ All interactions work correctly
- ✅ Forms submit successfully
- ✅ Error scenarios handled gracefully
- ✅ No console errors
- ✅ Network requests successful

**Testing**:
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass (browser automation)
- ✅ Edge cases tested
- ✅ Error scenarios tested

**Documentation**:
- ✅ COMPONENT_INDEX.md updated (if component) - verified auto-update
- ✅ API_ROUTES_INDEX.md updated (if API route) - verified auto-update
- ✅ DATABASE_SCHEMA.md updated (if schema changes) - verified auto-update
- ✅ All reference docs updated and verified

**Accessibility**:
- ✅ WCAG AA compliant
- ✅ Keyboard navigation works
- ✅ Screen reader compatible
- ✅ Color contrast meets standards

**Performance**:
- ✅ Query performance targets met (<20ms for simple queries)
- ✅ Bundle size within budget
- ✅ No performance regressions

**Workflow Compliance**:
- ✅ Pre-implementation checklist completed
- ✅ Implementation checklist followed
- ✅ Post-implementation checklist completed
- ✅ Quality gate passed

## Additional Context

[Add any specific requirements, constraints, or context about this component/page here]

Examples:
- This component needs to handle real-time updates
- Must integrate with Stripe for payments
- Should support mobile and desktop views
- Needs to work with existing booking flow
- Must comply with specific business rules
```

---

## 🎯 How to Use

1. **Copy the prompt above** (everything between the code fences)
2. **Link the component/page** you want analyzed
3. **Add any specific context** in the "Additional Context" section
4. **Paste and send** - I'll provide a comprehensive analysis and implementation plan

---

## 📊 What You'll Get

### 1. Comprehensive Analysis Report

**Codebase Discovery**:
- Similar patterns found with codebase_search (semantic queries)
- Reusable components identified
- Similar API routes found
- Utility functions located
- External documentation consulted (via MCP tools)

**Database Analysis** (Using Supabase MCP):
- Current schema verified with `mcp_supabase_list_tables`
- Existing indexes checked
- RLS policies reviewed
- Migration plan with branch testing
- Type generation planned

**Architecture Requirements**:
- API endpoint specifications
- Component structure
- Integration requirements
- Database requirements

**Security Considerations**:
- Input validation requirements
- Authentication/authorization patterns
- Secrets management verification
- Rate limiting strategy

**Performance Opportunities**:
- Query optimization opportunities
- Index requirements
- Frontend optimization
- Performance benchmarking

**Accessibility Needs**:
- WCAG compliance requirements
- Keyboard navigation needs
- ARIA label requirements

**Error Scenarios**:
- All error cases identified
- Recovery strategies planned
- Edge cases documented
- Self-healing pattern matches

**Testing Requirements**:
- Unit test plan
- Integration test plan
- E2E test plan (browser automation)
- Test data requirements

**Business Logic Validation**:
- Domain rules verified
- Calculation logic checked
- Workflow patterns validated

### 2. Detailed Implementation Plan

**Pre-Implementation**:
- Codebase search results
- Database schema analysis (with MCP results)
- External documentation references (via MCP)
- File inventory
- API/component specifications
- Todo list created (if 3+ steps)

**Implementation Steps**:
- Atomic steps with @filename:line references
- Workflow rule references (@.cursor/rules/workflows/*)
- Exact code patterns to follow
- Validation requirements
- Error handling approach
- Security considerations
- Incremental development (verify each step)

**Quality Assurance**:
- Code quality checks
- Database quality checks (with MCP advisors)
- Browser verification steps
- Accessibility audit
- Error scenario testing
- Self-healing pattern checks

**Documentation & Testing**:
- Documentation updates (auto-update verification)
- Unit tests
- Integration tests
- E2E tests (browser automation)

### 3. Risk Assessment

- Security risks and mitigations
- Performance risks and optimizations
- Data integrity risks and safeguards
- User experience risks and improvements
- Edge cases and handling strategies
- Self-healing pattern applications

### 4. Quality Checklist

- Pre-commit verification
- Post-implementation checks
- Success criteria
- MCP advisor results
- Workflow compliance verification

---

## 🔍 Example Usage

```
I need you to perform a COMPREHENSIVE ANALYSIS and create a DETAILED IMPLEMENTATION PLAN for this component/page to achieve a fully functional, bug-free product.

[Link to component/page here]

## Additional Context
- This component needs to handle real-time updates
- Must integrate with Stripe for payments
- Should support mobile and desktop views
- Needs to work with existing booking flow
```

---

## ✅ Key Improvements in V3

### 1. **Workflow Integration**
- Explicit references to @docs/reference/AI_WORKFLOW_CHECKLISTS.md
- References to workflow rules (@.cursor/rules/workflows/*)
- Pre/Post/Implementation checklist integration

### 2. **External Documentation MCP Tools**
- `mcp_supabase_search_docs` for Supabase documentation
- `mcp_Stripe_search_stripe_documentation` for Stripe docs
- `mcp_Context7_*` for library documentation
- Explicit usage in analysis phase

### 3. **Type Generation**
- Explicit step to regenerate types after schema changes
- `mcp_supabase_generate_typescript_types()` in implementation steps

### 4. **Todo Management**
- Use `todo_write` for complex tasks (3+ steps)
- Track progress through implementation

### 5. **Incremental Development**
- Verify each step works before proceeding
- Build incrementally with verification

### 6. **Documentation Auto-Update**
- Explicit verification of auto-update rule
- Check that documentation updates are correct

### 7. **Self-Healing Patterns**
- Check for known self-healing patterns
- Apply auto-fixes for known issues

### 8. **Enhanced Log Checking**
- Check postgres logs in addition to API/auth logs
- Comprehensive log analysis

### 9. **Workflow Compliance**
- Success criteria includes workflow compliance
- References to workflow checklists throughout

### 10. **Better Organization**
- Clear references to workflow rules
- Integration with existing checklists
- More systematic approach

---

## ✅ Benefits

Using this V3 prompt ensures:

- **Maximum Tool Integration**: All MCP tools leveraged (Supabase, Stripe, Context7, Browser)
- **Workflow Compliance**: Follows established workflows and checklists
- **External Documentation**: Uses MCP tools for real-time docs
- **Type Safety**: Explicit type generation after schema changes
- **Incremental Development**: Verify each step before proceeding
- **Documentation Accuracy**: Auto-update with verification
- **Self-Healing**: Applies known fixes automatically
- **Comprehensive Logging**: Checks all relevant logs
- **Systematic Approach**: Follows established patterns and workflows

---

**Status**: ✅ Ready to Use (V3 - Maximum Power)
**Last Updated**: January 2025
**Version**: 3.0 (Maximum Power with Full Workflow Integration)

