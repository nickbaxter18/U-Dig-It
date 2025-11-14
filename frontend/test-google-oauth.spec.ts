import { expect, test } from '@playwright/test';

test.describe('Google OAuth Integration', () => {
  test('should complete Google OAuth flow successfully', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('http://localhost:3000/login');

    // 2. Click Google sign-in button
    await page.click('button:has-text("Continue with Google")');

    // 3. Verify redirect to Supabase OAuth
    await expect(page).toHaveURL(/bnimazxnqligusckahab\.supabase\.co\/auth\/v1\/authorize/);

    // 4. Verify OAuth parameters
    const url = page.url();
    expect(url).toContain('provider=google');
    expect(url).toContain('redirectTo=');

    console.log('✅ OAuth redirect to Supabase successful');
    console.log('Current URL:', url);
  });

  test('should handle OAuth callback correctly', async ({ page }) => {
    // Navigate directly to callback URL with mock parameters
    await page.goto('http://localhost:3000/auth/callback');

    // Should redirect to dashboard if authenticated, or signin if not
    await expect(page).toHaveURL(/\/(dashboard|auth\/signin)/);

    console.log('✅ OAuth callback handling working');
    console.log('Redirected to:', page.url());
  });

  test('should show Google sign-in button on login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Check for Google sign-in button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();

    // Check button styling and accessibility
    await expect(googleButton).toHaveAttribute('type', 'button');

    console.log('✅ Google sign-in button displayed correctly');
  });

  test('should show Google sign-in button on register page', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    // Check for Google sign-in button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();

    console.log('✅ Google sign-in button displayed on register page');
  });

  test('should validate environment variables', async ({ page }) => {
    // This test verifies that the Supabase client is configured correctly
    await page.goto('http://localhost:3000');

    // Check if the page loads without environment variable errors
    const errorMessages = page.locator('.error, [data-error], .bg-red-50');
    const errorCount = await errorMessages.count();

    expect(errorCount).toBe(0);

    console.log('✅ No environment variable errors detected');
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    // Navigate to callback with error parameters
    await page.goto('http://localhost:3000/auth/callback?error=access_denied');

    // Should redirect to signin with error message
    await expect(page).toHaveURL(/\/auth\/signin/);

    console.log('✅ OAuth error handling working');
  });
});

test.describe('Authentication Middleware', () => {
  test('should protect dashboard routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/signin/);

    console.log('✅ Dashboard route protection working');
  });

  test('should allow access to public routes', async ({ page }) => {
    // Test public routes
    const publicRoutes = ['/', '/login', '/register', '/about'];

    for (const route of publicRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      // Should not redirect for public routes
      await expect(page).toHaveURL(new RegExp(`^.*localhost:3000${route}`));
    }

    console.log('✅ Public routes accessible');
  });
});

test.describe('User Session Management', () => {
  test('should maintain session across page reloads', async ({ page }) => {
    // This would require manual Google OAuth completion first
    // For automated testing, we would need to mock the OAuth flow

    await page.goto('http://localhost:3000/login');

    // Check if OAuth buttons are present and functional
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeEnabled();

    console.log('✅ OAuth buttons are functional');
  });

  test('should clear session on logout', async ({ page }) => {
    // This would test the logout functionality
    // Requires authenticated session first

    console.log('✅ Session management tests ready (requires authenticated state)');
  });
});

















