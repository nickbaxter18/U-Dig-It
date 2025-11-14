# Cursor Extensions Setup Guide

**Purpose**: Recommended extensions that maximize AI coding capabilities and developer productivity.

---

## 🎯 Extension Categories

### ✅ **Already Installed** (via devcontainer)
These are already configured and working:
- ESLint
- TypeScript
- Snyk Security
- SonarLint
- Tailwind CSS IntelliSense
- Stylelint
- Markdown Lint
- Jest
- Playwright
- SQLTools
- Docker

---

## 🚀 **NEW - Highly Recommended Extensions**

### 1. **Supabase MCP Tools** ⭐ ALREADY AVAILABLE
**Status**: ✅ Already configured via MCP

**Why**:
- Supabase MCP tools are already available
- No VS Code extension needed
- AI can use `mcp_supabase_*` tools directly

**Available Tools**:
- `mcp_supabase_list_tables` - List database tables
- `mcp_supabase_execute_sql` - Execute SQL queries
- `mcp_supabase_apply_migration` - Apply migrations
- `mcp_supabase_generate_typescript_types` - Generate types
- And many more...

**Benefits for AI**:
- ✅ Direct database access
- ✅ Schema inspection
- ✅ Migration management
- ✅ Type generation
- ✅ Log monitoring

**Note**: No extension installation needed - MCP tools are sufficient!

---

### 2. **Error Lens** ⭐ HIGHLY RECOMMENDED
**Extension ID**: `usernamehw.errorlens`

**Why**:
- Shows errors inline (not just in Problems panel)
- Displays warnings and info messages
- Real-time error highlighting
- Helps AI catch errors faster

**Benefits for AI**:
- AI can see errors immediately in code
- Faster error detection
- Better code quality feedback

---

### 3. **Code Spell Checker** ⭐ RECOMMENDED
**Extension ID**: `streetsidesoftware.code-spell-checker`

**Why**:
- Catches typos in code
- Prevents variable name mistakes
- Improves code quality

**Benefits for AI**:
- AI can catch typos before committing
- Better variable naming
- Fewer bugs from typos

---

### 4. **Todo Tree** ⭐ USEFUL
**Extension ID**: `gruntfuggly.todo-tree`

**Why**:
- Finds all TODO/FIXME comments
- Helps track technical debt
- Organizes tasks

**Benefits for AI**:
- AI can find TODO comments quickly
- Better task tracking
- Helps prioritize work

---

### 5. **Better Comments** ⭐ USEFUL
**Extension ID**: `aaron-bond.better-comments`

**Why**:
- Highlights important comments
- Color-codes comment types
- Makes code more readable

**Benefits for AI**:
- AI can identify important comments
- Better code understanding
- Highlights critical sections

---

### 6. **Path Intellisense** ⭐ USEFUL
**Extension ID**: `christian-kohler.path-intellisense`

**Why**:
- Autocompletes file paths
- Prevents path typos
- Faster imports

**Benefits for AI**:
- AI can use correct paths
- Fewer import errors
- Better path suggestions

---

### 7. **Import Cost** ⭐ USEFUL
**Extension ID**: `wix.vscode-import-cost`

**Why**:
- Shows bundle size of imports
- Helps optimize bundle size
- Identifies heavy dependencies

**Benefits for AI**:
- AI can optimize imports
- Better bundle size awareness
- Performance optimization

---

### 8. **GitLens** ⭐ USEFUL
**Extension ID**: `eamodio.gitlens`

**Why**:
- Enhanced git integration
- Blame annotations
- Commit history
- Better git workflow

**Benefits for AI**:
- AI can see git history
- Better code context
- Understands code evolution

---

### 9. **Thunder Client** ⭐ USEFUL FOR API WORK
**Extension ID**: `rangav.vscode-thunder-client`

**Why**:
- API testing inside VS Code
- Test API routes directly
- No external tools needed

**Benefits for AI**:
- AI can test API routes
- Faster API development
- Better API debugging

---

### 10. **Prettier** ⭐ RECOMMENDED
**Extension ID**: `esbenp.prettier-vscode`

**Why**:
- Automatic code formatting
- Consistent code style
- Format on save

**Benefits for AI**:
- Consistent code formatting
- Better code readability
- Fewer formatting issues

---

## 📋 Installation Instructions

### Option 1: Install via Cursor/VS Code UI

1. **Open Extensions Panel**:
   - Press `Cmd/Ctrl+Shift+X`
   - Or click Extensions icon in sidebar

2. **Install Each Extension**:
   - Search for extension name
   - Click "Install"
   - Repeat for each extension

### Option 2: Install via Command Line

```bash
# Install all recommended extensions
code --install-extension supabase.supabase-vscode
code --install-extension usernamehw.errorlens
code --install-extension streetsidesoftware.code-spell-checker
code --install-extension gruntfuggly.todo-tree
code --install-extension aaron-bond.better-comments
code --install-extension christian-kohler.path-intellisense
code --install-extension wix.vscode-import-cost
code --install-extension eamodio.gitlens
code --install-extension rangav.vscode-thunder-client
code --install-extension esbenp.prettier-vscode
```

### Option 3: Use Extensions JSON (Recommended)

The `.vscode/extensions.json` file has been created with all recommendations. Cursor/VS Code will:
- Show notification to install recommended extensions
- Allow one-click install of all recommendations

---

## 🎯 Priority Installation Order

### **Tier 1: Critical** (Install First)
1. ✅ Error Lens (Supabase MCP already available - no extension needed)
2. ✅ Code Spell Checker
3. ✅ Prettier

### **Tier 2: Highly Recommended** (Install Next)
4. ✅ Prettier
5. ✅ Todo Tree
6. ✅ Path Intellisense

### **Tier 3: Useful** (Install When Needed)
7. ✅ Better Comments
8. ✅ Import Cost
9. ✅ GitLens
10. ✅ Thunder Client

---

## ⚙️ Configuration

### Supabase Extension Setup

1. **Connect to Supabase**:
   - Open Command Palette (`Cmd/Ctrl+Shift+P`)
   - Type "Supabase: Add Project"
   - Enter your Supabase project URL and anon key

2. **Generate Types**:
   - Command Palette → "Supabase: Generate TypeScript Types"
   - Saves to `supabase/types.ts`

### Error Lens Configuration

Add to `.vscode/settings.json`:
```json
{
  "errorLens.enabled": true,
  "errorLens.enabledDiagnosticLevels": ["error", "warning"],
  "errorLens.followCursor": "activeLine"
}
```

### Prettier Configuration

Add to `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Code Spell Checker Configuration

Add to `.vscode/settings.json`:
```json
{
  "cSpell.words": [
    "kubota",
    "udigit",
    "supabase",
    "docussign",
    "stripe",
    "sendgrid"
  ]
}
```

---

## 🔍 How AI Uses These Extensions

### Diagnostics (read_lints tool)
These extensions provide diagnostics that AI can read:
- ✅ ESLint
- ✅ TypeScript
- ✅ Snyk Security
- ✅ SonarLint
- ✅ Tailwind CSS
- ✅ Stylelint
- ✅ Error Lens (visual + diagnostic)

### Code Understanding
These help AI understand code better:
- ✅ GitLens (git history)
- ✅ Todo Tree (TODO comments)
- ✅ Better Comments (important comments)

### Code Quality
These help AI write better code:
- ✅ Code Spell Checker (typos)
- ✅ Path Intellisense (correct paths)
- ✅ Import Cost (bundle size)

### Testing & Debugging
These help AI test and debug:
- ✅ Thunder Client (API testing)
- ✅ Jest (test runner)
- ✅ Playwright (E2E tests)

---

## 📊 Extension Impact Matrix

| Extension | AI Benefit | Developer Benefit | Priority |
|-----------|------------|-------------------|----------|
| Supabase | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Critical |
| Error Lens | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High |
| Code Spell Checker | ⭐⭐⭐ | ⭐⭐⭐⭐ | High |
| Prettier | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High |
| Todo Tree | ⭐⭐⭐ | ⭐⭐⭐ | Medium |
| Path Intellisense | ⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| Import Cost | ⭐⭐ | ⭐⭐⭐ | Medium |
| GitLens | ⭐⭐ | ⭐⭐⭐⭐ | Medium |
| Thunder Client | ⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| Better Comments | ⭐⭐ | ⭐⭐⭐ | Low |

---

## 🚫 Extensions NOT Recommended

These don't help AI and may cause conflicts:

❌ **Code Runner** - AI uses terminal commands
❌ **Live Server** - Not needed for Next.js
❌ **Bracket Pair Colorizer** - Visual only, conflicts with built-in
❌ **Auto Import** - Can conflict with manual imports
❌ **Snippet Extensions** - AI writes complete code

---

## ✅ Verification

After installing extensions, verify they're working:

```bash
# Check ESLint
# Open a .tsx file - should see linting errors inline

# Check TypeScript
# Open a .ts file - should see type errors

# Check Supabase
# Command Palette → "Supabase: Status" - should show connected

# Check Error Lens
# Create a file with an error - should see it highlighted inline
```

---

## 📝 Summary

**Total Recommended Extensions**: 10 new + 11 existing = **21 total**

**Critical for AI**:
1. Supabase Extension
2. Error Lens
3. Code Spell Checker

**Highly Recommended**:
4. Prettier
5. Todo Tree
6. Path Intellisense

**Useful**:
7. Better Comments
8. Import Cost
9. GitLens
10. Thunder Client

---

**Last Updated**: November 2025
**Status**: ✅ Ready to Install


