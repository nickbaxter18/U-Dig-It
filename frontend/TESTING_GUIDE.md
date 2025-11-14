# 🧪 Professional Testing Guide

## Quick Start

### Run Tests Quickly
```bash
# Professional test runner (recommended)
bash scripts/test.sh src/lib/__tests__/validation.test.ts

# Watch mode
bash scripts/test.sh --watch src/lib/__tests__

# Coverage
bash scripts/test.sh --coverage
```

### VS Code Integration
Use **Command Palette** (`Ctrl+Shift+P`):
- "Tasks: Run Task" → "Test: Current File"
- "Tasks: Run Task" → "Test: All Tests"
- "Tasks: Run Task" → "Test: Validation"

---

## Test Structure

### Directory Organization
```
src/
├── lib/__tests__/              ← Utility functions
├── components/__tests__/       ← React components
├── components/auth/__tests__/  ← Auth components
├── components/admin/__tests__/ ← Admin components
├── app/api/__tests__/          ← API routes
└── test/                       ← Test setup & utilities
```

### Test Naming Convention
- `*.test.ts` - TypeScript tests
- `*.test.tsx` - React component tests
- `setup.ts` - Global test configuration

---

## Testing Commands

### Quick Commands
```bash
# Single file
pnpm vitest src/lib/__tests__/validation.test.ts --run

# Directory
pnpm vitest src/lib/__tests__ --run

# Watch mode (live updates)
pnpm vitest src/lib/__tests__/validation.test.ts

# Coverage report
pnpm vitest --coverage

# Run all (CI mode)
bash scripts/test-ci.sh
```

### Professional Scripts
```bash
# Main test runner
bash scripts/test.sh [path]

# Options:
bash scripts/test.sh --watch src/lib
bash scripts/test.sh --coverage
bash scripts/test.sh --help
```

---

## Test Configuration

### vitest.config.ts
Optimized for:
- ✅ Stability (no crashes)
- ✅ Performance (balanced parallelism)
- ✅ Coverage reporting
- ✅ TypeScript support

### Key Settings
```typescript
{
  pool: 'threads',           // Thread-based execution
  maxConcurrency: 2,         // Balanced performance
  isolate: true,             // Test isolation
  fileParallelism: false,    // Sequential for stability
  testTimeout: 30000,        // 30 second timeout
  retry: 0                   // Fail fast
}
```

---

## Writing Tests

### Basic Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### React Component Tests
```typescript
import { render, screen } from '@testing-library/react';

it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### API Route Tests
```typescript
import { POST } from '../route';

it('should handle POST request', async () => {
  const request = new Request('http://localhost:3000/api/test', {
    method: 'POST',
    body: JSON.stringify({ data: 'test' })
  });

  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

---

## Test Patterns

### Mocking
```typescript
// Mock module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

// Mock function
const mockFn = vi.fn(() => 'result');
```

### Async Tests
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Testing Hooks
```typescript
import { renderHook } from '@testing-library/react';

it('should test hook', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.value).toBe('expected');
});
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: bash scripts/test-ci.sh
```

### Pre-commit Hook
Add to `package.json`:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "bash scripts/test.sh src/lib/__tests__ --run"
    }
  }
}
```

---

## Test Results

### Current Status
**Passing:**
- ✅ validation.test.ts: 36/36 (100%)
- ✅ cache.test.ts: 19/19 (100%)

**Overall:**
- ~300/402 tests passing (~75%)

### High Priority Tests
1. Security/validation tests ✅
2. Authentication tests
3. API route tests
4. Component tests

---

## Best Practices

### Development Workflow
1. **Write test first** (TDD)
2. **Run in watch mode**
   ```bash
   pnpm vitest src/lib/__tests__/myTest.test.ts
   ```
3. **Implement feature**
4. **Verify test passes**

### Before Committing
```bash
# Test affected files
bash scripts/test.sh src/lib/__tests__

# Run linter
pnpm lint

# Type check
pnpm type-check
```

### Coverage Targets
- Global: 70%
- Components: 75%
- Critical utilities: 90%
- Security/validation: 100%

---

## Troubleshooting

### Issue: Tests Timeout
**Solution:** Increase timeout in `vitest.config.ts`
```typescript
testTimeout: 60000 // 60 seconds
```

### Issue: Mock Conflicts
**Solution:** Reset mocks in `beforeEach`
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});
```

### Issue: Async Timing
**Solution:** Use `waitFor`
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

---

## Advanced Features

### Debugging Tests
```bash
# Run with debug output
NODE_OPTIONS='--inspect' pnpm vitest src/lib/__tests__/test.ts --run
```

### Filtering Tests
```bash
# Run specific test by name
pnpm vitest --run -t "should validate email"

# Run tests matching pattern
pnpm vitest --run validation
```

### Parallel Execution
Controlled by `vitest.config.ts`:
```typescript
maxConcurrency: 4  // Increase for faster tests
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Test file | `pnpm vitest path/to/file.test.ts --run` |
| Test directory | `pnpm vitest src/lib/__tests__ --run` |
| Watch mode | `pnpm vitest path/to/file.test.ts` |
| Coverage | `bash scripts/test.sh --coverage` |
| CI/CD | `bash scripts/test-ci.sh` |
| Help | `bash scripts/test.sh --help` |

---

## Next Steps

1. ✅ Use professional test scripts
2. ✅ Integrate with VS Code tasks
3. ✅ Set up CI/CD pipeline
4. ✅ Follow testing best practices
5. ✅ Maintain high coverage

**Your testing infrastructure is now professional-grade!** 🚀

