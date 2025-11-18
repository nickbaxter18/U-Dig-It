# Infinite Loop Fix - Startup Scripts

## 🚨 Critical Bug Fixed

**Date:** November 18, 2025
**Issue:** Startup scripts caused infinite loop
**Status:** ✅ RESOLVED

---

## The Problem

The startup scripts had a **circular reference** that caused an infinite loop:

```
User runs: pnpm dev
    ↓
Calls: start-frontend-clean.sh
    ↓
Script runs: pnpm dev  ← LOOPS BACK!
    ↓
Calls: start-frontend-clean.sh
    ↓
Infinite recursion...
```

### What Happened

1. `package.json` configured `dev` script to run `bash ../start-frontend-clean.sh`
2. `start-frontend-clean.sh` ended with `PORT=3000 pnpm dev`
3. This caused the script to call itself recursively
4. Result: Infinite loop, server never starts

---

## The Solution

### Changed Both Startup Scripts

**Old Code (WRONG):**
```bash
PORT=3000 pnpm dev  # ❌ Calls script again!
```

**New Code (CORRECT):**
```bash
# CRITICAL: Use 'pnpm next dev' directly to avoid infinite loop
# ('pnpm dev' calls this script, which would cause recursion)
PORT=3000 pnpm next dev  # ✅ Calls Next.js directly
```

### Files Updated

1. ✅ `start-frontend-clean.sh` - Line 44
2. ✅ `start-frontend-deep-clean.sh` - Line 46
3. ✅ `.cursor/rules/nextjs-startup-optimization.mdc` - Documentation updated
4. ✅ `.cursor/rules/CORE.mdc` - Added warning about internal use

---

## How It Works Now

### User Flow (External)
```
User runs: bash start-frontend-clean.sh
    ↓
OR
User runs: cd frontend && pnpm dev
    ↓
Calls: start-frontend-clean.sh
    ↓
Script runs: pnpm next dev  ← Calls Next.js DIRECTLY
    ↓
Server starts! ✅
```

### Internal Script Flow
```
start-frontend-clean.sh
    ↓
Kill existing processes
    ↓
Clean ports 3000/3001
    ↓
Remove stale lock file
    ↓
Run: PORT=3000 pnpm next dev  ← Direct Next.js call
    ↓
Server starts with Turbopack caching
```

---

## Key Takeaways

### ✅ DO THIS (Users)
```bash
# Use the optimized script
bash start-frontend-clean.sh

# Or use pnpm dev (calls script)
cd frontend && pnpm dev
```

### ⚠️ INTERNAL ONLY (Scripts)
```bash
# Scripts must use 'pnpm next dev' to avoid loop
PORT=3000 pnpm next dev
```

### ❌ DON'T DO THIS (Users)
```bash
# Bypasses optimizations (no port cleanup, no lock handling)
cd frontend && next dev
pnpm next dev  # Use pnpm dev instead
```

---

## Why This Matters

The startup scripts provide critical functionality:
- ⚡ **70% faster restarts** with Turbopack caching
- 🧹 **Automatic port cleanup** (3000/3001)
- 🔄 **Process cleanup** (kills zombie Next.js)
- 🔒 **Lock file handling** (removes stale locks)
- 💾 **Cache preservation** (keeps Turbopack cache)

**Using `next dev` directly bypasses ALL of this!**

---

## Testing the Fix

1. ✅ Stopped infinite loop processes
2. ✅ Updated both scripts
3. ✅ Started server successfully
4. ✅ Server running on port 3000
5. ✅ No recursion detected
6. ✅ Documentation updated

---

## Prevention

To prevent this in the future:

1. **Never** have a script call `pnpm dev` if `pnpm dev` is configured to call that script
2. **Always** use direct commands (`pnpm next dev`) inside scripts
3. **Test** startup scripts after any changes
4. **Review** Cursor rules before modifying startup flow

---

**Status:** ✅ Issue resolved, documentation updated, testing complete

