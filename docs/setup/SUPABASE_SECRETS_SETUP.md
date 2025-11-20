# Supabase Edge Function Secrets Setup

## Overview

This project uses **Supabase Edge Function Secrets** as the primary source for API keys and sensitive configuration. This eliminates the need for `.env.local` files and centralizes secret management in Supabase.

## How It Works

The unified secrets loader (`frontend/src/lib/secrets/loader.ts`) checks secrets in this priority order:

1. **Supabase Edge Function Secrets** (when running in Supabase environment)
2. **Environment Variables** (`.env.local` for local development)
3. **system_config Table** (database-stored secrets for backward compatibility)
4. **Hardcoded Fallbacks** (development only)

## Setting Up Secrets in Supabase

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Click **"Add another"** or use the bulk editor
4. Add your secrets as key-value pairs:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_TEST_KEY=sk_test_51S2N0TFYCEvui16J...
STRIPE_PUBLIC_TEST_KEY=pk_test_51S2N0TFYCEvui16J...
GOOGLE_MAPS_API_KEY=AIzaSyAqGOtQHggjCf31e31uWD0lgS...
```

5. Click **"Save"** to store the secrets

### Via Supabase CLI

```bash
# Set individual secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Set multiple secrets at once
supabase secrets set \
  STRIPE_SECRET_TEST_KEY=sk_test_... \
  STRIPE_PUBLIC_TEST_KEY=pk_test_... \
  GOOGLE_MAPS_API_KEY=AIza...
```

## Required Secrets

Based on your Supabase dashboard, these secrets should be configured:

### Supabase Configuration
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_URL` - Project URL (optional, can use NEXT_PUBLIC_SUPABASE_URL)
- `SUPABASE_ANON_KEY` - Anonymous key (optional, can use NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Stripe Configuration
- `STRIPE_SECRET_TEST_KEY` - Stripe secret key (test mode)
- `STRIPE_PUBLIC_TEST_KEY` - Stripe publishable key (test mode)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Google Maps
- `GOOGLE_MAPS_API_KEY` - Google Maps API key

### Email (SendGrid)
- `SENDGRID_API_KEY` - SendGrid API key (optional)

## Local Development

For local development, you can still use `.env.local` as a fallback:

```bash
# frontend/.env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_TEST_KEY=sk_test_...
STRIPE_PUBLIC_TEST_KEY=pk_test_...
GOOGLE_MAPS_API_KEY=AIza...
```

The secrets loader will automatically use `.env.local` if Supabase secrets aren't available.

## Benefits

✅ **Centralized Management** - All secrets in one place (Supabase dashboard)
✅ **No .env Files** - Eliminates `.env.local` file management
✅ **Environment-Specific** - Different secrets for dev/staging/prod
✅ **Secure** - Secrets never committed to git
✅ **Easy Updates** - Update secrets via dashboard without code changes
✅ **Backward Compatible** - Still works with `.env.local` for local dev

## Migration Guide

### From .env.local to Supabase Secrets

1. **Export your current secrets:**
   ```bash
   cat frontend/.env.local | grep -E "^(SUPABASE|STRIPE|GOOGLE)" > secrets.txt
   ```

2. **Add to Supabase Dashboard:**
   - Go to Edge Functions → Secrets
   - Paste your secrets (key=value format)
   - Click Save

3. **Test the migration:**
   - Restart your dev server
   - Verify secrets are loaded from Supabase
   - Check logs for `[Secrets] Loaded ... from Supabase Edge Function secrets`

4. **Optional: Remove .env.local:**
   - Once verified, you can delete `.env.local`
   - Secrets will load from Supabase automatically

## Troubleshooting

### Secrets Not Loading

1. **Check Supabase Dashboard:**
   - Verify secrets are set in Edge Functions → Secrets
   - Check secret names match exactly (case-sensitive)

2. **Check Environment:**
   - Supabase secrets are only available in Supabase-hosted environments
   - For local dev, use `.env.local` as fallback

3. **Check Logs:**
   - Look for `[Secrets] Loaded ...` messages
   - Verify which source is being used

### Fallback to .env.local

If Supabase secrets aren't available, the loader automatically falls back to:
1. Environment variables (`.env.local`)
2. `system_config` table
3. Hardcoded fallbacks (dev only)

## Security Notes

⚠️ **Never commit secrets to git**
⚠️ **Never expose service role keys to client-side code**
⚠️ **Use different secrets for dev/staging/prod**
⚠️ **Rotate secrets regularly**

## Reference

- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [Unified Secrets Loader](../reference/SECRETS_LOADER.md)


