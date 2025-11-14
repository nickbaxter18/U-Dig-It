# Feature Development Plan Template

## Overview
**Feature Name:** {feature_name}
**Description:** {feature_description}
**Priority:** {High|Medium|Low}
**Estimated Time:** {hours}

---

## Phase 1: Database Schema

### Tasks
- [ ] Create migration file
- [ ] Define table structure
- [ ] Add indexes (foreign keys, WHERE clauses, sort columns)
- [ ] Enable Row-Level Security (RLS)
- [ ] Create RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Add updated_at trigger
- [ ] Generate TypeScript types
- [ ] Test migration in branch

### Acceptance Criteria
- [ ] Migration runs successfully
- [ ] RLS policies tested with different user roles
- [ ] Indexes created and verified
- [ ] Types generated correctly

---

## Phase 2: API Routes

### Tasks
- [ ] Create API route file
- [ ] Add authentication check
- [ ] Implement input validation (Zod schema)
- [ ] Add input sanitization
- [ ] Implement rate limiting
- [ ] Add business logic
- [ ] Implement error handling
- [ ] Add structured logging
- [ ] Write API tests

### Acceptance Criteria
- [ ] Authentication required
- [ ] Input validation works
- [ ] Rate limiting enforced
- [ ] Error handling comprehensive
- [ ] Tests passing (80% coverage)

---

## Phase 3: Frontend Components

### Tasks
- [ ] Create component files
- [ ] Add state management
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Implement accessibility (ARIA, keyboard nav)
- [ ] Add responsive design
- [ ] Write component tests
- [ ] Add Storybook stories (if applicable)

### Acceptance Criteria
- [ ] Component renders correctly
- [ ] State management works
- [ ] Error handling implemented
- [ ] Accessibility verified (WCAG AA)
- [ ] Responsive on all devices
- [ ] Tests passing

---

## Phase 4: Integration

### Tasks
- [ ] Connect frontend to API
- [ ] Handle API errors in UI
- [ ] Add loading indicators
- [ ] Implement optimistic updates (if applicable)
- [ ] Add success/error notifications
- [ ] Test end-to-end flow

### Acceptance Criteria
- [ ] Frontend connects to API
- [ ] Error handling works end-to-end
- [ ] User feedback clear
- [ ] E2E tests passing

---

## Phase 5: Testing

### Tasks
- [ ] Unit tests (business logic)
- [ ] Integration tests (API routes)
- [ ] E2E tests (user journeys)
- [ ] Accessibility tests
- [ ] Performance tests (if applicable)
- [ ] Security tests (if applicable)

### Acceptance Criteria
- [ ] 80% code coverage minimum
- [ ] All tests passing
- [ ] No accessibility violations
- [ ] Performance budgets met

---

## Phase 6: Documentation

### Tasks
- [ ] Update API documentation
- [ ] Add component documentation
- [ ] Update README if needed
- [ ] Document any breaking changes

### Acceptance Criteria
- [ ] Documentation complete
- [ ] Examples provided
- [ ] Breaking changes documented

---

## Notes
- Follow Supabase MCP tools for database operations
- Use security standards for all API routes
- Follow business logic rules for domain logic
- Maintain 80% test coverage

