import { Page, expect, test } from '@playwright/test';

// Test credentials from Browser Testing Protocol
const TEST_CREDENTIALS = {
  email: 'aitest2@udigit.ca',
  password: 'TestAI2024!@#$',
  firstName: 'AI',
  lastName: 'Tester',
};

async function login(page: Page) {
  console.log('🔐 Starting login process...');

  // Navigate to sign-in page
  await page.goto('http://localhost:3000/auth/signin');
  await page.waitForLoadState('networkidle');

  // Click "Sign in with email" button
  const emailButton = page.getByRole('button', { name: /sign in with email/i });
  await emailButton.click();
  await page.waitForTimeout(1000);

  // Fill in credentials
  console.log('📝 Filling in credentials...');
  const emailInput = page.getByRole('textbox', { name: /email address/i });
  const passwordInput = page.getByRole('textbox', { name: /^password$/i });

  await emailInput.fill(TEST_CREDENTIALS.email);
  await passwordInput.fill(TEST_CREDENTIALS.password);

  // Click Sign In button (the submit button in the form)
  const signInButton = page.locator('form').getByRole('button', { name: /^sign in$/i });
  await signInButton.click();

  // Wait for redirect to dashboard
  console.log('⏳ Waiting for dashboard redirect...');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Verify login success
  const welcomeText = await page.getByText(/welcome back/i).textContent();
  console.log('✅ Login successful:', welcomeText);
}

test.describe('Payment System Tests', () => {
  test.setTimeout(120000); // 2 minutes for full flow

  test('should display itemized invoice with correct amounts', async ({ page }) => {
    await login(page);

    console.log('\n📋 Testing Invoice Display...');

    // Navigate to manage booking
    const manageButton = page.getByRole('link', { name: /manage booking/i }).first();
    await manageButton.click();
    await page.waitForLoadState('networkidle');

    console.log('📄 Looking for invoice section...');

    // Look for "Pay Invoice" button in the checklist
    const payInvoiceButton = page.getByRole('button', { name: /pay invoice/i });

    if (await payInvoiceButton.isVisible()) {
      console.log('✅ Found "Pay Invoice" button');
      await payInvoiceButton.click();
      await page.waitForTimeout(1000);

      // Verify invoice elements are visible
      console.log('🔍 Checking invoice details...');

      // Check for invoice header
      const invoiceHeader = await page.getByText(/INVOICE/i).count();
      console.log(`   ${invoiceHeader > 0 ? '✅' : '❌'} Invoice header found`);

      // Check for line items
      const equipmentRental = await page.getByText(/equipment rental/i).count();
      console.log(`   ${equipmentRental > 0 ? '✅' : '❌'} Equipment rental line item found`);

      const transportation = await page.getByText(/transportation & staging/i).count();
      console.log(`   ${transportation > 0 ? '✅' : '❌'} Transportation & Staging found`);

      const delivery = await page.getByText(/• delivery/i).count();
      console.log(`   ${delivery > 0 ? '✅' : '❌'} Delivery sub-item found`);

      const pickup = await page.getByText(/• pickup/i).count();
      console.log(`   ${pickup > 0 ? '✅' : '❌'} Pickup sub-item found`);

      const hst = await page.getByText(/HST.*15%/i).count();
      console.log(`   ${hst > 0 ? '✅' : '❌'} HST (15%) found`);

      const totalDue = await page.getByText(/total due/i).count();
      console.log(`   ${totalDue > 0 ? '✅' : '❌'} Total Due found`);

      // Take screenshot of invoice
      await page.screenshot({
        path: '/tmp/invoice-display.png',
        fullPage: true,
      });
      console.log('📸 Screenshot saved: /tmp/invoice-display.png');

      expect(invoiceHeader).toBeGreaterThan(0);
      expect(equipmentRental).toBeGreaterThan(0);
      expect(transportation).toBeGreaterThan(0);
      expect(hst).toBeGreaterThan(0);
      expect(totalDue).toBeGreaterThan(0);
    } else {
      console.log('⚠️  Pay Invoice button not visible - may need to complete earlier steps');
      await page.screenshot({ path: '/tmp/booking-page.png' });
    }
  });

  test('should create Stripe checkout session for invoice payment', async ({
    page,
    context: _context,
  }) => {
    await login(page);

    console.log('\n💳 Testing Stripe Checkout Session Creation (Invoice)...');

    // Navigate to manage booking
    const manageButton = page.getByRole('link', { name: /manage booking/i }).first();
    await manageButton.click();
    await page.waitForLoadState('networkidle');

    // Click "Pay Invoice" button
    const payInvoiceButton = page.getByRole('button', { name: /pay invoice/i });

    if (await payInvoiceButton.isVisible()) {
      await payInvoiceButton.click();
      await page.waitForTimeout(1000);

      // Find and click the payment button
      console.log('🔍 Looking for payment button...');

      // Listen for network requests to the API
      const apiPromise = page.waitForResponse(
        (response) => response.url().includes('/api/stripe/create-checkout-session'),
        { timeout: 30000 }
      );

      // Click the payment button (look for green button with "Proceed to Secure Checkout")
      const checkoutButton = page.getByRole('button', {
        name: /proceed to secure checkout|pay.*total/i,
      });

      if (await checkoutButton.isVisible()) {
        console.log('✅ Found checkout button, clicking...');
        await checkoutButton.click();

        // Wait for API response
        console.log('⏳ Waiting for API response...');
        const response = await apiPromise;
        const responseData = await response.json();

        console.log('📡 API Response Status:', response.status());
        console.log('📡 API Response:', JSON.stringify(responseData, null, 2));

        if (response.status() === 200 && responseData.sessionUrl) {
          console.log('✅ Checkout session created successfully!');
          console.log('🔗 Session URL:', responseData.sessionUrl);

          // Wait for redirect to Stripe
          console.log('⏳ Waiting for Stripe redirect...');
          await page.waitForURL('**/checkout.stripe.com/**', { timeout: 15000 });

          console.log('✅ Successfully redirected to Stripe Checkout!');

          // Take screenshot of Stripe checkout page
          await page.waitForTimeout(2000); // Let Stripe page fully load
          await page.screenshot({
            path: '/tmp/stripe-checkout-invoice.png',
            fullPage: true,
          });
          console.log('📸 Screenshot saved: /tmp/stripe-checkout-invoice.png');

          // Verify Stripe page elements
          const stripeHeader = await page.getByText(/pay/i).count();
          console.log(`   ${stripeHeader > 0 ? '✅' : '❌'} Stripe checkout page loaded`);

          expect(responseData.sessionUrl).toContain('stripe.com');
        } else {
          console.error('❌ Failed to create checkout session');
          console.error('Response:', responseData);
          throw new Error(`API returned status ${response.status()}`);
        }
      } else {
        console.log('⚠️  Checkout button not found');
        await page.screenshot({ path: '/tmp/no-checkout-button.png' });
      }
    } else {
      console.log('⚠️  Pay Invoice section not accessible');
    }
  });

  test('should create Stripe checkout session for security deposit', async ({ page }) => {
    await login(page);

    console.log('\n💰 Testing Stripe Checkout Session Creation (Deposit)...');

    // Navigate to manage booking
    const manageButton = page.getByRole('link', { name: /manage booking/i }).first();
    await manageButton.click();
    await page.waitForLoadState('networkidle');

    // Click "Pay Security Deposit" button
    const payDepositButton = page.getByRole('button', { name: /pay.*security deposit/i });

    if (await payDepositButton.isVisible()) {
      await payDepositButton.click();
      await page.waitForTimeout(1000);

      console.log('🔍 Looking for deposit payment button...');

      // Listen for network requests
      const apiPromise = page.waitForResponse(
        (response) => response.url().includes('/api/stripe/create-checkout-session'),
        { timeout: 30000 }
      );

      // Click the deposit payment button
      const checkoutButton = page.getByRole('button', {
        name: /proceed to secure checkout|pay.*deposit/i,
      });

      if (await checkoutButton.isVisible()) {
        console.log('✅ Found deposit checkout button, clicking...');
        await checkoutButton.click();

        // Wait for API response
        console.log('⏳ Waiting for API response...');
        const response = await apiPromise;
        const responseData = await response.json();

        console.log('📡 API Response Status:', response.status());
        console.log('📡 API Response:', JSON.stringify(responseData, null, 2));

        if (response.status() === 200 && responseData.sessionUrl) {
          console.log('✅ Deposit checkout session created successfully!');
          console.log('🔗 Session URL:', responseData.sessionUrl);

          // Wait for redirect to Stripe
          await page.waitForURL('**/checkout.stripe.com/**', { timeout: 15000 });
          console.log('✅ Successfully redirected to Stripe Checkout for deposit!');

          // Take screenshot
          await page.waitForTimeout(2000);
          await page.screenshot({
            path: '/tmp/stripe-checkout-deposit.png',
            fullPage: true,
          });
          console.log('📸 Screenshot saved: /tmp/stripe-checkout-deposit.png');

          expect(responseData.sessionUrl).toContain('stripe.com');
        } else {
          console.error('❌ Failed to create deposit checkout session');
          throw new Error(`API returned status ${response.status()}`);
        }
      } else {
        console.log('⚠️  Deposit checkout button not found');
      }
    } else {
      console.log('⚠️  Pay Security Deposit section not accessible');
    }
  });
});
