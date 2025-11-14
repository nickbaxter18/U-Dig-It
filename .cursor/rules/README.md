# Cursor Rules - Condensed & Optimized

## 🎯 Overview

This directory contains a **streamlined set of 6 core rules** designed for optimal AI model performance. The previous 54+ rule files have been consolidated to eliminate redundancy and reduce context overhead.

---

## 📋 Core Rules (Always Applied)

### 1. **CORE.mdc** - Development Standards & AI Assistance
**Size**: ~400 lines
**Scope**: Core development patterns, TypeScript standards, reasoning frameworks

**What it covers**:
- AI coding assistance optimization
- Quick reference file usage (AI_CODING_REFERENCE.md, COMPONENT_INDEX.md)
- TypeScript & code quality standards
- Extension integration (Error Lens, Code Spell Checker, Todo Tree)
- Performance optimization patterns
- Reasoning & problem-solving frameworks
- Security & input validation basics
- Logging standards
- Frontend startup protocol
- Testing basics
- Accessibility standards

**When to apply**: Always (foundational)

---

### 2. **SUPABASE.mdc** - Backend & Database Operations
**Size**: ~450 lines
**Scope**: All Supabase operations, RLS, migrations, database design

**What it covers**:
- Supabase MCP tool usage (HIGHEST PRIORITY)
- Database design standards (naming, indexing, constraints)
- Row-Level Security (RLS) policies and patterns
- Authentication & authorization
- Type safety with generated types
- Query optimization
- Migration safety protocols
- Storage best practices
- Monitoring & debugging

**When to apply**: Always (backend operations)

---

### 3. **BUSINESS.mdc** - Domain Logic & Rental Operations
**Size**: ~400 lines
**Scope**: Equipment rental business logic, workflows, pricing

**What it covers**:
- Equipment management & status tracking
- Booking workflow (multi-step process)
- Dynamic pricing strategy (seasonal, duration, delivery)
- Payment processing & schedules
- Customer communication & notifications
- Safety & compliance (operator certification, inspections)
- Inventory & location tracking
- Reporting & analytics
- Local market considerations (New Brunswick regulations)

**When to apply**: Always (business features)

---

### 4. **SECURITY.mdc** - Security & Compliance
**Size**: ~450 lines
**Scope**: Security protocols, threat protection, compliance

**What it covers**:
- Snyk security integration (mandatory scanning)
- Input validation & sanitization (multi-layer)
- XSS, SQL injection prevention
- Authentication & authorization patterns
- Rate limiting & DoS protection
- Data protection & privacy (PII handling, audit logging)
- Secure API design (headers, CORS)
- Secret management
- Dependency security
- Incident response protocols
- Compliance requirements (PIPEDA, PCI-DSS)
- Secure payment processing (Stripe)

**When to apply**: Always (security critical)

---

### 5. **TESTING.mdc** - Testing & Quality Assurance
**Size**: ~400 lines
**Scope**: Testing standards, browser automation, QA protocols

**What it covers**:
- Testing philosophy & pyramid
- Browser testing & automation (test account, login procedures)
- Unit testing standards
- Integration testing (API routes, database)
- E2E testing scenarios
- Test data management
- Performance testing
- Accessibility testing
- Visual regression testing
- Test coverage requirements (80% minimum)
- CI/CD integration
- Testing best practices (AAA pattern, isolation, descriptive names)

**When to apply**: Always (quality assurance)

---

### 6. **ai-workflow-optimization.mdc** - Workflow Optimization & Quality Gates
**Size**: ~400 lines
**Scope**: Systematic development workflows, proactive quality checks, documentation integration

**What it covers**:
- Pre-implementation workflow (codebase search, index checks, doc consultation)
- Implementation best practices (pattern reuse, incremental development)
- Post-implementation verification (linter checks, advisors, browser verification)
- Quality gate checklist (mandatory checks before committing)
- Tool integration workflows (Supabase + Testing, Browser + Docs)
- Proactive error prevention (common mistakes checklist)
- Documentation integration (when/how to consult external docs)
- Testing integration (test-first mindset)
- Performance monitoring (regular checks)
- Workflow execution order (standard development flow)

**When to apply**: Always (workflow optimization)

---

## 📁 Specialized Rules (Agent-Requested Only)

These rules are **NOT always loaded**. The AI can choose to load them when relevant based on the task context.

### Design & UX
- `design-accessibility.mdc` - WCAG compliance, inclusive design
- `design-colors-typography.mdc` - Color theory, brand guidelines
- `design-components.mdc` - Component design standards
- `design-layout-spacing.mdc` - Layout systems, spacing guidelines

**When to use**: When working on UI/UX design tasks

---

### Advanced Problem-Solving
- `advanced-problem-solving.mdc` - Complex problem decomposition
- `advanced-prompting-techniques.mdc` - Creative problem-solving
- `complex-problem-solving.mdc` - Multi-step reasoning

**When to use**: When facing complex architectural decisions or challenging technical problems

---

### Performance & Optimization
- `performance-critical-optimization.mdc` - Critical performance issues
- `performance-optimization.mdc` - General performance patterns

**When to use**: When dealing with performance bottlenecks or optimization tasks

---

### System Architecture & Operations
- `distributed-systems-operations.mdc` - Distributed systems patterns
- `system-architecture.mdc` - Architecture patterns, microservices
- `emergency-response.mdc` - Crisis management, rapid deployment

**When to use**: When working on system architecture or handling emergencies

---

### Documentation & Testing (Specialized)
- `documentation-excellence.mdc` - Technical writing best practices
- `e2e-testing-quality-assurance.mdc` - Advanced E2E testing
- `test-management-framework.mdc` - Test data management
- `testing-scenarios.mdc` - Edge case handling

**When to use**: When writing documentation or advanced testing scenarios

---

### Privacy & Compliance
- `privacy-human-centered-design.mdc` - Privacy protection, human-centered design
- `security-compliance.mdc` - Comprehensive security protocols

**When to use**: When dealing with privacy-sensitive features or compliance requirements

---

## 🗑️ Deprecated Rules (Archived)

The following rules are **DEPRECATED** and should **NOT** be used:

- ❌ `api-database-standards.mdc` - Replaced by SUPABASE.mdc
- ❌ `backend-development.mdc` - NestJS backend is inactive
- ❌ `murmuration-coordinator.mdc` - Redundant coordination logic
- ❌ `rental-platform-coordinator.mdc` - Redundant coordination logic
- ❌ `rule-design-excellence-framework.mdc` - Meta-rule, not needed
- ❌ `cognitive-architecture.mdc` - Consolidated into CORE.mdc
- ❌ `ai-coding-assistance.mdc` - Consolidated into CORE.mdc
- ❌ `browser-testing-login.mdc` - Consolidated into TESTING.mdc
- ❌ `ethical-ai-responsibility.mdc` - Moved to agent-requested
- ❌ `extension-integration.mdc` - Consolidated into CORE.mdc
- ❌ `frontend-startup-protocol.mdc` - Consolidated into CORE.mdc
- ❌ `kubota-business-logic.mdc` - Consolidated into BUSINESS.mdc
- ❌ `rental-business-logic.mdc` - Consolidated into BUSINESS.mdc
- ❌ `rental-payment-security.mdc` - Consolidated into SECURITY.mdc
- ❌ `rental-performance-optimization.mdc` - Consolidated into CORE.mdc
- ❌ `rental-testing-quality-assurance.mdc` - Consolidated into TESTING.mdc
- ❌ `supabase-backend-priority.mdc` - Consolidated into SUPABASE.mdc
- ❌ `supabase-excellence.mdc` - Consolidated into SUPABASE.mdc

These files have been moved to `.cursor/rules/archive/`.

---

## 📊 Benefits of Condensed Structure

### Before (Problems)
- ❌ 54+ rule files
- ❌ 15+ always-applied rules
- ❌ Massive context overhead (~100K+ tokens)
- ❌ Overlapping guidance causing confusion
- ❌ Models struggling with too much context

### After (Solutions)
- ✅ **6 core rules** (always applied)
- ✅ **~2,500 lines total** (vs. 10,000+ before)
- ✅ **Minimal context overhead** (~55K tokens)
- ✅ **Clear, non-overlapping guidance**
- ✅ **Models working optimally**

---

## 🎯 Rule Selection Guide

### Starting a Task
**Ask yourself**: What am I working on?

#### Frontend Component
**Load**: CORE.mdc (always) + design-components.mdc (if needed)

#### API Route
**Load**: CORE.mdc + SUPABASE.mdc + SECURITY.mdc (always)

#### Business Logic
**Load**: CORE.mdc + BUSINESS.mdc + SUPABASE.mdc (always)

#### Testing
**Load**: CORE.mdc + TESTING.mdc (always)

#### Performance Issue
**Load**: CORE.mdc + SUPABASE.mdc + performance-critical-optimization.mdc

#### Security Incident
**Load**: SECURITY.mdc + emergency-response.mdc

---

## 🔄 Migration from Old Rules

If you have bookmarks or references to old rules, here's the mapping:

| Old Rule | New Location |
|-----|---|
| `ai-coding-assistance.mdc` | CORE.mdc (Section 1) |
| `browser-testing-login.mdc` | TESTING.mdc (Section 2) |
| `development-standards.mdc` | CORE.mdc (Sections 2-10) |
| `supabase-backend-priority.mdc` | SUPABASE.mdc (Section 1) |
| `supabase-excellence.mdc` | SUPABASE.mdc (Sections 2-10) |
| `kubota-business-logic.mdc` | BUSINESS.mdc (Sections 1-10) |
| `rental-business-logic.mdc` | BUSINESS.mdc (Sections 2-9) |
| `security-compliance.mdc` | SECURITY.mdc (Sections 1-12) |
| `rental-payment-security.mdc` | SECURITY.mdc (Section 12) |
| `testing-quality-assurance.mdc` | TESTING.mdc (Sections 1-12) |
| `rental-testing-quality-assurance.mdc` | TESTING.mdc (Sections 3-4) |

---

## 📝 Quick Reference Files

**Don't forget to use these** (they're faster than rules):

- `docs/reference/AI_CODING_REFERENCE.md` - Main coding patterns & examples
- `docs/reference/COMPONENT_INDEX.md` - Existing components catalog
- `docs/reference/API_ROUTES_INDEX.md` - API endpoints catalog
- `docs/reference/QUICK_COMMANDS.md` - Command reference

**Always check these BEFORE creating new components or APIs!**

---

## ✅ Validation Checklist

When working with the new rule structure:

- [ ] Only 6 core rules are "always applied"
- [ ] Specialized rules loaded only when needed
- [ ] No deprecated rules referenced
- [ ] Quick reference files checked first
- [ ] Rule guidance is clear and actionable
- [ ] No overlapping or contradictory guidance

---

## 🚀 Performance Impact

### Context Window Usage
- **Before**: ~100K tokens (rules) + ~50K tokens (code) = **150K total**
- **After**: ~55K tokens (rules) + ~50K tokens (code) = **105K total**
- **Savings**: **30% reduction** in context usage

### Model Performance
- **Response Quality**: ✅ Improved (less confusion from overlap)
- **Response Speed**: ✅ Faster (less context to process)
- **Accuracy**: ✅ Better (clearer guidance)
- **Hallucinations**: ✅ Reduced (less contradiction)

---

## 📚 Additional Resources

- [Cursor Rules Documentation](https://cursor.com/docs/context/rules)
- [AI_CODING_REFERENCE.md](../../AI_CODING_REFERENCE.md)
- [COMPONENT_INDEX.md](../../COMPONENT_INDEX.md)
- [API_ROUTES_INDEX.md](../../API_ROUTES_INDEX.md)

---

## 🔧 Maintenance

### Adding New Rules
1. **Check if it fits** in one of the 6 core rules first
2. **If specialized**, create as agent-requested rule
3. **Keep under 500 lines**
4. **Avoid duplication** with existing rules

### Updating Rules
1. **Update the specific section** in the relevant core rule
2. **Keep changes minimal** and focused
3. **Test with AI** to ensure guidance is clear
4. **Document changes** in this README

---

**Last Updated**: November 7, 2025
**Version**: 2.1 (Audited & Optimized)
**Status**: ✅ Production Ready - Fully Optimized
