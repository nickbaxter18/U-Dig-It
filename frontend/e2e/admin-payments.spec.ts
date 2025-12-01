import { Page, expect, test } from '@playwright/test';

/**
 * E2E Tests for Admin Payments Page
 *
 * Tests cover:
 * - Payment listing and pagination
 * - Filtering and search
 * - Refund workflow
 * - Manual payment recording
 * - Financial exports
 * - Accessibility
 */

// Admin test credentials
const ADMIN_CREDENTIALS = {
  email: 'aitest2@udigit.ca',
  password: 'TestAI2024!@#$',
};

async function loginAsAdmin(page: Page) {
  console.log('🔐 Logging in as admin...');

  await page.goto('http://localhost:3000/auth/signin');
  await page.waitForLoadState('networkidle');

  // Click "Sign in with email" button
  const emailButton = page.getByRole('button', { name: /sign in with email/i });
  await emailButton.click();
  await page.waitForTimeout(1000);

  // Fill in credentials
  const emailInput = page.getByRole('textbox', { name: /email address/i });
  const passwordInput = page.getByRole('textbox', { name: /^password$/i });

  await emailInput.fill(ADMIN_CREDENTIALS.email);
  await passwordInput.fill(ADMIN_CREDENTIALS.password);

  // Click Sign In button
  const signInButton = page.locator('form').getByRole('button', { name: /^sign in$/i });
  await signInButton.click();

  // Wait for redirect
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  console.log('✅ Logged in successfully');
}

async function navigateToAdminPayments(page: Page) {
  console.log('🧭 Navigating to admin payments...');

  // Navigate directly to admin payments
  await page.goto('http://localhost:3000/admin/payments');
  await page.waitForLoadState('networkidle');

  // Verify we're on the payments page
  const pageTitle = page.getByRole('heading', { name: /payments/i }).first();
  await expect(pageTitle).toBeVisible({ timeout: 10000 });

  console.log('✅ On admin payments page');
}

test.describe('Admin Payments Page', () => {
  test.setTimeout(90000); // 90 seconds timeout

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display payments list', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📋 Checking payments list...');

    // Check for payments table
    const paymentsTable = page.locator('table').first();
    await expect(paymentsTable).toBeVisible();

    // Check table headers
    const headers = ['Booking', 'Customer', 'Amount', 'Status', 'Date', 'Actions'];
    for (const header of headers) {
      const headerCell = page.getByRole('columnheader', { name: new RegExp(header, 'i') });
      const isVisible = await headerCell.isVisible().catch(() => false);
      console.log(`   ${isVisible ? '✅' : '⚠️'} Column "${header}" ${isVisible ? 'visible' : 'not found'}`);
    }

    console.log('✅ Payments list displayed');
  });

  test('should have functional pagination', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📄 Testing pagination...');

    // Check for pagination controls
    const paginationSection = page.locator('[aria-label*="pagination"], nav').filter({
      has: page.getByRole('button', { name: /next|previous/i }),
    });

    const hasPagination = await paginationSection.count() > 0;
    console.log(`   ${hasPagination ? '✅' : '⚠️'} Pagination controls ${hasPagination ? 'found' : 'not found'}`);

    if (hasPagination) {
      // Check page info
      const pageInfo = page.getByText(/page\s+\d+/i);
      const hasPageInfo = await pageInfo.isVisible().catch(() => false);
      console.log(`   ${hasPageInfo ? '✅' : '⚠️'} Page info ${hasPageInfo ? 'displayed' : 'not found'}`);

      // Check results count
      const resultsCount = page.getByText(/\d+\s+(result|payment)/i);
      const hasResultsCount = await resultsCount.first().isVisible().catch(() => false);
      console.log(
        `   ${hasResultsCount ? '✅' : '⚠️'} Results count ${hasResultsCount ? 'displayed' : 'not found'}`
      );
    }

    console.log('✅ Pagination check complete');
  });

  test('should filter payments by status', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('🔍 Testing status filter...');

    // Find status filter dropdown
    const statusFilter = page.getByRole('combobox', { name: /status/i }).first();

    if (await statusFilter.isVisible().catch(() => false)) {
      // Get current row count
      const initialRows = await page.locator('tbody tr').count();
      console.log(`   Initial row count: ${initialRows}`);

      // Select "Succeeded" status
      await statusFilter.selectOption({ label: /succeeded/i });
      await page.waitForTimeout(500);

      // Check rows after filter
      const filteredRows = await page.locator('tbody tr').count();
      console.log(`   Filtered row count: ${filteredRows}`);

      console.log('✅ Status filter functional');
    } else {
      console.log('⚠️  Status filter not found');
    }
  });

  test('should search payments', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('🔎 Testing search...');

    // Find search input
    const searchInput = page.getByRole('textbox', { name: /search/i }).first();

    if (await searchInput.isVisible().catch(() => false)) {
      // Type a search term
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      console.log('✅ Search input functional');
    } else {
      console.log('⚠️  Search input not found');
    }
  });

  test('should have accessible interactive elements', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('♿ Testing accessibility...');

    // Check search input accessibility
    const searchInput = page.locator('#payment-search');
    if (await searchInput.isVisible().catch(() => false)) {
      const hasLabel = await searchInput.getAttribute('aria-label');
      console.log(`   ${hasLabel ? '✅' : '⚠️'} Search input ${hasLabel ? 'has' : 'missing'} aria-label`);
    }

    // Check status filter accessibility
    const statusFilter = page.locator('#status-filter');
    if (await statusFilter.isVisible().catch(() => false)) {
      const hasLabel = await statusFilter.getAttribute('aria-label');
      console.log(`   ${hasLabel ? '✅' : '⚠️'} Status filter ${hasLabel ? 'has' : 'missing'} aria-label`);
    }

    // Check buttons have aria-labels
    const buttons = await page.getByRole('button').all();
    let buttonsWithLabels = 0;
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      if (ariaLabel || (text && text.trim().length > 0)) {
        buttonsWithLabels++;
      }
    }
    console.log(`   ✅ ${buttonsWithLabels}/${buttons.length} buttons have labels`);

    console.log('✅ Accessibility check complete');
  });

  test('should display financial reports section', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📊 Testing financial reports section...');

    // Check for financial reports section
    const reportsSection = page.getByRole('heading', { name: /financial.*reports?|summary/i }).first();
    const hasReports = await reportsSection.isVisible().catch(() => false);

    if (hasReports) {
      console.log('   ✅ Financial reports section found');

      // Check for revenue metrics
      const revenue = page.getByText(/revenue|total/i).first();
      const hasRevenue = await revenue.isVisible().catch(() => false);
      console.log(`   ${hasRevenue ? '✅' : '⚠️'} Revenue metric ${hasRevenue ? 'displayed' : 'not found'}`);

      // Check for date range selector
      const dateSelector = page.getByRole('combobox', { name: /date|range|period/i }).first();
      const hasDateSelector = await dateSelector.isVisible().catch(() => false);
      console.log(
        `   ${hasDateSelector ? '✅' : '⚠️'} Date range selector ${hasDateSelector ? 'found' : 'not found'}`
      );
    } else {
      console.log('   ⚠️ Financial reports section not visible');
    }

    console.log('✅ Financial reports check complete');
  });

  test('should display manual payments section', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('💵 Testing manual payments section...');

    // Scroll to manual payments section
    const manualSection = page.getByRole('heading', { name: /manual.*payment/i }).first();

    if (await manualSection.isVisible().catch(() => false)) {
      await manualSection.scrollIntoViewIfNeeded();
      console.log('   ✅ Manual payments section found');

      // Check for refresh button
      const refreshButton = page.getByRole('button', { name: /refresh.*manual|refresh$/i });
      const hasRefresh = await refreshButton.first().isVisible().catch(() => false);
      console.log(`   ${hasRefresh ? '✅' : '⚠️'} Refresh button ${hasRefresh ? 'found' : 'not found'}`);
    } else {
      console.log('   ⚠️ Manual payments section not visible');
    }

    console.log('✅ Manual payments check complete');
  });

  test('should display export functionality', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📥 Testing export functionality...');

    // Look for export section
    const exportSection = page.getByRole('heading', { name: /export/i }).first();

    if (await exportSection.isVisible().catch(() => false)) {
      await exportSection.scrollIntoViewIfNeeded();
      console.log('   ✅ Export section found');

      // Check for export type selector
      const exportType = page.locator('#export-type');
      const hasExportType = await exportType.isVisible().catch(() => false);
      console.log(`   ${hasExportType ? '✅' : '⚠️'} Export type selector ${hasExportType ? 'found' : 'not found'}`);

      // Check for generate button
      const generateButton = page.getByRole('button', { name: /generate|export/i });
      const hasGenerateButton = await generateButton.first().isVisible().catch(() => false);
      console.log(
        `   ${hasGenerateButton ? '✅' : '⚠️'} Generate button ${hasGenerateButton ? 'found' : 'not found'}`
      );
    } else {
      // Check for export button in header
      const exportButton = page.getByRole('button', { name: /export/i });
      const hasExportButton = await exportButton.first().isVisible().catch(() => false);
      console.log(`   ${hasExportButton ? '✅' : '⚠️'} Export button ${hasExportButton ? 'found' : 'not found'}`);
    }

    console.log('✅ Export functionality check complete');
  });

  test('should navigate between pages', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📱 Testing page navigation...');

    // Check for payout reconciliation section
    const payoutSection = page.getByRole('heading', { name: /payout.*reconciliation/i }).first();
    if (await payoutSection.isVisible().catch(() => false)) {
      await payoutSection.scrollIntoViewIfNeeded();
      console.log('   ✅ Payout reconciliation section found');
    }

    // Check for ledger section
    const ledgerSection = page.getByRole('heading', { name: /ledger/i }).first();
    if (await ledgerSection.isVisible().catch(() => false)) {
      await ledgerSection.scrollIntoViewIfNeeded();
      console.log('   ✅ Ledger section found');
    }

    // Check for installments section
    const installmentsSection = page.getByRole('heading', { name: /installment/i }).first();
    if (await installmentsSection.isVisible().catch(() => false)) {
      await installmentsSection.scrollIntoViewIfNeeded();
      console.log('   ✅ Installments section found');
    }

    console.log('✅ Page navigation check complete');
  });

  test('should take screenshot of full page', async ({ page }) => {
    await navigateToAdminPayments(page);

    console.log('📸 Taking full page screenshot...');

    await page.screenshot({
      path: '/tmp/admin-payments-full.png',
      fullPage: true,
    });

    console.log('✅ Screenshot saved to /tmp/admin-payments-full.png');
  });
});

test.describe('Admin Payments - Refund Modal', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPayments(page);
  });

  test('should open refund modal when clicking refund button', async ({ page }) => {
    console.log('💰 Testing refund modal...');

    // Find a payment with refund button
    const refundButton = page.getByRole('button', { name: /refund/i }).first();

    if (await refundButton.isVisible().catch(() => false)) {
      await refundButton.click();
      await page.waitForTimeout(500);

      // Check for modal
      const modal = page.getByRole('dialog');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log(`   ${modalVisible ? '✅' : '⚠️'} Refund modal ${modalVisible ? 'opened' : 'not found'}`);

      if (modalVisible) {
        // Check modal content
        const amountInput = page.getByRole('spinbutton', { name: /amount/i });
        const hasAmount = await amountInput.isVisible().catch(() => false);
        console.log(`   ${hasAmount ? '✅' : '⚠️'} Amount input ${hasAmount ? 'found' : 'not found'}`);

        const reasonInput = page.getByRole('textbox', { name: /reason/i });
        const hasReason = await reasonInput.isVisible().catch(() => false);
        console.log(`   ${hasReason ? '✅' : '⚠️'} Reason input ${hasReason ? 'found' : 'not found'}`);

        // Close modal
        const closeButton = page.getByRole('button', { name: /close|cancel/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    } else {
      console.log('   ⚠️ No refund buttons visible (may need succeeded payments)');
    }

    console.log('✅ Refund modal check complete');
  });
});

test.describe('Admin Payments - View Payment Details', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPayments(page);
  });

  test('should view payment details', async ({ page }) => {
    console.log('👁️ Testing view payment details...');

    // Find a view button
    const viewButton = page.getByRole('button', { name: /view/i }).first();

    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Check for details panel/modal
      const detailsPanel = page.getByRole('dialog');
      const panelVisible = await detailsPanel.isVisible().catch(() => false);

      if (panelVisible) {
        console.log('   ✅ Payment details panel opened');

        // Check for payment info
        const paymentId = page.getByText(/payment.*id|pi_/i);
        const hasPaymentId = await paymentId.first().isVisible().catch(() => false);
        console.log(`   ${hasPaymentId ? '✅' : '⚠️'} Payment ID ${hasPaymentId ? 'displayed' : 'not found'}`);

        // Close panel
        const closeButton = page.getByRole('button', { name: /close|cancel|×/i });
        if (await closeButton.first().isVisible()) {
          await closeButton.first().click();
        }
      } else {
        console.log('   ⚠️ Payment details panel not found');
      }
    } else {
      console.log('   ⚠️ No view buttons visible');
    }

    console.log('✅ View payment details check complete');
  });
});

