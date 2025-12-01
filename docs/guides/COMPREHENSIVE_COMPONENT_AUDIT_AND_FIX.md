# Comprehensive Component/Page Audit & Fix Prompt

## 🎯 Purpose
**THOROUGH, COMPLETE, END-TO-END** - This prompt ensures a complete audit of ALL issues before fixing anything, then systematically fixes everything while verifying end-to-end functionality at each step.

---

## ⚠️ CRITICAL WORKFLOW RULES

**MANDATORY PROCESS - NO EXCEPTIONS:**

2. **FIND ALL ISSUES FIRST** - Complete audit before ANY fixes
3. **CATEGORIZE & PRIORITIZE** - Organize all issues before fixing
4. **FIX SYSTEMATICALLY** - One category at a time
5. **VERIFY AFTER EACH FIX** - Ensure nothing broke
6. **TEST END-TO-END** - Complete workflow testing after all fixes
7. **CHECK INTEGRATIONS** - Verify all connected systems still work
8. **REGRESSION TEST** - Ensure existing features weren't broken

**NEVER**:
- ❌ Fix one issue and stop
- ❌ Skip verification steps
- ❌ Assume fixes don't break other things
- ❌ Ignore related components/pages
- ❌ Skip end-to-end testing

**ALWAYS**:
- ✅ Complete audit before fixing
- ✅ Test after each fix
- ✅ Verify end-to-end workflows
- ✅ Check cross-component impacts
- ✅ Test integrations
- ✅ Document all findings

---

## Phase 2: COMPLETE AUDIT (FIND ALL ISSUES FIRST)

**This phase is MANDATORY and must be completed BEFORE any fixes.**

### Step 2.1: Deep Codebase Analysis

**Codebase Search** (MANDATORY - Multiple Semantic Searches):

2. **Component/Page Functionality Search**:
   - Use `codebase_search` with semantic queries:
     - "How does [component/page name] work?"
     - "What features does [component/page] provide?"
     - "Where is [component/page] used in the application?"
     - "What dependencies does [component/page] have?"

3. **Related Components Search**:
   - Find parent components that use this component
   - Find child components this component uses
   - Find sibling components with similar functionality
   - Search for similar patterns across codebase

4. **API Integration Search**:
   - Find all API routes this component/page calls
   - Find all webhooks related to this functionality
   - Search for data fetching patterns
   - Find error handling patterns

5. **Database Integration Search**:
   - Find all database queries related to this component
   - Find RLS policies affecting this functionality
   - Find related tables and relationships
   - Search for data mutation patterns

6. **State Management Search**:
   - Find all state management patterns
   - Find TanStack Query usage
   - Find Context providers
   - Find local state patterns

**Deliverable**: Complete list of:
- All files that touch this component/page (direct and indirect)
- All API routes called by this component
- All database queries involved
- All related components (parent, child, sibling)
- All integrations (Stripe, SendGrid, etc.)

### Step 2.2: File Structure Analysis

**Read ALL Related Files** (Not just the main component):

2. **Primary Component/Page File**:
   - Read the complete file
   - Note all imports
   - Note all functions/methods
   - Note all state variables
   - Note all useEffect/useMemo/useCallback hooks
   - Note all event handlers

3. **Related Component Files**:
   - Read ALL imported components
   - Read ALL utility functions imported
   - Read ALL hooks imported
   - Read ALL types/interfaces imported

4. **API Route Files**:
   - Read ALL API routes this component calls
   - Read ALL webhook handlers related to this functionality
   - Note request/response patterns
   - Note error handling

5. **Utility/Library Files**:
   - Read ALL utility functions used
   - Read ALL hooks used
   - Read ALL validation functions
   - Read ALL data transformation functions

6. **Type Definition Files**:
   - Read ALL TypeScript types used
   - Check for type mismatches
   - Check for missing types

**Deliverable**: Complete inventory of:
- All files read (with line counts)
- All functions/methods found
- All state variables found
- All API calls found
- All database queries found
- All potential issues identified

### Step 2.3: Issue Discovery (Multi-Dimensional Audit)

**Perform these audits in parallel - find ALL issues before fixing ANY:**

#### A. Code Quality Audit

- [ ] **TypeScript Issues**:
  - [ ] Run `read_lints` on ALL related files
  - [ ] List ALL type errors
  - [ ] List ALL `any` types found
  - [ ] List ALL missing type annotations
  - [ ] Check for type mismatches

- [ ] **Linting Issues**:
  - [ ] List ALL ESLint errors
  - [ ] List ALL ESLint warnings
  - [ ] Check for unused imports
  - [ ] Check for unused variables
  - [ ] Check for console.log statements
  - [ ] Check for TODO/FIXME comments

- [ ] **Code Smells**:
  - [ ] Duplicate code patterns
  - [ ] Long functions (>51 lines)
  - [ ] Complex conditionals
  - [ ] Magic numbers/strings
  - [ ] Hardcoded values

#### B. Pattern Compliance Audit

- [ ] **API Route Pattern** (if API routes involved):
  - [ ] Check if rate limiting exists (Step 2)
  - [ ] Check if request validation exists (Step 3)
  - [ ] Check if authentication exists (Step 4)
  - [ ] Check if input sanitization exists (Step 5)
  - [ ] Check if Zod validation exists (Step 6)
  - [ ] Check if structured logging exists (Step 8)
  - [ ] Check if proper error handling exists (Step 9)
  - [ ] Reference: @frontend/src/app/api/bookings/route.ts:73-297

- [ ] **Component Pattern** (if component involved):
  - [ ] Check props interface definition
  - [ ] Check state management patterns
  - [ ] Check memoization (useMemo/useCallback)
  - [ ] Check validation functions
  - [ ] Check error handling
  - [ ] Reference: @frontend/src/components/EnhancedBookingFlowV3.tsx

- [ ] **Database Query Pattern**:
  - [ ] Check for SELECT * usage (FORBIDDEN)
  - [ ] Check for pagination (.range(), .limit())
  - [ ] Check for specific columns
  - [ ] Check for indexed filters
  - [ ] Reference: @frontend/src/app/api/bookings/route.ts:148-153

- [ ] **RLS Policy Pattern**:
  - [ ] Check if RLS enabled on tables
  - [ ] Check if policies use (SELECT auth.uid()) wrapper
  - [ ] Check if policy columns indexed
  - [ ] Check for separate policies per operation
  - [ ] Reference: @supabase/migrations/20250121000003_rls_policies.sql

#### C. Security Audit

- [ ] **Input Validation**:
  - [ ] Check server-side validation exists
  - [ ] Check sanitization functions used
  - [ ] Check Zod schemas defined
  - [ ] Check for XSS vulnerabilities
  - [ ] Check for SQL injection risks (if raw SQL)

- [ ] **Authentication/Authorization**:
  - [ ] Check authentication required where needed
  - [ ] Check role-based access control
  - [ ] Check RLS policies correct
  - [ ] Check webhook signature verification (if webhooks)

- [ ] **Secrets Management**:
  - [ ] Check for direct `process.env` access (FORBIDDEN)
  - [ ] Check secrets loader usage
  - [ ] Check for hardcoded secrets
  - [ ] Reference: @frontend/src/lib/secrets/

- [ ] **Rate Limiting**:
  - [ ] Check rate limiting on API routes
  - [ ] Check appropriate preset (STRICT/MODERATE/LENIENT)
  - [ ] Reference: @frontend/src/lib/rate-limiter.ts

#### D. Performance Audit

- [ ] **Database Query Performance**:
  - [ ] Check for SELECT * usage
  - [ ] Check for missing indexes
  - [ ] Check for pagination
  - [ ] Check for N+2 query patterns
  - [ ] Run performance advisors: `mcp_supabase_get_advisors({ type: 'performance' })`

- [ ] **Frontend Performance**:
  - [ ] Check for missing memoization
  - [ ] Check for unnecessary re-renders
  - [ ] Check for large bundle imports
  - [ ] Check for lazy loading opportunities
  - [ ] Check for missing loading states

- [ ] **Network Performance**:
  - [ ] Check for duplicate API calls
  - [ ] Check for missing caching (TanStack Query)
  - [ ] Check for large payload sizes
  - [ ] Check for missing request deduplication

#### E. Accessibility Audit

- [ ] **WCAG AA Compliance**:
  - [ ] Check semantic HTML usage
  - [ ] Check ARIA labels present
  - [ ] Check keyboard navigation works
  - [ ] Check focus indicators visible
  - [ ] Check color contrast ratios
  - [ ] Check screen reader compatibility

- [ ] **Form Accessibility**:
  - [ ] Check label associations
  - [ ] Check error message announcements
  - [ ] Check required field indicators
  - [ ] Check help text associations

#### F. Error Handling Audit

- [ ] **Error Scenarios Covered**:
  - [ ] Network failures
  - [ ] Authentication failures
  - [ ] Validation errors
  - [ ] Database errors
  - [ ] External API failures
  - [ ] Timeout handling
  - [ ] Null/undefined handling
  - [ ] Empty state handling
  - [ ] Loading state handling

- [ ] **Error Recovery**:
  - [ ] Retry strategies for transient failures
  - [ ] Fallback UI states
  - [ ] Error boundaries present
  - [ ] User-friendly error messages
  - [ ] Structured logging exists

#### G. Integration Audit

- [ ] **Stripe Integration** (if applicable):
  - [ ] Check payment intent creation
  - [ ] Check webhook handling
  - [ ] Check error handling
  - [ ] Check idempotency

- [ ] **SendGrid Integration** (if applicable):
  - [ ] Check email sending
  - [ ] Check webhook handling
  - [ ] Check error handling

- [ ] **Google Maps API** (if applicable):
  - [ ] Check API key management
  - [ ] Check error handling
  - [ ] Check fallback strategies

- [ ] **IDKit Integration** (if applicable):
  - [ ] Check verification flow
  - [ ] Check webhook handling
  - [ ] Check error handling

#### H. Business Logic Audit

- [ ] **Domain Rules** (if applicable):
  - [ ] Booking availability checks correct
  - [ ] Pricing calculations correct
  - [ ] Discount code validation correct
  - [ ] Payment processing flows correct
  - [ ] Contract generation logic correct
  - [ ] Refund calculations correct

- [ ] **Data Validation**:
  - [ ] Business rule validation exists
  - [ ] Edge cases handled
  - [ ] Boundary conditions tested

#### I. Self-Healing Pattern Audit

- [ ] **Known Patterns Check**:
  - [ ] Check for RLS policy blocks (webhook/service client needed)
  - [ ] Check for port conflicts (startup script needed)
  - [ ] Check for SQL casing issues (quoted camelCase)
  - [ ] Check for NULL handling in triggers (COALESCE)
  - [ ] Check for setTimeout cleanup issues
  - [ ] Check for SELECT * usage
  - [ ] Check for missing RLS policy indexes
  - [ ] Check for wrong date fields in availability checks
  - [ ] Reference: @.cursor/rules/CODING_SAVANT_PATTERNS.mdc

### Step 2.4: Cross-Component Impact Analysis

**Find ALL components/pages that depend on this one:**

2. **Parent Components**:
   - Find all components that import/use this component
   - Check if props passed correctly
   - Check if parent handles errors from child
   - Check if parent handles loading states

3. **Child Components**:
   - Find all components imported/used by this component
   - Check if props passed correctly
   - Check if child component errors handled
   - Check if child component loading states handled

4. **Related Pages**:
   - Find all pages that use this component
   - Find all pages that link to this page
   - Check navigation flows
   - Check data flow

5. **Shared State**:
   - Find all Context providers used
   - Find all global state used
   - Check state synchronization
   - Check state updates

6. **Shared Data**:
   - Find all API routes called
   - Find all database queries
   - Check data consistency
   - Check cache invalidation

**Deliverable**: Complete impact map showing:
- All parent components
- All child components
- All related pages
- All shared state/data
- All potential breaking changes

### Step 2.5: Database Schema Analysis (Using Supabase MCP)

**Complete Database Audit:**

2. **Schema Verification**:
   ```typescript
   // MANDATORY: Verify current schema
   await mcp_supabase_list_tables({ schemas: ['public'] })
   ```

3. **Index Verification**:
   ```sql
   -- MANDATORY: Check all indexes
   SELECT * FROM pg_indexes
   WHERE schemaname = 'public'
   AND tablename IN ('table2', 'table2', ...);
   ```

4. **RLS Policy Verification**:
   ```sql
   -- MANDATORY: Check all RLS policies
   SELECT * FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('table2', 'table2', ...);
   ```

5. **Security Advisors**:
   ```typescript
   // MANDATORY: Check security issues
   await mcp_supabase_get_advisors({ type: 'security' })
   ```

6. **Performance Advisors**:
   ```typescript
   // MANDATORY: Check performance issues
   await mcp_supabase_get_advisors({ type: 'performance' })
   ```

**Deliverable**: Complete database audit report:
- All tables used
- All indexes present/missing
- All RLS policies present/missing
- All security advisor issues
- All performance advisor issues
- All missing foreign key indexes

### Step 1.6: External Documentation Consultation

**Consult External Docs for Patterns:**

1. **Supabase Documentation** (if DB/auth changes):
   ```graphql
   query {
     searchDocs(query: "[topic]") {
       nodes {
         title
         href
         content
       }
     }
   }
   ```

2. **Stripe Documentation** (if payment changes):
   ```typescript
   await mcp_Stripe_search_stripe_documentation({
     question: "[question]",
     language: "node"
   })
   ```

3. **Next.js Documentation** (if routing/features):
   ```typescript
   await mcp_Context7_resolve_library_id({ libraryName: "next.js" })
   await mcp_Context7_get_library_docs({
     context7CompatibleLibraryID: "[id]",
     topic: "[topic]"
   })
   ```

**Deliverable**: External documentation references:
- Relevant Supabase patterns found
- Relevant Stripe patterns found
- Relevant Next.js patterns found
- Best practices to follow

### Step 1.7: Issue Categorization & Prioritization

**Organize ALL Issues Found:**

Create a comprehensive issue list with:

1. **Critical Issues** (Must fix - blocks functionality):
   - Security vulnerabilities
   - TypeScript errors (blocks compilation)
   - Missing authentication/authorization
   - Missing RLS policies
   - Data loss risks
   - Breaking changes

2. **High Priority Issues** (Should fix - affects quality):
   - Performance issues
   - Pattern violations
   - Missing error handling
   - Missing validation
   - Accessibility issues
   - Missing logging

3. **Medium Priority Issues** (Nice to fix - improves maintainability):
   - Code quality issues
   - Missing comments/docs
   - Code smells
   - Minor performance improvements
   - UX improvements

4. **Low Priority Issues** (Optional - polish):
   - Style improvements
   - Minor refactoring
   - Additional tests
   - Documentation improvements

**Deliverable**: Categorized issue list:
- Issue ID
- Category (Critical/High/Medium/Low)
- File/line location
- Description
- Impact assessment
- Suggested fix
- Related issues (if any)

---

## Phase 2: SYSTEMATIC FIX IMPLEMENTATION

**Fix issues category by category, verifying after each fix.**

### Step 2.1: Create Implementation Plan

**Before fixing, create detailed plan:**

1. **Todo List Creation** (if 3+ fixes):
   ```typescript
   await todo_write({
     merge: false,
     todos: [
       { id: 'fix-1', status: 'pending', content: 'Fix critical security issue X' },
       { id: 'fix-2', status: 'pending', content: 'Fix TypeScript error Y' },
       // ... all fixes
     ]
   })
   ```

2. **Fix Order Determination**:
   - Fix Critical issues first
   - Fix High priority next
   - Fix Medium priority after
   - Fix Low priority last (optional)

3. **Dependency Mapping**:
   - Fix issues that block others first
   - Fix foundational issues before dependent ones
   - Fix shared utilities before components using them

**Deliverable**: Implementation plan with:
- All fixes in order
- Dependencies mapped
- Estimated effort
- Risk assessment

### Step 2.2: Critical Issues Fix (With Verification)

**For EACH critical issue:**

1. **Before Fix**:
   - [ ] Read the issue location
   - [ ] Understand root cause
   - [ ] Check for related issues
   - [ ] Review similar patterns in codebase

2. **Implement Fix**:
   - [ ] Follow codebase patterns (reference @filename:line)
   - [ ] Use established utilities/functions
   - [ ] Follow security best practices
   - [ ] Follow performance best practices
   - [ ] Add proper error handling
   - [ ] Add structured logging

3. **Immediate Verification** (AFTER EACH FIX):
   - [ ] Run `read_lints` on changed file - MUST PASS
   - [ ] Check TypeScript compilation - MUST PASS
   - [ ] Verify fix doesn't break other files (check imports)
   - [ ] Test the specific functionality fixed
   - [ ] Check browser console for errors (if UI change)

4. **Integration Verification** (AFTER EACH FIX):
   - [ ] Check parent components still work
   - [ ] Check child components still work
   - [ ] Check related API routes still work
   - [ ] Check related database queries still work
   - [ ] Check related pages still load

5. **Regression Check** (AFTER EACH FIX):
   - [ ] Verify existing tests still pass (if tests exist)
   - [ ] Manually test related functionality
   - [ ] Check for console errors
   - [ ] Check for network errors

**Repeat for ALL critical issues, one at a time.**

**Deliverable**:
- All critical issues fixed
- All verification steps passed
- No regressions introduced
- Progress documented

### Step 2.3: High Priority Issues Fix (With Verification)

**Same process as Critical, but for High priority issues:**

- [ ] Fix issue following patterns
- [ ] Immediate verification (lints, types, functionality)
- [ ] Integration verification (related components/pages)
- [ ] Regression check (existing functionality)

**Repeat for ALL high priority issues.**

### Step 2.4: Medium Priority Issues Fix (With Verification)

**Same process, for Medium priority issues:**

- [ ] Fix issue following patterns
- [ ] Immediate verification
- [ ] Integration verification
- [ ] Regression check

**Repeat for ALL medium priority issues.**

### Step 2.5: Low Priority Issues Fix (Optional)

**Only if time permits, fix Low priority issues:**

- [ ] Fix issue following patterns
- [ ] Immediate verification
- [ ] Integration verification
- [ ] Regression check

---

## Phase 3: END-TO-END VERIFICATION

**After ALL fixes, perform comprehensive end-to-end testing.**

### Step 3.1: Complete Workflow Testing

**Test the complete user workflow:**

1. **Happy Path Testing**:
   - [ ] Navigate to the page/component
   - [ ] Complete the primary user flow
   - [ ] Verify all interactions work
   - [ ] Verify data saves correctly
   - [ ] Verify success messages appear
   - [ ] Verify redirects work (if applicable)

2. **Error Path Testing**:
   - [ ] Test validation errors
   - [ ] Test authentication errors
   - [ ] Test network errors (disable network)
   - [ ] Test timeout scenarios
   - [ ] Test empty states
   - [ ] Test loading states
   - [ ] Verify error messages are user-friendly

3. **Edge Case Testing**:
   - [ ] Test with missing data
   - [ ] Test with invalid data
   - [ ] Test with boundary values
   - [ ] Test with concurrent operations
   - [ ] Test with rapid interactions
   - [ ] Test with large datasets (if applicable)

4. **Integration Testing**:
   - [ ] Test Stripe integration (if applicable)
   - [ ] Test SendGrid integration (if applicable)
   - [ ] Test Google Maps integration (if applicable)
   - [ ] Test IDKit integration (if applicable)
   - [ ] Test all webhooks (if applicable)

### Step 3.2: Browser Automation Testing

**Use browser automation for thorough testing:**

1. **Navigation & Initial Load**:
   ```typescript
   await mcp_cursor-ide-browser_browser_navigate({
     url: 'http://localhost:3000/[page]'
   })
   await mcp_cursor-ide-browser_browser_snapshot()
   ```

2. **Console Error Check**:
   ```typescript
   const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages()
   // Verify no errors
   ```

3. **Network Request Check**:
   ```typescript
   const networkRequests = await mcp_cursor-ide-browser_browser_network_requests()
   // Verify all requests successful
   ```

4. **Interaction Testing**:
   - [ ] Click all buttons
   - [ ] Fill all forms
   - [ ] Submit forms
   - [ ] Navigate between pages
   - [ ] Test keyboard navigation
   - [ ] Test screen reader compatibility

5. **Responsive Testing**:
   - [ ] Test mobile view
   - [ ] Test tablet view
   - [ ] Test desktop view
   - [ ] Verify responsive breakpoints work

### Step 3.3: Database Verification

**Verify database operations work correctly:**

1. **Query Verification**:
   ```typescript
   // Test all database queries used by component
   await mcp_supabase_execute_sql({
     query: 'SELECT ... FROM ... WHERE ...'
   })
   ```

2. **RLS Policy Verification**:
   - [ ] Test as authenticated user
   - [ ] Test as unauthenticated user
   - [ ] Test as admin user
   - [ ] Verify RLS policies work correctly

3. **Data Integrity Verification**:
   - [ ] Verify data saves correctly
   - [ ] Verify data updates correctly
   - [ ] Verify data deletes correctly (if applicable)
   - [ ] Verify foreign key constraints work
   - [ ] Verify unique constraints work

4. **Performance Verification**:
   ```typescript
   // Check performance advisors
   await mcp_supabase_get_advisors({ type: 'performance' })
   // Fix any remaining issues
   ```

### Step 3.4: Security Verification

**Verify all security measures work:**

1. **Input Validation**:
   - [ ] Test XSS attempts
   - [ ] Test SQL injection attempts
   - [ ] Test malicious input
   - [ ] Verify sanitization works

2. **Authentication/Authorization**:
   - [ ] Test unauthenticated access (should be blocked)
   - [ ] Test unauthorized access (should be blocked)
   - [ ] Test authenticated access (should work)
   - [ ] Test admin access (should work)

3. **Rate Limiting**:
   - [ ] Test rate limit exceeded scenario
   - [ ] Verify rate limit responses correct
   - [ ] Verify rate limit reset works

4. **Secrets Management**:
   - [ ] Verify no direct `process.env` access
   - [ ] Verify secrets loaders used
   - [ ] Verify no hardcoded secrets

5. **Security Advisors**:
   ```typescript
   // Check security advisors
   await mcp_supabase_get_advisors({ type: 'security' })
   // Fix any remaining issues
   ```

### Step 3.5: Performance Verification

**Verify performance is acceptable:**

1. **Query Performance**:
   - [ ] Test query execution times (<20ms for simple queries)
   - [ ] Verify indexes are used
   - [ ] Verify pagination works
   - [ ] Verify no SELECT * usage

2. **Frontend Performance**:
   - [ ] Test page load times
   - [ ] Test interaction response times
   - [ ] Verify no unnecessary re-renders
   - [ ] Verify memoization works
   - [ ] Check bundle size impact

3. **Network Performance**:
   - [ ] Verify request deduplication works
   - [ ] Verify caching works (TanStack Query)
   - [ ] Verify payload sizes reasonable
   - [ ] Verify no duplicate API calls

### Step 3.6: Accessibility Verification

**Verify accessibility compliance:**

1. **WCAG AA Compliance**:
   - [ ] Test keyboard navigation
   - [ ] Test screen reader compatibility
   - [ ] Verify ARIA labels present
   - [ ] Verify focus indicators visible
   - [ ] Verify color contrast meets standards

2. **Form Accessibility**:
   - [ ] Verify label associations
   - [ ] Verify error message announcements
   - [ ] Verify required field indicators
   - [ ] Verify help text associations

### Step 3.7: Cross-Component Verification

**Verify related components/pages still work:**

1. **Parent Components**:
   - [ ] Test all parent components that use this component
   - [ ] Verify props passed correctly
   - [ ] Verify error handling works
   - [ ] Verify loading states work

2. **Child Components**:
   - [ ] Test all child components used by this component
   - [ ] Verify props passed correctly
   - [ ] Verify child component errors handled

3. **Related Pages**:
   - [ ] Test all pages that use this component
   - [ ] Test all pages that link to this page
   - [ ] Verify navigation flows work
   - [ ] Verify data flow works

4. **Shared State/Data**:
   - [ ] Verify Context providers work
   - [ ] Verify global state updates correctly
   - [ ] Verify cache invalidation works
   - [ ] Verify data consistency maintained

### Step 3.8: Regression Testing

**Verify existing features weren't broken:**

1. **Existing Functionality**:
   - [ ] Test related features that existed before
   - [ ] Verify no breaking changes introduced
   - [ ] Verify backward compatibility maintained

2. **Test Suite** (if exists):
   - [ ] Run all existing unit tests - MUST PASS
   - [ ] Run all existing integration tests - MUST PASS
   - [ ] Run all existing E2E tests - MUST PASS
   - [ ] Fix any failing tests

3. **Manual Regression**:
   - [ ] Test critical user flows
   - [ ] Test common user workflows
   - [ ] Test edge cases that existed before
   - [ ] Verify no functionality degraded

---

## Phase 4: FINAL QUALITY ASSURANCE

**Final checks before declaring complete.**

### Step 4.1: Code Quality Final Check

- [ ] **Linter Check**:
  ```bash
  # Run on ALL changed files
  read_lints(['file1.ts', 'file2.ts', ...])
  # MUST have zero errors
  ```

- [ ] **TypeScript Check**:
  ```bash
  pnpm type-check
  # MUST pass with no errors
  ```

- [ ] **Console Check**:
  - [ ] No `console.log` statements (use structured logger)
  - [ ] No `console.error` statements (use structured logger)
  - [ ] No `console.warn` statements (use structured logger)

- [ ] **Environment Variable Check**:
  - [ ] No direct `process.env` access for secrets (use secrets loaders)
  - [ ] All environment variables documented
  - [ ] All secrets use loaders

### Step 4.2: Database Quality Final Check

- [ ] **Security Advisors**:
  ```typescript
  const securityIssues = await mcp_supabase_get_advisors({ type: 'security' })
  // MUST have zero critical issues
  ```

- [ ] **Performance Advisors**:
  ```typescript
  const perfIssues = await mcp_supabase_get_advisors({ type: 'performance' })
  // MUST have zero critical issues
  ```

- [ ] **RLS Policies**:
  - [ ] All tables have RLS enabled
  - [ ] All policies use (SELECT auth.uid()) wrapper
  - [ ] All policy columns indexed
  - [ ] All operations have policies

- [ ] **Indexes**:
  - [ ] All foreign keys indexed
  - [ ] All RLS policy columns indexed
  - [ ] All WHERE clause columns indexed
  - [ ] All ORDER BY columns indexed

- [ ] **Types Regenerated**:
  ```typescript
  await mcp_supabase_generate_typescript_types()
  // Verify types in @supabase/types.ts updated
  ```

### Step 4.3: Documentation Updates

- [ ] **COMPONENT_INDEX.md** (if component changed):
  - [ ] Entry updated with new props/usage
  - [ ] Path correct
  - [ ] Description accurate
  - [ ] Dependencies listed

- [ ] **API_ROUTES_INDEX.md** (if API route changed):
  - [ ] Entry updated with new request/response format
  - [ ] Auth requirements correct
  - [ ] Rate limit preset correct
  - [ ] Description accurate

- [ ] **DATABASE_SCHEMA.md** (if schema changed):
  - [ ] Tables documented
  - [ ] Columns documented
  - [ ] Indexes documented
  - [ ] RLS policies documented

- [ ] **TYPE_DEFINITIONS_INDEX.md** (if types changed):
  - [ ] Types documented
  - [ ] Usage examples provided
  - [ ] Location correct

- [ ] **UTILITY_FUNCTIONS_INDEX.md** (if utilities changed):
  - [ ] Functions documented
  - [ ] Parameters documented
  - [ ] Return types documented
  - [ ] Examples provided

### Step 4.4: Final Browser Verification

**Complete browser testing one more time:**

1. **Navigate to Page**:
   ```typescript
   await mcp_cursor-ide-browser_browser_navigate({
     url: 'http://localhost:3000/[page]'
   })
   ```

2. **Take Snapshot**:
   ```typescript
   await mcp_cursor-ide-browser_browser_snapshot()
   ```

3. **Check Console**:
   ```typescript
   const messages = await mcp_cursor-ide-browser_browser_console_messages()
   // Verify NO errors
   ```

4. **Check Network**:
   ```typescript
   const requests = await mcp_cursor-ide-browser_browser_network_requests()
   // Verify all requests successful
   ```

5. **Test Complete Workflow**:
   - [ ] Complete happy path
   - [ ] Test error scenarios
   - [ ] Test edge cases
   - [ ] Verify all interactions work

### Step 4.5: Success Criteria Verification

**Verify ALL success criteria met:**

**Code Quality**:
- [x] All linter checks pass
- [x] TypeScript compilation succeeds
- [x] No console.log statements
- [x] No process.env direct access

**Database Quality**:
- [x] Security advisors pass (zero critical issues)
- [x] Performance advisors pass (zero critical issues)
- [x] RLS policies verified and working
- [x] All required indexes created
- [x] Types regenerated

**Browser Verification**:
- [x] Page loads without errors
- [x] All interactions work correctly
- [x] Forms submit successfully
- [x] Error scenarios handled gracefully
- [x] No console errors
- [x] Network requests successful

**Testing**:
- [x] All unit tests pass (if tests exist)
- [x] All integration tests pass (if tests exist)
- [x] All E2E tests pass (if tests exist)
- [x] Edge cases tested
- [x] Error scenarios tested

**Documentation**:
- [x] COMPONENT_INDEX.md updated (if applicable)
- [x] API_ROUTES_INDEX.md updated (if applicable)
- [x] DATABASE_SCHEMA.md updated (if applicable)
- [x] All reference docs updated

**Accessibility**:
- [x] WCAG AA compliant
- [x] Keyboard navigation works
- [x] Screen reader compatible
- [x] Color contrast meets standards

**Performance**:
- [x] Query performance targets met
- [x] Bundle size within budget
- [x] No performance regressions

**Workflow Compliance**:
- [x] Complete audit performed
- [x] All issues categorized and prioritized
- [x] Fixes implemented systematically
- [x] Verification after each fix
- [x] End-to-end testing completed
- [x] Cross-component verification completed
- [x] Regression testing completed

---

## 📋 COMPREHENSIVE AUDIT CHECKLIST

**Use this checklist to ensure nothing is missed:**

### Pre-Fix Phase (MANDATORY - Must Complete Before Fixing)

- [ ] **Step 1.1**: Codebase search completed (multiple semantic queries)
- [ ] **Step 1.2**: All related files read and analyzed
- [ ] **Step 1.3**: Complete issue audit performed (A through I)
- [ ] **Step 1.4**: Cross-component impact analysis completed
- [ ] **Step 1.5**: Database schema analysis completed (with MCP tools)
- [ ] **Step 1.6**: External documentation consulted
- [ ] **Step 1.7**: All issues categorized and prioritized

**Deliverable**: Comprehensive audit report with ALL issues found

### Fix Phase (SYSTEMATIC - One Category at a Time)

- [ ] **Step 2.1**: Implementation plan created
- [ ] **Step 2.2**: Critical issues fixed (with verification after each)
- [ ] **Step 2.3**: High priority issues fixed (with verification after each)
- [ ] **Step 2.4**: Medium priority issues fixed (with verification after each)
- [ ] **Step 2.5**: Low priority issues fixed (optional)

**Deliverable**: All issues fixed with verification passed

### Verification Phase (COMPREHENSIVE - End-to-End)

- [ ] **Step 3.1**: Complete workflow testing (happy path, error path, edge cases)
- [ ] **Step 3.2**: Browser automation testing completed
- [ ] **Step 3.3**: Database verification completed
- [ ] **Step 3.4**: Security verification completed
- [ ] **Step 3.5**: Performance verification completed
- [ ] **Step 3.6**: Accessibility verification completed
- [ ] **Step 3.7**: Cross-component verification completed
- [ ] **Step 3.8**: Regression testing completed

**Deliverable**: End-to-end verification report showing all tests passed

### Final QA Phase (COMPLETE - Before Declaring Done)

- [ ] **Step 4.1**: Code quality final check passed
- [ ] **Step 4.2**: Database quality final check passed
- [ ] **Step 4.3**: Documentation updates completed
- [ ] **Step 4.4**: Final browser verification completed
- [ ] **Step 4.5**: All success criteria verified

**Deliverable**: Final QA report showing all checks passed

---

## 🎯 DELIVERABLES

**Provide these deliverables in your response:**

### 1. Comprehensive Audit Report

- Complete issue list (categorized and prioritized)
- Cross-component impact map
- Database audit results (with MCP tool outputs)
- External documentation references
- Risk assessment

### 2. Implementation Report

- All fixes applied (with before/after code references)
- Verification results after each fix
- Integration test results
- Regression test results

### 3. End-to-End Verification Report

- Complete workflow test results
- Browser automation test results
- Database verification results
- Security verification results
- Performance verification results
- Accessibility verification results
- Cross-component verification results
- Regression test results

### 4. Final QA Report

- Code quality check results
- Database quality check results
- Documentation update verification
- Final browser verification
- Success criteria checklist

---

## 🚨 CRITICAL REMINDERS

**Before you finish, verify:**

1. ✅ **ALL issues found before fixing ANY**
2. ✅ **Verification after EACH fix**
3. ✅ **End-to-end testing completed**
4. ✅ **Cross-component verification completed**
5. ✅ **Regression testing completed**
6. ✅ **All success criteria met**
7. ✅ **Documentation updated**
8. ✅ **No console errors**
9. ✅ **No type errors**
10. ✅ **No linting errors**

**DO NOT declare complete until ALL phases are done and ALL checks pass!**

---

## 📝 Usage Instructions

1. **Copy the prompt above** (everything in this document)

2. **Link the component/page** you want audited and fixed:
   ```
   Component: @frontend/src/components/ComponentName.tsx
   Page: @frontend/src/app/page/page.tsx
   ```

3. **Add specific context** if needed:
   ```
   Context: This component handles booking creation and needs to integrate with Stripe payments.
   ```

4. **Paste and send** - I'll provide:
   - Complete audit (ALL issues found)
   - Systematic fixes (with verification)
   - End-to-end verification (complete testing)
   - Final QA report (all checks passed)

---

**Remember**: This is a COMPREHENSIVE audit and fix process. Take your time, be thorough, and verify everything end-to-end!




