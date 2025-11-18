# 🎯 Cursor Rules Setup Complete!

## ✅ What Was Created

I've created **6 optimized Cursor rules** following the [official Cursor guidelines](https://cursor.com/docs/context/rules) to ensure the AI consistently uses all your new development tools correctly.

---

## 📂 Rules Created

### 1. `.cursor/rules/testing-with-msw.mdc`
**Type:** File-scoped (test files)
**Applied to:** `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`

**What it does:**
- Ensures AI always suggests MSW for API mocking
- Prevents manual fetch/axios mocking mistakes
- Shows how to override handlers per-test
- Guides adding new mock handlers

**Example impact:**
```typescript
// ✅ AI will suggest this
test('fetches equipment', async () => {
  render(<EquipmentList />);
  // MSW automatically mocks the API
  await waitFor(() => {
    expect(screen.getByText('Kubota SVL-75')).toBeInTheDocument();
  });
});

// ❌ AI will NOT suggest manual mocks
vi.mock('fetch'); // Won't happen with rule active
```

---

### 2. `.cursor/rules/storybook-development.mdc`
**Type:** File-scoped (story files)
**Applied to:** `**/*.stories.ts`, `**/*.stories.tsx`

**What it does:**
- Enforces "Storybook first" workflow
- Ensures all component states are covered (default, loading, error, empty)
- Includes accessibility testing reminders
- Shows proper story structure

**Example impact:**
```typescript
// AI suggests complete story structure automatically
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],  // AI reminds you of this
};

export const Loading: Story = {
  args: { disabled: true, children: 'Loading...' }
};
// AI suggests all states you need
```

---

### 3. `.cursor/rules/bundle-performance.mdc`
**Type:** Manual (invoke with @-mention)
**Applied to:** When mentioned or optimizing

**What it does:**
- Reminds to check `pnpm size` before PRs
- Suggests dynamic imports for large components
- Shows bundle optimization strategies
- Guides using `pnpm size:why` for analysis

**How to use:**
```
You: "This component is large, how do I optimize it?"
AI: "@bundle-performance Let me help optimize..."
     1. First, check bundle size: pnpm size
     2. Use dynamic imports:
        const Heavy = dynamic(() => import('./Heavy'));
```

---

### 4. `.cursor/rules/security-scanning.mdc`
**Type:** Always Apply
**Applied to:** Every chat session

**What it does:**
- Reminds about automatic Snyk scanning on commit
- Shows common security vulnerabilities to avoid
- Enforces input validation and sanitization
- Guides fixing security issues

**Example impact:**
```typescript
You: "How do I save this booking?"

AI: "Here's how, with security best practices:

// ✅ Always validate and sanitize
const schema = z.object({ equipmentId: z.string().uuid() });
const sanitized = sanitizeBookingFormData(body);
const validated = schema.parse(sanitized);

// ❌ Never trust user input directly
await supabase.from('bookings').insert(body); // AI warns against this
```

---

### 5. `.cursor/rules/code-cleanup.mdc`
**Type:** Manual (invoke with @-mention)
**Applied to:** When cleaning code

**What it does:**
- Shows how to use Knip to find unused code
- Guides removing unused dependencies
- Explains cleanup workflow step-by-step
- Helps identify false positives

**How to use:**
```
You: "@code-cleanup help me clean this up"
AI: "Let's use Knip to find unused code:
     1. Run: pnpm knip
     2. Review findings
     3. Remove: pnpm remove unused-package
     4. Verify: pnpm build"
```

---

### 6. `.cursor/rules/development-workflow.mdc`
**Type:** Always Apply
**Applied to:** Every chat session

**What it does:**
- Provides complete daily development workflow
- Reminds about weekly maintenance (Knip, security audit)
- Shows which tool to use when
- Includes feature development checklist

**Example impact:**
```
You: "I'm starting a new feature"

AI: "Great! Here's the workflow:
     1. Create Storybook story first
     2. Write tests with MSW
     3. Check bundle size: pnpm size
     4. Run quality checks: pnpm quality:fast
     5. Commit (Snyk runs automatically)"
```

---

## 🎯 How Rules Apply

### Automatic (File-Based)
When you open specific file types:

| File Type | Rule Applied | Result |
|-----------|--------------|--------|
| `*.test.tsx` | `testing-with-msw.mdc` | AI suggests MSW patterns |
| `*.stories.tsx` | `storybook-development.mdc` | AI guides story structure |

### Always Active (Session-Based)
These apply to every chat:

- `security-scanning.mdc` - Security best practices
- `development-workflow.mdc` - Complete workflow

### On-Demand (Manual)
Invoke with @-mention:

- `@bundle-performance` - Bundle optimization
- `@code-cleanup` - Remove unused code

---

## 📚 Rule Best Practices Followed

According to [Cursor documentation](https://cursor.com/docs/context/rules):

✅ **Under 500 lines** - Each rule is focused and concise
✅ **Concrete examples** - ✅ CORRECT / ❌ WRONG patterns
✅ **File references** - Links to actual project files
✅ **Actionable guidance** - Not vague, specific instructions
✅ **Proper scoping** - Applied only when relevant

---

## 🚀 Quick Test

Verify rules are working:

```bash
# 1. Open a test file
code frontend/src/components/__tests__/Button.test.tsx

# Ask AI: "How do I test an API call?"
# → AI should suggest MSW patterns automatically

# 2. Open a story file
code frontend/src/components/Button.stories.tsx

# Ask AI: "How do I create a loading state?"
# → AI should suggest complete story structure

# 3. In any chat
# Ask: "How do I start a new feature?"
# → AI should walk through complete workflow
```

---

## 📖 Documentation References

Each rule references these files:

```
@frontend/docs/DEVELOPMENT_TOOLS_GUIDE.md
@frontend/docs/QUICK_COMMANDS_CHEATSHEET.md
@GODLIKE_SETUP_COMPLETE.md
@frontend/src/test/mocks/handlers.ts
@frontend/.size-limit.json
@.husky/pre-commit
```

This means the AI can pull exact code examples from your actual setup!

---

## 🎓 What This Means for You

### Before Rules
```
You: "How do I test this component that fetches data?"
AI: "You can use jest.mock() or vi.mock()..."
```

### After Rules
```
You: "How do I test this component that fetches data?"
AI: "Use MSW! It's already set up. Here's how:

test('fetches data', async () => {
  render(<Component />);
  // MSW automatically intercepts the request
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});

MSW handlers are in @frontend/src/test/mocks/handlers.ts"
```

**The AI now knows:**
- ✅ MSW is installed and configured
- ✅ Where the handlers are
- ✅ How you want tests written
- ✅ What patterns to follow

---

## 🔥 Consistency Achieved

With these rules, **every AI interaction** will:

✅ Suggest MSW for API mocking (never manual mocks)
✅ Guide Storybook-first component development
✅ Remind you to check bundle sizes
✅ Enforce security best practices
✅ Show proper workflows
✅ Help clean up unused code

---

## 📊 Rule Summary

| Rule | Lines | Type | Impact |
|------|-------|------|--------|
| testing-with-msw | 150 | File-scoped | High - Every test |
| storybook-development | 180 | File-scoped | High - Every story |
| bundle-performance | 160 | Manual | Medium - On demand |
| security-scanning | 200 | Always | Critical - Every session |
| code-cleanup | 170 | Manual | Medium - Weekly |
| development-workflow | 220 | Always | High - Every session |

**Total:** 1,080 lines of focused, actionable guidance

---

## 🎯 Next Steps

### Immediate
1. ✅ Rules are created and active
2. ✅ Test by opening test/story files
3. ✅ Ask AI development questions

### This Week
- Notice AI consistently suggests MSW
- See Storybook guidance in story files
- Observe security reminders

### Ongoing
- Rules evolve with your workflow
- Edit `.mdc` files to customize
- Add new rules as needed

---

## 🆘 Managing Rules

### View All Rules
**Cursor Settings → Rules**

You'll see:
- Project Rules (6 rules)
- Which are active
- When they apply

### Edit a Rule
```bash
code .cursor/rules/testing-with-msw.mdc
# Edit and save - changes apply immediately
```

### Disable a Rule
```bash
# Rename to disable
mv .cursor/rules/testing-with-msw.mdc \
   .cursor/rules/testing-with-msw.mdc.disabled
```

### Add New Rule
```bash
# Create new .mdc file
code .cursor/rules/my-new-rule.mdc

# Follow MDC format:
---
description: What it does
globs: ['**/*.tsx']
alwaysApply: false
---

# Rule content here
```

---

## 📚 Full Documentation

- **Rules README**: `.cursor/rules/README.md`
- **Development Tools**: `frontend/docs/DEVELOPMENT_TOOLS_GUIDE.md`
- **Quick Commands**: `frontend/docs/QUICK_COMMANDS_CHEATSHEET.md`
- **Setup Guide**: `GODLIKE_SETUP_COMPLETE.md`
- **Cursor Docs**: https://cursor.com/docs/context/rules

---

## 🎉 Result

You now have:

1. ✅ **14 powerful development tools** installed
2. ✅ **6 Cursor rules** ensuring consistent AI guidance
3. ✅ **Comprehensive documentation** for everything
4. ✅ **Automated workflows** (Husky + Snyk)
5. ✅ **Enterprise-grade setup** rivaling top tech companies

**Your AI assistant is now supercharged with context-aware, tool-specific guidance! 🚀**

---

**Every chat will now follow best practices automatically!**

