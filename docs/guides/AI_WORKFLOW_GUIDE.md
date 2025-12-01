# AI Workflow Optimization Guide

**Purpose**: Comprehensive guide for systematic AI-assisted development workflows, proactive quality checks, and tool integration.

---

## 🎯 Overview

This guide implements a systematic approach to development that:
- **Prevents errors** through proactive checks
- **Reuses patterns** through codebase exploration
- **Ensures quality** through comprehensive verification
- **Integrates tools** for maximum efficiency

---

## 📋 Pre-Implementation Workflow

### Step 1: Codebase Search

**ALWAYS search before implementing:**

```typescript
// Search for similar implementations
codebase_search({
  query: "How is [similar feature] implemented?",
  target_directories: []
});
```

**What to search for:**
- Similar components
- Similar API routes
- Similar database patterns
- Similar business logic

**Why:** Reuse existing patterns, maintain consistency, avoid duplication.

---

### Step 2: Check Reference Indexes

**ALWAYS check these files:**

1. **COMPONENT_INDEX.md** - Find similar components
2. **API_ROUTES_INDEX.md** - Find similar endpoints
3. **AI_CODING_REFERENCE.md** - Find established patterns

**Why:** Quick reference to existing code, patterns, and conventions.

---

### Step 3: Consult External Documentation

**When to consult docs:**
- Implementing Supabase features → Use Supabase MCP docs
- Implementing Stripe features → Use Stripe MCP docs
- Using libraries → Use Context7 docs
- General questions → Use web search

**How to consult:**

```typescript
// Supabase docs
mcp_supabase_search_docs({
  graphql_query: "query { searchDocs(query: \"RLS policies\") { ... } }"
});

// Stripe docs
mcp_Stripe_search_stripe_documentation({
  question: "How to implement payment intents?",
  language: "node"
});

// Library docs (Context7)
mcp_Context7_resolve_library_id({ libraryName: "next.js" });
mcp_Context7_get_library_docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "server components"
});
```

**Why:** Ensure alignment with best practices, avoid common pitfalls.

---

### Step 4: Create Todo List (Complex Tasks)

**When to create todos:**
- Tasks with 3+ distinct steps
- Multi-component features
- Complex integrations

**How to create:**

```typescript
todo_write({
  merge: false,
  todos: [
    { id: "1", status: "in_progress", content: "Create database schema" },
    { id: "2", status: "pending", content: "Implement API route" },
    { id: "3", status: "pending", content: "Create UI component" },
    { id: "4", status: "pending", content: "Add tests" }
  ]
});
```

**Why:** Track progress, organize complex work, ensure completeness.

---

### Step 5: Verify Database Schema (DB Changes)

**Before database changes:**

```typescript
// Check current schema
mcp_supabase_list_tables({ schemas: ["public"] });

// Check existing migrations
mcp_supabase_list_migrations();
```

**Why:** Understand current state, avoid conflicts, plan migrations.

---

## 🔨 Implementation Workflow

### Pattern Reuse First

**ALWAYS reuse existing patterns:**

1. Found similar component? → Adapt it
2. Found similar API route? → Follow its structure
3. Found similar database pattern? → Use same approach

**Example:**

```typescript
// ✅ CORRECT - Reusing pattern
// Found BookingForm component, adapting for EquipmentForm
// Following same structure: validation → submission → error handling

// ❌ WRONG - Creating from scratch
// Starting new component without checking existing patterns
```

---

### Incremental Development

**Build in small steps:**

1. Implement core functionality
2. Verify it works
3. Add features incrementally
4. Test each step

**Why:** Easier debugging, faster feedback, better quality.

---

### Type Safety

**ALWAYS use generated types:**

```typescript
import { Database } from '@/../../supabase/types';

const supabase = createClient<Database>();

// Type-safe queries
const { data } = await supabase
  .from('bookings')
  .select('id, bookingNumber, status');
```

**Why:** Catch errors early, better IDE support, documentation.

---

## ✅ Post-Implementation Verification

### Step 1: Linter Checks

**ALWAYS check lints:**

```typescript
read_lints({ paths: ["path/to/changed/files"] });
```

**What to fix:**
- Type errors
- Linting errors
- Formatting issues
- Unused imports

**Why:** Catch errors early, maintain code quality.

---

### Step 2: Supabase Advisors (DB Changes)

**For database changes:**

```typescript
// Security checks
const securityIssues = await mcp_supabase_get_advisors({ type: "security" });

// Performance checks
const perfIssues = await mcp_supabase_get_advisors({ type: "performance" });
```

**What to check:**
- Missing RLS policies
- Unindexed foreign keys
- Performance issues
- Security vulnerabilities

**Why:** Prevent security issues, optimize performance.

---

### Step 3: Browser Verification (UI Changes)

**For UI changes:**

```typescript
// Navigate to page
mcp_cursor-browser-extension_browser_navigate({
  url: "http://localhost:3000/feature-page"
});

// Take snapshot
mcp_cursor-browser-extension_browser_snapshot();

// Capture screenshot
mcp_cursor-browser-extension_browser_take_screenshot({
  filename: "feature-verification.png"
});

// Test interactions
mcp_cursor-browser-extension_browser_click({
  element: "Submit button",
  ref: "button-ref"
});
```

**What to verify:**
- Visual appearance
- Interactions work
- No console errors
- Responsive design

**Why:** Ensure UI works correctly, catch visual bugs.

---

### Step 4: Test Suggestions

**ALWAYS suggest tests:**

- **Unit tests** for business logic
- **Integration tests** for API routes
- **E2E tests** for user flows
- **Visual regression** for UI changes

**Example:**

```typescript
// ✅ Suggest unit test
describe('calculateBookingTotal', () => {
  it('calculates correctly with delivery fee', () => {
    // Test implementation
  });
});

// ✅ Suggest integration test
describe('POST /api/bookings', () => {
  it('creates booking successfully', () => {
    // Test implementation
  });
});
```

**Why:** Ensure code works, prevent regressions, document behavior.

---

### Step 5: Common Mistake Checks

**Checklist:**

- [ ] **RLS enabled** on new tables?
- [ ] **Foreign keys indexed**?
- [ ] **Input validation** server-side?
- [ ] **Error handling** implemented?
- [ ] **Logging** added?
- [ ] **Type safety** verified?
- [ ] **Accessibility** considered?

**Why:** Prevent common mistakes, ensure quality.

---

## 🔗 Tool Integration Workflows

### Supabase + Testing

**Test migrations in branch:**

```typescript
// Create test branch
const branch = await mcp_supabase_create_branch({
  name: "test-new-feature"
});

// Apply migration
await mcp_supabase_apply_migration({
  name: "add_new_table",
  query: "CREATE TABLE ..."
});

// Test thoroughly
// ... run tests ...

// Merge if successful
await mcp_supabase_merge_branch({ branch_id: branch.id });
```

---

### Browser + Documentation

**Verify against docs:**

```typescript
// Navigate to documentation
mcp_cursor-browser-extension_browser_navigate({
  url: "https://supabase.com/docs/guides/auth/row-level-security"
});

// Capture relevant sections
mcp_cursor-browser-extension_browser_take_screenshot({
  filename: "rls-docs-reference.png"
});

// Verify implementation matches
```

---

### Codebase Search + Pattern Reuse

**Find and reuse patterns:**

```typescript
// Search for authentication pattern
codebase_search({
  query: "How is user authentication verified in API routes?",
  target_directories: ["frontend/src/app/api"]
});

// Found pattern: Use createClient from '@/lib/supabase/server'
// Reuse same pattern in new route
```

---

## 🛡️ Proactive Error Prevention

### Common Mistakes Checklist

**Database:**
- [ ] RLS enabled on all user-facing tables
- [ ] Foreign keys indexed
- [ ] Updated_at triggers added
- [ ] Proper ON DELETE behavior

**API Routes:**
- [ ] Authentication verified
- [ ] Input validation (Zod + sanitization)
- [ ] Error handling implemented
- [ ] Rate limiting applied
- [ ] Logging added

**Frontend:**
- [ ] Type safety verified
- [ ] Error boundaries added
- [ ] Loading states handled
- [ ] Accessibility considered

---

## 📚 Documentation Integration

### When to Consult Docs

**Supabase:**
- RLS policies
- Storage operations
- Edge Functions
- Auth flows
- Realtime subscriptions

**Next.js:**
- Server Components
- Middleware
- Routing
- Data fetching

**Stripe:**
- PaymentIntents
- Checkout
- Webhooks
- Disputes

**Libraries:**
- Radix UI
- Testing frameworks
- Utility libraries

---

## 🧪 Testing Integration

### Test-First Mindset

**When to write tests:**

1. **New business logic** → Unit tests
2. **New API routes** → Integration tests
3. **New user flows** → E2E tests
4. **UI changes** → Visual regression tests

**Test structure:**

```typescript
// Unit test example
describe('Business Logic', () => {
  it('handles edge cases', () => {
    // Test implementation
  });
});

// Integration test example
describe('API Route', () => {
  it('returns correct response', () => {
    // Test implementation
  });
});

// E2E test example
describe('User Flow', () => {
  it('completes booking flow', async () => {
    // Browser automation
  });
});
```

---

## ⚡ Performance Monitoring

### Regular Checks

**After database changes:**

```typescript
// Check performance advisors
const perfAdvisors = await mcp_supabase_get_advisors({
  type: "performance"
});

// Review suggestions
// - Missing indexes
// - Slow queries
// - Optimization opportunities
```

**After query changes:**

- Verify indexes are used
- Check query plans
- Monitor query times
- Optimize slow queries

---

## 📊 Complete Workflow Checklist

### Pre-Implementation
- [ ] Codebase searched for similar patterns
- [ ] Component/API indexes checked
- [ ] External documentation consulted
- [ ] Todo list created (if complex)
- [ ] Database schema verified (if DB changes)

### Implementation
- [ ] Patterns reused from codebase
- [ ] Standards followed (TypeScript, security, etc.)
- [ ] Types verified (generated types used)
- [ ] Incremental development approach
- [ ] Code is readable and maintainable

### Post-Implementation
- [ ] Linter checks passed
- [ ] Supabase advisors checked (if DB changes)
- [ ] Browser verification done (if UI changes)
- [ ] Tests suggested or written
- [ ] Common mistakes avoided

### Quality Gate
- [ ] All checks passed
- [ ] Issues fixed
- [ ] Documentation updated
- [ ] Ready for review

---

## 🎯 Quick Reference

### Before Starting
1. Search codebase
2. Check indexes
3. Consult docs
4. Create todos (if needed)

### During Development
1. Reuse patterns
2. Follow standards
3. Verify types
4. Build incrementally

### After Development
1. Check lints
2. Run advisors
3. Verify in browser
4. Suggest tests

### Before Committing
1. All checks passed
2. Issues fixed
3. Documentation updated
4. Ready for review

---

## 🔍 Comprehensive Audit & Fix Process

**For thorough, end-to-end component/page fixes:**

Use the **Comprehensive Component/Page Audit & Fix Prompt** when you need:
- Complete audit of ALL issues (not just one)
- Systematic fixes with verification after each
- End-to-end testing after all fixes
- Cross-component verification
- Regression testing

**Reference**: `docs/guides/COMPREHENSIVE_COMPONENT_AUDIT_AND_FIX.md`

**Key Features**:
- **Complete Audit FIRST** - Find ALL issues before fixing ANY
- **Categorize & Prioritize** - Organize all issues before fixing
- **Systematic Fixes** - One category at a time with verification
- **End-to-End Verification** - Complete testing after all fixes
- **Cross-Component Checks** - Verify related components still work
- **Regression Testing** - Ensure existing features weren't broken

**When to Use**:
- Fixing existing components/pages with issues
- Comprehensive refactoring
- Major bug fixes affecting multiple components
- Quality assurance audits

**When NOT to Use**:
- Simple, single-issue fixes (use regular workflow)
- New component creation (use component development workflow)
- New API route creation (use API route development workflow)

---

## 📖 Related Documents

- **AI_CODING_REFERENCE.md** - Coding patterns and quick reference
- **COMPONENT_INDEX.md** - Component catalog
- **API_ROUTES_INDEX.md** - API endpoint catalog
- **QUICK_COMMANDS.md** - Command reference
- **.cursor/rules/ai-workflow-optimization.mdc** - Workflow rules
- **COMPREHENSIVE_COMPONENT_AUDIT_AND_FIX.md** - Comprehensive audit & fix process

---

**Remember**:
- 🔍 **Search FIRST, code SECOND**
- 📚 **Docs BEFORE implementation**
- ✅ **Verify AFTER changes**
- 🧪 **Tests WITH features**
- 🛡️ **Quality gates ALWAYS**
