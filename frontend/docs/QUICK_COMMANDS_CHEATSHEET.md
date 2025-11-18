# 🚀 Quick Commands Cheatsheet

**One-page reference for all development tools**

---

## 🏃 Development

```bash
pnpm dev                    # Start Next.js dev server (port 3000)
pnpm storybook              # Start Storybook (port 6006)
bash start-frontend-clean.sh # Clean start (kills ports, clears cache)
```

---

## 🧪 Testing

```bash
# Unit Tests (Vitest)
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Generate coverage report
pnpm test:ui                # Vitest UI (interactive)

# E2E Tests (Playwright)
pnpm test:e2e               # Run all E2E tests
pnpm test:e2e:admin         # Admin dashboard tests
pnpm test:e2e:admin:ui      # Playwright UI mode
pnpm test:accessibility     # A11y tests

# Specific Tests
pnpm test:lib               # Library tests only
pnpm test:components        # Component tests only
pnpm test:api               # API tests only
```

---

## ✅ Quality Checks

```bash
# Individual Checks
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix ESLint issues
pnpm format                 # Prettier format
pnpm type-check             # TypeScript compilation

# Combined Checks
pnpm quality:fast           # Lint + Type Check
pnpm quality:all            # Lint + Type + Test + Security
pnpm ci                     # Full CI check (quality + build)
```

---

## 🔒 Security

```bash
pnpm security:scan          # Snyk code scan (finds vulnerabilities)
pnpm security:deps          # Snyk dependency check
pnpm security:all           # Both scans
```

---

## 📦 Bundle Analysis

```bash
pnpm size                   # Check bundle sizes vs limits
pnpm size:why               # Detailed analysis (what's in bundles)
pnpm analyze                # Full Next.js bundle analyzer
pnpm test:bundle-analyze    # Analyze during build
```

---

## 🧹 Code Cleanup

```bash
pnpm knip                   # Find unused files/exports/dependencies
pnpm knip:production        # Production code only
pnpm unused                 # Alias for knip
```

---

## 🏗️ Build & Deploy

```bash
pnpm build                  # Production build
pnpm build:check            # Build with type checking
pnpm start                  # Start production server
pnpm clean                  # Clean cache/build artifacts
```

---

## 📚 Storybook

```bash
pnpm storybook              # Dev mode (port 6006)
pnpm build-storybook        # Build static Storybook
npx chromatic               # Visual regression testing
```

---

## 🪝 Git Hooks

```bash
git commit                  # Triggers pre-commit hook:
                            #   1. Lint & Format
                            #   2. Type Check
                            #   3. Snyk Security Scan

git commit --no-verify      # Skip hooks (EMERGENCY ONLY)
pnpm precommit              # Run pre-commit manually
```

---

## 🐛 Debugging

```bash
# Type Errors
pnpm type-check:verbose     # Detailed type errors

# Test Debugging
pnpm test:debug             # Debug tests
pnpm test:e2e:admin:debug   # Debug E2E tests

# Linting
pnpm lint:fix               # Auto-fix lint issues

# Port Issues
bash start-frontend-clean.sh # Kills processes on ports 3000/3001
```

---

## 📊 Reporting

```bash
pnpm test:coverage          # Generate coverage report
pnpm test:health            # Test health report
pnpm coverage:delta         # Coverage changes
```

---

## 🔧 Utilities

```bash
pnpm reconcile:stripe       # Reconcile Stripe payments
pnpm policy:drift           # Check RLS policy drift
```

---

## 💡 Pro Tips

### Daily Workflow
1. `bash start-frontend-clean.sh` - Start clean
2. `pnpm storybook` - Develop components
3. `pnpm test:watch` - Watch tests
4. `git commit` - Hooks run automatically

### Before PR
1. `pnpm quality:all` - Full check
2. `pnpm size` - Check bundle size
3. `pnpm knip` - Clean unused code

### CI/CD Pipeline
```bash
pnpm ci
# Runs: lint → type-check → test → security:scan → build
```

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `bash start-frontend-clean.sh` |
| Tests failing | `pnpm clean && pnpm install` |
| Type errors | `pnpm type-check:verbose` |
| Lint errors | `pnpm lint:fix` |
| Bundle too large | `pnpm size:why` |
| Unused code | `pnpm knip` |
| Security issues | `pnpm security:scan` |

---

## 📖 Full Documentation

See `DEVELOPMENT_TOOLS_GUIDE.md` for detailed documentation.

---

**Bookmark this page! 🔖**

