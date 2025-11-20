# 📧 Email System Fix - SendGrid API Key Configuration

## Problem
Emails were not sending because the SendGrid API key (`EMAIL_API_KEY`) stored in Supabase Edge Function secrets was not accessible to Next.js API routes.

## Solution
Created a unified email secrets loader that checks multiple sources in priority order:

1. **Supabase Edge Function secrets** (`process.env.EMAIL_API_KEY`) - When running in Supabase environment
2. **Environment variables** (`.env.local` - `EMAIL_API_KEY` or `SENDGRID_API_KEY`) - For local development
3. **Database** (`system_config` table) - For centralized secret management

## Changes Made

### 1. Created Email Secrets Loader
**File**: `frontend/src/lib/secrets/email.ts`

- Loads SendGrid API key from multiple sources
- Provides clear error messages if key is not found
- Logs which source was used for debugging

### 2. Updated Email Service
**File**: `frontend/src/lib/email-service.ts`

- Changed from static initialization to dynamic initialization
- All email functions now call `ensureSendGridInitialized()` before sending
- This allows async loading from database if needed

### 3. Updated All Email Sending Functions
Updated these files to use the new secrets loader:
- `frontend/src/lib/email-service.ts` - All 12 email functions
- `frontend/src/lib/sendgrid.ts` - Admin email helper
- `frontend/src/lib/email/spin-notifications.ts` - Spin-to-win emails

## Configuration

### Option 1: Supabase Edge Function Secrets (Recommended for Production)
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add/update `EMAIL_API_KEY` with your SendGrid API key
3. The key will be available as `process.env.EMAIL_API_KEY` in Supabase Edge Functions

**Note**: For Next.js API routes, you still need to set it as an environment variable (see Option 2).

### Option 2: Environment Variables (Recommended for Local Development)
Add to `frontend/.env.local`:

```bash
# SendGrid API Key (from Supabase Edge Function secrets)
EMAIL_API_KEY=SG.your_sendgrid_api_key_here

# OR use legacy variable name (for backward compatibility)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

### Option 3: Database (system_config table)
Insert into `system_config` table:

```sql
INSERT INTO system_config (key, value, description)
VALUES (
  'EMAIL_API_KEY',
  'SG.your_sendgrid_api_key_here',
  'SendGrid API key for email notifications'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## Priority Order

The system checks sources in this order:
1. `process.env.EMAIL_API_KEY` (Supabase secrets or env file)
2. `process.env.SENDGRID_API_KEY` (legacy env var)
3. `system_config` table (database)

## Testing

### Test Email Endpoint
Use the test email endpoint to verify configuration:

```bash
POST /api/test-email
{
  "toEmail": "your-email@example.com",
  "type": "basic"
}
```

### Check Logs
Look for these log messages:

**Success**:
```
SendGrid initialized successfully
SendGrid API key loaded from EMAIL_API_KEY (Supabase secrets)
```

**Failure**:
```
SendGrid API key not found
Failed to initialize SendGrid
```

## Troubleshooting

### Emails Still Not Sending

1. **Check API key is set**:
   ```bash
   # In Next.js API route, log:
   console.log('EMAIL_API_KEY:', process.env.EMAIL_API_KEY ? 'SET' : 'NOT SET');
   ```

2. **Check SendGrid API key format**:
   - Should start with `SG.`
   - Should be ~70 characters long
   - No spaces or quotes

3. **Check FROM_EMAIL is verified in SendGrid**:
   - Go to SendGrid Dashboard → Settings → Sender Authentication
   - Verify `NickBaxter@udigit.ca` is verified

4. **Check SendGrid API key permissions**:
   - Go to SendGrid Dashboard → Settings → API Keys
   - Ensure key has "Mail Send" permissions

5. **Check error logs**:
   - Look for `SendGrid email send failed` in logs
   - Check error message and code from SendGrid

### Common Errors

**Error**: `SendGrid API key not configured`
- **Fix**: Set `EMAIL_API_KEY` in `.env.local` or Supabase secrets

**Error**: `Forbidden` (403 from SendGrid)
- **Fix**: Check API key has correct permissions in SendGrid

**Error**: `Unauthorized` (401 from SendGrid)
- **Fix**: API key is invalid or expired - regenerate in SendGrid

**Error**: `Sender email not verified`
- **Fix**: Verify `NickBaxter@udigit.ca` in SendGrid Sender Authentication

## Files Modified

- ✅ `frontend/src/lib/secrets/email.ts` (NEW)
- ✅ `frontend/src/lib/email-service.ts` (UPDATED)
- ✅ `frontend/src/lib/sendgrid.ts` (UPDATED)
- ✅ `frontend/src/lib/email/spin-notifications.ts` (UPDATED)

## Next Steps

1. **Set EMAIL_API_KEY in `.env.local`** for local development
2. **Restart development server** to load new environment variables
3. **Test email sending** using `/api/test-email` endpoint
4. **Check logs** to verify which source was used for the API key
5. **For production**: Set `EMAIL_API_KEY` in Vercel environment variables or Supabase Edge Function secrets


