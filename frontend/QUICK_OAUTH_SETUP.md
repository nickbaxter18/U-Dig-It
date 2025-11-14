# Quick OAuth Setup Guide

## 🚀 Google OAuth with Supabase

The OAuth buttons are now configured to work with **Supabase Auth**. Google OAuth is already enabled in your Supabase dashboard.

### ✅ Current Status
- ✅ **Google OAuth is enabled** in Supabase dashboard (Production project: `bnimaznqiqusckahab`)
- ✅ **OAuth buttons are working** with Supabase Auth system
- ✅ **No additional configuration needed** for Google OAuth

### 🔧 How It Works
1. **Supabase handles OAuth**: Google OAuth is configured directly in Supabase dashboard
2. **Frontend integration**: Components use `SupabaseAuthProvider` and `authService.signInWithGoogle()`
3. **Callback handling**: OAuth redirects to `/auth/callback` page which handles the authentication flow

### 📱 Test OAuth Flow
1. Go to `/register` or `/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Verify user is redirected to dashboard
5. Verify user is created in Supabase users table

### 🔧 Troubleshooting
- **Buttons not working**: Check browser console for errors
- **OAuth redirect error**: Ensure site URL is correctly configured in Supabase dashboard
- **User not created**: Check Supabase logs for OAuth errors

### 🛠️ Add More OAuth Providers
To add Apple, GitHub, or other providers:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable the desired provider
3. Configure the provider settings (client ID, secret, etc.)
4. Update the `OAuthButtons.tsx` component if needed

## 📋 Environment Variables (No longer needed for OAuth)
The following NextAuth environment variables are **no longer required** since we're using Supabase:

```bash
# These are no longer needed for OAuth
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-key-here
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 🗑️ Cleanup (Optional)
You can remove NextAuth-related files if not using them elsewhere:
- Remove `src/app/api/auth/[...nextauth]/route.ts`
- Remove `src/lib/auth.ts` (NextAuth config)
- Remove NextAuth dependencies from package.json

