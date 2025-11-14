# Browser Testing & Automation Setup

## 🎯 Purpose

Enable AI-assisted development with browser automation to:
- Test authentication flows directly
- Diagnose UI issues in real-time
- Validate fixes without manual testing
- Create automated E2E tests

---

## 🚀 Quick Setup

### Step 1: Create Test Account

Create a dedicated test account for browser automation:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to Supabase Dashboard → Authentication → Users
# 2. Click "Add user"
# 3. Email: test@udigit.ca
# 4. Password: Test1234!@#$ (or any secure password)
# 5. Confirm email immediately

# Option 2: Via API (from your browser console while logged in)
```

### Step 2: Store Test Credentials

Create a test credentials file:

```bash
cd /home/vscode/Kubota-rental-platform/frontend
cat > .env.test.local << 'EOF'
# Test Account Credentials for Browser Automation
TEST_EMAIL=test@udigit.ca
TEST_PASSWORD=Test1234!@#$
EOF
```

**IMPORTANT:** Add to `.gitignore`:
```
.env.test.local
```

---

## 🤖 Automated Testing Scripts

### Test Script 1: Login & Navigate to Dashboard

```typescript
// tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login and access dashboard', async ({ page }) => {
    // Navigate to sign-in
    await page.goto('http://localhost:3000/auth/signin');

    // Click "Sign in with email"
    await page.getByRole('button', { name: /sign in with email/i }).click();

    // Wait for email form
    await page.waitForSelector('input[type="email"]');

    // Fill in credentials
    await page.fill('input[type="email"]', process.env.TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Verify dashboard loaded
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/dashboard/i)).toBeVisible();

    console.log('✅ Successfully logged in and accessed dashboard!');
  });

  test('should navigate to profile from dropdown', async ({ page }) => {
    // Login first (using the same flow as above)
    await page.goto('http://localhost:3000/auth/signin');
    // ... login steps ...

    // Click user dropdown
    await page.getByRole('button', { name: /user/i }).click();

    // Click profile link
    await page.getByRole('link', { name: /profile/i }).click();

    // Verify profile loaded
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByText(/profile settings/i)).toBeVisible();

    console.log('✅ Successfully navigated to profile!');
  });
});
```

### Test Script 2: Dashboard Data Loading

```typescript
// tests/e2e/dashboard-data.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Data', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    // ... login flow ...
    await page.goto('http://localhost:3000/dashboard');
  });

  test('should load user bookings', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="bookings-list"]', { timeout: 10000 });

    // Check if data loaded or "no bookings" message
    const hasBookings = await page.locator('[data-testid="booking-card"]').count() > 0;
    const noBookingsMsg = await page.getByText(/no bookings/i).isVisible();

    expect(hasBookings || noBookingsMsg).toBeTruthy();

    console.log('✅ Dashboard data loaded successfully!');
  });

  test('should display user stats', async ({ page }) => {
    // Check for stats elements
    await expect(page.getByText(/total bookings/i)).toBeVisible();
    await expect(page.getByText(/total spent/i)).toBeVisible();

    console.log('✅ User stats displayed!');
  });
});
```

---

## 📋 Manual Browser Automation Commands

For AI-assisted development, you can use these commands:

### Login Command:
```javascript
// In browser automation context
await page.goto('http://localhost:3000/auth/signin');
await page.getByRole('button', { name: /sign in with email/i }).click();
await page.fill('input[type="email"]', 'test@udigit.ca');
await page.fill('input[type="password"]', 'Test1234!@#$');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL('**/dashboard');
```

### Navigate to Dashboard:
```javascript
await page.goto('http://localhost:3000/dashboard');
await page.waitForLoadState('networkidle');
```

### Navigate to Profile:
```javascript
await page.getByRole('button', { name: /user/i }).click();
await page.getByRole('link', { name: /profile/i }).click();
await page.waitForURL('**/profile');
```

### Check Auth State:
```javascript
const authState = await page.evaluate(() => {
  const token = localStorage.getItem('supabase.auth.token');
  return {
    hasToken: !!token,
    isLoggedIn: !!token
  };
});
console.log('Auth state:', authState);
```

---

## 🔧 Playwright Configuration

Create `playwright.config.ts` in frontend directory:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🎬 Usage Examples

### Run All Tests:
```bash
cd /home/vscode/Kubota-rental-platform/frontend
npx playwright test
```

### Run Specific Test:
```bash
npx playwright test auth-flow
```

### Run in Debug Mode:
```bash
npx playwright test --debug
```

### Run with UI Mode (Interactive):
```bash
npx playwright test --ui
```

---

## 💡 AI Browser Automation Workflow

### For Me (AI) to Test Your App:

1. **You provide test credentials:**
   ```
   Email: test@udigit.ca
   Password: Test1234!@#$
   ```

2. **I can then:**
   - Login automatically
   - Navigate to any page
   - Test forms and interactions
   - Capture screenshots at any point
   - Verify data loading
   - Check console errors
   - Validate UI state

3. **Benefits:**
   - Diagnose issues directly without asking for logs
   - Test fixes in real-time
   - Create regression tests
   - Validate entire user flows

---

## 🔐 Security Considerations

### Test Account Best Practices:

1. **Separate Test Account:**
   - Use dedicated email: `test@udigit.ca`
   - Different from production accounts
   - Limited permissions if possible

2. **Secure Credentials:**
   - Store in `.env.test.local` (git-ignored)
   - Never commit to repository
   - Rotate periodically

3. **Test Data:**
   - Create sample bookings for testing
   - Don't use real customer data
   - Clean up after tests

---

## 📊 What I Can Test With Browser Automation

### ✅ Authentication Flows:
- Email/password login
- Sign up flow
- Password reset
- Session persistence
- Logout

### ✅ Protected Routes:
- Dashboard access
- Profile access
- Booking pages
- Admin pages

### ✅ User Interactions:
- Form submissions
- Dropdown menus
- Button clicks
- Modal dialogs
- File uploads

### ✅ Data Loading:
- API calls
- Database queries
- Loading states
- Error handling
- Empty states

### ✅ UI Validation:
- Element visibility
- Text content
- Form validation
- Error messages
- Success messages

---

## 🎯 Next Steps

### Option 1: Quick Test (Recommended)

**Create test account:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@udigit.ca',
  crypt('Test1234!@#$', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);
```

Then tell me:
```
Test Email: test@udigit.ca
Test Password: Test1234!@#$
```

And I can start automated testing immediately!

### Option 2: Comprehensive Setup

1. Install Playwright:
```bash
cd /home/vscode/Kubota-rental-platform/frontend
npm install -D @playwright/test
npx playwright install chromium
```

2. Create test files (I can do this)
3. Run tests: `npx playwright test`

---

## ✨ Benefits

With browser automation enabled, I can:

✅ **Test fixes immediately** - No need to ask "did it work?"
✅ **Diagnose issues directly** - See exactly what's happening
✅ **Create regression tests** - Prevent issues from coming back
✅ **Validate entire flows** - End-to-end testing
✅ **Debug faster** - Real-time inspection
✅ **Document behavior** - Screenshots and videos

---

## 📞 Ready to Enable?

Just provide test credentials:
```
Email: test@udigit.ca
Password: [your chosen password]
```

And I can immediately start testing dashboard, profile, and all other features!

**Or** if you prefer, I can create the test account through Supabase MCP tools right now.

Would you like me to:
1. ✅ Create a test account via Supabase?
2. ✅ Set up Playwright testing infrastructure?
3. ✅ Create comprehensive E2E test suites?

Let me know and I'll proceed! 🚀
































































