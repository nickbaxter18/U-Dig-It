-- ========================================
-- Store EMAIL_API_KEY in system_config table
-- ========================================
--
-- IMPORTANT: Replace 'SG.your_actual_sendgrid_api_key_here'
-- with your actual SendGrid API key from Supabase Edge Function secrets
--
-- To get your key:
-- 1. Go to Supabase Dashboard → Edge Functions → Secrets
-- 2. Find EMAIL_API_KEY
-- 3. Copy the value
-- 4. Replace it in the SQL below
-- ========================================

-- Insert or update EMAIL_API_KEY in system_config
INSERT INTO system_config (key, value, description, category, is_public)
VALUES (
  'EMAIL_API_KEY',
  '"SG.your_actual_sendgrid_api_key_here"'::jsonb,
  'SendGrid API key for email notifications (from Supabase Edge Function secrets)',
  'email',
  false
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Verify it was inserted
SELECT
  key,
  value::text as value_text,
  description,
  category,
  created_at,
  updated_at
FROM system_config
WHERE key = 'EMAIL_API_KEY';

