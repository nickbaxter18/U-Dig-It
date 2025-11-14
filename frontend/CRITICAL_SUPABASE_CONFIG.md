# CRITICAL: Supabase Redirect URL Configuration

## ⚠️ ACTION REQUIRED

Your OAuth is failing because the Supabase project doesn't have the correct redirect URL configured!

---

## What You MUST Do Right Now

### 1. Open Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/bnimazxnqligusckahab/auth/url-configuration

### 2. Update Redirect URLs

In the "Redirect URLs" section, **ADD these URLs**:

```
http://localhost:3000/api/auth/callback
http://localhost:3000/**
https://udigit.ca/api/auth/callback
https://udigit.ca/**
```

**IMPORTANT:** Use `api/auth/callback` NOT `auth/callback`!

### 3. Update Site URL

Set the **Site URL** to:
```
https://udigit.ca
```

For local development, you can also use:
```
http://localhost:3000
```

### 4. Click "Save" Button

Make sure to **SAVE** the changes in the Supabase dashboard!

---

## Why This Is Critical

The redirect URL is where Supabase sends the user after OAuth authentication:

```
User → Google OAuth → Google redirects to Supabase
  ↓
Supabase checks: Is the redirect URL allowed?
  ↓
If YES → Redirects to: http://localhost:3000/api/auth/callback?code=xxx
If NO  → Error or redirect fails
```

Currently, your Supabase project probably has:
- ❌ `http://localhost:3000/auth/callback` (OLD, client-side)
- ✅ Should be: `http://localhost:3000/api/auth/callback` (NEW, server-side)

---

## Quick Configuration Steps

### Step 1: Go to URL Configuration

1. Open https://supabase.com/dashboard
2. Select your project: `bnimazxnqligusckahab`
3. Click **Authentication** in left sidebar
4. Click **URL Configuration**

### Step 2: Configure Redirect URLs

In the **"Redirect URLs"** text area, add each URL on a new line:

```plaintext
http://localhost:3000/api/auth/callback
http://localhost:3000/**
https://udigit.ca/api/auth/callback
https://udigit.ca/**
```

### Step 3: Configure Site URL

In the **"Site URL"** field, enter:

```
https://udigit.ca
```

Or for local development:

```
http://localhost:3000
```

### Step 4: Save

Click the **"Save"** button at the bottom of the page.

---

## After Saving Configuration

### 1. Clear Your Browser Data

```
Chrome: Ctrl+Shift+Delete
Clear:
- ✅ Cookies and site data
- ✅ Cached images and files
Time range: All time
```

### 2. Restart Development Server

```bash
cd /home/vscode/Kubota-rental-platform/frontend
pkill -f "next dev"
npm run dev
```

### 3. Test OAuth Flow

1. Open `http://localhost:3000/auth/signin` in incognito mode
2. Click "Sign in with Google"
3. Complete Google authentication
4. **Watch the URL bar** - you should see it go through:
   ```
   http://localhost:3000/api/auth/callback?code=xxx&redirect=/dashboard
   ```
   (This should happen very quickly)
5. You should end up on `/dashboard`
6. **KEY TEST:** Press F5 - you should STAY on dashboard!

---

## Verification Checklist

After configuring Supabase and testing:

- [ ] Supabase redirect URLs include `/api/auth/callback`
- [ ] Site URL is configured in Supabase
- [ ] Cleared all browser data
- [ ] Restarted dev server
- [ ] Tested OAuth in incognito mode
- [ ] OAuth redirects to `/api/auth/callback` (check URL bar)
- [ ] Session persists after refresh
- [ ] Can access `/dashboard` and `/profile`

---

## Screenshot: What It Should Look Like

In the Supabase Dashboard → Authentication → URL Configuration:

```
┌─────────────────────────────────────────────────┐
│ Site URL                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ https://udigit.ca                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Redirect URLs                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ http://localhost:3000/api/auth/callback     │ │
│ │ http://localhost:3000/**                    │ │
│ │ https://udigit.ca/api/auth/callback         │ │
│ │ https://udigit.ca/**                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│  [Save] button                                  │
└─────────────────────────────────────────────────┘
```

---

## Current Configuration Suspicion

I suspect your current Supabase configuration has:

```
Redirect URLs:
- http://localhost:3000/auth/callback  ← OLD, wrong
- https://udigit.ca                    ← Missing /api/auth/callback
```

This needs to be:

```
Redirect URLs:
- http://localhost:3000/api/auth/callback  ← NEW, correct
- http://localhost:3000/**                  ← Allows all local paths
- https://udigit.ca/api/auth/callback       ← Production
- https://udigit.ca/**                      ← Allows all production paths
```

---

**CRITICAL:** Without the correct redirect URLs in Supabase dashboard, OAuth will NEVER work!

Please configure this now, then test again.



