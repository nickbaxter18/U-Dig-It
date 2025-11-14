# Quick Authentication Test Guide

## 🚀 Quick Start

1. **Clear Browser Data First** (Very Important!)
   ```
   Chrome: Ctrl+Shift+Delete or Cmd+Shift+Delete
   Select:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   Time range: Last hour
   ```

2. **Restart Development Server**
   ```bash
   # Kill any running instances
   pkill -f "next dev"

   # Start fresh
   cd /home/vscode/Kubota-rental-platform/frontend
   npm run dev
   ```

3. **Open Browser in Incognito/Private Mode** (Recommended)
   - Chrome: Ctrl+Shift+N or Cmd+Shift+N
   - Firefox: Ctrl+Shift+P or Cmd+Shift+P

4. **Navigate to:** `http://localhost:3000/auth/signin`

5. **Open Browser DevTools** (F12 or Cmd+Option+I)
   - Switch to the **Console** tab

---

## 🧪 Test Procedure

### Test 1: OAuth Login Flow

**Steps:**
1. Click "Sign in with Google" button
2. Select/authenticate with your Google account
3. Watch the console for this message:
   ```
   ✅ Session created successfully: your-email@example.com
   ```
4. You should be redirected to `/dashboard`

**Expected Result:** ✅ Successfully land on dashboard page

---

### Test 2: Session Persistence (THE KEY TEST!)

**Steps:**
1. After landing on `/dashboard`, press **F5** or **Ctrl+R** to refresh
2. Watch what happens

**Expected Result:** ✅ You should STAY on `/dashboard` (not redirect to login)

**If it fails:** ❌ You'll be redirected back to `/auth/signin`

---

### Test 3: Protected Route Navigation

**Steps:**
1. While logged in, manually navigate to these URLs:
   - `http://localhost:3000/profile`
   - `http://localhost:3000/book`
   - `http://localhost:3000/dashboard`

**Expected Result:** ✅ All pages load without redirecting to login

---

### Test 4: Cookie Verification

**Steps:**
1. Open DevTools → **Application** tab → **Cookies** → `http://localhost:3000`
2. Look for these cookies:
   ```
   sb-bnimazxnqligusckahab-auth-token
   sb-bnimazxnqligusckahab-auth-token-code-verifier (during OAuth only)
   ```

**Expected Result:** ✅ Auth token cookie is present and has a value

---

### Test 5: Logout and Re-login

**Steps:**
1. Click logout (if you have a logout button)
2. You should be redirected to `/auth/signin`
3. Log in again with Google
4. You should land on `/dashboard` again

**Expected Result:** ✅ Complete flow works smoothly

---

## 🔍 What to Check in Browser Console

### Success Messages You Should See:

```javascript
✅ Session created successfully: user@example.com
```

### Supabase Debug Logs (if in development):

```javascript
SIGNED_IN
TOKEN_REFRESHED
USER_UPDATED
```

### Errors You Should NOT See:

```javascript
❌ Session error
❌ Code exchange error
❌ No session found
❌ Authentication incomplete
```

---

## 🛠️ Debugging Tools

### Check Current Session (Browser Console)

Open browser console and run:

```javascript
// Check if Supabase client is available
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'https://bnimazxnqligusckahab.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc'
)

// Check session
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('User:', data.session?.user)
```

**Expected Output:**
```javascript
Session: {
  access_token: "eyJ...",
  refresh_token: "...",
  user: { id: "...", email: "..." }
}
```

### Check Local Storage

```javascript
// In browser console
console.log('Auth Token:', localStorage.getItem('supabase.auth.token'))
```

### Monitor Auth State Changes

```javascript
// In browser console
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient('https://bnimazxnqligusckahab.supabase.co', 'eyJ...')

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event)
  console.log('Session:', session)
})
```

---

## 📊 Test Results Template

Copy this and fill it out:

```
✅ Test 1: OAuth Login Flow - [ ] PASS [ ] FAIL
   - Successfully redirected to Google: [ ]
   - Successfully authenticated: [ ]
   - Redirected to /dashboard: [ ]
   - Console shows success message: [ ]

✅ Test 2: Session Persistence - [ ] PASS [ ] FAIL
   - Refreshed /dashboard: [ ]
   - Stayed on /dashboard (didn't redirect): [ ]

✅ Test 3: Protected Routes - [ ] PASS [ ] FAIL
   - /profile accessible: [ ]
   - /book accessible: [ ]
   - /dashboard accessible: [ ]

✅ Test 4: Cookie Verification - [ ] PASS [ ] FAIL
   - Auth token cookie exists: [ ]
   - Cookie has valid value: [ ]

✅ Test 5: Logout/Re-login - [ ] PASS [ ] FAIL
   - Logout worked: [ ]
   - Re-login worked: [ ]
```

---

## 🚨 Common Issues and Fixes

### Issue: "Code exchange failed"

**Check:**
1. Supabase redirect URLs in dashboard
2. Google OAuth redirect URI
3. `.env.local` has correct credentials

**Fix:**
```bash
# Verify .env.local
cat /home/vscode/Kubota-rental-platform/frontend/.env.local | grep SUPABASE
```

### Issue: Still redirecting after login

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Cookies are being set

**Fix:**
```bash
# Restart with clean cache
npm run dev -- --no-cache
```

### Issue: "Missing environment variables"

**Fix:**
```bash
# Verify .env.local exists
ls -la /home/vscode/Kubota-rental-platform/frontend/.env.local

# If missing, create it:
cat > /home/vscode/Kubota-rental-platform/frontend/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc
EOF

# Restart dev server
npm run dev
```

---

## ✅ Success Criteria

All these should be TRUE:

- [x] Can log in with Google OAuth
- [x] Redirected to /dashboard after login
- [x] Session persists across page refreshes
- [x] Can access /profile without redirect
- [x] Can access /book without redirect
- [x] Supabase auth cookies are present
- [x] No console errors during auth flow
- [x] Can logout and login again

---

## 📞 Still Having Issues?

If authentication still doesn't work after following this guide:

1. **Capture Screenshots** of:
   - Browser console errors
   - Network tab (filter: "auth", "supabase")
   - Cookies tab showing Supabase cookies

2. **Check Server Logs**:
   ```bash
   # In the terminal where npm run dev is running
   # Look for middleware errors or Supabase errors
   ```

3. **Verify Supabase Configuration**:
   - Open: https://supabase.com/dashboard/project/bnimazxnqligusckahab/auth/url-configuration
   - Verify redirect URLs include: `http://localhost:3000/auth/callback`

4. **Test with Different Browser**:
   - Try Chrome, Firefox, or Safari
   - Use incognito/private mode

---

**Good Luck! 🎉**

The fixes applied should resolve the session persistence issue. If you still encounter problems, the debugging tools above will help identify the root cause.




