# 🛡️ PROTECTED FILES - DO NOT MOVE OR MODIFY

**CRITICAL:** These files are essential for development workflow and must NEVER be moved, renamed, or modified during reorganization.

---

## 🚨 Critical Startup Scripts

### `start-frontend-clean.sh` ⚠️ **NEVER TOUCH**
**Location:** `/home/vscode/Kubota-rental-platform/start-frontend-clean.sh`
**Purpose:** Used to start the server when opening Cursor
**Status:** **PROTECTED - DO NOT MOVE OR MODIFY**

**Why Protected:**
- Automatically executed by Cursor on startup
- Critical for development workflow
- Moving or modifying will break developer setup
- Must remain in exact current location

### `start-frontend.sh` ⚠️ **NEVER TOUCH**
**Location:** `/home/vscode/Kubota-rental-platform/start-frontend.sh`
**Purpose:** Standard frontend startup script
**Status:** **PROTECTED - DO NOT MOVE OR MODIFY**

---

## 📋 Other Protected Files

### Configuration Files
- `.env.local` (if exists)
- `.cursor/` directory (Cursor configuration)
- `package.json` (root and frontend)
- `tsconfig.json`
- `next.config.js`

### Active Development Files
- `frontend/test-runner.sh` (current test runner)
- Any files currently open in your IDE

---

## ✅ What CAN Be Moved

Only move files that are:
- ✅ Documentation (`.md` files) - SAFE
- ✅ Legacy/unused code in `backend/`, `guards/`, `decorators/` - SAFE
- ✅ Scripts that are NOT startup scripts - CHECK FIRST
- ✅ Backup files (`.backup`, `.preview`) - SAFE

---

## 🚫 Phase 3 Script Reorganization - EXCLUSIONS

When running Phase 3 (script reorganization), **EXCLUDE:**

```bash
# DO NOT MOVE THESE:
start-frontend-clean.sh    # ⚠️ CRITICAL STARTUP SCRIPT
start-frontend.sh          # ⚠️ CRITICAL STARTUP SCRIPT
restart-dev-server.sh      # May be used by developers
```

**Only safe to move:**
- `cleanup-junk-code.sh` ✅
- `setup-*` scripts ✅
- `deploy-*` scripts ✅
- Database migration scripts ✅
- Non-startup utility scripts ✅

---

## 🔍 Before Moving ANY Script

Ask these questions:
1. Is it a startup script? → **DON'T MOVE**
2. Is it referenced in package.json? → **CHECK CAREFULLY**
3. Is it used by Cursor/VS Code? → **DON'T MOVE**
4. Is it run automatically? → **DON'T MOVE**
5. Is it a utility script? → **SAFE TO MOVE**

---

## 📝 How to Check If File Is Safe to Move

```bash
# Check if script is referenced in package.json
grep -r "script-name.sh" package.json

# Check if script is referenced in Cursor config
grep -r "script-name.sh" .cursor/

# Check if script is referenced in VS Code config
grep -r "script-name.sh" .vscode/

# If ANY of above return results → DON'T MOVE!
```

---

## 🚨 Emergency Recovery

If you accidentally moved a protected file:

```bash
# Undo last git operation
git reset --hard HEAD~1

# Or restore specific file
git checkout HEAD~1 -- start-frontend-clean.sh
```

---

## ✅ Updated Reorganization Rules

### Phase 1: Documentation Cleanup
- ✅ SAFE - Only moves `.md` files
- ✅ No risk to startup scripts

### Phase 2: Remove Legacy Code
- ✅ SAFE - Only removes backend/, guards/, decorators/
- ✅ No risk to startup scripts

### Phase 3: Script Reorganization
- ⚠️ **MODIFIED** - Explicitly excludes:
  - `start-frontend-clean.sh`
  - `start-frontend.sh`
  - `restart-dev-server.sh`
- ✅ Only moves non-critical utility scripts

### Phase 4-10: Components, Infrastructure, etc.
- ✅ SAFE - Don't touch root scripts

---

## 📢 IMPORTANT REMINDER

**Before running ANY script:**
1. Read this file
2. Verify protected files won't be touched
3. Create backup branch
4. Test after execution

**The startup script is SACRED - don't touch it!** 🙏

---

*Last Updated: November 4, 2025*
*Status: Active Protection*


