# ⚡ Cursor 2.0 Quick Reference Card

**Print this and keep it handy!**

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+C` | Composer | Open multi-file editor |
| `Ctrl+Shift+G` | Git Commit | Generate commit message |
| `Ctrl+Shift+L` | Fix Logs | Fix console.* statements |
| `Ctrl+Shift+S` | Security Scan | Run Snyk scan |
| `Ctrl+Shift+?` | Code Archaeology | Explain code history |
| `Ctrl+K Ctrl+I` | Inline Chat | Quick AI help |
| `Ctrl+Shift+V` | Voice Input | Push-to-talk |

---

## 🚀 Quick Commands

### Code Generation
```bash
# Migration
node scripts/cursor-actions/generate-migration.js add_table table_name

# API Route
node scripts/cursor-actions/create-api-route.js path/to/route POST

# Component
node scripts/cursor-actions/generate-component.js ComponentName components/path
```

### Code Quality
```bash
# Fix console logs (dry run)
node scripts/cursor-actions/fix-console-logs.js --dry-run

# Fix console logs (apply)
node scripts/cursor-actions/fix-console-logs.js

# Generate commit message
git add . && node scripts/cursor-actions/generate-commit-message.js
```

---

## 📁 Key Files

### Configuration
- `.cursor/auto-fix-patterns.json` - Auto-fix rules
- `.cursor/security-patterns.json` - Security detection
- `.cursor/performance-budgets.json` - Performance limits
- `.cursor/mcp-resources.json` - Templates

### Scripts
- `scripts/cursor-actions/` - All action scripts
- `.husky/pre-commit` - Enhanced pre-commit hook

### Documentation
- `.cursor/FINAL-IMPLEMENTATION-SUMMARY.md` - Complete guide
- `.cursor/CREATIVE-QUICK-WINS.md` - Creative ideas

---

## 🎯 Common Workflows

### New Feature
1. Generate migration: `node scripts/cursor-actions/generate-migration.js ...`
2. Create API route: `node scripts/cursor-actions/create-api-route.js ...`
3. Generate component: `node scripts/cursor-actions/generate-component.js ...`
4. Commit: `git add . && node scripts/cursor-actions/generate-commit-message.js`

### Fix Code Quality
1. Fix console logs: `node scripts/cursor-actions/fix-console-logs.js`
2. Run security scan: Press `Ctrl+Shift+S`
3. Check performance: `node scripts/cursor-actions/check-performance-budgets.js`

### Pre-Commit
- Automatically runs:
  - Type checking
  - Security checks
  - Console.log warnings

---

## 💡 Pro Tips

1. **Use Composer for multi-file changes** (`Ctrl+Shift+C`)
2. **Generate commit messages** before committing (`Ctrl+Shift+G`)
3. **Fix console logs** regularly (run script weekly)
4. **Use MCP resources** in Composer for templates
5. **Check performance budgets** before deploying

---

## 🆘 Troubleshooting

**Pre-commit fails?**
- Check for hardcoded secrets
- Fix console.log warnings
- Run type check manually: `cd frontend && pnpm type-check`

**Scripts not working?**
- Check permissions: `chmod +x scripts/cursor-actions/*.js`
- Verify Node version: `node --version` (should be 20+)

**MCP resources not found?**
- Restart Cursor
- Check `.cursor/mcp-resources.json` exists

---

**Last Updated:** November 7, 2025
