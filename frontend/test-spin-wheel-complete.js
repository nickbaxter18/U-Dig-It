/**
 * COMPREHENSIVE SPIN WHEEL BROWSER AUTOMATION TEST
 *
 * This script performs complete end-to-end testing of the Spin to Win wheel
 * to verify that ALL visual landings match backend outcomes.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: 'automation-test@example.com',
  screenshotDir: path.join(__dirname, '../spin-wheel-screenshots'),
  timeout: 60000,
  slowMo: 500,  // Slow down for visibility
};

// Expected outcomes
const EXPECTED_OUTCOMES = {
  spin1: { outcome: 'try_again', color: 'gray', label: 'Try Again' },
  spin2: { outcome: 'try_again', color: 'gray', label: 'Try Again' },
  spin3: { outcome: 'prize', color: ['green', 'orange', 'red'], label: ['5%', '10%', '15%'] },
};

// Slice configuration (must match SpinWheel.tsx)
const WHEEL_SLICES = [
  { id: 'try_again', label: 'Try Again', color: '#6B7280' },
  { id: '5%', label: '5%', color: '#10B981' },
  { id: '10%', label: '10%', color: '#F59E0B' },
  { id: '5%', label: '5%', color: '#10B981' },
  { id: 'try_again', label: 'Try Again', color: '#6B7280' },
  { id: '15%', label: '15%', color: '#EF4444' },
  { id: '5%', label: '5%', color: '#10B981' },
  { id: '10%', label: '10%', color: '#F59E0B' },
  { id: '5%', label: '5%', color: '#10B981' },
  { id: 'try_again', label: 'Try Again', color: '#6B7280' },
  { id: '5%', label: '5%', color: '#10B981' },
  { id: '10%', label: '10%', color: '#F59E0B' },
];

// Test results storage
const testResults = {
  spin1: null,
  spin2: null,
  spin3: null,
  overall: 'PENDING',
  errors: [],
};

// Utility: Create screenshots directory
function ensureScreenshotDir() {
  if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
    fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
  }
}

// Utility: Calculate which slice is at top given rotation
function calculateSliceAtTop(rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  return Math.round((360 - normalized) / 30) % 12;
}

// Utility: Take screenshot with timestamp
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`   📸 Screenshot: ${filename}`);
  return filepath;
}

// Main test function
async function runComprehensiveTest() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  🎰 SPIN WHEEL COMPREHENSIVE BROWSER AUTOMATION TEST');
  console.log('════════════════════════════════════════════════════════════\n');

  ensureScreenshotDir();

  const browser = await chromium.launch({
    headless: true,  // Headless mode for CI/CD environments
    slowMo: 0,  // No slow-mo in headless
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Listen to console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[SpinWheel] Rotation applied')) {
      console.log(`   📋 ${text.substring(0, 100)}...`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate to Equipment Page');
    console.log('─────────────────────────────────────────────────────────\n');

    await page.goto(`${TEST_CONFIG.baseUrl}/equipment`, {
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout,
    });

    console.log('   ✅ Page loaded successfully\n');

    // ========================================================================
    // STEP 2: OPEN SPIN WHEEL MODAL
    // ========================================================================
    console.log('📍 Step 2: Open Spin Wheel Modal');
    console.log('─────────────────────────────────────────────────────────\n');

    await page.click('button:has-text("Claim Offer")');
    await page.waitForSelector('text=Spin to Win', { timeout: 5000 });

    console.log('   ✅ Modal opened\n');
    await takeScreenshot(page, 'modal-opened');

    // ========================================================================
    // STEP 3: ENTER EMAIL AND START SESSION
    // ========================================================================
    console.log('📍 Step 3: Enter Email and Create Session');
    console.log('─────────────────────────────────────────────────────────\n');

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    console.log(`   📧 Email: ${uniqueEmail}`);

    await page.click('button:has-text("Start Spinning")');
    await page.waitForSelector('text=Spin #1', { timeout: 10000 });

    console.log('   ✅ Session created, wheel loaded\n');
    await takeScreenshot(page, 'wheel-loaded');

    // ========================================================================
    // SPIN 1 TEST
    // ========================================================================
    console.log('📍 Step 4: TEST SPIN #1 (Must land on "Try Again")');
    console.log('═════════════════════════════════════════════════════════\n');

    await page.click('button:has-text("Spin #1")');
    console.log('   🎰 Spinning... (waiting 5 seconds for animation)');

    await page.waitForTimeout(5000);  // Wait for 4s animation + buffer

    // Get rotation value
    const spin1Data = await page.evaluate(() => {
      const wheel = document.querySelector('[style*="transform: rotate"]');
      if (!wheel) return null;

      const transform = wheel.style.transform;
      const match = transform.match(/rotate\(([-\d.]+)deg\)/);
      const rotation = match ? parseFloat(match[1]) : 0;
      const normalized = ((rotation % 360) + 360) % 360;

      // Calculate which slice is at top
      const sliceIndex = Math.round((360 - normalized) / 30) % 12;

      const slices = [
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '15%', label: '15%', color: 'red' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
      ];

      const landedSlice = slices[sliceIndex];

      return {
        rotation,
        normalized,
        sliceIndex,
        landedLabel: landedSlice.label,
        landedColor: landedSlice.color,
        landedId: landedSlice.id,
      };
    });

    await takeScreenshot(page, 'spin1-completed');

    // Wait for outcome message to appear (it shows after animation completes)
    await page.waitForTimeout(500);  // Extra buffer for message to render

    // Verify outcome message (check multiple possible selectors)
    const spin1HasLossMessage = await page.locator('text=So close!').isVisible().catch(() => false) ||
                               await page.locator('[role="status"]').filter({ hasText: 'So close' }).isVisible().catch(() => false) ||
                               await page.locator('text=/got 2 more spin/').isVisible().catch(() => false);

    const spin1IsCorrect = spin1Data && spin1Data.landedId === 'try_again' && spin1HasLossMessage;

    testResults.spin1 = {
      rotation: spin1Data?.rotation,
      normalized: spin1Data?.normalized,
      sliceIndex: spin1Data?.sliceIndex,
      landedLabel: spin1Data?.landedLabel,
      landedColor: spin1Data?.landedColor,
      expectedOutcome: 'try_again',
      actualOutcome: spin1Data?.landedId,
      messageCorrect: spin1HasLossMessage,
      success: spin1IsCorrect,
    };

    console.log(`   📊 Results:`);
    console.log(`      Rotation: ${spin1Data?.rotation}° (${spin1Data?.normalized}° normalized)`);
    console.log(`      Landed on: Slice ${spin1Data?.sliceIndex} - ${spin1Data?.landedLabel} (${spin1Data?.landedColor})`);
    console.log(`      Expected: "Try Again" (gray)`);
    console.log(`      Message: ${spin1HasLossMessage ? '"So close!"' : 'WRONG MESSAGE!'}`);
    console.log(`      ${spin1IsCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!spin1IsCorrect) {
      testResults.errors.push('Spin 1: Visual landing did not match expected "Try Again" outcome');
    }

    // Wait for button to be enabled
    await page.waitForSelector('button:has-text("Spin #2"):not([disabled])', { timeout: 2000 });

    // ========================================================================
    // SPIN 2 TEST
    // ========================================================================
    console.log('📍 Step 5: TEST SPIN #2 (Must land on "Try Again")');
    console.log('═════════════════════════════════════════════════════════\n');

    await page.click('button:has-text("Spin #2")');
    console.log('   🎰 Spinning... (waiting 5 seconds for animation)');

    await page.waitForTimeout(5000);

    const spin2Data = await page.evaluate(() => {
      const wheel = document.querySelector('[style*="transform: rotate"]');
      if (!wheel) return null;

      const transform = wheel.style.transform;
      const match = transform.match(/rotate\(([-\d.]+)deg\)/);
      const rotation = match ? parseFloat(match[1]) : 0;
      const normalized = ((rotation % 360) + 360) % 360;
      const sliceIndex = Math.round((360 - normalized) / 30) % 12;

      const slices = [
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '15%', label: '15%', color: 'red' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
      ];

      const landedSlice = slices[sliceIndex];

      return {
        rotation,
        normalized,
        sliceIndex,
        landedLabel: landedSlice.label,
        landedColor: landedSlice.color,
        landedId: landedSlice.id,
      };
    });

    await takeScreenshot(page, 'spin2-completed');

    // Wait for outcome message
    await page.waitForTimeout(500);

    const spin2HasLossMessage = await page.locator('text=So close!').isVisible().catch(() => false) ||
                               await page.locator('[role="status"]').filter({ hasText: 'So close' }).isVisible().catch(() => false) ||
                               await page.locator('text=/got 1 more spin/').isVisible().catch(() => false);

    const spin2IsCorrect = spin2Data && spin2Data.landedId === 'try_again' && spin2HasLossMessage;

    testResults.spin2 = {
      rotation: spin2Data?.rotation,
      normalized: spin2Data?.normalized,
      sliceIndex: spin2Data?.sliceIndex,
      landedLabel: spin2Data?.landedLabel,
      landedColor: spin2Data?.landedColor,
      expectedOutcome: 'try_again',
      actualOutcome: spin2Data?.landedId,
      messageCorrect: spin2HasLossMessage,
      success: spin2IsCorrect,
    };

    console.log(`   📊 Results:`);
    console.log(`      Rotation: ${spin2Data?.rotation}° (${spin2Data?.normalized}° normalized)`);
    console.log(`      Landed on: Slice ${spin2Data?.sliceIndex} - ${spin2Data?.landedLabel} (${spin2Data?.landedColor})`);
    console.log(`      Expected: "Try Again" (gray)`);
    console.log(`      Message: ${spin2HasLossMessage ? '"So close!"' : 'WRONG MESSAGE!'}`);
    console.log(`      ${spin2IsCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!spin2IsCorrect) {
      testResults.errors.push('Spin 2: Visual landing did not match expected "Try Again" outcome');
    }

    // Wait for final spin button
    await page.waitForSelector('button:has-text("Final Spin"):not([disabled])', { timeout: 2000 });

    // ========================================================================
    // SPIN 3 TEST (GUARANTEED WIN)
    // ========================================================================
    console.log('📍 Step 6: TEST SPIN #3 (Must land on PRIZE: 5%, 10%, or 15%)');
    console.log('═════════════════════════════════════════════════════════\n');

    await page.click('button:has-text("Final Spin")');
    console.log('   🎰 Spinning... (waiting 5 seconds for animation)');

    await page.waitForTimeout(5000);

    const spin3Data = await page.evaluate(() => {
      const wheel = document.querySelector('[style*="transform: rotate"]');
      if (!wheel) return null;

      const transform = wheel.style.transform;
      const match = transform.match(/rotate\(([-\d.]+)deg\)/);
      const rotation = match ? parseFloat(match[1]) : 0;
      const normalized = ((rotation % 360) + 360) % 360;
      const sliceIndex = Math.round((360 - normalized) / 30) % 12;

      const slices = [
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '15%', label: '15%', color: 'red' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
        { id: '5%', label: '5%', color: 'green' },
        { id: 'try_again', label: 'Try Again', color: 'gray' },
        { id: '5%', label: '5%', color: 'green' },
        { id: '10%', label: '10%', color: 'orange' },
      ];

      const landedSlice = slices[sliceIndex];

      return {
        rotation,
        normalized,
        sliceIndex,
        landedLabel: landedSlice.label,
        landedColor: landedSlice.color,
        landedId: landedSlice.id,
      };
    });

    await takeScreenshot(page, 'spin3-completed');

    // Wait for win animation to complete
    await page.waitForTimeout(2000);  // Extra time for redirect

    // Check for win message or redirect
    const currentUrl = page.url();
    const redirectedToBooking = currentUrl.includes('/book') || currentUrl.includes('/auth/signin');
    const spin3HasWinMessage = redirectedToBooking ||
                              await page.locator('text=Congratulations').isVisible().catch(() => false) ||
                              await page.locator('text=You won').isVisible().catch(() => false);

    const spin3IsWin = spin3Data && spin3Data.landedId !== 'try_again';
    const spin3IsCorrect = spin3IsWin && (spin3HasWinMessage || redirectedToBooking);

    testResults.spin3 = {
      rotation: spin3Data?.rotation,
      normalized: spin3Data?.normalized,
      sliceIndex: spin3Data?.sliceIndex,
      landedLabel: spin3Data?.landedLabel,
      landedColor: spin3Data?.landedColor,
      expectedOutcome: 'prize (5%, 10%, or 15%)',
      actualOutcome: spin3Data?.landedId,
      messageCorrect: spin3HasWinMessage || redirectedToBooking,
      redirected: redirectedToBooking,
      finalUrl: currentUrl,
      success: spin3IsCorrect,
    };

    console.log(`   📊 Results:`);
    console.log(`      Rotation: ${spin3Data?.rotation}° (${spin3Data?.normalized}° normalized)`);
    console.log(`      Landed on: Slice ${spin3Data?.sliceIndex} - ${spin3Data?.landedLabel} (${spin3Data?.landedColor})`);
    console.log(`      Expected: Prize (green/orange/red)`);
    console.log(`      Actual: ${spin3Data?.landedId}`);
    console.log(`      Win message: ${spin3HasWinMessage ? 'Yes' : 'No'}`);
    console.log(`      Redirected: ${redirectedToBooking ? 'Yes' : 'No'}`);
    console.log(`      Final URL: ${currentUrl}`);
    console.log(`      ${spin3IsCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!spin3IsCorrect) {
      if (!spin3IsWin) {
        testResults.errors.push('Spin 3: Landed on "Try Again" instead of a prize!');
      } else {
        testResults.errors.push('Spin 3: Landed on prize but no win message or redirect');
      }
    }

    // Extract promo code from URL if redirected
    if (redirectedToBooking) {
      const urlParams = new URLSearchParams(new URL(currentUrl).search);
      const promoCode = urlParams.get('promo') || urlParams.get('callbackUrl')?.match(/promo=([^&]+)/)?.[1];
      if (promoCode) {
        console.log(`   🎟️  Promo Code: ${promoCode}\n`);
        testResults.spin3.promoCode = promoCode;
      }
    }

    // ========================================================================
    // FINAL RESULTS
    // ========================================================================
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  📊 COMPREHENSIVE TEST RESULTS');
    console.log('════════════════════════════════════════════════════════════\n');

    const allPassed = testResults.spin1?.success &&
                     testResults.spin2?.success &&
                     testResults.spin3?.success;

    testResults.overall = allPassed ? 'PASSED' : 'FAILED';

    console.log(`Spin 1: ${testResults.spin1?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Expected: "Try Again" (gray)`);
    console.log(`   Actual: ${testResults.spin1?.landedLabel} (${testResults.spin1?.landedColor})`);
    console.log(`   Rotation: ${testResults.spin1?.normalized}°\n`);

    console.log(`Spin 2: ${testResults.spin2?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Expected: "Try Again" (gray)`);
    console.log(`   Actual: ${testResults.spin2?.landedLabel} (${testResults.spin2?.landedColor})`);
    console.log(`   Rotation: ${testResults.spin2?.normalized}°\n`);

    console.log(`Spin 3: ${testResults.spin3?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Expected: Prize (green/orange/red)`);
    console.log(`   Actual: ${testResults.spin3?.landedLabel} (${testResults.spin3?.landedColor})`);
    console.log(`   Rotation: ${testResults.spin3?.normalized}°`);
    if (testResults.spin3?.promoCode) {
      console.log(`   Promo Code: ${testResults.spin3.promoCode}`);
    }
    console.log('');

    console.log('─────────────────────────────────────────────────────────\n');

    if (allPassed) {
      console.log('🎉 SUCCESS! ALL TESTS PASSED!');
      console.log('\n✅ The spin wheel is working correctly:');
      console.log('   • Spins 1 & 2 land on "Try Again" (gray) ✓');
      console.log('   • Spin 3 lands on prize (colored) ✓');
      console.log('   • Visual landing matches outcomes ✓');
      console.log('   • Messages are correct ✓');
      console.log('\n🚀 System is PRODUCTION-READY!\n');
    } else {
      console.log('❌ TESTS FAILED!');
      console.log('\n⚠️  Errors detected:');
      testResults.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log('\n🔧 System needs fixing before production deployment.\n');
    }

    console.log('════════════════════════════════════════════════════════════\n');

    // Save results to file
    const resultsPath = path.join(TEST_CONFIG.screenshotDir, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Full results saved to: ${resultsPath}\n`);

    // Auto-close after showing results
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    testResults.overall = 'ERROR';
    testResults.errors.push(`Test error: ${error.message}`);

    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();

    // Print final summary
    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`  OVERALL RESULT: ${testResults.overall}`);
    console.log('════════════════════════════════════════════════════════════\n');

    process.exit(testResults.overall === 'PASSED' ? 0 : 1);
  }
}

// Run the test
runComprehensiveTest().catch(console.error);

