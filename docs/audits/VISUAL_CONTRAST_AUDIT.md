# 🎨 Visual Contrast Audit - Admin Dashboard
**Purpose**: Identify and fix contrast/visibility issues
**Standard**: WCAG AA (4.5:1 for normal text, 3:1 for large text/UI components)
**Date**: November 4, 2025

---

## 🎯 COLOR DEFINITIONS

### Current Tailwind Colors:
```
brand-primary: #E1BC56      ← LIGHT YELLOW/GOLD (Kubota brand)
brand-secondary: #A90F0F    ← DARK RED (CTA buttons)
kubota-orange: #A90F0F      ← DARK RED (same as secondary)
```

### Potential Contrast Issues:

#### ❌ **POOR CONTRAST**:
- `#E1BC56` (light yellow) + white text = **FAIL** (ratio ~1.5:1)
- `#E1BC56` (light yellow) + light gray text = **FAIL**

#### ✅ **GOOD CONTRAST**:
- `#A90F0F` (dark red) + white text = **PASS** (ratio ~7:1)
- Dark backgrounds + white text = **PASS**

---

## 🔍 ISSUES FOUND

### **Common Patterns to Check**:

1. ⚠️ **Buttons with light yellow backgrounds**
2. ⚠️ **Text on light yellow/gold backgrounds**
3. ⚠️ **Icons on light backgrounds**
4. ⚠️ **Status badges with poor contrast**
5. ⚠️ **Hover states that create visibility issues**

---

## 📊 PAGE-BY-PAGE AUDIT

### To systematically check, I'll:
1. Search for all instances of `bg-brand-primary`, `bg-[#E1BC56]`, or light backgrounds with white text
2. Check all buttons for proper contrast
3. Verify all status badges are readable
4. Test all hover states
5. Fix any violations found

---

## 🔧 FIXING STRATEGY

### For Light Yellow (#E1BC56):
- **Replace**: `text-white` → `text-gray-900` or `text-gray-800`
- **Or Replace**: Background color → darker variant
- **Or Add**: Dark text with border for visibility

### For Buttons:
- Use dark backgrounds (#A90F0F) with white text ✅
- Or light backgrounds with dark text ✅
- Never light backgrounds with light text ❌

---

## 📝 AUDIT IN PROGRESS

Let me systematically scan all admin pages...


