# Test Suite Management Guide

## 🚨 Problem: Cursor Crashes When Running Full Test Suite

The project has 107+ test suites, which crashes Cursor when run all at once.

---

## ✅ Solution: Run Tests in Smaller Batches

### 1. Test Specific Directories

```bash
# Test only components
pnpm test src/components/__tests__

# Test only lib utilities
pnpm test src/lib/__tests__

# Test only API routes
pnpm test src/app/api/__tests__

# Test specific component
pnpm test src/components/__tests__/ErrorBoundary.test.tsx
```

### 2. Test by Pattern

```bash
# Test files matching a pattern
pnpm test -t "ErrorBoundary"

# Test files in a specific path pattern
pnpm test components/auth
```

### 3. Use Test UI (No Terminal Output)

```bash
# Opens browser-based test UI (much more stable!)
pnpm test:ui
```

### 4. Run Tests with Limited Concurrency

```bash
# Run with only 2 concurrent workers
pnpm vitest --maxWorkers=2

# Run tests sequentially (slowest but most stable)
pnpm vitest --poolOptions.forks.maxForks=1
```

### 5. Generate Coverage Report (Runs All Tests, Saves to File)

```bash
# This runs all tests but outputs to files instead of terminal
pnpm test:coverage

# Then open the HTML report
open coverage/index.html
```

---

## 📊 Recommended Testing Workflow

### During Development
```bash
# 1. Test the specific file you're working on
pnpm test src/components/__tests__/MyComponent.test.tsx

# 2. Use watch mode for live feedback
pnpm vitest src/components/__tests__/MyComponent.test.tsx --watch
```

### Before Committing
```bash
# 1. Test the directory you modified
pnpm test src/components/__tests__

# 2. Run linter
pnpm lint

# 3. Type check
pnpm type-check
```

### Before Pushing (CI Simulation)
```bash
# 1. Generate coverage report (runs all tests to file)
pnpm test:coverage

# 2. Check coverage thresholds
pnpm test:coverage:check

# 3. View results in browser
open coverage/index.html
```

---

## 🔍 Investigate Test Failures

### List All Test Files
```bash
find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l
```

### Run One Test Suite to See Specific Errors
```bash
# Pick one failing test
pnpm test src/components/providers/__tests__/SupabaseAuthProvider.test.tsx
```

### Check Test Configuration
```bash
# View vitest config
cat vitest.config.ts
```

---

## 🛠️ Fix Common Issues

### Issue 1: Mock Conflicts

**Problem**: Global mocks in `src/test/setup.ts` conflict with test-specific mocks.

**Solution**: 
- Review `src/test/setup.ts`
- Use `vi.resetAllMocks()` in each test's `beforeEach`

### Issue 2: Memory Issues

**Problem**: Too many tests running in parallel.

**Current Config**: 
- `maxForks: 6`
- `maxConcurrency: 8`

**Solution**: Reduce in `vitest.config.ts`:
```typescript
poolOptions: {
  forks: {
    maxForks: 2, // Reduce from 6
    minForks: 1,
  },
},
maxConcurrency: 2, // Reduce from 8
```

### Issue 3: Async/Timeout Errors

**Current**: `testTimeout: 15000` (15 seconds)

**Solution**: Increase timeout or use `retry: 0` to fail fast:
```typescript
testTimeout: 30000,
retry: 0, // Don't retry on failure
```

---

## 📈 Test Suite Statistics

### Current Status
- **Total Test Files**: ~112 test files
- **Failing Suites**: 107
- **Test Runner**: Vitest 4.0.7 ✅ (NOT Jest)
- **Test Environment**: jsdom

### Coverage Targets
- **Global**: 65-70%
- **Components**: 75-80%
- **Critical Business Logic**: 85-90%
- **Security/Validation**: 100%

---

## 🎯 Quick Commands Reference

```bash
# Test specific directory (RECOMMENDED)
pnpm test src/components/__tests__

# Test with UI (MOST STABLE)
pnpm test:ui

# Coverage report (outputs to file)
pnpm test:coverage

# Single test file
pnpm test ErrorBoundary.test.tsx

# Watch mode for development
pnpm vitest --watch

# Run with minimal workers (most stable)
pnpm vitest --maxWorkers=1

# Skip retry attempts (fail fast)
pnpm vitest --retry=0
```

---

## 🚀 Performance Tips

1. **Use Test UI**: `pnpm test:ui` - Browser-based, much more stable
2. **Test Small Batches**: One directory at a time
3. **Reduce Concurrency**: Lower `maxForks` and `maxConcurrency`
4. **Use Coverage Report**: Runs tests to file, not terminal
5. **Skip Retries**: Set `retry: 0` to fail fast

---

## 📝 Next Steps

1. ✅ **You're using Vitest** (NOT Jest) - configuration is correct
2. ⚠️ **107 failing tests** - likely mock/configuration issues
3. 🎯 **Test in batches** - use commands above
4. 🔧 **Fix critical tests first** - start with one directory
5. 📊 **Generate coverage** - use `pnpm test:coverage`

---

**Remember**: Don't run the full test suite in the terminal. Use:
- `pnpm test:ui` for interactive testing
- `pnpm test:coverage` for full suite (outputs to file)
- Directory-specific tests for development


