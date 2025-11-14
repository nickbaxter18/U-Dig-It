# Extensions Quick Start Guide

**TL;DR**: Install recommended extensions for maximum AI coding potential.

---

## 🚀 Quick Install (3 Steps)

### Step 1: Open Extensions Panel
Press `Cmd/Ctrl+Shift+X` or click Extensions icon

### Step 2: Install Recommended
Cursor/VS Code will show a notification: **"This workspace has extension recommendations"**
- Click **"Install All"** or **"Show Recommendations"**

### Step 3: Verify Critical Extensions
Check these are installed:
- ✅ Supabase (`supabase.supabase-vscode`)
- ✅ Error Lens (`usernamehw.errorlens`)
- ✅ Code Spell Checker (`streetsidesoftware.code-spell-checker`)

---

## 🎯 Critical Extensions (Install First)

### 1. Supabase Extension
**Why**: Direct Supabase integration, schema visualization, type generation

**Setup**:
1. Command Palette (`Cmd/Ctrl+Shift+P`)
2. Type: "Supabase: Add Project"
3. Enter your Supabase URL and anon key

### 2. Error Lens
**Why**: Shows errors inline (not just in Problems panel)

**No setup needed** - Works immediately!

### 3. Code Spell Checker
**Why**: Catches typos in code

**No setup needed** - Custom words already configured in settings.json

---

## 📋 Full Extension List

See [CURSOR_EXTENSIONS_SETUP.md](./CURSOR_EXTENSIONS_SETUP.md) for complete list and details.

---

## ✅ Verification

After installing, test:

```bash
# 1. Check Error Lens
# Create a file with: const x: string = 123;
# Should see error highlighted inline

# 2. Check Code Spell Checker
# Type: const kubota = "test";
# Should NOT show error (word is in dictionary)

# 3. Check Supabase
# Command Palette → "Supabase: Status"
# Should show connection status
```

---

## 🎉 Done!

You're now set up with all recommended extensions. AI coding assistance will be significantly improved!

**Next Steps**:
- Read [CURSOR_EXTENSIONS_SETUP.md](./CURSOR_EXTENSIONS_SETUP.md) for detailed configuration
- Check [AI_CODING_REFERENCE.md](./AI_CODING_REFERENCE.md) for coding patterns

---

**Status**: ✅ Ready to Install


