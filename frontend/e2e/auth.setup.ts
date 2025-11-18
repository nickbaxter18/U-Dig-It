// Authentication setup script - creates and saves admin session
// Uses API-based authentication to bypass UI login flow
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const ADMIN_TEST_ACCOUNT = {
  email: 'aitest2@udigit.ca',
  password: 'TestAI2024!@#$',
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bnimazxnqligusckahab.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc';

const authFile = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page, context }) => {
  console.log('🔐 Authenticating as admin via browser Supabase client...');

  // Navigate to homepage and authenticate using the browser's Supabase client
  // This ensures cookies are set properly by the SSR package
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Authenticate using Supabase client in the browser context
  // This is the most reliable way because the SSR package handles cookie management
  const authResult = await page.evaluate(
    async ([url, anonKey, email, password]) => {
      try {
        // Dynamically import Supabase
        const { createBrowserClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/ssr@0.5.2/+esm');

        // Create browser client (this will handle cookies automatically)
        const supabase = createBrowserClient(url, anonKey);

        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data.session) {
          return { success: false, error: 'No session created' };
        }

        return {
          success: true,
          user: data.user,
          session: {
            access_token: data.session.access_token.substring(0, 20) + '...',
            expires_at: data.session.expires_at
          }
        };
      } catch (e) {
        return { success: false, error: e.message || String(e) };
      }
    },
    [SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_TEST_ACCOUNT.email, ADMIN_TEST_ACCOUNT.password]
  );

  if (!authResult.success) {
    throw new Error(`Authentication failed: ${authResult.error}`);
  }

  console.log('✅ Authentication successful via browser');
  console.log(`   User: ${authResult.user.email}`);
  console.log(`   Role: ${authResult.user.user_metadata?.role || 'N/A'}`);

  // Wait for cookies to be set by Supabase SSR
  await page.waitForTimeout(2000);

  console.log('💾 Saving authentication state...');

  // Save the storage state with cookies and localStorage set by Supabase
  await context.storageState({ path: authFile });

  console.log('🧪 Verifying authentication...');

  // Navigate to admin dashboard
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Check if we're authenticated
  const currentUrl = page.url();

  if (currentUrl.includes('/auth/signin') || currentUrl.includes('/admin-login')) {
    // Check storage state for debugging
    const debugInfo = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const cookies = document.cookie;

      return {
        localStorageKeys: keys,
        hasCookies: !!cookies,
        cookiePreview: cookies.substring(0, 100),
      };
    });

    console.log('❌ Auth verification failed. Debug:');
    console.log(JSON.stringify(debugInfo, null, 2));

    throw new Error(`Authentication verification failed: Redirected to login. URL: ${currentUrl}`);
  }

  console.log(`✅ Authentication verified - on admin dashboard!`);

  // Save final state
  await context.storageState({ path: authFile });

  console.log('✅ Authentication setup complete!');
  console.log(`   State saved to: ${authFile}`);
});

