# Quick Start: Running Admin E2E Tests

## Prerequisites

1. **Test Account Exists**: `aitest2@udigit.ca` with `super_admin` role
2. **Frontend Server Running**: `pnpm dev` on `http://localhost:3000`
3. **Dependencies Installed**: `pnpm install`

## Run Tests

### All Admin Tests
```bash
cd frontend
pnpm test:e2e:admin
```

### Specific Page
```bash
pnpm test:e2e:admin -- dashboard
pnpm test:e2e:admin -- bookings
```

### Interactive UI Mode (Recommended for First Run)
```bash
pnpm test:e2e:admin:ui
```

### Debug Mode
```bash
pnpm test:e2e:admin:debug
```

## Troubleshooting

### Test Account Not Found
If tests fail with authentication errors:
1. Verify account exists: Check Supabase `users` table
2. Verify role: Must be `super_admin` or `admin`
3. Update password if needed

### Server Not Running
```bash
cd frontend
bash start-frontend-clean.sh
# or
pnpm dev
```

### Import Errors
If you see import path errors, verify:
- Helpers are in: `frontend/e2e/helpers/`
- Tests are in: `frontend/tests/e2e/admin/`
- Import paths use: `../../../e2e/helpers/`

## First Test Run

For your first test run, use UI mode to see what's happening:

```bash
cd frontend
pnpm test:e2e:admin:ui
```

This opens an interactive browser where you can:
- See tests running in real-time
- Watch the browser automation
- Debug any issues visually

## Expected Results

All tests should:
- ✅ Login successfully
- ✅ Navigate to admin pages
- ✅ Verify page loads
- ✅ Check for key elements
- ✅ Complete without errors

## Next Steps

Once tests pass:
1. Tests will run automatically in CI/CD
2. Add more test cases as needed
3. Update tests when adding features

