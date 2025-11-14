# Browser Testing Guide for Kubota Rental Platform

## Overview
This guide explains how to use the browser automation capabilities for testing the Kubota Rental Platform.

## Available Browser Automation Tools

The platform has access to **Playwright** browser automation through MCP (Model Context Protocol), enabling:
- Automated page navigation
- Form filling and submission
- Button clicks and interactions
- Page snapshots and screenshots
- Console log monitoring
- Network request tracking
- JavaScript evaluation

## Test Account

A dedicated test account has been created for automated testing:

```json
{
  "email": "aitest2@udigit.ca",
  "password": "TestAI2024!@#$",
  "firstName": "AI",
  "lastName": "Tester",
  "phone": "(506) 555-0199",
  "company": "AI Testing Co"
}
```

**Important Notes:**
- This account was created through the normal sign-up flow
- Email confirmation was handled via Supabase SQL
- Google OAuth **cannot** be used in automated browsers (Google blocks them)
- Always use email/password authentication for automated tests

## Common Testing Workflows

### 1. Login Test
```typescript
// Navigate to sign-in page
await navigate('http://localhost:3000/auth/signin')

// Click "Sign in with email"
await click(signInWithEmailButton)

// Fill credentials
await fillForm([
  { field: 'Email Address', value: 'aitest2@udigit.ca' },
  { field: 'Password', value: 'TestAI2024!@#$' }
])

// Submit
await click(signInButton)

// Verify redirect to dashboard
await waitFor('Welcome back, AI!')
```

### 2. Navigation Test
```typescript
// Test Dashboard → Profile navigation
await click(profileDropdownButton)
await click(profileLinkInDropdown)
await verifyUrl('http://localhost:3000/profile')

// Test Profile → Dashboard navigation
await click(profileDropdownButton)
await click(dashboardLinkInDropdown)
await verifyUrl('http://localhost:3000/dashboard')
```

### 3. Form Submission Test
```typescript
// Navigate to booking page
await navigate('http://localhost:3000/book')

// Fill booking form
await fillForm([
  { field: 'Equipment', value: 'Kubota SVL-75' },
  { field: 'Start Date', value: '2025-11-01' },
  { field: 'End Date', value: '2025-11-05' }
])

// Submit and verify
await click(submitButton)
await waitFor('Booking confirmed')
```

## Issue Diagnosis Capabilities

### Console Log Monitoring
The browser automation captures all console logs, including:
- Supabase auth state changes
- GoTrueClient debug logs
- React component logs
- Network errors

### Network Request Tracking
Monitor API calls and responses:
- Supabase REST API calls
- Auth token exchanges
- Failed requests (400, 500 errors)

### Visual Verification
- Take screenshots at any point
- Capture full-page accessibility snapshots
- Verify UI state and content

## Lessons Learned

### Authentication Issues

**Problem:** Redirect loop on protected pages  
**Root Cause:** Server-side middleware couldn't access localStorage sessions  
**Solution:** Use client-side authentication protection for pages with localStorage-based sessions

**Problem:** NULL values in auth.users table cause login failures  
**Root Cause:** Admin API creates users with NULL string fields  
**Solution:** Always create test users through sign-up flow, then confirm email via SQL

### Google OAuth Limitations

**Problem:** "This browser or app may not be secure" error  
**Root Cause:** Google detects and blocks automated browsers  
**Solution:** Use email/password authentication for automated tests

## Testing Best Practices

1. **Always verify auth state before testing protected pages**
2. **Use email/password login, not OAuth providers**
3. **Check console logs for Supabase auth state changes**
4. **Wait for `initialized: true` before navigation**
5. **Monitor network requests for API errors**
6. **Take screenshots for visual regression testing**

## Supabase Testing Considerations

### Email Confirmation
When creating test users, confirm their email:

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmation_token = '', 
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    reauthentication_token = '',
    recovery_token = ''
WHERE email = 'test@example.com';
```

### Session Management
- Sessions are stored in localStorage: `supabase.auth.token`
- Sessions expire after 1 hour (3600 seconds)
- Auto-refresh happens 90 seconds before expiry
- Monitor `GoTrueClient` logs for session state

## Debugging Failed Tests

1. **Check auth logs:**
   ```typescript
   // Look for:
   "[SupabaseAuthProvider] Session found, user logged in"
   "[Dashboard] Auth state: {user: true, loading: false, initialized: true}"
   ```

2. **Check for redirect loops:**
   ```typescript
   // Look for:
   "[Dashboard] Fully initialized with no user, redirecting to sign-in"
   // This means auth state hasn't loaded yet
   ```

3. **Check for database errors:**
   ```typescript
   // Look for:
   "Database error querying schema"
   "Scan error on column index"
   // This means NULL values in required fields
   ```

## Future Enhancements

- [ ] Create automated end-to-end test suite with Playwright
- [ ] Add CI/CD integration for automated testing
- [ ] Create visual regression test baseline
- [ ] Add performance monitoring during tests
- [ ] Create test data fixtures for common scenarios
































































