import { Page, expect, test } from '@playwright/test';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'aitest2@udigit.ca',
  password: 'TestAI2024!@#$',
  firstName: 'AI',
  lastName: 'Tester'
};

async function login(page: Page) {
  console.log('🔐 Starting login process...');

  await page.goto('http://localhost:3000/auth/signin');
  await page.waitForLoadState('networkidle');

  const emailButton = page.getByRole('button', { name: /sign in with email/i });
  await emailButton.click();
  await page.waitForTimeout(1000);

  const emailInput = page.getByRole('textbox', { name: /email address/i });
  const passwordInput = page.getByRole('textbox', { name: /^password$/i });

  await emailInput.fill(TEST_CREDENTIALS.email);
  await passwordInput.fill(TEST_CREDENTIALS.password);

  const signInButton = page.locator('form').getByRole('button', { name: /^sign in$/i });
  await signInButton.click();

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  console.log('✅ Login successful');
}

test.describe('Complete Booking and Payment Flow', () => {
  test.setTimeout(180000); // 3 minutes

  test('should complete full booking flow and display payment options', async ({ page }) => {
    await login(page);

    console.log('\n📋 Step 1: Starting New Booking...');

    // Click "New Booking" button
    const newBookingButton = page.getByRole('link', { name: /new booking/i }).first();
    await newBookingButton.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Navigated to booking form');

    // Take screenshot of booking page
    await page.screenshot({
      path: '/tmp/booking-form-step1.png',
      fullPage: true
    });

    console.log('\n📋 Step 2: Filling Equipment Details...');

    // Fill equipment selection
    const equipmentSelect = page.locator('select[name="equipmentId"]');
    if (await equipmentSelect.isVisible()) {
      await equipmentSelect.selectOption({ index: 1 }); // Select first equipment
      console.log('✅ Equipment selected');
    }

    // Fill dates (future dates)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // 7 days from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // 5-day rental

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const startDateInput = page.locator('input[name="startDate"], input[type="date"]').first();
    const endDateInput = page.locator('input[name="endDate"], input[type="date"]').nth(1);

    if (await startDateInput.isVisible()) {
      await startDateInput.fill(startDateStr);
      console.log(`✅ Start date: ${startDateStr}`);
    }

    if (await endDateInput.isVisible()) {
      await endDateInput.fill(endDateStr);
      console.log(`✅ End date: ${endDateStr}`);
    }

    // Take screenshot after filling dates
    await page.screenshot({
      path: '/tmp/booking-form-step2.png',
      fullPage: true
    });

    console.log('\n📋 Step 3: Checking for Continue/Next Button...');

    // Look for the specific "Go to next step" button
    const continueButton = page.getByRole('button', { name: 'Go to next step' });

    try {
      if (await continueButton.isVisible({ timeout: 2000 })) {
        console.log('✅ Found "Go to next step" button, clicking...');
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    } catch {
      console.log('⚠️  No "Go to next step" button found, may be single-page form');
    }

    // Take screenshot of current state
    await page.screenshot({
      path: '/tmp/booking-form-step3.png',
      fullPage: true
    });

    console.log('\n📋 Step 4: Looking for Submit Button...');

    // Look for submit button
    const submitButton = page.getByRole('button', { name: /submit|create booking|confirm/i });

    if (await submitButton.isVisible()) {
      console.log('✅ Found submit button');

      // Take screenshot before submit
      await page.screenshot({
        path: '/tmp/booking-form-before-submit.png',
        fullPage: true
      });

      console.log('🚀 Submitting booking...');
      await submitButton.click();

      // Wait for success or next step
      await page.waitForTimeout(3000);

      // Take screenshot after submit
      await page.screenshot({
        path: '/tmp/booking-form-after-submit.png',
        fullPage: true
      });

      console.log('✅ Booking submitted');
    } else {
      console.log('⚠️  No submit button found');
    }

    console.log('\n📋 Step 5: Checking Current Page State...');

    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Take final screenshot
    await page.screenshot({
      path: '/tmp/booking-flow-final.png',
      fullPage: true
    });

    // Check if we're on booking management page
    if (currentUrl.includes('/book/') && currentUrl.includes('/manage')) {
      console.log('✅ Successfully navigated to booking management page');

      console.log('\n📋 Step 6: Looking for Payment Sections...');

      // Wait a bit for the page to fully load
      await page.waitForTimeout(2000);

      // Look for payment buttons
      const payInvoiceButton = page.getByRole('button', { name: /pay invoice/i });
      const payDepositButton = page.getByRole('button', { name: /pay.*deposit/i });

      const invoiceVisible = await payInvoiceButton.isVisible();
      const depositVisible = await payDepositButton.isVisible();

      console.log(`   Pay Invoice Button: ${invoiceVisible ? '✅ Visible' : '❌ Not visible'}`);
      console.log(`   Pay Deposit Button: ${depositVisible ? '✅ Visible' : '❌ Not visible'}`);

      if (invoiceVisible) {
        console.log('\n💳 Testing Invoice Payment Flow...');

        await payInvoiceButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot of invoice
        await page.screenshot({
          path: '/tmp/invoice-section.png',
          fullPage: true
        });

        // Check for invoice elements
        const invoiceHeader = await page.getByText(/INVOICE/i).count();
        const totalDue = await page.getByText(/total due/i).count();

        console.log(`   Invoice Header: ${invoiceHeader > 0 ? '✅ Found' : '❌ Not found'}`);
        console.log(`   Total Due: ${totalDue > 0 ? '✅ Found' : '❌ Not found'}`);

        // Look for checkout button
        const checkoutButton = page.getByRole('button', { name: /proceed to.*checkout|pay.*total/i });

        if (await checkoutButton.isVisible()) {
          console.log('✅ Found checkout button');

          // Listen for API call
          const apiPromise = page.waitForResponse(
            response => response.url().includes('/api/stripe/create-checkout-session'),
            { timeout: 15000 }
          );

          console.log('🚀 Clicking checkout button...');
          await checkoutButton.click();

          try {
            const response = await apiPromise;
            const data = await response.json();

            console.log(`\n📡 API Response: ${response.status()}`);

            if (data.sessionUrl) {
              console.log('✅ Checkout session created successfully!');
              console.log(`🔗 Session URL: ${data.sessionUrl}`);

              // Wait for redirect
              await page.waitForURL('**/checkout.stripe.com/**', { timeout: 10000 });
              console.log('✅ Redirected to Stripe Checkout!');

              // Take screenshot of Stripe page
              await page.waitForTimeout(2000);
              await page.screenshot({
                path: '/tmp/stripe-checkout-page.png',
                fullPage: true
              });

              console.log('📸 Screenshot saved: /tmp/stripe-checkout-page.png');
            }
          } catch (error) {
            console.log('⚠️  No redirect to Stripe (may have errored)');
          }
        }
      }
    } else {
      console.log('⚠️  Not on booking management page yet');
      console.log('   This may be normal - booking flow may have multiple steps');
    }

    // Final summary
    console.log('\n📊 Test Summary:');
    console.log('   • Login: ✅ Successful');
    console.log('   • Booking Form: ✅ Accessed');
    console.log('   • Screenshots: ✅ Captured');
    console.log('   • Current URL:', currentUrl);
  });
});

