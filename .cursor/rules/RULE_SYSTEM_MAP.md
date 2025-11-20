# 🗺️ Cursor Rule System Map

**Purpose**: Visual guide to understanding and navigating the U-Dig-It Cursor rule system.

**Last Updated**: 2025-01-21

---

## 📊 Rule Hierarchy Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CURSOR RULE SYSTEM                       │
│                         (55+ Rules)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼─────────┐
        │ ALWAYS APPLIED │         │  CONTEXT-AWARE  │
        │   (13 rules)   │         │   (42+ rules)   │
        └───────┬────────┘         └───────┬─────────┘
                │                           │
       ┌────────┴────────┐         ┌────────┴──────────┐
       │                 │         │                   │
   ┌───▼───┐      ┌─────▼────┐  ┌─▼──────┐    ┌──────▼──────┐
   │ Core  │      │ Security │  │ Auto   │    │   Agent     │
   │ Dev   │      │ & Tests  │  │ Attach │    │  Requested  │
   │ (4)   │      │   (5)    │  │  (10)  │    │    (30+)    │
   └───────┘      └──────────┘  └────────┘    └─────────────┘
```

---

## 🎯 Always Applied Rules (Core System)

These rules are **ALWAYS active** regardless of context:

### Consolidated Core Rules (8 rules)

| Rule | Purpose | Token Cost | Priority |
|------|---------|------------|----------|
| `CORE.mdc` | Development standards, TypeScript, workflow | ~6K | CRITICAL |
| `CODING_SAVANT_PATTERNS.mdc` | Codebase-specific patterns & bug fixes | ~4K | CRITICAL |
| `frontend-startup-protocol.mdc` | Server startup optimization (critical) | ~1K | CRITICAL |
| `BUSINESS.mdc` | Business logic, workflows, pricing consolidated | ~3K | HIGH |
| `SECURITY.mdc` | Security standards, compliance consolidated | ~3K | CRITICAL |
| `security-scanning.mdc` | Security review process (procedural) | ~1K | HIGH |
| `TESTING.mdc` | Testing standards consolidated | ~3K | HIGH |
| `SUPABASE.mdc` | Database operations, RLS consolidated | ~4K | CRITICAL |

**Total Token Cost (Always Active)**: ~25K tokens (✅ Optimized from 30-35K)

### Detailed Reference Rules (Agent-Requested)

**Development Details**:
- `development-workflow.mdc` - Comprehensive workflow procedures
- `ai-workflow-optimization.mdc` - Advanced optimization techniques

**Security Details**:
- `security-compliance.mdc` - Compliance, incident response
- `security-standards.mdc` - Implementation patterns

**Testing Details**:
- `testing-quality-assurance.mdc` - Comprehensive QA
- `testing-unit-integration.mdc` - Unit/integration patterns
- `testing-browser.mdc` - E2E and browser automation

**Business Details**:
- `business-workflows.mdc` - Detailed workflow procedures
- `business-pricing.mdc` - Pricing calculation details
- `business-operations.mdc` - Reporting and analytics

---

## 🔄 Auto-Attached Rules (Context-Aware)

These rules **activate automatically** based on file patterns:

### Database & Backend (glob: `supabase/**/*.sql`, `**/migrations/**`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-supabase-docs.mdc` | Supabase files | Auto @ mention Supabase docs |

### API Routes (glob: `**/app/api/**/*.ts`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-nextjs-docs.mdc` | Next.js API routes | Auto @ mention Next.js docs |

### Payment Code (glob: `**/*stripe*.{ts,tsx}`, `**/payment*.{ts,tsx}`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-stripe-docs.mdc` | Stripe integration | Auto @ mention Stripe docs |

### Component Development (glob: `**/components/**/*.{ts,tsx}`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-ui-docs.mdc` | UI components | Auto @ mention React/Radix/Tailwind |

### Testing Files (glob: `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-testing-docs.mdc` | Test files | Auto @ mention testing docs |

### Configuration Files (glob: `**/*.config.{ts,js}`, `**/package.json`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-dev-tools-docs.mdc` | Config files | Auto @ mention tool docs |

### Email/Notifications (glob: `**/*email*.{ts,tsx}`, `**/*notification*.{ts,tsx}`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-email-docs.mdc` | Email code | Auto @ mention SendGrid docs |

### Performance Code (glob: patterns in rule file)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-performance-docs.mdc` | Performance-related files | Auto @ mention Web Vitals |

### Monitoring/Analytics (glob: `**/*analytics*.{ts,tsx}`, `**/*monitoring*.{ts,tsx}`)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-monitoring-docs.mdc` | Observability code | Auto @ mention SigNoz/OpenTelemetry |

### Third-Party Integrations (glob: various integration patterns)

| Rule | Trigger | Purpose |
|------|---------|---------|
| `auto-reference-integrations-docs.mdc` | Integration code | Auto @ mention provider docs |

**Auto-Attach Benefits**:
- ✅ Right docs at the right time
- ✅ Minimal token overhead (only when needed)
- ✅ Automatic context enrichment

---

## 🎓 Agent Requested Rules (Advanced Features)

These rules are **activated on demand** via @ mentions or specific scenarios:

### Advanced Problem-Solving

| Rule | When to Use | Activation |
|------|-------------|------------|
| `advanced-problem-solving.mdc` | Complex technical challenges | @ mention or manual |
| `advanced-prompting.mdc` | Standard problem decomposition | @ mention |
| `advanced-prompting-techniques.mdc` | Creative/innovative solutions | @ mention |
| `complex-problem-solving.mdc` | Multi-system integrations | @ mention |

### Emergency & Critical

| Rule | When to Use | Activation |
|------|-------------|------------|
| `emergency-response.mdc` | Production outages, critical bugs | Manual trigger |
| `performance-critical-optimization.mdc` | Performance issues, bottlenecks | @ mention |

### Domain Expertise

| Rule | When to Use | Activation |
|------|-------------|------------|
| `business-workflows.mdc` | Equipment management, bookings | @ mention |
| `business-pricing.mdc` | Pricing calculations, payments | @ mention |
| `business-operations.mdc` | Reporting, analytics | @ mention |

### Design & UX

| Rule | When to Use | Activation |
|------|-------------|------------|
| `design-accessibility.mdc` | WCAG compliance, a11y | @ mention |
| `design-components.mdc` | Component design patterns | @ mention |
| `design-colors-typography.mdc` | Visual design, branding | @ mention |
| `design-layout-spacing.mdc` | Layout systems, grids | @ mention |

### Testing & Quality

| Rule | When to Use | Activation |
|------|-------------|------------|
| `testing-browser.mdc` | E2E testing, browser automation | @ mention |
| `testing-unit-integration.mdc` | Unit/integration tests | @ mention |
| `testing-scenarios.mdc` | Edge cases, test scenarios | @ mention |
| `testing-with-msw.mdc` | API mocking with MSW | @ mention |
| `e2e-testing-quality-assurance.mdc` | Comprehensive QA | @ mention |

### Performance & Scale

| Rule | When to Use | Activation |
|------|-------------|------------|
| `performance-optimization.mdc` | General performance work | @ mention |
| `bundle-performance.mdc` | Bundle size optimization | @ mention |
| `code-cleanup.mdc` | Remove unused code with Knip | @ mention |

### Infrastructure & Operations

| Rule | When to Use | Activation |
|------|-------------|------------|
| `distributed-systems-operations.mdc` | Distributed systems | @ mention |
| `system-architecture.mdc` | Architecture decisions | @ mention |

### Documentation & Standards

| Rule | When to Use | Activation |
|------|-------------|------------|
| `documentation-excellence.mdc` | Writing documentation | @ mention |
| `ethical-ai-responsibility.mdc` | AI ethics, bias mitigation | @ mention |
| `privacy-human-centered-design.mdc` | Privacy, human-centered design | @ mention |

### Development Tools

| Rule | When to Use | Activation |
|------|-------------|------------|
| `storybook-development.mdc` | Storybook component dev | @ mention |
| `nextjs-config-standards.mdc` | Next.js configuration | @ mention |
| `nextjs-startup-optimization.mdc` | Startup performance | @ mention |

---

## 📋 Rule Selection Guide

### Use Case: "Create New Booking Feature"

**Activated Rules**:
```
✅ Always Applied:
   - coding-savant-patterns.mdc (codebase patterns)
   - development-standards.mdc (TypeScript standards)
   - business-logic.mdc (booking rules)
   - security-compliance.mdc (validation, auth)
   - supabase-backend-priority.mdc (database ops)

✅ Auto-Attached:
   - auto-reference-nextjs-docs.mdc (API routes)
   - auto-reference-supabase-docs.mdc (database)
   - auto-reference-stripe-docs.mdc (if payment involved)

🎓 Suggested Agent Requested:
   @ mention business-workflows.mdc (booking flow)
   @ mention testing-unit-integration.mdc (test creation)
```

### Use Case: "Fix Performance Issue"

**Activated Rules**:
```
✅ Always Applied:
   - coding-savant-patterns.mdc
   - development-standards.mdc
   - supabase-backend-priority.mdc

✅ Auto-Attached:
   - (depends on file type)

🎓 Required Agent Requested:
   @ mention performance-critical-optimization.mdc
   @ mention bundle-performance.mdc (if frontend)
   @ mention code-cleanup.mdc (remove unused)
```

### Use Case: "Production Outage"

**Activated Rules**:
```
✅ Always Applied:
   - security-compliance.mdc
   - supabase-backend-priority.mdc

🎓 Required Agent Requested:
   @ mention emergency-response.mdc (CRITICAL)
   @ mention distributed-systems-operations.mdc (if needed)
```

---

## 🔍 Rule Discovery

### Finding the Right Rule

**By Task Type**:
```bash
# Database work
→ supabase-backend-priority.mdc (always)
→ @ mention auto-reference-supabase-docs.mdc

# API development
→ development-standards.mdc (always)
→ @ mention auto-reference-nextjs-docs.mdc

# UI components
→ @ mention design-components.mdc
→ @ mention auto-reference-ui-docs.mdc

# Testing
→ testing-quality-assurance.mdc (always)
→ @ mention testing-browser.mdc (E2E)
→ @ mention testing-with-msw.mdc (mocking)

# Performance
→ @ mention performance-critical-optimization.mdc
→ @ mention bundle-performance.mdc

# Security issue
→ security-compliance.mdc (always)
→ @ mention emergency-response.mdc (if critical)
```

---

## 📊 Performance Metrics

### Token Usage by Category

| Category | Always Applied | Auto-Attached | Agent Requested |
|----------|----------------|---------------|-----------------|
| Core Dev | 11K tokens | - | - |
| Security | 5K tokens | - | 3K tokens (if requested) |
| Business | 2K tokens | - | 6K tokens (if requested) |
| Backend | 6K tokens | 2K tokens | - |
| Testing | 2K tokens | 2K tokens | 5K tokens (if requested) |
| **Total** | **~24K** | **~2-4K** | **~3-10K** |

**Context Window Budget**: 150K tokens total
- Always Applied: 24K (16%)
- Auto-Attached: 2-4K (2-3%)
- Agent Requested: 3-10K (2-7%)
- **Available for Code**: ~110-120K (75-80%) ✅

---

## 🛠️ Rule Maintenance

### Adding New Rule

1. **Determine Type**:
   - Always Applied? → Put in root `.cursor/rules/`
   - Auto-Attached? → Add glob pattern to frontmatter
   - Agent Requested? → Mark with `alwaysApply: false`

2. **Update This Map**:
   - Add to appropriate category
   - Document activation trigger
   - Estimate token cost

3. **Update External Docs**:
   - Add to `external-docs.mdc` if docs involved
   - Update auto-reference rules if needed

### Archiving Rule

1. Move to `.cursor/rules/archive/`
2. Add deprecation notice
3. Update references in other rules
4. Remove from this map

---

## 📚 Related Documentation

- `docs/reference/AI_CODING_REFERENCE.md` - Quick coding reference
- `docs/reference/CODING_SAVANT_CHEAT_SHEET.md` - Pattern cheat sheet
- `docs/analysis/AI_MODEL_CURSOR_IMPROVEMENTS.md` - Improvement plan
- `.cursor/rules/external-docs.mdc` - External documentation system
- `docs/external/EXTERNAL_DOCS_INDEX.md` - 48 indexed doc sources

---

## ✅ Quick Reference

### Most Used Rules

1. `coding-savant-patterns.mdc` - **Always check first**
2. `supabase-backend-priority.mdc` - **All database work**
3. `security-compliance.mdc` - **Before any commit**
4. `auto-reference-*` rules - **Automatic, no action needed**
5. `emergency-response.mdc` - **Production issues only**

### Rule Activation Syntax

```typescript
// In conversation with AI:
"@ mention business-pricing.mdc to help with pricing calculation"

// In code comments:
// @see .cursor/rules/coding-savant-patterns.mdc for API pattern

// In rule files:
// Reference: @business-workflows.mdc
```

---

**Status**: ✅ Active System Map
**Maintenance**: Update when rules added/changed
**Version**: 1.0.0

