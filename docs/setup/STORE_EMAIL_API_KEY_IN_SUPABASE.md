# Store EMAIL_API_KEY in Supabase system_config Table

## Problem
Supabase Edge Function secrets are **only available inside Edge Functions**, not in Next.js API routes. To use the `EMAIL_API_KEY` from Supabase in Next.js, we need to store it in the `system_config` table.

## Solution
Store the `EMAIL_API_KEY` in the `system_config` table. The secrets loader will automatically fetch it from there.

## Steps

### 1. Get Your SendGrid API Key
The key is stored in Supabase Edge Function secrets. You can:
- View it in Supabase Dashboard → Edge Functions → Secrets
- Or use the Supabase CLI: `supabase secrets list`

### 2. Insert into system_config Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Insert EMAIL_API_KEY into system_config table
INSERT INTO system_config (key, value, description, category, is_public)
VALUES (
  'EMAIL_API_KEY',
  '"SG.your_actual_sendgrid_api_key_here"'::jsonb,
  'SendGrid API key for email notifications',
  'email',
  false
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();
```

**Important**:
- The `value` field is JSONB, so wrap the API key in quotes: `'"SG.xxx"'`
- Replace `SG.your_actual_sendgrid_api_key_here` with your actual SendGrid API key

### 3. Verify It's Stored

```sql
SELECT key, value::text, description
FROM system_config
WHERE key = 'EMAIL_API_KEY';
```

### 4. Test the Email System

After storing the key, test it:
1. Visit: `http://localhost:3000/api/admin/diagnose-email`
2. Should show: `"secretsLoader": { "success": true }`
3. Test sending an email: `POST /api/test-email`

## How It Works

The secrets loader checks sources in this order:
1. ✅ `process.env.EMAIL_API_KEY` (Supabase secrets - only in Edge Functions)
2. ✅ `process.env.SENDGRID_API_KEY` (legacy env var)
3. ✅ **`system_config` table** ← This is what we're using
4. ❌ Hardcoded fallback (dev only)

## Security Notes

- The `system_config` table should have RLS enabled
- Only admins should be able to read/write secrets
- The API key is stored as JSONB in the database
- Access is controlled via Supabase service role key (server-side only)

