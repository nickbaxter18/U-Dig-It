#!/usr/bin/env ts-node
/**
 * Browser Testing Script for Kubota Rental Platform
 * 
 * This script demonstrates how to use Playwright for automated browser testing.
 * It can be run via MCP browser automation tools or standalone with Playwright.
 * 
 * Usage:
 *   - Via AI: "Run the browser test script"
 *   - Via CLI: npx ts-node scripts/browser-test.ts
 */

import { chromium, Browser, Page } from 'playwright';

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'aitest2@udigit.ca',
    password: 'TestAI2024!@#$',
    firstName: 'AI',
    lastName: 'Tester',
  },
};

// Helper functions
async function login(page: Page) {
  console.log('🔐 Logging in...');
  await page.goto(`${CONFIG.baseUrl}/auth/signin`);
  
  // Click "Sign in with email"
  await page.getByRole('button', { name: 'Sign in with email' }).click();
  
  // Fill credentials
  await page.getByRole('textbox', { name: 'Email Address' }).fill(CONFIG.testUser.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(CONFIG.testUser.password);
  
  // Submit
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for dashboard
  await page.waitForURL(`${CONFIG.baseUrl}/dashboard`);
  console.log('✅ Login successful');
}

async function testDashboardToProfile(page: Page) {
  console.log('🧪 Testing Dashboard → Profile navigation...');
  
  // Navigate to profile via Quick Actions
  await page.getByRole('link', { name: 'Profile Manage account' }).click();
  await page.waitForURL(`${CONFIG.baseUrl}/profile`);
  
  // Verify content
  const heading = await page.getByRole('heading', { name: 'Profile Settings' }).textContent();
  if (heading === 'Profile Settings') {
    console.log('✅ Dashboard → Profile navigation works');
  } else {
    console.error('❌ Dashboard → Profile navigation failed');
  }
}

async function testProfileToDashboard(page: Page) {
  console.log('🧪 Testing Profile → Dashboard navigation...');
  
  // Navigate to dashboard via sidebar
  await page.getByRole('link', { name: 'Dashboard' }).first().click();
  await page.waitForURL(`${CONFIG.baseUrl}/dashboard`);
  
  // Verify content
  const heading = await page.getByRole('heading', { name: /Welcome back/ }).textContent();
  if (heading?.includes('Welcome back')) {
    console.log('✅ Profile → Dashboard navigation works');
  } else {
    console.error('❌ Profile → Dashboard navigation failed');
  }
}

async function testDropdownNavigation(page: Page) {
  console.log('🧪 Testing dropdown menu navigation...');
  
  // Find and click profile dropdown button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const profileButton = buttons.find(btn => 
      btn.textContent?.includes('AI') && 
      btn.textContent?.length < 10 &&
      btn.className.includes('flex items-center')
    );
    if (profileButton) {
      (profileButton as HTMLButtonElement).click();
    }
  });
  
  // Wait a moment for dropdown to appear
  await page.waitForTimeout(500);
  
  // Click Profile link from dropdown
  await page.evaluate(() => {
    const profileLinks = Array.from(document.querySelectorAll('a[href="/profile"]'));
    const dropdownProfileLink = profileLinks.find(link => 
      link.className.includes('flex items-center') && 
      link.className.includes('text-gray-700')
    ) as HTMLAnchorElement;
    if (dropdownProfileLink) {
      dropdownProfileLink.click();
    }
  });
  
  await page.waitForURL(`${CONFIG.baseUrl}/profile`);
  console.log('✅ Dropdown → Profile navigation works');
  
  // Open dropdown again and click Dashboard
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const profileButton = buttons.find(btn => 
      btn.textContent?.includes('AI') && 
      btn.textContent?.length < 10 &&
      btn.className.includes('flex items-center')
    );
    if (profileButton) {
      (profileButton as HTMLButtonElement).click();
    }
  });
  
  await page.waitForTimeout(500);
  
  await page.evaluate(() => {
    const dashboardLinks = Array.from(document.querySelectorAll('a[href="/dashboard"]'));
    const dropdownDashboardLink = dashboardLinks.find(link => 
      link.className.includes('flex items-center') && 
      link.className.includes('text-gray-700')
    ) as HTMLAnchorElement;
    if (dropdownDashboardLink) {
      dropdownDashboardLink.click();
    }
  });
  
  await page.waitForURL(`${CONFIG.baseUrl}/dashboard`);
  console.log('✅ Dropdown → Dashboard navigation works');
}

async function logout(page: Page) {
  console.log('🔓 Logging out...');
  
  // Open profile dropdown
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const profileButton = buttons.find(btn => 
      btn.textContent?.includes('AI') && 
      btn.textContent?.length < 10 &&
      btn.className.includes('flex items-center')
    );
    if (profileButton) {
      (profileButton as HTMLButtonElement).click();
    }
  });
  
  await page.waitForTimeout(500);
  
  // Click Sign Out button
  await page.getByRole('button', { name: 'Sign Out' }).click();
  
  // Wait for redirect to home
  await page.waitForURL(CONFIG.baseUrl);
  console.log('✅ Logout successful');
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Kubota Rental Platform Browser Tests\n');
  
  const browser: Browser = await chromium.launch({
    headless: false, // Set to true for CI/CD
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page: Page = await context.newPage();
  
  try {
    // Run test suite
    await login(page);
    await testDashboardToProfile(page);
    await testProfileToDashboard(page);
    await testDropdownNavigation(page);
    await logout(page);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runTests, login, testDashboardToProfile, testProfileToDashboard, logout };





































































