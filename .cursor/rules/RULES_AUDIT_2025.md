# Cursor Rules Audit Report
**Date:** November 14, 2025
**Reference:** [Cursor Rules Documentation](https://cursor.com/docs/context/rules)

## Executive Summary

Audited all `.cursor/rules/*.mdc` files against official Cursor documentation best practices. Found **4 critical issues** and **several improvement opportunities**.

---

## 🚨 Critical Issues

### 1. File Size Violations (CRITICAL)

**Per Documentation:** Rules should be **under 500 lines** to maintain clarity and performance.

**Violations Found:**
- ❌ `TESTING.mdc`: **624 lines** (124 lines over limit)
- ❌ `SECURITY.mdc`: **572 lines** (72 lines over limit)
- ❌ `BUSINESS.mdc`: **566 lines** (66 lines over limit)
- ⚠️ `SUPABASE.mdc`: **501 lines** (1 line over limit)

**Impact:** Large rules increase context overhead, reduce clarity, and slow down AI processing.

**Recommendation:** Split large rules into focused, composable components:
- `TESTING.mdc` → Split into `testing-browser.mdc` + `testing-unit.mdc` + `testing-integration.mdc`
- `SECURITY.mdc` → Split into `security-standards.mdc` + `security-compliance.mdc` + `security-snyk.mdc`
- `BUSINESS.mdc` → Split into `business-logic.mdc` + `business-pricing.mdc` + `business-workflows.mdc`

---

### 2. Invalid Format: JSON Schema Instead of MDC (CRITICAL)

**Per Documentation:** Rules should use **MDC format** (Markdown with YAML frontmatter), not JSON schema.

**Violations Found:**
- ❌ `ethical-ai-responsibility.mdc`: Contains JSON schema (`$schema`, `prePrompt`, `metaAffirmations`, etc.)
- ❌ `advanced-prompting.mdc`: Contains JSON schema format

**Current Format (WRONG):**
```md
---
description: "..."
alwaysApply: false
---
{
  "$schema": "...",
  "prePrompt": [...],
  "metaRules": [...]
}
```

**Should Be (CORRECT):**
```md
---
description: "..."
alwaysApply: false
---

# Rule Title

## Content in Markdown
- Use markdown formatting
- Provide concrete examples
- Keep it actionable
```

**Impact:** JSON schema format is not standard MDC and may not be properly parsed by Cursor.

**Recommendation:** Convert these files to proper MDC format with markdown content.

---

### 3. Missing Description Field (MODERATE)

**Per Documentation:** All rules should have a `description` field for "Apply Intelligently" functionality.

**Violations Found:**
- ⚠️ `external-docs.mdc`: Missing `description` field (has `alwaysApply: true` but no description)

**Impact:** Without description, the rule cannot be intelligently applied when relevant.

**Recommendation:** Add description field:
```md
---
description: "External documentation usage guidelines for Supabase, Next.js, Stripe, and other tools"
alwaysApply: true
---
```

---

### 4. Globs Pattern Format Inconsistency (MODERATE)

**Per Documentation:** Globs should be arrays for multiple patterns: `globs: ["pattern1", "pattern2"]`

**Issues Found:**
- Some files use comma-separated strings: `globs: pattern1,pattern2` ❌
- Some files use arrays correctly: `globs: ["pattern1", "pattern2"]` ✅
- Some files use single strings: `globs: "**/*"` ✅ (acceptable for single pattern)

**Examples:**
- ❌ `testing-scenarios.mdc`: `globs: frontend/e2e/**/*.spec.ts,**/test/**/*` (should be array)
- ✅ `design-colors-typography.mdc`: `globs: frontend/**/*.tsx,frontend/**/*.css` (should be array)

**Recommendation:** Standardize all globs to array format:
```md
globs: ["frontend/e2e/**/*.spec.ts", "**/test/**/*"]
```

---

## ✅ What's Working Well

### Proper MDC Format
- ✅ Core rules (`CORE.mdc`, `SUPABASE.mdc`, `BUSINESS.mdc`, `SECURITY.mdc`, `TESTING.mdc`) use proper MDC format
- ✅ Most specialized rules use correct YAML frontmatter
- ✅ Proper use of `alwaysApply: true` for core rules
- ✅ Proper use of `alwaysApply: false` with `globs` for specialized rules

### Good Practices
- ✅ Rules are focused and actionable
- ✅ Concrete code examples provided
- ✅ Clear structure with sections
- ✅ Proper use of ✅/❌ examples

### Rule Organization
- ✅ Core rules properly marked as `alwaysApply: true`
- ✅ Specialized rules use `alwaysApply: false` with appropriate globs
- ✅ Deprecated rules properly archived

---

## 📊 Detailed Analysis

### Always-Applied Rules (5 total)
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `CORE.mdc` | 368 | ✅ Good | Under limit |
| `SUPABASE.mdc` | 501 | ⚠️ Warning | 1 line over |
| `BUSINESS.mdc` | 566 | ❌ Violation | 66 lines over |
| `SECURITY.mdc` | 572 | ❌ Violation | 72 lines over |
| `TESTING.mdc` | 624 | ❌ Violation | 124 lines over |
| `external-docs.mdc` | ~40 | ⚠️ Missing desc | No description field |

### Specialized Rules (Conditional)
Most specialized rules are properly formatted and under 500 lines. Good use of globs patterns.

---

## 🎯 Recommendations

### Priority 1: Fix Critical Issues (Immediate)

1. **Split Large Rules**
   - Split `TESTING.mdc` (624 lines) into 3 focused files
   - Split `SECURITY.mdc` (572 lines) into 2-3 focused files
   - Split `BUSINESS.mdc` (566 lines) into 2-3 focused files
   - Consider splitting `SUPABASE.mdc` (501 lines) if it grows

2. **Convert JSON Schema to MDC**
   - Convert `ethical-ai-responsibility.mdc` to proper MDC format
   - Convert `advanced-prompting.mdc` to proper MDC format
   - Remove JSON schema structure, use markdown content

3. **Add Missing Descriptions**
   - Add description to `external-docs.mdc`

### Priority 2: Standardize Patterns (High)

4. **Standardize Globs Format**
   - Convert all comma-separated globs to array format
   - Ensure consistent pattern matching

5. **Review Rule Content**
   - Ensure all rules have concrete examples (✅ Good - most do)
   - Remove vague guidance (✅ Good - most are specific)
   - Check for redundancy (✅ Good - archived rules handled)

### Priority 3: Optimization (Medium)

6. **Consider Nested Rules**
   - Per documentation, nested `.cursor/rules` directories are supported
   - Could organize by domain (e.g., `frontend/.cursor/rules/`, `backend/.cursor/rules/`)

7. **Review Always-Applied Rules**
   - Current 5 always-applied rules is reasonable
   - Consider if `external-docs.mdc` needs to be always-applied or could use globs

---

## 📋 Action Items

### Immediate (This Week)
- [ ] Split `TESTING.mdc` into focused components
- [ ] Split `SECURITY.mdc` into focused components
- [ ] Split `BUSINESS.mdc` into focused components
- [ ] Convert `ethical-ai-responsibility.mdc` to MDC format
- [ ] Convert `advanced-prompting.mdc` to MDC format
- [ ] Add description to `external-docs.mdc`

### Short Term (This Month)
- [ ] Standardize all globs to array format
- [ ] Review and optimize `SUPABASE.mdc` (consider splitting if it grows)
- [ ] Audit for any remaining redundancy

### Long Term (Ongoing)
- [ ] Monitor rule sizes (keep under 500 lines)
- [ ] Review rule effectiveness quarterly
- [ ] Consider nested rule organization if project grows

---

## 📚 References

- [Cursor Rules Documentation](https://cursor.com/docs/context/rules)
- Best Practices:
  - Keep rules under 500 lines
  - Split large rules into multiple, composable rules
  - Provide concrete examples or referenced files
  - Avoid vague guidance
  - Use proper MDC format (not JSON schema)
  - Include descriptions for intelligent application

---

## ✅ Validation Checklist

After fixes, verify:
- [ ] All rules under 500 lines
- [ ] All rules use proper MDC format (no JSON schema)
- [ ] All rules have description field
- [ ] All globs use array format
- [ ] Core rules properly marked `alwaysApply: true`
- [ ] Specialized rules use appropriate globs
- [ ] No redundancy between rules
- [ ] Concrete examples provided
- [ ] Actionable guidance (not vague)

---

**Status:** ⚠️ **Needs Attention** - 4 critical issues found, but overall structure is good.

**Next Steps:** Prioritize splitting large rules and converting JSON schema files to MDC format.

