# Frontend Startup Optimization - Cursor Rules Summary

## 📋 Overview

Created comprehensive Cursor rules following [Cursor Rules Documentation](https://cursor.com/docs/context/rules) to ensure AI assistant always follows Next.js 16 startup optimization best practices.

**Date Created:** November 18, 2025
**Next.js Version:** 16.0.3
**Optimization:** Turbopack FileSystem Caching

---

## 🎯 Rules Created

### 1. `frontend-startup-protocol.mdc` ⚡
**Type:** Always Apply
**Purpose:** Critical startup protocol that applies to every chat session

**Key Points:**
- ALWAYS use `bash start-frontend-clean.sh` or `pnpm dev`
- NEVER use raw `next dev` (bypasses optimizations)
- References the 70% performance improvement
- Links to emergency deep clean script

**Why Always Apply:**
This is the most critical rule - it prevents accidentally using non-optimized startup commands that waste 10-15 seconds on every restart.

---

### 2. `nextjs-startup-optimization.mdc` 📚
**Type:** Apply to Specific Files
**Globs:**
- `**/start-frontend*.sh`
- `**/next.config.js`
- `**/package.json`

**Purpose:** Detailed optimization guide for startup-related files

**Key Points:**
- Turbopack filesystem caching configuration
- Startup script patterns (optimized vs deep clean)
- Performance targets and troubleshooting
- Never-do-this patterns

**Why File-Scoped:**
Only relevant when working with startup scripts, Next.js config, or package.json.

---

### 3. `nextjs-config-standards.mdc` ⚙️
**Type:** Apply to Specific Files
**Globs:**
- `**/next.config.js`
- `**/next.config.ts`
- `**/next.config.mjs`

**Purpose:** Configuration standards for Next.js setup

**Key Points:**
- Required `turbopackFileSystemCacheForDev: true`
- Server external packages (Supabase)
- Webpack optimization patterns
- Image optimization configuration
- What NOT to do (disable Turbopack, etc.)

**Why File-Scoped:**
Only relevant when editing Next.js configuration files.

---

### 4. `CORE.mdc` (Updated) 🏗️
**Type:** Always Apply
**Changes:** Updated section 8 (Frontend Startup Protocol)

**Updates:**
- References new dedicated rules
- Updated performance metrics (3-5s restarts)
- Clarified cache preservation vs cache clearing
- Added links to detailed documentation

---

## 📊 Rule Design Compliance

### Follows Cursor Best Practices ✅

1. **Focused and Scoped**
   - Each rule under 500 lines
   - Clear, specific purposes
   - Composable rules (reference each other)

2. **Actionable Guidance**
   - Concrete examples with code snippets
   - Clear do/don't patterns
   - Specific commands to run

3. **File References**
   - Uses `@filename` syntax for related files
   - Links to documentation
   - References other rules

4. **Proper Metadata**
   - `description`: Clear, searchable descriptions
   - `globs`: Specific file patterns where applicable
   - `alwaysApply`: Used appropriately for critical rules

### Rule Types Used Correctly ✅

| Rule | Type | Reason |
|------|------|--------|
| `frontend-startup-protocol.mdc` | Always Apply | Critical - prevents common mistakes |
| `nextjs-startup-optimization.mdc` | Apply to Specific Files | Only relevant for startup files |
| `nextjs-config-standards.mdc` | Apply to Specific Files | Only relevant for config files |
| `CORE.mdc` | Always Apply | Core standards for all work |

---

## 🔗 Rule Relationships

```
CORE.mdc (Always Apply)
   ↓
   ├─→ frontend-startup-protocol.mdc (Always Apply)
   │       ↓
   │       └─→ nextjs-startup-optimization.mdc (File-Scoped)
   │              └─→ Related Files:
   │                     - @start-frontend-clean.sh
   │                     - @start-frontend-deep-clean.sh
   │                     - @STARTUP_OPTIMIZATION.md
   │
   └─→ nextjs-config-standards.mdc (File-Scoped)
           └─→ Related Files:
                  - @frontend/next.config.js
                  - @STARTUP_OPTIMIZATION.md
```

---

## 🎬 How Rules Work in Practice

### Scenario 1: Starting a Chat Session

**What Happens:**
1. Cursor loads `CORE.mdc` (Always Apply)
2. Cursor loads `frontend-startup-protocol.mdc` (Always Apply)
3. AI sees startup optimization guidelines in every response

**Result:**
AI will always recommend `bash start-frontend-clean.sh` instead of raw `next dev`.

### Scenario 2: Editing `next.config.js`

**What Happens:**
1. Cursor loads `CORE.mdc` (Always Apply)
2. Cursor loads `frontend-startup-protocol.mdc` (Always Apply)
3. Cursor loads `nextjs-config-standards.mdc` (matches glob pattern)

**Result:**
AI knows to ensure `turbopackFileSystemCacheForDev: true` is present and will warn if you try to disable it.

### Scenario 3: Working on Startup Script

**What Happens:**
1. Cursor loads `CORE.mdc` (Always Apply)
2. Cursor loads `frontend-startup-protocol.mdc` (Always Apply)
3. Cursor loads `nextjs-startup-optimization.mdc` (matches glob pattern)

**Result:**
AI has detailed context about startup script patterns and will ensure proper structure.

---

## 📝 Rule Content Guidelines Followed

### ✅ Concise and Actionable
- Clear instructions with code examples
- Specific patterns to follow/avoid
- Concrete commands to run

### ✅ Specific Examples
```bash
# ✅ CORRECT
bash start-frontend-clean.sh

# ❌ WRONG
next dev
```

### ✅ Referenced Files
- Uses `@filename` syntax
- Links to documentation
- References related rules

### ✅ Proper Length
- `frontend-startup-protocol.mdc`: ~150 lines
- `nextjs-startup-optimization.mdc`: ~300 lines
- `nextjs-config-standards.mdc`: ~350 lines
- All under 500-line recommendation

---

## 🔍 Testing the Rules

### How to Verify Rules Are Working

1. **Open Cursor/VS Code**
2. **Go to:** `Cursor Settings → Rules`
3. **Check Status:**
   - ✅ `CORE.mdc` - Active (Always Apply)
   - ✅ `frontend-startup-protocol.mdc` - Active (Always Apply)
   - ✅ Other rules - Available when files match

4. **Test in Chat:**
   - Ask: "How do I start the frontend server?"
   - Expected: AI recommends `bash start-frontend-clean.sh`
   - Unexpected: AI recommends `next dev` or `pnpm dev` without context

5. **Test with File:**
   - Open `next.config.js`
   - Ask: "Should I enable Turbopack caching?"
   - Expected: AI confirms it's required and shows `turbopackFileSystemCacheForDev: true`

---

## 📚 Documentation Links

### Cursor Documentation
- Rules Overview: https://cursor.com/docs/context/rules
- MDC Format: Covered in rules documentation
- Best Practices: https://cursor.com/docs/context/rules#best-practices

### Next.js Documentation
- Turbopack: https://nextjs.org/docs/app/api-reference/turbopack
- FileSystem Cache: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache
- Version 16 Guide: https://nextjs.org/docs/app/guides/upgrading/version-16

### Project Documentation
- `@STARTUP_OPTIMIZATION.md` - Complete optimization guide
- `@frontend/next.config.js` - Live configuration
- `@start-frontend-clean.sh` - Optimized script
- `@start-frontend-deep-clean.sh` - Emergency script

---

## ✅ Validation Checklist

When creating/updating rules, verify:

- [ ] MDC format with proper frontmatter
- [ ] `description` is clear and searchable
- [ ] `globs` pattern is specific (if file-scoped)
- [ ] `alwaysApply` is appropriate for rule type
- [ ] Content under 500 lines
- [ ] Concrete examples provided
- [ ] Related files referenced with `@`
- [ ] Links to documentation included
- [ ] Clear do/don't patterns
- [ ] Actionable instructions

---

## 🎯 Impact

**These rules ensure:**
1. AI assistant always recommends optimized startup (70% faster)
2. Turbopack caching is never accidentally disabled
3. Configuration standards are maintained
4. Emergency deep clean is only suggested when appropriate
5. VS Code tasks continue to use optimized scripts

**Result:**
- Faster development experience (3-5s restarts)
- Consistent AI recommendations
- Prevention of common mistakes
- Proper use of Next.js 16 features

---

**Last Updated:** November 18, 2025
**Created By:** AI Assistant following Cursor Rules best practices
**Status:** ✅ Active and tested


