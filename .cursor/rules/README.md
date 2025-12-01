# 🎯 Cursor Rules System

This directory contains **comprehensive Cursor rules** that guide the AI with actual codebase patterns, workflows, and best practices.

**Rule Architecture**:
- **Always-Applied Rules**: Core patterns that apply to every chat session
- **Context-Aware Rules**: Auto-activate based on file patterns (globs)
- **Nested Rules**: Directory-specific rules that attach automatically
- **Workflow Rules**: Complete development workflows with checklists
- **AGENTS.md Files**: Quick reference files throughout the codebase

---

## 📋 Rules Overview

### Always-Applied Rules (Core Patterns)
| Rule File | Purpose | Key Patterns |
|-----------|---------|--------------|
| `CORE.mdc` | Core development standards | Pattern reuse, TypeScript, error handling |
| `CODING_SAVANT_PATTERNS.mdc` | Codebase-specific patterns | API route 8-step pattern, query optimization |
| `SUPABASE.mdc` | Database operations | MCP tools, RLS policies, indexing |
| `BUSINESS.mdc` | Business logic | Booking workflows, pricing, operations |
| `SECURITY.mdc` | Security standards | Input validation, authentication, RLS |
| `TESTING.mdc` | Testing standards | Browser automation, E2E, unit tests |

### Context-Aware Rules (Auto-Activate)
| Rule File | Purpose | When Applied |
|-----------|---------|--------------|
| `testing-with-msw.mdc` | MSW API mocking | `**/*.test.ts`, `**/*.spec.tsx` |
| `storybook-development.mdc` | Storybook dev | `**/*.stories.tsx` |
| `bundle-performance.mdc` | Bundle optimization | When mentioned |
| `code-cleanup.mdc` | Unused code removal | When mentioned |
| `systematic-problem-solving.mdc` | Problem-solving frameworks | When debugging, implementing features, or making decisions |

### Nested Rules (Directory-Specific)
| Location | Purpose | When Applied |
|----------|---------|--------------|
| `frontend/src/app/api/.cursor/rules/api-route-patterns.mdc` | API route patterns | `**/app/api/**/*.ts` |
| `frontend/src/components/.cursor/rules/component-patterns.mdc` | Component patterns | `**/components/**/*.tsx` |

### Workflow Rules (With Checklists)
| Rule File | Purpose | When Applied |
|-----------|---------|--------------|
| `workflows/feature-development.mdc` | Complete feature workflow | `**/feature/**/*`, `**/feat/**/*` |
| `workflows/api-route-development.mdc` | API route workflow | `**/app/api/**/*.ts` |
| `workflows/component-development.mdc` | Component workflow | `**/components/**/*.tsx` |
| `workflows/database-migration.mdc` | Migration workflow | `**/supabase/migrations/**/*.sql` |

---

## 🎯 Rule Details

### 1. testing-with-msw.mdc
**Applied to:** All test files automatically

**What it does:**
- Ensures AI uses MSW for API mocking (never manual mocks)
- Shows how to override handlers for specific tests
- Guides adding new mock handlers
- Prevents common testing mistakes

**Example usage:**
```typescript
// AI will automatically suggest MSW patterns
test('fetches data', async () => {
  render(<Component />);
  // MSW handles the API call automatically
});
```

### 2. storybook-development.mdc
**Applied to:** Story files automatically

**What it does:**
- Enforces "Storybook first" development workflow
- Shows proper story structure
- Ensures all component states are covered
- Includes accessibility testing guidance

**Example usage:**
```typescript
// AI suggests complete story structure
export const Loading: Story = {
  args: { disabled: true, children: 'Loading...' },
};
```

### 3. bundle-performance.mdc
**Applied to:** When @-mentioned or optimizing

**What it does:**
- Reminds to check bundle size before PRs
- Suggests dynamic imports for large components
- Shows how to analyze bundle contents
- Provides optimization strategies

**Trigger:** Say "check bundle size" or "@bundle-performance"

### 4. security-scanning.mdc
**Applied to:** Always active (every session)

**What it does:**
- Reminds about automatic Snyk scanning on commit
- Shows common security vulnerabilities to avoid
- Guides fixing security issues
- Enforces input validation and sanitization

**Impact:** AI will proactively suggest security best practices

### 5. code-cleanup.mdc
**Applied to:** When @-mentioned or cleaning code

**What it does:**
- Shows how to use Knip to find unused code
- Guides removing unused dependencies
- Explains cleanup workflow
- Helps identify false positives

**Trigger:** Say "clean up code" or "@code-cleanup"

### 6. systematic-problem-solving.mdc
**Applied to:** When debugging, implementing features, or making architectural decisions

**What it does:**
- Provides decision frameworks for common scenarios (bugs, features, performance, architecture)
- Guides systematic problem decomposition
- Integrates with existing workflows and patterns
- Provides codebase-specific examples with real file references
- Validates solutions before and after implementation

**Key Features:**
- **Bug Investigation Framework**: Reproduce → Isolate → Pattern Match → Check Logs → Verify Fix
- **Feature Implementation Framework**: Check Docs → Find Patterns → Follow Workflow → Validate → Document
- **Performance Framework**: Identify Bottleneck → Check Patterns → Optimize → Verify
- **Architecture Framework**: Check Patterns → Review Rules → Consider Constraints → Test → Document

**Example usage:**
```
"Query is slow, help me fix it"
→ AI uses Performance Framework
→ Checks for SELECT * usage
→ Suggests specific columns
→ References actual codebase patterns
```

**Impact:** AI will systematically approach problems, reference existing patterns, and validate solutions

### 7. development-workflow.mdc
**Applied to:** Always active (every session)

**What it does:**
- Provides complete daily workflow
- Reminds about weekly maintenance tasks
- Shows which tool to use when
- Includes feature development checklist

**Impact:** AI guides you through proper development process

---

## 🚀 How to Use These Rules

### Automatic Application
Some rules apply automatically based on file type:

```bash
# Open a test file
vim frontend/src/components/__tests__/Button.test.tsx
# → testing-with-msw.mdc automatically applies

# Open a story file
vim frontend/src/components/Button.stories.tsx
# → storybook-development.mdc automatically applies
```

### Manual Invocation
Mention rules in chat to invoke them:

```
"@bundle-performance help me optimize this component"
"@code-cleanup find unused code"
```

### Always Active
These rules are always present:
- `security-scanning.mdc` - Security best practices
- `development-workflow.mdc` - Complete workflow guidance

---

## 📚 Rule Structure

Each rule follows [Cursor MDC format](https://cursor.com/docs/context/rules):

```markdown
---
description: What the rule does
globs: ['**/*.test.ts']  # File patterns (optional)
alwaysApply: false        # Apply to every session (optional)
---

# Rule Content

Clear, actionable guidance with:
- ✅ CORRECT examples
- ❌ WRONG examples
- Reference files using @filename.ts
- Concrete code snippets
```

---

## 🎯 Best Practices Followed

According to [Cursor documentation](https://cursor.com/docs/context/rules):

✅ **Focused** - Most rules under 500 lines (SUPABASE.mdc is 513 but intentionally comprehensive)
✅ **Scoped** - Applied via globs, intelligent activation, or always-apply
✅ **Actionable** - Concrete examples with `@filename` references to actual codebase
✅ **Referenced** - 100+ references to actual files with line numbers
✅ **Composable** - Rules work together (nested rules, workflows, AGENTS.md)
✅ **Descriptive** - Enhanced descriptions for better intelligent activation

---

## 🔄 When Rules Apply

### Always-Applied (Every Chat Session)
- Start any chat → `CORE.mdc`, `CODING_SAVANT_PATTERNS.mdc`, `SUPABASE.mdc`, `BUSINESS.mdc`, `SECURITY.mdc`, `TESTING.mdc`

### File-Based (Automatic via Globs)
- Open API route file → `api-route-patterns.mdc` (nested rule)
- Open component file → `component-patterns.mdc` (nested rule)
- Open test file → `testing-with-msw.mdc`
- Open story file → `storybook-development.mdc`
- Open migration file → `workflows/database-migration.mdc`

### Context-Aware (Intelligent Activation)
- Agent decides based on description and context → Workflow rules activate when relevant

### On-Demand (Manual)
- Mention `@bundle-performance` → `bundle-performance.mdc`
- Mention `@code-cleanup` → `code-cleanup.mdc`

---

## 📖 Referenced Files

Rules use `@filename` syntax to reference actual codebase files:

**Quick Reference**:
- `@docs/reference/AI_CODING_REFERENCE.md` - Main coding patterns
- `@docs/reference/COMPONENT_INDEX.md` - Existing components
- `@docs/reference/API_ROUTES_INDEX.md` - API endpoints
- `@docs/reference/QUICK_COMMANDS.md` - Command reference

**Actual Code Examples** (with line numbers):
- API route pattern: `@frontend/src/app/api/bookings/route.ts:72-297`
- Component pattern: `@frontend/src/components/EnhancedBookingFlowV2.tsx:97-740`
- Migration pattern: `@supabase/migrations/20250121000002_rls_policies.sql`
- Query pattern: `@frontend/src/app/api/bookings/route.ts:147-153`

**AGENTS.md Files** (Quick Reference):
- Root: `AGENTS.md`
- API routes: `frontend/src/app/api/AGENTS.md`
- Components: `frontend/src/components/AGENTS.md`
- Utilities: `frontend/src/lib/AGENTS.md`
- Database: `supabase/AGENTS.md`

---

## 🎓 Learning Path

### Week 1: Get Familiar
- Open test files and see MSW rule apply
- Create story files and see Storybook rule apply
- Chat with AI and observe workflow guidance

### Week 2: Use Actively
- Mention `@bundle-performance` when optimizing
- Mention `@code-cleanup` when refactoring
- Notice security suggestions appear automatically

### Week 3: Internalize
- Rules become second nature
- Workflow is automatic
- Quality is consistent

---

## 🔧 Customization

### Add New Rules
```bash
# Create new rule
touch .cursor/rules/my-custom-rule.mdc

# Use MDC format
# Set globs or alwaysApply
# Add concrete examples
```

### Modify Existing Rules
Edit the `.mdc` files directly. Changes take effect immediately.

### Disable a Rule
Rename the file extension:
```bash
mv testing-with-msw.mdc testing-with-msw.mdc.disabled
```

---

## 📊 Impact

With these rules, the AI will:

✅ **Always suggest MSW** instead of manual API mocks
✅ **Remind you to check bundle size** before PRs
✅ **Guide Storybook development** for components
✅ **Enforce security best practices** automatically
✅ **Suggest proper workflows** for common tasks
✅ **Help clean up unused code** systematically

---

## 🆘 Troubleshooting

**Rule not applying?**
- Check file matches glob pattern
- Ensure rule type is correct
- Try @-mentioning the rule manually

**Rule conflicts?**
- Rules are merged, not replaced
- More specific rules take precedence
- Check `.cursor/rules/` for nested rules

**Need to disable all rules?**
```bash
# Temporarily rename directory
mv .cursor/rules .cursor/rules.disabled
```

---

## 📚 Resources

- [Cursor Rules Documentation](https://cursor.com/docs/context/rules)
- Root AGENTS.md: `AGENTS.md`
- API AGENTS.md: `frontend/src/app/api/AGENTS.md`
- Component AGENTS.md: `frontend/src/components/AGENTS.md`
- Reference docs: `docs/reference/` directory

---

## ✅ Checklist

Verify rules are working:

- [ ] Open API route file → Nested rule applies with actual patterns
- [ ] Open component file → Component patterns rule applies
- [ ] Open test file → AI suggests MSW patterns
- [ ] Open story file → AI suggests Storybook structure
- [ ] Ask about API route → AI follows 8-step pattern from actual codebase
- [ ] Ask about query → AI suggests specific columns with pagination
- [ ] Ask about security → AI enforces validation and RLS
- [ ] Ask about workflow → AI guides complete process with checklists

---

## 🎯 Key Features

### Real Code References
All rules reference actual codebase files with `@filename` syntax:
- `@frontend/src/app/api/bookings/route.ts:72-297` - Complete 8-step API pattern
- `@frontend/src/components/EnhancedBookingFlowV2.tsx:373-426` - Validation pattern
- `@supabase/migrations/20250121000002_rls_policies.sql` - RLS policy examples

### Nested Rules
Rules automatically attach when files in their directory are referenced:
- `frontend/src/app/api/.cursor/rules/api-route-patterns.mdc` - For API routes
- `frontend/src/components/.cursor/rules/component-patterns.mdc` - For components

### Workflow Orchestration
Complete workflows with checklist integration:
- Feature development → Pre/Post implementation checklists
- API route development → 8-step pattern with real examples
- Component development → Props, state, validation patterns
- Database migrations → Safety patterns, testing in branches

### AGENTS.md Quick Reference
Simple markdown files for quick reference:
- Root `AGENTS.md` - Quick entry point
- Directory-specific `AGENTS.md` files - Context-specific guidance

---

**Your AI assistant now has codebase-specific expertise! 🚀**

These rules ensure every interaction follows actual patterns from YOUR codebase, not generic examples.
