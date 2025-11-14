# Complete Google OAuth ↔ Supabase ↔ Next.js Setup Guide

## ✅ Implementation Status

**✅ COMPLETED:**
- ✅ Removed NextAuth dependencies and configuration
- ✅ Updated middleware to use Supabase auth helpers
- ✅ Updated all components to use SupabaseAuthProvider
- ✅ Set up environment variables for Supabase
- ✅ Updated auth callback handling

**🔄 IN PROGRESS:**
- 🔄 Verify Google OAuth configuration in Supabase dashboard
- 🔄 Configure Google Cloud OAuth client with proper redirect URIs

---

## 1) Environment Variables Setup

Create `.env.local` in the frontend directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc
```

---

## 2) Google Cloud Console Setup

**Model A: Supabase Callback (Recommended)**

### A. Create OAuth 2.0 Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**

### B. Configure Authorized Redirect URIs

Add this **exact** URI:
```
https://bnimazxnqligusckahab.supabase.co/auth/v1/callback
```

### C. Configure Authorized JavaScript Origins

Add these origins:
```
https://udigit.ca
http://localhost:3000
```

### D. Get Client Credentials

Copy the **Client ID** and **Client Secret** from the OAuth 2.0 Client creation.

---

## 3) Supabase Dashboard Configuration

### A. Auth Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `bnimazxnqligusckahab`
3. Navigate to **Authentication** → **Settings**

**Site URL:**
```
https://udigit.ca
```

**Additional Redirect URLs:**
```
https://udigit.ca
http://localhost:3000
https://localhost:3000
```

### B. Google OAuth Provider Setup

1. Go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your **Client ID** and **Client Secret** from Google Cloud Console
4. **Skip nonce checks:** Leave **OFF** (unchecked)
5. **Allow users without email:** Leave **OFF** (unchecked)

**Callback URL (for OAuth):**
Copy the value shown (should be: `https://bnimazxnqligusckahab.supabase.co/auth/v1/callback`)

---

## 4) Implementation Details

### Current Auth Flow

```typescript
// OAuth Sign-in (from OAuthButtons.tsx)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### Callback Handling

```typescript
// Auth callback page (frontend/src/app/auth/callback/page.tsx)
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/SupabaseAuthProvider'

export default function AuthCallback() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/signin?error=auth_callback')
      }
    }
  }, [user, loading, router])
  // ... loading UI
}
```

### Middleware Protection

```typescript
// middleware.ts (updated for Supabase)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect authenticated routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return res
}
```

---

## 5) Testing Checklist

### ✅ Manual Testing Steps

1. **Environment Variables:** Confirm `.env.local` is created with correct Supabase credentials
2. **Google Cloud:** Verify OAuth client has correct redirect URI and origins
3. **Supabase:** Verify Google provider is enabled with correct client ID/secret
4. **Dependencies:** Run `npm install` to ensure all packages are installed

### 🔄 Automated Testing

```typescript
// Test script for OAuth flow
describe('Google OAuth Flow', () => {
  it('should complete OAuth flow successfully', async () => {
    // 1. Navigate to login page
    await page.goto('http://localhost:3000/login')

    // 2. Click Google sign-in button
    await page.click('[data-testid="google-signin"]')

    // 3. Verify redirect to Supabase
    await expect(page).toHaveURL(/bnimazxnqligusckahab\.supabase\.co/)

    // 4. Verify final redirect back to site
    await expect(page).toHaveURL(/udigit\.ca|localhost:3000/)

    // 5. Verify user is authenticated
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible()
  })
})
```

---

## 6) Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Error: `redirect_uri_mismatch`
   - Solution: Ensure Google Cloud redirect URI exactly matches Supabase callback URL

2. **Origin Not Allowed**
   - Error: `invalid_request` or CORS errors
   - Solution: Add both `https://udigit.ca` and `http://localhost:3000` to Google Cloud JavaScript origins

3. **Google Provider Not Enabled**
   - Error: OAuth provider errors
   - Solution: Ensure Google provider is enabled in Supabase Auth → Providers

4. **Environment Variables Missing**
   - Error: Missing Supabase environment variables
   - Solution: Create `.env.local` with correct `NEXT_PUBLIC_SUPABASE_*` values

### Debug Commands

```bash
# Check Supabase auth configuration
npx supabase status

# Test OAuth locally
npm run dev

# Check browser console for OAuth errors
# Look for: redirect_uri, origin, or provider errors
```

---

## 7) Production Deployment

### Vercel Configuration

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Ensure domain `udigit.ca` is configured in:
   - Google Cloud Console (origins and redirect URIs)
   - Supabase Auth settings (Site URL and redirect URLs)

3. Test OAuth flow on production domain

### DNS Configuration

Ensure `udigit.ca` points to your deployment and SSL certificate is properly configured.

---

## 8) Next Steps

- [ ] Configure Google Cloud OAuth client
- [ ] Test OAuth flow in development
- [ ] Test OAuth flow in production
- [ ] Add user profile management
- [ ] Set up admin role management
- [ ] Configure email templates in Supabase
- [ ] Add OAuth error handling improvements

---

## 📞 Need Help?

If you encounter issues:

1. Check browser developer tools for OAuth errors
2. Verify all redirect URIs match exactly
3. Ensure Google Cloud and Supabase configurations are in sync
4. Test with different browsers/networks
5. Check Supabase dashboard logs for OAuth attempts

The implementation follows **Model A** (Supabase callback) for simplicity and fewer moving parts.

















