# AI Workflow Checklists - Quick Reference

**Purpose**: Quick reference checklists for systematic development workflows.

---

## ✅ Pre-Implementation Checklist

**Before writing ANY code:**

- [ ] **Codebase Search**
  - [ ] Searched for similar components/features
  - [ ] Found existing patterns to reuse
  - [ ] Identified similar API routes

- [ ] **Reference Indexes**
  - [ ] Checked `COMPONENT_INDEX.md` for similar components
  - [ ] Checked `API_ROUTES_INDEX.md` for similar endpoints
  - [ ] Reviewed `AI_CODING_REFERENCE.md` for patterns

- [ ] **External Documentation**
  - [ ] Consulted Supabase docs (if DB/auth changes)
  - [ ] Consulted Stripe docs (if payment changes)
  - [ ] Consulted Next.js docs (if routing/features)
  - [ ] Consulted library docs (if using new library)

- [ ] **Task Planning**
  - [ ] Created todo list (if 3+ steps)
  - [ ] Broken down complex task into steps
  - [ ] Identified dependencies

- [ ] **Database Schema** (if DB changes)
  - [ ] Verified current schema
  - [ ] Checked existing migrations
  - [ ] Planned migration approach

---

## 🔨 Implementation Checklist

**During development:**

- [ ] **Pattern Reuse**
  - [ ] Reusing existing component patterns
  - [ ] Following established API route structure
  - [ ] Using existing utilities/functions

- [ ] **Code Quality**
  - [ ] TypeScript strict mode
  - [ ] Proper type definitions
  - [ ] Error handling implemented
  - [ ] Logging added

- [ ] **Security**
  - [ ] Input validation (server-side)
  - [ ] Authentication verified
  - [ ] Authorization checked
  - [ ] Rate limiting applied (API routes)

- [ ] **Database** (if DB changes)
  - [ ] RLS enabled on new tables
  - [ ] Foreign keys indexed
  - [ ] Updated_at triggers added
  - [ ] Proper ON DELETE behavior

- [ ] **Incremental Development**
  - [ ] Built in small steps
  - [ ] Verified each step works
  - [ ] Tested incrementally

---

## ✅ Post-Implementation Checklist

**After writing code:**

- [ ] **Linter Checks**
  - [ ] Ran `read_lints` on changed files
  - [ ] Fixed all type errors
  - [ ] Fixed all linting errors
  - [ ] Removed unused imports

- [ ] **Supabase Advisors** (if DB changes)
  - [ ] Ran security advisors
  - [ ] Ran performance advisors
  - [ ] Fixed identified issues

- [ ] **Browser Verification** (if UI changes)
  - [ ] Navigated to page
  - [ ] Took snapshot
  - [ ] Tested interactions
  - [ ] Checked console for errors
  - [ ] Verified responsive design

- [ ] **Test Suggestions**
  - [ ] Suggested unit tests (business logic)
  - [ ] Suggested integration tests (API routes)
  - [ ] Suggested E2E tests (user flows)
  - [ ] Suggested visual regression (UI changes)

- [ ] **Common Mistakes**
  - [ ] RLS enabled (if new table)
  - [ ] Foreign keys indexed
  - [ ] Input validation server-side
  - [ ] Error handling implemented
  - [ ] Logging added
  - [ ] Type safety verified

---

## 🛡️ Quality Gate Checklist

**Before committing:**

- [ ] **Pre-Implementation** - All steps completed
- [ ] **Implementation** - All standards followed
- [ ] **Post-Implementation** - All checks passed
- [ ] **Documentation** - Updated if needed
- [ ] **Tests** - Written or suggested
- [ ] **Ready for Review** - All issues resolved

---

## 🔍 Quick Search Checklist

**When searching codebase:**

- [ ] Searched for similar component names
- [ ] Searched for similar API route patterns
- [ ] Searched for similar database patterns
- [ ] Searched for similar business logic
- [ ] Found and reviewed existing implementations

---

## 📚 Documentation Checklist

**When consulting docs:**

- [ ] Identified relevant documentation source
- [ ] Searched documentation for feature
- [ ] Reviewed examples/patterns
- [ ] Verified implementation matches docs
- [ ] Noted any deviations and reasons

---

## 🧪 Testing Checklist

**When writing tests:**

- [ ] **Unit Tests**
  - [ ] Business logic functions tested
  - [ ] Edge cases covered
  - [ ] Error cases handled

- [ ] **Integration Tests**
  - [ ] API routes tested
  - [ ] Database operations tested
  - [ ] Authentication/authorization tested

- [ ] **E2E Tests**
  - [ ] User flows tested
  - [ ] Browser automation used
  - [ ] Critical paths covered

- [ ] **Visual Regression**
  - [ ] UI changes captured
  - [ ] Screenshots taken
  - [ ] Visual differences reviewed

---

## 🗄️ Database Change Checklist

**For any database changes:**

- [ ] **Pre-Change**
  - [ ] Current schema verified
  - [ ] Migration planned
  - [ ] Test branch created (if complex)

- [ ] **Migration**
  - [ ] Uses `mcp_supabase_apply_migration`
  - [ ] Snake_case naming
  - [ ] NOT NULL constraints
  - [ ] Foreign keys with ON DELETE
  - [ ] Indexes for foreign keys
  - [ ] Updated_at triggers

- [ ] **RLS Policies**
  - [ ] RLS enabled on table
  - [ ] Policies for SELECT/INSERT/UPDATE/DELETE
  - [ ] Uses `(SELECT auth.uid())` wrapper
  - [ ] Policy columns indexed

- [ ] **Post-Change**
  - [ ] Security advisors checked
  - [ ] Performance advisors checked
  - [ ] Types regenerated
  - [ ] Tested with different roles

---

## 🎨 UI Change Checklist

**For any UI changes:**

- [ ] **Pre-Change**
  - [ ] Similar components reviewed
  - [ ] Design patterns checked
  - [ ] Accessibility considered

- [ ] **Implementation**
  - [ ] TypeScript types used
  - [ ] Tailwind classes applied
  - [ ] Error states handled
  - [ ] Loading states handled
  - [ ] Accessibility attributes added

- [ ] **Post-Change**
  - [ ] Browser verification done
  - [ ] Screenshot captured
  - [ ] Interactions tested
  - [ ] Console errors checked
  - [ ] Responsive design verified

---

## 🔌 API Route Checklist

**For any API route:**

- [ ] **Pre-Implementation**
  - [ ] Similar routes reviewed
  - [ ] Authentication pattern checked
  - [ ] Validation pattern checked

- [ ] **Implementation**
  - [ ] Rate limiting added
  - [ ] Request validation added
  - [ ] Authentication verified
  - [ ] Authorization checked
  - [ ] Input sanitization added
  - [ ] Error handling implemented
  - [ ] Logging added
  - [ ] Proper status codes returned

- [ ] **Post-Implementation**
  - [ ] Linter checks passed
  - [ ] Integration tests suggested
  - [ ] Error cases tested
  - [ ] Rate limiting verified

---

## 🚨 Emergency Checklist

**For critical issues:**

- [ ] **Immediate Response**
  - [ ] Issue identified
  - [ ] Impact assessed
  - [ ] Rollback plan ready

- [ ] **Investigation**
  - [ ] Logs checked
  - [ ] Supabase advisors checked
  - [ ] Browser console checked
  - [ ] Root cause identified

- [ ] **Fix**
  - [ ] Fix implemented
  - [ ] All checks passed
  - [ ] Tested thoroughly
  - [ ] Deployed safely

---

## 📊 Complete Workflow Checklist

**For every development task:**

### Pre-Implementation
- [ ] Codebase searched
- [ ] Indexes checked
- [ ] Docs consulted
- [ ] Todos created (if needed)
- [ ] Schema verified (if DB changes)

### Implementation
- [ ] Patterns reused
- [ ] Standards followed
- [ ] Types verified
- [ ] Incremental approach
- [ ] Code quality maintained

### Post-Implementation
- [ ] Lints checked
- [ ] Advisors run (if DB changes)
- [ ] Browser verified (if UI changes)
- [ ] Tests suggested
- [ ] Common mistakes avoided

### Quality Gate
- [ ] All checks passed
- [ ] Issues fixed
- [ ] Documentation updated
- [ ] Ready for review

---

## 🎯 Quick Reference

**Before Starting:**
1. Search codebase
2. Check indexes
3. Consult docs
4. Create todos (if needed)

**During Development:**
1. Reuse patterns
2. Follow standards
3. Verify types
4. Build incrementally

**After Development:**
1. Check lints
2. Run advisors
3. Verify in browser
4. Suggest tests

**Before Committing:**
1. All checks passed
2. Issues fixed
3. Documentation updated
4. Ready for review

---

**Related Documents:**
- `docs/reference/AI_WORKFLOW_GUIDE.md` - Comprehensive workflow guide
- `docs/reference/AI_CODING_REFERENCE.md` - Coding patterns reference
- `.cursor/rules/ai-workflow-optimization.mdc` - Workflow rules
