# 🚀 Quick Test Commands (Crash-Free)

## ⚠️ NEVER RUN THESE (They Will Crash):
```bash
❌ pnpm test           # Crashes - too many tests
❌ pnpm test run       # Crashes - too many tests
❌ pnpm test:coverage  # Crashes - runs all tests
```

---

## ✅ SAFE COMMANDS (Use These Instead):

### 1. Test UI (RECOMMENDED - Most Stable)
```bash
pnpm test:ui
```
- Opens browser-based test interface
- No terminal output
- Won't crash
- Can filter/run individual tests

### 2. Single Test File
```bash
# Test one specific file
pnpm vitest src/lib/__tests__/validation.test.ts --run

# Watch mode for development
pnpm vitest src/lib/__tests__/validation.test.ts
```

### 3. Test One Directory
```bash
# Components only
pnpm vitest src/components/__tests__ --run

# Lib utilities only
pnpm vitest src/lib/__tests__ --run

# API routes only
pnpm vitest src/app/api/__tests__ --run
```

### 4. Safe Batch Testing (Custom Script)
```bash
# Test all files safely (one at a time)
bash test-safe.sh

# Test specific directory safely
bash test-safe.sh src/lib/__tests__
bash test-safe.sh src/components/__tests__
```

### 5. Test by Pattern
```bash
# Test files matching a name
pnpm vitest -t "validation" --run

# Test files in path
pnpm vitest booking --run
```

---

## 📊 Check Test Status Without Running

### Count Test Files
```bash
find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l
```

### List Test Files
```bash
find src -name "*.test.ts" -o -name "*.test.tsx"
```

### List by Directory
```bash
find src/components/__tests__ -name "*.test.*"
find src/lib/__tests__ -name "*.test.*"
find src/app/api/__tests__ -name "*.test.*"
```

---

## 🎯 Recommended Workflow

### During Development
1. Use Test UI: `pnpm test:ui`
2. Or watch single file: `pnpm vitest path/to/file.test.ts`

### Before Committing
1. Test your directory: `pnpm vitest src/components/__tests__ --run`
2. Run linter: `pnpm lint`
3. Type check: `pnpm type-check`

### Full Test Suite (CI Simulation)
1. Use safe script: `bash test-safe.sh`
2. Or use Test UI and run all

---

## 💡 Pro Tips

1. **Always use Test UI** - Most stable, best experience
2. **Never run full suite in terminal** - Will crash
3. **Test one directory at a time** - Fast and safe
4. **Use watch mode during development** - Live feedback
5. **Use safe script for full coverage** - Tests one file at a time

---

## 🐛 Current Test Status

- **Total Test Files**: ~112
- **Test Runner**: Vitest 4.0.7 ✅
- **Known Passing**: validation.test.ts (36/36 tests)
- **Configuration**: Optimized for low memory usage

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Test UI | `pnpm test:ui` |
| Single file | `pnpm vitest path/to/file.test.ts --run` |
| One directory | `pnpm vitest src/lib/__tests__ --run` |
| Safe all tests | `bash test-safe.sh` |
| Watch mode | `pnpm vitest path/to/file.test.ts` |
| List tests | `find src -name "*.test.*"` |

---

**Remember**: Use `pnpm test:ui` for the best experience! 🎯

