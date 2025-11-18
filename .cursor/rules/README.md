# 🎯 Cursor Rules for Development Power Tools

This directory contains **6 focused Cursor rules** that guide the AI to consistently use all the development tools we've set up correctly.

---

## 📋 Rules Overview

| Rule File | Type | Purpose | When Applied |
|-----------|------|---------|--------------|
| `testing-with-msw.mdc` | File-scoped | MSW API mocking standards | `**/*.test.ts`, `**/*.spec.tsx` |
| `storybook-development.mdc` | File-scoped | Storybook component dev | `**/*.stories.tsx` |
| `bundle-performance.mdc` | Manual | Bundle size optimization | When mentioned or optimizing |
| `security-scanning.mdc` | Always | Snyk security standards | Every chat session |
| `code-cleanup.mdc` | Manual | Knip unused code removal | When cleaning up code |
| `development-workflow.mdc` | Always | Complete dev workflow | Every chat session |

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

### 6. development-workflow.mdc
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

✅ **Focused** - Each rule under 500 lines
✅ **Scoped** - Applied to relevant files only
✅ **Actionable** - Concrete examples, not vague guidance
✅ **Referenced** - Links to actual project files
✅ **Composable** - Rules work together

---

## 🔄 When Rules Apply

### File-Based (Automatic)
- Open test file → `testing-with-msw.mdc`
- Open story file → `storybook-development.mdc`

### Session-Based (Always)
- Start any chat → `security-scanning.mdc`
- Start any chat → `development-workflow.mdc`

### On-Demand (Manual)
- Mention `@bundle-performance`
- Mention `@code-cleanup`

---

## 📖 Referenced Files

Rules reference these key documentation files:

```
@frontend/docs/DEVELOPMENT_TOOLS_GUIDE.md
@frontend/docs/QUICK_COMMANDS_CHEATSHEET.md
@GODLIKE_SETUP_COMPLETE.md
@frontend/src/test/mocks/handlers.ts
@frontend/src/components/Button.stories.tsx
@frontend/.size-limit.json
@frontend/knip.json
@.husky/pre-commit
```

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
- Project documentation: `frontend/docs/DEVELOPMENT_TOOLS_GUIDE.md`
- Quick reference: `frontend/docs/QUICK_COMMANDS_CHEATSHEET.md`

---

## ✅ Checklist

Verify rules are working:

- [ ] Open test file → AI suggests MSW patterns
- [ ] Open story file → AI suggests Storybook structure
- [ ] Ask about optimization → AI mentions bundle size
- [ ] Ask about security → AI enforces validation
- [ ] Ask about workflow → AI guides complete process

---

**Your AI assistant now has godlike consistency! 🚀**

These rules ensure every interaction follows best practices and uses all the tools correctly.
